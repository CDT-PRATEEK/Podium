from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.utils import timezone
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token

from .models import Profile
from .serializers import RegisterSerializer, ProfileSerializer, PublicProfileSerializer
from blog.models import Post, Comment

# ==========================================
# 0. CUSTOM LOGIN (Auto-Reactivate Account)
# ==========================================
class CustomLoginView(ObtainAuthToken):
    """
    Standard Token Login, but with a twist:
    If a user is marked as 'Soft Deleted', logging in
    automatically RESTORES their account.
    """
    def post(self, request, *args, **kwargs):
        # 1. Validate Username/Password
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # 2. === THE LOGIC: RESTORE ACCOUNT ===
        # If they are in the 30-day grace period, bring them back!
        if hasattr(user, 'profile') and user.profile.is_soft_deleted:
             user.profile.is_soft_deleted = False
             user.profile.scheduled_deletion_date = None
             user.profile.save()
             print(f"♻️ Account reactivated for {user.username}")

        # 3. Get or Create Token
        token, created = Token.objects.get_or_create(user=user)
        
        # 4. Return Token & User Info
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email
        })

# ==========================================
# 1. REGISTRATION
# ==========================================
class RegisterAPI(generics.CreateAPIView):
    """
    Creates a new User. 
    The 'create_profile' signal in users/signals.py will 
    automatically generate the Profile entry.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


# ==========================================
# 2. PROFILE MANAGEMENT
# ==========================================
@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def ProfileAPI(request):
    try:
        # Get the profile for the currently logged-in user
        profile, created = Profile.objects.get_or_create(user=request.user)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

    # --- GET: Retrieve Profile Data ---
    if request.method == 'GET':
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)

    # --- PUT: Update Profile Data ---
    elif request.method == 'PUT':
        # partial=True allows updating just the Bio without re-sending the Image
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        # If validation fails, return the specific errors (e.g., "Bio too long")
        return Response(serializer.errors, status=400)
    
    
class PublicProfileView(generics.RetrieveAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'username'

    def get_object(self):
        # 1. Get the username from the URL
        username = self.kwargs.get('username')
        
        # 2. Find the User (or 404 if they don't exist)
        user = get_object_or_404(User, username=username)
        
        # 3. Get the profile, OR create it if it's missing
        profile, created = Profile.objects.get_or_create(user=user)
        
        return profile
    
# ==========================================
# 3. ACCOUNT DELETION (Soft Delete)
# ==========================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def RequestAccountDeletion(request):
    """
    Soft deletes the user account. 
    Data is retained for 30 days (Grace Period), then hard deleted via Cron Job.
    """
    try:
        profile = request.user.profile
        
        if profile.is_soft_deleted:
            return Response({"message": "Account is already scheduled for deletion."}, status=status.HTTP_200_OK)

        # Trigger the Soft Delete
        profile.mark_for_deletion()
        
        return Response({
            "message": "Account scheduled for deletion.", 
            "detail": "Your data will be permanently removed in 30 days. You can reactivate by logging in before then.",
            "scheduled_date": profile.scheduled_deletion_date
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=500)
    

@api_view(['POST', 'GET']) # GET is easier for some cron services, POST is safer
@permission_classes([AllowAny]) # We handle auth via Secret Key
def CleanupDeletedUsers(request):
    """
    EXTERNAL CRON ENDPOINT
    Permanently deletes users whose 30-day grace period has expired.
    Reassigns content to a 'Ghost User' to preserve history.
    """
    # 1. SECURITY CHECK
    auth_header = request.headers.get('X-CRON-SECRET')
    query_param = request.query_params.get('secret')
    
    # Allow passing secret via Header OR Query Param (e.g. ?secret=...)
    if auth_header != settings.CRON_SECRET_KEY and query_param != settings.CRON_SECRET_KEY:
        return Response({"error": "Unauthorized access."}, status=status.HTTP_401_UNAUTHORIZED)

    # 2. FIND USERS TO DELETE
    now = timezone.now()
    profiles_to_delete = Profile.objects.filter(
        is_soft_deleted=True,
        scheduled_deletion_date__lte=now
    )
    
    count = profiles_to_delete.count()
    if count == 0:
        return Response({"message": "No accounts pending deletion."}, status=200)

    # 3. GET/CREATE GHOST USER (To hold the content)
    # We use a system account so posts don't vanish due to on_delete=CASCADE
    ghost_user, _ = User.objects.get_or_create(username="deleted_user")
    if not hasattr(ghost_user, 'profile'):
        Profile.objects.create(user=ghost_user, bio="This content is from a deleted account.")
    
    # Ensure Ghost User is also flagged as "Soft Deleted" so the Serializer masks it properly
    ghost_user.profile.is_soft_deleted = True 
    ghost_user.profile.save()

    deleted_usernames = []

    # 4. PROCESS DELETION
    for profile in profiles_to_delete:
        user = profile.user
        username = user.username
        
        # Skip if we accidentally picked up the ghost user
        if user.id == ghost_user.id:
            continue

        # A. Reassign Posts & Comments to Ghost User
        # This prevents CASCADE deletion
        Post.objects.filter(author=user).update(author=ghost_user)
        Comment.objects.filter(author=user).update(author=ghost_user)

        # B. Hard Delete the User
        user.delete()
        deleted_usernames.append(username)

    return Response({
        "message": "Cleanup successful",
        "deleted_count": count,
        "users": deleted_usernames
    }, status=200)