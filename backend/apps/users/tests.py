from django.contrib.auth.models import User
from django.urls import reverse
from django.test import override_settings
from rest_framework.test import APITestCase, APIClient
from apps.analytics.models import ProductEvent
from apps.universities.models import StudentUniversity, University
from .models import StudentProfile, UserAuthIdentity


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

    def test_profile_completion_records_onboarding_completed_once(self):
        payload = {
            "full_name": "Ivan Petrov",
            "country": "Kazakhstan",
            "intended_major": "Computer Science",
            "common_app_profile": {
                "intro_quiz_answers": {
                    "intakeYear": "2027",
                    "schoolLevel": "12",
                }
            },
        }

        first = self.client.patch(self.profile_url, payload, format="json")
        second = self.client.patch(self.profile_url, {"school_name": "Gymnasium 1"}, format="json")

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(ProductEvent.objects.filter(user=self.user, name="onboarding_completed").count(), 1)

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

    def test_common_app_writing_visibility_and_rich_text_completion(self):
        profile, _ = StudentProfile.objects.get_or_create(user=self.user)
        profile.common_app_profile = {
            "personal_essay_acknowledged": True,
            "personal_essay_prompt": "Topic of your choice",
            "personal_essay_content": "<p></p>",
        }
        profile.save(update_fields=["common_app_profile"])

        response = self.client.get(self.common_app_progress_url)
        self.assertEqual(response.status_code, 200)

        writing = next(section for section in response.data["sections"] if section["key"] == "writing")
        personal_essay = next(sub for sub in writing["subsections"] if sub["key"] == "personal_essay")
        fields = {field["id"]: field for field in personal_essay["fields"]}

        self.assertTrue(fields["personal_essay_prompt"]["visible"])
        self.assertTrue(fields["personal_essay_prompt"]["required"])
        self.assertTrue(fields["personal_essay_content"]["visible"])
        self.assertTrue(fields["personal_essay_content"]["required"])
        self.assertFalse(fields["personal_essay_content"]["filled"])
        self.assertEqual(personal_essay["completed_required"], 2)
        self.assertEqual(personal_essay["required_total"], 3)


class GoogleAuthTests(APITestCase):
    @override_settings(GOOGLE_OAUTH_CLIENT_ID="test-client-id")
    def test_google_auth_creates_user_and_returns_tokens(self):
        from unittest.mock import patch
        from apps.users.google_auth import GoogleIdentity

        University.objects.create(name="Stanford University", acceptance_rate=4, is_active=True)

        url = reverse("google_auth")
        mock_identity = GoogleIdentity(
            email="google.user@example.com",
            email_verified=True,
            given_name="Google",
            family_name="User",
            full_name="Google User",
            sub="google-sub-1",
        )

        with patch("apps.users.views.verify_google_id_token", return_value=mock_identity):
            response = self.client.post(url, {"id_token": "fake-token"}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertTrue(response.data["is_new_user"])
        self.assertTrue(User.objects.filter(email="google.user@example.com").exists())
        google_user = User.objects.get(email="google.user@example.com")
        self.assertEqual(StudentUniversity.objects.filter(student=google_user).count(), 1)
        self.assertEqual(ProductEvent.objects.filter(user=google_user, name="signup_completed").count(), 1)
        self.assertEqual(ProductEvent.objects.filter(user=google_user, name="first_university_added").count(), 0)

    @override_settings(GOOGLE_OAUTH_CLIENT_ID="test-client-id")
    def test_google_auth_returns_error_when_token_is_invalid(self):
        from unittest.mock import patch
        from apps.users.google_auth import GoogleTokenVerificationError

        url = reverse("google_auth")
        with patch(
            "apps.users.views.verify_google_id_token",
            side_effect=GoogleTokenVerificationError("Invalid Google token audience."),
        ):
            response = self.client.post(url, {"id_token": "bad-token"}, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["detail"], "Invalid Google token audience.")

    @override_settings(GOOGLE_OAUTH_CLIENT_ID="test-client-id")
    def test_google_auth_links_existing_password_account_by_verified_email(self):
        from unittest.mock import patch
        from apps.users.google_auth import GoogleIdentity

        existing = User.objects.create_user(
            username="existing",
            email="existing@example.com",
            password="password123",
        )

        mock_identity = GoogleIdentity(
            email="existing@example.com",
            email_verified=True,
            given_name="Existing",
            family_name="User",
            full_name="Existing User",
            sub="google-sub-existing",
        )

        with patch("apps.users.views.verify_google_id_token", return_value=mock_identity):
            response = self.client.post(reverse("google_auth"), {"id_token": "fake-token"}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["is_new_user"])
        identity = UserAuthIdentity.objects.get(user=existing)
        self.assertEqual(identity.normalized_email, "existing@example.com")
        self.assertEqual(identity.google_sub, "google-sub-existing")
        self.assertTrue(identity.email_verified)

    @override_settings(GOOGLE_OAUTH_CLIENT_ID="test-client-id")
    def test_google_auth_rejects_legacy_duplicate_email_collision(self):
        from unittest.mock import patch
        from apps.users.google_auth import GoogleIdentity

        User.objects.create_user(username="first", email="dup@example.com", password="password123")
        User.objects.create_user(username="second", email="dup@example.com", password="password123")

        mock_identity = GoogleIdentity(
            email="dup@example.com",
            email_verified=True,
            given_name="Dup",
            family_name="User",
            full_name="Dup User",
            sub="google-sub-dup",
        )

        with patch("apps.users.views.verify_google_id_token", return_value=mock_identity):
            response = self.client.post(reverse("google_auth"), {"id_token": "fake-token"}, format="json")

        self.assertEqual(response.status_code, 409)


class RegisterAnalyticsTests(APITestCase):
    def test_register_records_signup_completed(self):
        University.objects.create(name="Stanford University", acceptance_rate=4, is_active=True)

        response = self.client.post(
            reverse("register"),
            {
                "username": "new-user",
                "email": "new-user@example.com",
                "password": "Strongpass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username="new-user")
        self.assertEqual(StudentUniversity.objects.filter(student=user).count(), 1)
        self.assertEqual(ProductEvent.objects.filter(user=user, name="signup_completed").count(), 1)
        self.assertEqual(ProductEvent.objects.filter(user=user, name="first_university_added").count(), 0)

    def test_register_rejects_duplicate_email_and_creates_identity(self):
        User.objects.create_user(
            username="existing",
            email="existing@example.com",
            password="password123",
        )

        response = self.client.post(
            reverse("register"),
            {
                "username": "new-user",
                "email": "existing@example.com",
                "password": "Differentpass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)

    def test_register_creates_normalized_identity_record(self):
        University.objects.create(name="Stanford University", acceptance_rate=4, is_active=True)

        response = self.client.post(
            reverse("register"),
            {
                "username": "new-user-identity",
                "email": " New-User@Example.COM ",
                "password": "Differentpass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username="new-user-identity")
        identity = UserAuthIdentity.objects.get(user=user)
        self.assertEqual(user.email, "new-user@example.com")
        self.assertEqual(identity.normalized_email, "new-user@example.com")
        self.assertFalse(identity.email_verified)

    def test_register_rejects_weak_passwords(self):
        response = self.client.post(
            reverse("register"),
            {
                "username": "weak-user",
                "email": "weak@example.com",
                "password": "12345678",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.data)
