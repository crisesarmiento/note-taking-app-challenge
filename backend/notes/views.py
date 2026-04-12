from django.db.models import Count
from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenRefreshView

from .models import Category, Note
from .serializers import CategorySerializer, EmailTokenObtainSerializer, NoteSerializer, UserRegistrationSerializer


class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer


class EmailTokenObtainView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = EmailTokenObtainSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)


class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user).annotate(note_count=Count('notes')).order_by('id')


class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer

    def get_queryset(self):
        queryset = Note.objects.filter(user=self.request.user).select_related('category')
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset

    def get_serializer_context(self):
        return {**super().get_serializer_context(), 'request': self.request}


__all__ = ['RegisterView', 'EmailTokenObtainView', 'TokenRefreshView', 'CategoryListView', 'NoteViewSet']
