from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework.validators import UniqueValidator
from .models import Profile
from django.contrib.auth.password_validation import validate_password

# ==========================================
# USER & PROFILE SERIALIZERS
# ==========================================

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="This email is already registered.")]
    )
    
    
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password] 
    )

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    email = serializers.ReadOnlyField(source='user.email')
    is_moderator = serializers.SerializerMethodField()
    remove_image = serializers.BooleanField(write_only=True, required=False)
    
    # 1. Handle Image URL safety (Read Only)
    image = serializers.ImageField(required=False, allow_null=True)

    def to_representation(self, instance):
        """ 
        SECURITY INTERCEPT:
        If the user is Soft Deleted, mask their data immediately.
        """
        if instance.is_soft_deleted:
            return {
                'username': 'Deleted User',
                'image': None, # Frontend should show a default 'Ghost' avatar
                'bio': '',
                'interests': [],
                'is_soft_deleted': True,
            }

    # 2. Smart Interest Handling 
    # Allows Frontend to send ["TECH", "SCI"] but DB saves "TECH,SCI"
    interests_list = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,  # Frontend sends this
        required=False
    )

    class Meta:
        model = Profile
        fields = ['id', 'user', 'username', 'email', 'image', 'interests', 'interests_list', 'bio', 'is_moderator', 'remove_image']
        extra_kwargs = {
            'user': {'read_only': True},
            'interests': {'read_only': True} # We read this string, but write via interests_list
        }

    def to_representation(self, instance):
        """ Convert DB String "TECH,SCI" -> JSON List ["TECH", "SCI"] """
        ret = super().to_representation(instance)
        # 1. Image to full URL if exists
        if hasattr(instance, 'image') and instance.image:
             ret['image'] = instance.image.url

        # 2.  Interests String to List
        raw_interests = ret.get('interests', '')
        if raw_interests:
             ret['interests'] = [x.strip() for x in raw_interests.split(',') if x.strip()]
        else:
             ret['interests'] = []
        return ret

    def update(self, instance, validated_data):
        """ Convert JSON List ["TECH", "SCI"] -> DB String "TECH,SCI" """

        if validated_data.pop('remove_image', False):
            # If the user has a custom image, delete the file from storage
            if instance.image:
                instance.image.delete(save=False)
            # Set the DB field to NULL
            instance.image = None
        
        # If frontend sent a list of interests, join them into a string
        if 'interests_list' in validated_data:
            tags = validated_data.pop('interests_list')
            instance.interests = ",".join(tags).upper() # Normalize to Uppercase
        
        return super().update(instance, validated_data)
    
    def get_is_moderator(self, obj):
        # Checks if the user is in the 'Moderator' group
        return obj.user.groups.filter(name='Moderator').exists()
    

class PublicProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Profile
        fields = ['username', 'bio', 'image', 'interests'] 

    def to_representation(self, instance):
        if instance.is_soft_deleted:
            return {
                'username': 'Deleted User',
                'image': None,
                'bio': '',
                'interests': []
            }
        return super().to_representation(instance)