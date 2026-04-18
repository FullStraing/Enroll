from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient


class EssayPlanLimitTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="essay-user",
            email="essay-user@example.com",
            password="password123",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_free_plan_blocks_second_essay(self):
        response = self.client.post(
            reverse("essay-list-create"),
            {
                "title": "Essay 1",
                "essay_type": "other",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)

        blocked = self.client.post(
            reverse("essay-list-create"),
            {
                "title": "Essay 2",
                "essay_type": "other",
            },
            format="json",
        )

        self.assertEqual(blocked.status_code, 400)
        self.assertEqual(blocked.data["code"], "plan_limit_reached")
        self.assertEqual(blocked.data["feature"], "essays.max_count")

    def test_free_plan_blocks_sixth_version_for_single_essay(self):
        created = self.client.post(
            reverse("essay-list-create"),
            {
                "title": "Main Essay",
                "essay_type": "other",
            },
            format="json",
        )
        self.assertEqual(created.status_code, 201)
        essay_id = created.data["id"]

        for index in range(4):
            response = self.client.post(
                reverse("essay-version-list-create", kwargs={"essay_id": essay_id}),
                {
                    "label": f"Version {index + 2}",
                    "content": f"Draft {index + 2}",
                    "source": "user",
                },
                format="json",
            )
            self.assertEqual(response.status_code, 201)

        blocked = self.client.post(
            reverse("essay-version-list-create", kwargs={"essay_id": essay_id}),
            {
                "label": "Version 6",
                "content": "Draft 6",
                "source": "user",
            },
            format="json",
        )

        self.assertEqual(blocked.status_code, 400)
        self.assertEqual(blocked.data["code"], "plan_limit_reached")
        self.assertEqual(blocked.data["feature"], "essay_versions.max_per_essay")
