from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import CategoryListView, EmailTokenObtainView, NoteViewSet, RegisterView

router = DefaultRouter()
router.register('notes', NoteViewSet, basename='note')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/token/', EmailTokenObtainView.as_view(), name='auth-token'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('', include(router.urls)),
]
