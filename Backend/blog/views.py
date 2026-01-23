from rest_framework import generics, filters, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Case, When, Value, IntegerField, Q, F, FloatField
from django.core.files.storage import default_storage
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
import requests
from rest_framework import status
from .models import Bookmark, Post, Comment, Interaction, Notification
from .serializers import PostSerializer, CommentSerializer, NotificationSerializer
from mysite.permissions import IsOwnerOrModeratorOrReadOnly 
from django.conf import settings
from rest_framework.authentication import TokenAuthentication
import httpx
from adrf.generics import ListCreateAPIView
from asgiref.sync import sync_to_async
from adrf.generics import RetrieveUpdateDestroyAPIView


# ==========================================
#  POST LIST API (ASYNC)
# ==========================================
class PostListAPI(ListCreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['title', 'content', 'tags', 'author__username']
    ordering_fields = ['views', 'date_posted']

    # 1. PRE-FETCH DATA SAFELY
    async def list(self, request, *args, **kwargs):
        self.recent_interactions = []
        if request.user.is_authenticated:
            try:
                self.recent_interactions = await sync_to_async(list)(
                    Interaction.objects.filter(user=request.user)
                    .select_related('post')
                    .order_by('-date_interacted')[:20]
                )
            except Exception as e:
                print(f"⚠️ Recommendation Error: {e}")
                self.recent_interactions = []
        return await super().list(request, *args, **kwargs)

    # 2. ASYNC CREATE (AI CHECK)
    async def acreate(self, request, *args, **kwargs):
        data = request.data
        title = data.get('title', '')
        content = data.get('content', '')
        full_text = f"{title} {content}"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    settings.AI_SERVICE_URL,
                    json={"content": full_text}, 
                    timeout=2
                )
            
            if response.status_code == 200:
                analysis = response.json()
                if analysis.get('is_toxic', False):
                    return Response(
                        {
                            "detail": f"Post blocked: {analysis.get('reason', 'Toxic content detected')}.",
                            "score": analysis.get('score'),
                            "service": analysis.get('service')
                        }, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
        except Exception as e:
            print(f"⚠️ AI Service Error: {e}")
            return Response(
                {"detail": "Security check failed. Our AI service is currently busy."}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        return await super().acreate(request, *args, **kwargs)

    # 3. ASYNC SAVE HANDLER
    async def perform_acreate(self, serializer):
        # We wrap the synchronous 'save' in a thread
        await sync_to_async(serializer.save)(author=self.request.user)

    # 4. SYNC QUERYSET (Reads cached list)
    def get_queryset(self):
        user = self.request.user
        username = self.request.query_params.get('author__username', None)
        search_query = self.request.query_params.get('search', None)
        topic_param = self.request.query_params.get('topic', None)

        if username and user.is_authenticated and user.username == username:
            qs = Post.objects.filter(author__username=username)
        elif username:
            qs = Post.objects.filter(author__username=username, status=1)
        else:
            qs = Post.published.all()

        qs = qs.annotate(
            views=Count('interactions', filter=Q(interactions__interaction_type='VIEW'), distinct=True),
            total_comments=Count('comments', distinct=True),
            op_replies=Count('comments', filter=Q(comments__author=F('author')), distinct=True),
        ).annotate(
            quality_ratio=Case(
                When(total_comments=0, then=Value(0.0)),
                default=F('op_replies') * 1.0 / F('total_comments'),
                output_field=FloatField()
            )
        )

        if search_query:
            return qs.filter(
                Q(title__icontains=search_query) | 
                Q(content__icontains=search_query) | 
                Q(tags__icontains=search_query)
            ).order_by('-date_posted')

        if topic_param:
            return qs.filter(topic=topic_param).order_by('-date_posted')

        if username:
            return qs.order_by('-date_posted')

        if user.is_authenticated:
            interested_topics = set()
            clicked_tags = set()
            try:
                if hasattr(user, 'profile') and user.profile.interests:
                    interested_topics.update([x.strip() for x in user.profile.interests.split(',') if x.strip()])
            except: pass
            
            recent = getattr(self, 'recent_interactions', [])
            
            for i in recent:
                interested_topics.add(i.post.topic)
                if i.post.tags:
                    clicked_tags.update([t.strip().lower() for t in i.post.tags.split(',')])
            
            tag_query = Q()
            for tag in clicked_tags:
                tag_query |= Q(tags__icontains=tag)
            
            relevance_conditions = []
            if tag_query: 
                relevance_conditions.append(When(tag_query, then=Value(5))) 
            if interested_topics:
                relevance_conditions.append(When(topic__in=interested_topics, then=Value(2)))
            
            qs = qs.annotate(
                relevance=Case(
                    *relevance_conditions, 
                    default=Value(0), 
                    output_field=IntegerField()
                )
            )
            return qs.order_by('-relevance', '-date_posted', '-quality_ratio')

        return qs.order_by('-date_posted', '-quality_ratio')

# ==========================================
#  COMMENT API (ASYNC)
# ==========================================
class CommentAPI(ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    async def acreate(self, request, *args, **kwargs):
        content = request.data.get('text', '')

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    settings.AI_SERVICE_URL, 
                    json={"content": content},
                    timeout=2
                )
            
            if response.status_code == 200:
                analysis = response.json()
                if analysis.get('is_toxic', False):
                    return Response(
                        {
                            "detail": f"Comment blocked: {analysis.get('reason', 'Toxic content detected')}.",
                            "score": analysis.get('score'),
                            "service": analysis.get('service')
                        }, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
        except Exception as e:
            print(f"⚠️ AI Service Error (Comments): {e}")
            return Response(
                {"detail": "Security check failed. Our AI service is currently busy."}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        return await super().acreate(request, *args, **kwargs)

    async def perform_acreate(self, serializer):
        await sync_to_async(serializer.save)(author=self.request.user)

    def get_queryset(self):
        post_id = self.request.query_params.get('post_id')
        if post_id:
            return Comment.objects.filter(post_id=post_id, parent=None).order_by('-date_posted')
        return Comment.objects.none()

class CommentDetailAPI(generics.DestroyAPIView):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrModeratorOrReadOnly]

# ==========================================
# UTILS (Explore, Images, Recommendations)
# ==========================================
class ExploreAPIView(APIView):
    def get(self, request):
        all_tags = []
        posts = Post.objects.filter(status=1).values_list('tags', flat=True)
        for tag_str in posts:
            if tag_str:
                tags = [t.strip().replace('#', '').lower() for t in tag_str.split(',') if t.strip()]
                all_tags.extend(tags)
        
        from collections import Counter
        tag_counts = Counter(all_tags).most_common(10)
        data = [{'name': tag, 'count': count} for tag, count in tag_counts]
        return Response({'top_tags': data, 'recent_tags': []})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def recommendations(request):
    user = request.user

    # 1. LEARNING (Get User Interests)
    try:
        explicit_topics = [x.strip() for x in user.profile.interests.split(',') if x.strip()]
    except:
        explicit_topics = []

    # Get recent interactions to find implied interests
    recent_interactions = Interaction.objects.filter(user=user).select_related('post').order_by('-date_interacted')[:50]
    
    clicked_topics = set()
    clicked_tags = set()
    viewed_ids = set()

    for interaction in recent_interactions:
        post = interaction.post
        viewed_ids.add(post.id)
        clicked_topics.add(post.topic)
        if post.tags:
            tags = [t.strip().lower() for t in post.tags.split(',') if t.strip()]
            clicked_tags.update(tags)

    all_interested_topics = list(set(explicit_topics) | clicked_topics)

    # 2. SCORING (Filter out posts they've already seen)
    queryset = Post.published.exclude(id__in=viewed_ids)

    tag_query = Q()
    for tag in clicked_tags:
        tag_query |= Q(tags__icontains=tag)

    # Build Scoring Conditions
    relevance_conditions = []
    if tag_query: 
        relevance_conditions.append(When(tag_query, then=Value(5))) # High Priority (Tags)
    
    relevance_conditions.append(When(topic__in=all_interested_topics, then=Value(2))) # Medium Priority (Topics)

    recs = queryset.annotate(
        relevance=Case(
            *relevance_conditions, 
            default=Value(0),
            output_field=IntegerField(),
        ),
        total_comments=Count('comments', distinct=True),
        op_replies=Count('comments', filter=Q(comments__author=F('author')), distinct=True),
    ).annotate(
        quality_ratio=Case(
            When(total_comments=0, then=Value(0.0)),
            default=F('op_replies') * 1.0 / F('total_comments'),
            output_field=FloatField()
        )
    )

    # 3. RANKING (Updated Order)
    # Priority 1: Relevance Score
    # Priority 2: Date Posted (Newest First)
    # Priority 3: Quality Ratio (Tie-breaker)
    final_recs = recs.filter(relevance__gt=0).order_by('-relevance', '-date_posted', '-quality_ratio')[:10]

    # Fallback: If no relevant posts found, show highest quality trending posts
    if not final_recs:
        final_recs = recs.order_by('-quality_ratio', '-date_posted')[:10]

    serializer = PostSerializer(final_recs, many=True, context={'request': request})
    return Response(serializer.data)



class PostDetailAPI(RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrModeratorOrReadOnly]

    # 1. ASYNC RETRIEVE ( View Recording Logic)
    async def aretrieve(self, request, *args, **kwargs):
        #  Wrap the DB call
        instance = await sync_to_async(self.get_object)()
        
        if request.user.is_authenticated:
            try:
                def record_interaction(user, post):
                    interaction, created = Interaction.objects.get_or_create(
                        user=user,
                        post=post,
                        interaction_type='VIEW'
                    )
                    if not created:
                        interaction.save()
                
                await sync_to_async(record_interaction)(request.user, instance)
            except Exception as e:
                print(f"⚠️ View Record Error: {e}")

        return await super().aretrieve(request, *args, **kwargs)

    # 2. ASYNC UPDATE (AI Check)
    async def aupdate(self, request, *args, **kwargs):

        instance = await sync_to_async(self.get_object)()
        
        new_title = request.data.get('title', instance.title)
        new_content = request.data.get('content', instance.content)
        full_text = f"{new_title} {new_content}"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    settings.AI_SERVICE_URL,
                    json={"content": full_text}, 
                    timeout=2
                )
            
            if response.status_code == 200:
                analysis = response.json()
                if analysis.get('is_toxic', False):
                    return Response(
                        {
                            "detail": f"Edit blocked: {analysis.get('reason', 'Toxic content detected')}.",
                            "score": analysis.get('score')
                        }, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
        except Exception as e:
            print(f"⚠️ AI Service Error (Update): {e}")

        return await super().aupdate(request, *args, **kwargs)

    # 3. HELPER (Required for Async Save)
    async def perform_aupdate(self, serializer):
        await sync_to_async(serializer.save)()

    # 4. HELPER (Required for Async Delete)
    async def perform_adestroy(self, instance):
        await sync_to_async(instance.delete)()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_notifications(request):
    # Get last 20 notifications for the logged-in user
    notifs = Notification.objects.filter(recipient=request.user)[:20]
    serializer = NotificationSerializer(notifs, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_notification_read(request, pk):
    try:
        notif = Notification.objects.get(pk=pk, recipient=request.user)
        notif.is_read = True
        notif.save()
        return Response({'status': 'marked read'})
    except Notification.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    
class ToggleBookmarkAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, post_id):
        post_obj = get_object_or_404(Post, id=post_id)
        
        # Get or Create the bookmark
        bookmark, created = Bookmark.objects.get_or_create(user=request.user, post=post_obj)

        if not created:
            # If it already exists, DELETE it
            bookmark.delete()

            return Response({'is_bookmarked': False}, status=status.HTTP_200_OK)
        
        # If it was created
        return Response({'is_bookmarked': True}, status=status.HTTP_201_CREATED)
        

class BookmarkedPostListAPI(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Get all posts that have been bookmarked by the current user
        return Post.objects.filter(bookmarked_by__user=self.request.user).order_by('-bookmarked_by__created_at')
    

class ImageUploadAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if 'image' not in request.FILES:
            return Response({'error': 'No image provided'}, status=400)

        image_file = request.FILES['image']
        
        # This automatically uses whatever storage set in settings.py
       
        file_name = default_storage.save(f"posts/{image_file.name}", image_file)
        file_url = default_storage.url(file_name)

        return Response({'url': file_url}, status=200)
    
class RecordViewAPI(APIView):
    permission_classes = [AllowAny] 
    
    # 2. VITAL: This line disables CSRF checks by removing SessionAuthentication
    authentication_classes = [TokenAuthentication] 

    def post(self, request, pk):
        # 3. Check Authentication MANUALLY
        if not request.user.is_authenticated:
            return Response({"status": "Anonymous view ignored"})

        post = get_object_or_404(Post, pk=pk)
        
        # 4. Use get_or_create to prevent database spam
        Interaction.objects.get_or_create(
            user=request.user,
            post=post,
            interaction_type='VIEW'
        )
        
        return Response({"status": "View recorded"})