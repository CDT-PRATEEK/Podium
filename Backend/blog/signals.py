from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Comment, Notification
from django_rest_passwordreset.signals import reset_password_token_created
from .gmail import send_gmail
from django.conf import settings

@receiver(post_save, sender=Comment)
def create_comment_notification(sender, instance, created, **kwargs):
    if created:
        post = instance.post
        sender_user = instance.author # The person typing right now
        
        # 1. Determine who gets the notification
        if instance.parent:
            # Case A: It's a REPLY -> Notify the person who wrote the parent comment
            recipient = instance.parent.author
            action = "replied to you"
        else:
            # Case B: It's a ROOT COMMENT -> Notify the Post Author
            recipient = post.author
            action = "commented on"

        # 2. Anti-Spam Check
        # Don't notify if I reply to myself OR if I comment on my own post
        if sender_user != recipient:
            Notification.objects.create(
                recipient=recipient,
                post=post,
                text=f"{sender_user.username} {action}: {post.title[:20]}..."
            )

@receiver(reset_password_token_created)
def password_reset_token_created(sender, instance, reset_password_token, *args, **kwargs):

    frontend_base = settings.FRONTEND_URL
    
    # In production, change localhost to your actual domain
    url = f"{frontend_base}/reset-password?token={reset_password_token.key}"

    msg = f"""
    Hello,

    We received a request to reset your password.
    Click the link below to verify:

    {url}

    If you did not request this, ignore this email.
    """

    send_gmail(
        to_email=reset_password_token.user.email,
        subject="Reset Password Request",
        body=msg
    )