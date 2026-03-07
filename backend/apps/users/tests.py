from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from .models import StudentProfile


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
        self.common_app_progress_url = reverse("common_app_progress")

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

    def test_common_app_progress_contract_shape(self):
        response = self.client.get(self.common_app_progress_url)

        self.assertEqual(response.status_code, 200)
        self.assertIn("overall", response.data)
        self.assertIn("sections", response.data)
        self.assertIn("percent", response.data["overall"])
        self.assertIsInstance(response.data["sections"], list)
        self.assertGreater(len(response.data["sections"]), 0)

        first_section = response.data["sections"][0]
        self.assertIn("key", first_section)
        self.assertIn("title", first_section)
        self.assertIn("subsections", first_section)
        self.assertIsInstance(first_section["subsections"], list)
        self.assertGreater(len(first_section["subsections"]), 0)

        first_subsection = first_section["subsections"][0]
        self.assertIn("fields", first_subsection)
        self.assertIsInstance(first_subsection["fields"], list)
        self.assertGreater(len(first_subsection["fields"]), 0)

        first_field = first_subsection["fields"][0]
        for required_key in ("id", "label", "type", "required", "visible", "bind", "path", "value"):
            self.assertIn(required_key, first_field)

    def test_common_app_progress_nested_conditions_for_course_schedule(self):
        profile, _ = StudentProfile.objects.get_or_create(user=self.user)
        profile.common_app_profile = {
            "courses_report_count": "2",
            "course_scheduling_system": "Semester",
        }
        profile.save(update_fields=["common_app_profile"])

        response = self.client.get(self.common_app_progress_url)
        self.assertEqual(response.status_code, 200)

        education = next(section for section in response.data["sections"] if section["key"] == "education")
        courses = next(sub for sub in education["subsections"] if sub["key"] == "current_year_courses")

        visible_schedule_ids = {
            field["id"]
            for field in courses["fields"]
            if field["visible"] and field["id"].startswith("course_") and "_schedule_" in field["id"]
        }

        self.assertIn("course_1_schedule_semester", visible_schedule_ids)
        self.assertIn("course_2_schedule_semester", visible_schedule_ids)
        self.assertNotIn("course_3_schedule_semester", visible_schedule_ids)
        self.assertNotIn("course_1_schedule_quarter", visible_schedule_ids)
