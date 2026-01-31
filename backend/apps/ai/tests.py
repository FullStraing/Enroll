from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient


class AiStubTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="student",
            email="student@example.com",
            password="password123",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_ai_next_step_stub(self):
        response = self.client.post(
            reverse("ai_next_step"),
            {"context_type": "profile", "context_id": "1"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["type"], "next_step")
