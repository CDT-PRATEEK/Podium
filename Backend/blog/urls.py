from django.urls import path
from . import views

urlpatterns = [
    # POSTS
    path('posts/', views.PostListAPI.as_view(), name='post-list'),
    path('posts/<int:pk>/', views.PostDetailAPI.as_view(), name='post-detail'),
    path('posts/<int:post_id>/bookmark/', views.ToggleBookmarkAPI.as_view(), name='toggle-bookmark'),
    path('posts/bookmarks/', views.BookmarkedPostListAPI.as_view(), name='bookmarked-posts'),
    
    # COMMENTS
    path('comments/', views.CommentAPI.as_view(), name='comment-list'),

    path('comments/<int:pk>/', views.CommentDetailAPI.as_view(), name='comment-detail'),
    
    # TOOLS
    path('explore/', views.ExploreAPIView.as_view(), name='explore'),

    path('recommendations/', views.recommendations, name='recommendations'), # The Engine

    path('notifications/', views.get_notifications, name='get-notifs'),
    path('notifications/<int:pk>/read/', views.mark_notification_read, name='read-notif'),

    path('upload/', views.ImageUploadAPI.as_view(), name='image-upload'),

    path('posts/<int:pk>/record_view/', views.RecordViewAPI.as_view(), name='record_view'),
]

    
    

    
