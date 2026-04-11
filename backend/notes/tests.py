from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Category, Note

User = get_user_model()


class NotesApiTests(APITestCase):
    def register(self, email='test@example.com', password='strong-pass-123'):
        return self.client.post(reverse('auth-register'), {'email': email, 'password': password}, format='json')

    def authenticate(self, email='test@example.com', password='strong-pass-123'):
        response = self.register(email, password)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        return response

    def test_registration_seeds_default_categories_and_returns_tokens(self):
        response = self.register()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        user = User.objects.get(email='test@example.com')
        self.assertEqual(list(user.categories.values_list('name', flat=True)), ['Random Thoughts', 'School', 'Personal'])

    def test_email_login_returns_tokens(self):
        self.register()
        response = self.client.post(reverse('auth-token'), {'email': 'test@example.com', 'password': 'strong-pass-123'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_notes_are_scoped_to_authenticated_user(self):
        self.authenticate()
        first_user_category = Category.objects.get(name='Random Thoughts', user__email='test@example.com')
        Note.objects.create(user=first_user_category.user, category=first_user_category, title='Mine')

        other_user = User.objects.create_user(username='other@example.com', email='other@example.com', password='pass')
        other_category = Category.objects.create(user=other_user, name='School', color='#F9E4A0')
        Note.objects.create(user=other_user, category=other_category, title='Hidden')

        response = self.client.get('/api/notes/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Mine')

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
