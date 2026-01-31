from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient


class DocumentTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="student",
            email="student@example.com",
            password="password123",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_document_and_version(self):
        response = self.client.post(
            reverse("documents_list_create"),
            {"title": "Personal Statement", "type": "essay"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        document_id = response.data["id"]

        response = self.client.post(
            reverse("documents_versions", kwargs={"document_id": document_id}),
            {"content": "Draft v1", "created_by": "user"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["version_number"], 1)
