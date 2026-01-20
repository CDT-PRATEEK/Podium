from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User

# Choices
STATUS_CHOICES = ((0, 'Draft'), (1, 'Published'))

TOPIC_CHOICES = [
    ('TECH', 'Technology'), ('PHIL', 'Philosophy'),
    ('SCI', 'Science'),     ('SOC', 'Society'),
    ('ART', 'Art & Culture'), ('LIFE', 'Life & Self'),
]

class PublishedManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(status=1)

class Post(models.Model):
    title = models.CharField(max_length=100)
    content = models.TextField()
    date_posted = models.DateTimeField(default=timezone.now)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    status = models.IntegerField(choices=STATUS_CHOICES, default=0) 
    updated_on = models.DateTimeField(auto_now=True) 
    topic = models.CharField(max_length=4, choices=TOPIC_CHOICES, default='LIFE')
    

    # "python,react,django"
    tags = models.TextField(blank=True, null=True)

    objects = models.Manager()
    published = PublishedManager()

    class Meta:
        ordering = ['-date_posted']
        # SYSTEM DESIGN: Indexing for Speed
        indexes = [
            models.Index(fields=['topic']),      # Fast Topic filtering
            models.Index(fields=['status']),     # Fast "Published Only" checks
            models.Index(fields=['date_posted']),# Fast Sorting
        ]

    def __str__(self):
        return self.title
    

class Bookmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarks')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='bookmarked_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Prevents a user from bookmarking the same post multiple times
        unique_together = ('user', 'post')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} saved {self.post.title}"

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    

    text = models.TextField()
    
    date_posted = models.DateTimeField(auto_now_add=True)
    
    # Nested Replies
    parent = models.ForeignKey('self', null=True, blank=True, related_name='replies', on_delete=models.CASCADE)

    class Meta:
        ordering = ['date_posted']
        indexes = [
            models.Index(fields=['post']), # Fast comment loading for a post
        ]

    def __str__(self):
        return f'Comment by {self.author.username} on {self.post.title}'
    



class Interaction(models.Model):
    INTERACTION_TYPES = (
        ('VIEW', 'View'),              
        ('COMMENT', 'Comment'), 
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interactions')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='interactions')
    interaction_type = models.CharField(max_length=10, choices=INTERACTION_TYPES)
    date_interacted = models.DateTimeField(auto_now=True) # Updates automatically on every view

    class Meta:

        # 1. Fast lookup: "Has User X seen Post Y?"
        # 2. Fast lookup: "Get all interactions of type VIEW"
        indexes = [
            models.Index(fields=['user', 'post']),
            models.Index(fields=['interaction_type']), 
        ]
        
    def __str__(self):
        return f"{self.user.username} {self.interaction_type} {self.post.title}"
    


class Notification(models.Model):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    text = models.CharField(max_length=255)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"Notif for {self.recipient}: {self.text}"