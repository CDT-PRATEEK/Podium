from rest_framework import permissions

class IsOwnerOrModeratorOrReadOnly(permissions.BasePermission):
    """
    RBAC Permission:
    - Allows access if the user is the Owner.
    - Allows access if the user has the 'Moderator' Role (Group).
    """
    def has_object_permission(self, request, view, obj):
        
        print(f"RBAC CHECK: User '{request.user}' accessing object by '{obj.author}'")
        
        # 2. Allow SAFE methods (Read-only) to everyone
        
        if request.method in permissions.SAFE_METHODS:
            return True

        # 3. CHECK A: Is it the Owner?
        is_owner = obj.author == request.user
        
        # 4. CHECK B: Is it a Moderator? (The RBAC Part)
        # Checks if the user is inside the "Moderator" group in Django Admin
        is_moderator = request.user.groups.filter(name='Moderator').exists()

        # Debug Result
        print(f" -> Is Owner? {is_owner}")
        print(f" -> Is Moderator? {is_moderator}")

        # Grant access if EITHER is true
        return is_owner or is_moderator