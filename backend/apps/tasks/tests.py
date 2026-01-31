from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient

from apps.universities.models import University, Application, StudentUniversity


class TaskTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="student",
            email="student@example.com",
            password="password123",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_generate_tasks_for_application(self):
        university = University.objects.create(name="Test University")
        StudentUniversity.objects.create(student=self.user, university=university)
        application = Application.objects.create(
            student=self.user,
            university=university,
            status="planned",
        )

        response = self.client.post(
            reverse("tasks_generate"),
            {"application_id": application.id},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(len(response.data) > 0)
