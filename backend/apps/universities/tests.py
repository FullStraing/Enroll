from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient

from .models import University


class ApplicationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="student",
            email="student@example.com",
            password="password123",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.list_url = reverse("applications_list_create")

    def test_create_application_with_manual_name(self):
        payload = {
            "university_name": "Example University",
            "deadline_date": "2025-01-15",
            "status": "planned",
        }

        response = self.client.post(self.list_url, payload, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["university_name"], "Example University")
        self.assertEqual(response.data["status"], "planned")

    def test_create_application_with_university_id(self):
        university = University.objects.create(name="Test University")
        payload = {
            "university_id": university.id,
            "deadline_date": "2025-02-01",
            "status": "in_progress",
        }

        response = self.client.post(self.list_url, payload, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["university"]["id"], university.id)
        self.assertEqual(response.data["status"], "in_progress")
