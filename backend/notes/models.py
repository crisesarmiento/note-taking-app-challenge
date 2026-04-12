from django.conf import settings
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='categories')

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['name', 'user'], name='unique_category_name_per_user'),
        ]
        ordering = ['id']

    def __str__(self):
        return self.name


class Note(models.Model):
    title = models.CharField(max_length=255, blank=True, default='')
    content = models.TextField(blank=True, default='')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='notes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.title or 'Untitled note'
