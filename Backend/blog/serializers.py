from rest_framework import serializers
from .models import Post, Comment, Notification
import requests
from django.conf import settings

# ==========================================
# POST SERIALIZER
# ==========================================

class PostSerializer(serializers.ModelSerializer):
    # === FIELDS ===
    author_username = serializers.ReadOnlyField(source='author.username')
    # Use SerializerMethodField for image to handle masking logic safely
    author_image = serializers.SerializerMethodField()
    topic_name = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField() 
    views = serializers.IntegerField(read_only=True)
    total_comments = serializers.IntegerField(read_only=True)
    quality_ratio = serializers.FloatField(read_only=True)
    relevance = serializers.IntegerField(read_only=True)


    tags = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'content', 'date_posted', 'status', 
            'topic', 'topic_name', 'tags', 
            'author', 'author_username', 'author_image',
            'is_bookmarked', 'views', 'total_comments', 'quality_ratio', 'relevance'
        ]
        read_only_fields = ['author', 'date_posted']

    def get_topic_name(self, obj):
        TOPIC_MAP = {
            'TECH': 'Technology', 'PHIL': 'Philosophy',
            'SCI': 'Science', 'SOC': 'Society',
            'ART': 'Art & Culture', 'LIFE': 'Life & Self'
        }
        return TOPIC_MAP.get(obj.topic, obj.topic)

    # === SOFT DELETE LOGIC FOR IMAGE ===
    def get_author_image(self, obj):
        # Check if author exists and if profile is soft deleted
        if hasattr(obj.author, 'profile'):
            if obj.author.profile.is_soft_deleted:
                return None # Return None to show default avatar
            if obj.author.profile.image:
                return obj.author.profile.image.url
        return None

    # === CHECK IF USER BOOKMARKED THIS POST ===
    def get_is_bookmarked(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            from .models import Bookmark 
            return Bookmark.objects.filter(user=user, post=obj).exists()
        return False


    def to_representation(self, instance):
        ret = super().to_representation(instance)
        
        # === SOFT DELETE MASKING FOR USERNAME ===
        if hasattr(instance.author, 'profile') and instance.author.profile.is_soft_deleted:
             ret['author_username'] = "Deleted User"
        
        # Tag logic
        if isinstance(instance.tags, str) and instance.tags:
            ret['tags'] = [t.strip() for t in instance.tags.split(',') if t.strip()]
        else:
            ret['tags'] = []
            
        return ret

    def create(self, validated_data):
        if 'tags' in validated_data:
            tags_list = validated_data.pop('tags')
            validated_data['tags'] = ",".join(tags_list)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'tags' in validated_data:
            tags_list = validated_data.pop('tags')
            validated_data['tags'] = ",".join(tags_list)
        return super().update(instance, validated_data)

# ==========================================
# COMMENT SERIALIZER
# ==========================================

class CommentSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    author_image = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'post', 'author', 'author_image', 'text', 'date_posted', 'parent', 'replies']
        read_only_fields = ['author', 'date_posted', 'replies']

    def __init__(self, *args, **kwargs):
        
        no_replies = kwargs.pop('no_replies', False)
        super().__init__(*args, **kwargs)

        if no_replies:
            self.fields.pop('replies')

    def get_author(self, obj):
        if hasattr(obj.author, 'profile') and obj.author.profile.is_soft_deleted:
            return "Deleted User"
        return obj.author.username

    def get_author_image(self, obj):
        if hasattr(obj.author, 'profile'):
            if obj.author.profile.is_soft_deleted:
                return None
            if obj.author.profile.image:
                return obj.author.profile.image.url
        return None

    def get_replies(self, obj):
        # 1. Safety: If this is already a child, do not look for more replies
        if obj.parent_id:
            return []

        # 2. Standard Django Fetch (Relies on prefetch_related in View)
        replies = obj.replies.all()

        if replies:
            return CommentSerializer(
                replies, 
                many=True, 
                context=self.context,
                no_replies=True # Stops recursion at Level 1
            ).data
        return []

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user
        
        if 'parent' in attrs and attrs['parent']:
            parent = attrs['parent']
            
            # --- 1. FIND THE ROOT (Traverse up) ---
            root_comment = parent
            while root_comment.parent:
                root_comment = root_comment.parent
            
            # --- 2. PERMISSION CHECK ---
            root_author_id = root_comment.author.id
            post_author_id = parent.post.author.id
            current_user_id = user.id

            is_op = current_user_id == post_author_id
            is_root = current_user_id == root_author_id
            
            if not (is_op or is_root):
                raise serializers.ValidationError(
                    "Restricted Thread: Only the Post Author or the Original Commenter can reply here."
                )

            # --- 3. FLATTENING  ---
            # If user replies to a Reply, force the parent to be the ROOT.
            # This ensures the reply is visible in flat list.
            attrs['parent'] = root_comment

        return attrs


class NotificationSerializer(serializers.ModelSerializer):
    post_id = serializers.IntegerField(source='post.id', read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'text', 'post_id', 'is_read', 'date']