from django.contrib import admin
from .models import Post, Comment, Interaction

# 1. POST ADMIN 
@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'status', 'date_posted')
    list_filter = ('status', 'date_posted') # Sidebar filters
    search_fields = ('title', 'content', 'author__username')

# 2. COMMENT ADMIN
@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('author', 'post', 'date_posted')
    search_fields = ('content', 'author__username')

# 3. INTERACTION ADMIN 
@admin.register(Interaction)
class InteractionAdmin(admin.ModelAdmin):
    list_display = ('user', 'interaction_type', 'post', 'date_interacted')
    list_filter = ('interaction_type', 'date_interacted') # Filter by VIEW vs COMMENT
    search_fields = ('user__username', 'post__title')