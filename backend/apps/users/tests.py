from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient


class StudentProfileTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="student",
            email="student@example.com",
            password="password123",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.profile_url = reverse("profile")

    def test_profile_get_returns_defaults(self):
        response = self.client.get(self.profile_url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["activities"], [])
        self.assertEqual(response.data["honors"], [])

    def test_profile_update_accepts_mvp_fields(self):
        payload = {
            "full_name": "Ivan Petrov",
            "country": "Kazakhstan",
            "school_name": "Gymnasium 1",
            "graduation_year": 2026,
            "intended_major": "Computer Science",
            "gpa": "3.75",
            "grades_summary": "A-/B+",
            "ielts_overall": "7.5",
            "ielts_date": "2024-10-10",
            "toefl_total": 100,
            "toefl_date": "2024-08-01",
            "sat_total": 1400,
            "sat_date": "2024-09-01",
            "det_score": 120,
            "det_date": "2024-07-15",
            "activities": ["Robotics club", "Volunteer"],
            "honors": ["Math Olympiad winner"],
            "budget_range": "medium",
            "activities_level": "high",
            "target_country": "USA",
        }

        response = self.client.put(self.profile_url, payload, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["graduation_year"], 2026)
        self.assertEqual(response.data["intended_major"], "Computer Science")
        self.assertEqual(response.data["activities"], ["Robotics club", "Volunteer"])
