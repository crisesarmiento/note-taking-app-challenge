from django.contrib import admin

from .models import Category, Note


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'color', 'user')
    search_fields = ('name', 'user__email')


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'user', 'updated_at')
    list_filter = ('category', 'updated_at')
    search_fields = ('title', 'content', 'user__email')
