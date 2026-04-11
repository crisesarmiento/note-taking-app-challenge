from django.contrib.auth import authenticate, get_user_model
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Category, Note

User = get_user_model()

DEFAULT_CATEGORIES = [
    {'name': 'Random Thoughts', 'color': '#E8A87C'},
    {'name': 'School', 'color': '#F9E4A0'},
    {'name': 'Personal', 'color': '#8FBCBC'},
]


def tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {'access': str(refresh.access_token), 'refresh': str(refresh)}


class UserRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        email = value.lower().strip()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return email

    @transaction.atomic
    def create(self, validated_data):
        email = validated_data['email']
        user = User.objects.create_user(username=email, email=email, password=validated_data['password'])
        Category.objects.bulk_create([Category(user=user, **category) for category in DEFAULT_CATEGORIES])
        return user

    def to_representation(self, instance):
        return tokens_for_user(instance)


class EmailTokenObtainSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs['email'].lower().strip()
        password = attrs['password']
        try:
            username = User.objects.get(email__iexact=email).username
        except User.DoesNotExist as exc:
            raise serializers.ValidationError('Invalid email or password.') from exc

        user = authenticate(username=username, password=password)
        if user is None:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('This account is inactive.')
        return tokens_for_user(user)


class CategorySerializer(serializers.ModelSerializer):
    note_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = ['id', 'name', 'color', 'note_count']


class NoteSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.none(), source='category', write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Note
        fields = ['id', 'title', 'content', 'category', 'category_id', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            self.fields['category_id'].queryset = Category.objects.filter(user=request.user)

    def create(self, validated_data):
        request = self.context['request']
        if 'category' not in validated_data:
            validated_data['category'] = Category.objects.filter(user=request.user).order_by('id').first()
        return Note.objects.create(user=request.user, **validated_data)
