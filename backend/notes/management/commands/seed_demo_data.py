from django.contrib.auth import get_user_model
from django.core.management import CommandError
from django.core.management.base import BaseCommand
from django.db import transaction

from notes.defaults import (
    DEFAULT_CATEGORIES,
    DEMO_NOTES,
    DEMO_USER_EMAIL,
    get_demo_password,
    is_invalid_demo_password_placeholder,
)
from notes.models import Category, Note

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed a persistent demo user, default categories, and sample notes.'

    @transaction.atomic
    def handle(self, *args, **options):
        demo_password = get_demo_password()
        if not demo_password:
            raise CommandError(
                'DEMO_PASSWORD is required to seed the demo user. '
                'With Docker Compose the default is demo123 unless you override it. '
                'For backend-only runs, copy backend/.env.example to backend/.env and set a real password.'
            )
        if is_invalid_demo_password_placeholder(demo_password):
            raise CommandError(
                'DEMO_PASSWORD must be a real password, not the template placeholder from .env.example. '
                'Remove the angle brackets and choose a value (Docker Compose defaults to demo123 when unset).'
            )

        user = User.objects.filter(username=DEMO_USER_EMAIL, email__iexact=DEMO_USER_EMAIL).order_by('id').first()
        if user is None:
            user, user_created = User.objects.get_or_create(
                username=DEMO_USER_EMAIL,
                defaults={'email': DEMO_USER_EMAIL},
            )
        else:
            user_created = False

        user.username = DEMO_USER_EMAIL
        user.email = DEMO_USER_EMAIL
        user.set_password(demo_password)
        user.save(update_fields=['username', 'email', 'password'])

        categories_created = 0
        categories_by_name = {}
        for default_category in DEFAULT_CATEGORIES:
            category, created = Category.objects.get_or_create(
                user=user,
                name=default_category['name'],
                defaults={'color': default_category['color']},
            )
            if category.color != default_category['color']:
                category.color = default_category['color']
                category.save(update_fields=['color'])
            if created:
                categories_created += 1
            categories_by_name[category.name] = category

        notes_created = 0
        for sample_note in DEMO_NOTES:
            category = categories_by_name[sample_note['category']]
            note_exists = Note.objects.filter(
                user=user,
                category=category,
                title=sample_note['title'],
            ).exists()
            if not note_exists:
                Note.objects.create(user=user, category=category, title=sample_note['title'], content=sample_note['content'])
                notes_created += 1

        self.stdout.write(
            self.style.SUCCESS(
                'Demo data ready: '
                f'user={"created" if user_created else "updated"}, '
                f'categories_created={categories_created}, '
                f'notes_created={notes_created}. '
                f'Log in as {DEMO_USER_EMAIL} using the same DEMO_PASSWORD as in the environment.'
            )
        )
