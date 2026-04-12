import io
import secrets

import pytest
from django.contrib.auth import authenticate, get_user_model
from django.core.management import call_command
from django.db import IntegrityError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .defaults import DEFAULT_CATEGORIES, DEMO_NOTES, DEMO_USER_EMAIL
from .models import Category, Note
from .serializers import EmailTokenObtainSerializer, NoteSerializer, UserRegistrationSerializer

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(username='owner@example.com', email='owner@example.com', password='strong-pass-123')


@pytest.fixture
def other_user(db):
    return User.objects.create_user(username='other@example.com', email='other@example.com', password='strong-pass-123')


@pytest.fixture
def categories(user):
    return {
        data['name']: Category.objects.create(user=user, name=data['name'], color=data['color'])
        for data in DEFAULT_CATEGORIES
    }


@pytest.fixture
def auth_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.mark.django_db
def test_category_string_and_unique_name_per_user(user):
    category = Category.objects.create(user=user, name='School', color='#F9E4A0')

    assert str(category) == 'School'
    with pytest.raises(IntegrityError):
        Category.objects.create(user=user, name='School', color='#E8A87C')


@pytest.mark.django_db
def test_note_string_falls_back_to_untitled_and_default_ordering(user, categories):
    first = Note.objects.create(user=user, category=categories['Random Thoughts'], title='First')
    second = Note.objects.create(user=user, category=categories['School'], title='')

    assert str(second) == 'Untitled note'
    assert list(Note.objects.values_list('id', flat=True)) == [second.id, first.id]


@pytest.mark.django_db
def test_registration_serializer_normalizes_email_and_seeds_categories():
    serializer = UserRegistrationSerializer(data={'email': 'NEW@Example.COM ', 'password': 'strong-pass-123'})

    assert serializer.is_valid(), serializer.errors
    user = serializer.save()

    assert user.email == 'new@example.com'
    assert user.username == 'new@example.com'
    assert list(user.categories.values_list('name', flat=True)) == ['Random Thoughts', 'School', 'Personal']
    assert set(serializer.to_representation(user)) == {'access', 'refresh'}


@pytest.mark.django_db
def test_registration_serializer_rejects_duplicate_email():
    User.objects.create_user(username='taken@example.com', email='taken@example.com', password='strong-pass-123')
    serializer = UserRegistrationSerializer(data={'email': 'TAKEN@example.com', 'password': 'strong-pass-123'})

    assert not serializer.is_valid()
    assert 'email' in serializer.errors


@pytest.mark.django_db
def test_email_token_serializer_validates_credentials(user):
    valid = EmailTokenObtainSerializer(data={'email': 'OWNER@example.com', 'password': 'strong-pass-123'})
    invalid = EmailTokenObtainSerializer(data={'email': 'owner@example.com', 'password': 'wrong-password'})

    assert valid.is_valid(), valid.errors
    assert set(valid.validated_data) == {'access', 'refresh'}
    assert not invalid.is_valid()


@pytest.mark.django_db
def test_note_serializer_scopes_category_queryset_to_request_user(api_client, user, other_user, categories):
    other_category = Category.objects.create(user=other_user, name='Other', color='#111111')
    api_client.force_authenticate(user=user)
    request = type('Request', (), {'user': user})()
    serializer = NoteSerializer(context={'request': request})

    assert list(serializer.fields['category_id'].queryset) == list(Category.objects.filter(user=user))
    assert other_category not in serializer.fields['category_id'].queryset


class NotesApiTests(APITestCase):
    def register(self, email='test@example.com', password='strong-pass-123'):
        return self.client.post(reverse('auth-register'), {'email': email, 'password': password}, format='json')

    def authenticate(self, email='test@example.com', password='strong-pass-123'):
        response = self.register(email, password)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        return response

    def test_unauthenticated_notes_and_categories_are_blocked(self):
        assert self.client.get('/api/notes/').status_code == status.HTTP_401_UNAUTHORIZED
        assert self.client.get(reverse('category-list')).status_code == status.HTTP_401_UNAUTHORIZED

    def test_registration_seeds_default_categories_and_returns_tokens(self):
        response = self.register()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        user = User.objects.get(email='test@example.com')
        self.assertEqual(list(user.categories.values_list('name', flat=True)), ['Random Thoughts', 'School', 'Personal'])

    def test_email_login_and_token_refresh_return_tokens(self):
        register_response = self.register()
        login_response = self.client.post(reverse('auth-token'), {'email': 'test@example.com', 'password': 'strong-pass-123'}, format='json')
        refresh_response = self.client.post(reverse('auth-token-refresh'), {'refresh': register_response.data['refresh']}, format='json')

        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', login_response.data)
        self.assertIn('refresh', login_response.data)
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh_response.data)

    def test_invalid_login_returns_400(self):
        self.register()
        response = self.client.post(reverse('auth-token'), {'email': 'test@example.com', 'password': 'wrong'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_notes_are_scoped_to_authenticated_user_for_list_retrieve_patch_delete(self):
        self.authenticate()
        first_user_category = Category.objects.get(name='Random Thoughts', user__email='test@example.com')
        mine = Note.objects.create(user=first_user_category.user, category=first_user_category, title='Mine')

        other_user = User.objects.create_user(username='other@example.com', email='other@example.com', password='pass')
        other_category = Category.objects.create(user=other_user, name='School', color='#F9E4A0')
        hidden = Note.objects.create(user=other_user, category=other_category, title='Hidden')

        list_response = self.client.get('/api/notes/')
        hidden_get_response = self.client.get(f'/api/notes/{hidden.id}/')
        hidden_patch_response = self.client.patch(f'/api/notes/{hidden.id}/', {'title': 'Nope'}, format='json')
        hidden_delete_response = self.client.delete(f'/api/notes/{hidden.id}/')
        mine_get_response = self.client.get(f'/api/notes/{mine.id}/')

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 1)
        self.assertEqual(list_response.data[0]['title'], 'Mine')
        self.assertEqual(hidden_get_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(hidden_patch_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(hidden_delete_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(mine_get_response.status_code, status.HTTP_200_OK)

    def test_category_counts_and_filtering(self):
        self.authenticate()
        random = Category.objects.get(name='Random Thoughts')
        school = Category.objects.get(name='School')
        Note.objects.create(user=random.user, category=random, title='One')
        Note.objects.create(user=random.user, category=random, title='Two')
        Note.objects.create(user=school.user, category=school, title='Three')

        categories_response = self.client.get(reverse('category-list'))
        notes_response = self.client.get(f'/api/notes/?category={random.id}')

        counts = {item['name']: item['note_count'] for item in categories_response.data}
        self.assertEqual(counts['Random Thoughts'], 2)
        self.assertEqual(counts['School'], 1)
        self.assertEqual(len(notes_response.data), 2)

    def test_create_note_defaults_to_first_category_and_can_patch_delete(self):
        self.authenticate()

        create_response = self.client.post('/api/notes/', {'title': '', 'content': ''}, format='json')
        note_id = create_response.data['id']
        patch_response = self.client.patch(f'/api/notes/{note_id}/', {'title': 'Updated'}, format='json')
        delete_response = self.client.delete(f'/api/notes/{note_id}/')

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_response.data['category']['name'], 'Random Thoughts')
        self.assertEqual(patch_response.data['title'], 'Updated')
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)

    def test_cannot_assign_note_to_another_users_category(self):
        self.authenticate()
        note = self.client.post('/api/notes/', {'title': 'Mine', 'content': ''}, format='json').data
        other_user = User.objects.create_user(username='other@example.com', email='other@example.com', password='pass')
        other_category = Category.objects.create(user=other_user, name='Other', color='#111111')

        response = self.client.patch(f"/api/notes/{note['id']}/", {'category_id': other_category.id}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('category_id', response.data)


@pytest.mark.django_db
def test_seed_demo_data_command_is_idempotent_and_login_works(monkeypatch):
    first_output = io.StringIO()
    second_output = io.StringIO()
    demo_password = f"test-{secrets.token_urlsafe(16)}"
    monkeypatch.setenv('DEMO_PASSWORD', demo_password)

    call_command('seed_demo_data', stdout=first_output)
    user = User.objects.get(email=DEMO_USER_EMAIL)
    random_category = user.categories.get(name='Random Thoughts')
    Note.objects.create(user=user, category=random_category, title=DEMO_NOTES[0]['title'], content='Duplicate user-created note.')
    call_command('seed_demo_data', stdout=second_output)

    assert authenticate(username=DEMO_USER_EMAIL, password=demo_password) == user
    assert user.categories.count() == len(DEFAULT_CATEGORIES)
    assert user.notes.count() == len(DEMO_NOTES) + 1
    assert 'notes_created=5' in first_output.getvalue()
    assert 'notes_created=0' in second_output.getvalue()

@pytest.mark.django_db
def test_seed_demo_data_rejects_placeholder_password(monkeypatch):
    from django.core.management import CommandError

    monkeypatch.setenv('DEMO_PASSWORD', '<set-a-local-demo-password>')
    with pytest.raises(CommandError, match='must not be the placeholder'):
        call_command('seed_demo_data', stdout=io.StringIO())

