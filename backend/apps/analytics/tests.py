from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient

from .models import ProductEvent
from .services import record_product_event


class ProductAnalyticsTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username="staff",
            email="staff@example.com",
            password="password123",
            is_staff=True,
        )
        self.user = User.objects.create_user(
            username="student",
            email="student@example.com",
            password="password123",
        )
        self.client = APIClient()

    def test_signup_started_accepts_anonymous_client_and_dedupes(self):
        payload = {
            "name": "signup_started",
            "client_id": "client-123",
            "source": "password",
        }

        first = self.client.post(reverse("analytics-events"), payload, format="json")
        second = self.client.post(reverse("analytics-events"), payload, format="json")

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(ProductEvent.objects.filter(name="signup_started", client_id="client-123").count(), 1)

    def test_non_signup_event_requires_authentication(self):
        response = self.client.post(
            reverse("analytics-events"),
            {"name": "onboarding_completed", "client_id": "anon"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(ProductEvent.objects.count(), 0)

    def test_staff_can_view_summary_counts(self):
        record_product_event("signup_started", client_id="client-1", source="password")
        record_product_event("signup_completed", user=self.user, source="password")
        record_product_event("onboarding_completed", user=self.user, source="profile_update")

        self.client.force_authenticate(self.staff)
        response = self.client.get(reverse("analytics-summary"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["totals"]["registered_users"], 2)
        self.assertEqual(response.data["totals"]["signup_started"], 1)
        self.assertEqual(response.data["totals"]["signup_completed"], 1)
        self.assertEqual(response.data["totals"]["onboarding_completed"], 1)

    def test_non_staff_cannot_view_summary(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(reverse("analytics-summary"))
        self.assertEqual(response.status_code, 403)


class ProductAnalyticsServiceTests(APITestCase):
    def test_one_time_user_events_are_deduped(self):
        user = User.objects.create_user(username="analytics-user", password="password123")

        first_event, first_created = record_product_event("first_task_created", user=user, source="tasks")
        second_event, second_created = record_product_event("first_task_created", user=user, source="tasks")

        self.assertTrue(first_created)
        self.assertFalse(second_created)
        self.assertEqual(first_event.id, second_event.id)
        self.assertEqual(ProductEvent.objects.filter(user=user, name="first_task_created").count(), 1)
