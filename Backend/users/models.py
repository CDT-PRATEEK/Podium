from django.db import models
from django.contrib.auth.models import User
from PIL import Image
from django.utils import timezone
from datetime import timedelta

class Profile(models.Model):

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    image = models.ImageField(upload_to='profile_pics', null=True, blank=True)
    interests = models.TextField(blank=True, null=True, help_text="Comma-separated values (e.g., TECH,SCI)")
    bio = models.TextField(max_length=150, blank=True, null=True)
    is_soft_deleted = models.BooleanField(default=False)
    scheduled_deletion_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'{self.user.username} Profile'

    # SYSTEM DESIGN CHOICE: 
    #  property to handle the splitting logic centrally.
    @property
    def interest_list(self):
        if not self.interests:
            return []
        return [tag.strip().upper() for tag in self.interests.split(',') if tag.strip()]

    # === HELPER TO TRIGGER DELETION ===
    def mark_for_deletion(self):
        self.is_soft_deleted = True
        # Set grace period to 30 days from now
        self.scheduled_deletion_date = timezone.now() + timedelta(days=30)
        self.save()