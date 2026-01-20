from django.urls import path
from . import views

urlpatterns = [
    # 1. AUTH (Custom Login with Auto-Restore)
    path('api-token-auth/', views.CustomLoginView.as_view(), name='api_token_auth'),
    
    path('register/', views.RegisterAPI.as_view(), name='register'),

    # 2. MY PROFILE
    path('profile/', views.ProfileAPI, name='my-profile'),

    # 3. PUBLIC PROFILE
    path('profile/<str:username>/', views.PublicProfileView.as_view(), name='public-profile'),

    # 4. ACCOUNT DELETION & CLEANUP
    path('delete-account/', views.RequestAccountDeletion, name='delete-account'),
    path('cron/cleanup/', views.CleanupDeletedUsers, name='cleanup-cron'),
]