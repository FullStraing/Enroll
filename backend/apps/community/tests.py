from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from apps.community.models import CommunityMembership, CommunitySavedPost
from apps.community.seed import ensure_seeded_groups
from apps.universities.models import StudentUniversity, University
from apps.users.models import StudentProfile


class CommunityApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="tester", password="pass12345")
        StudentProfile.objects.create(
            user=self.user,
            country="Kyrgyzstan",
            intended_major="Computer Science",
            common_app_profile={"intro_quiz_answers": {"intakeYear": "2027"}},
        )
        self.client.force_authenticate(self.user)
        self.university = University.objects.create(name="Brown University")
        StudentUniversity.objects.create(student=self.user, university=self.university)
        ensure_seeded_groups()

    def test_home_returns_recommendations(self):
        response = self.client.get("/api/community/home/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("recommendations", payload)
        self.assertTrue(payload["recommendations"]["country"])
        self.assertTrue(payload["recommendations"]["intake"])

    def test_join_and_leave_group(self):
        join_response = self.client.post("/api/community/groups/kyrgyzstan-applicants/join/")
        self.assertEqual(join_response.status_code, 200)
        self.assertTrue(CommunityMembership.objects.filter(user=self.user, group__slug="kyrgyzstan-applicants").exists())

        leave_response = self.client.post("/api/community/groups/kyrgyzstan-applicants/leave/")
        self.assertEqual(leave_response.status_code, 200)
        self.assertFalse(CommunityMembership.objects.filter(user=self.user, group__slug="kyrgyzstan-applicants").exists())

    def test_member_can_post_comment_save_and_report(self):
        self.client.post("/api/community/groups/kyrgyzstan-applicants/join/")

        create_response = self.client.post(
            "/api/community/groups/kyrgyzstan-applicants/posts/",
            {
                "post_type": "question",
                "title": "How do I pace Fall 2027 essays?",
                "body": "I want a realistic pacing plan for supplements.",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, 201)
        post_id = create_response.json()["id"]

        comment_response = self.client.post(
            f"/api/community/posts/{post_id}/comments/",
            {"body": "Start with the schools that have the most unusual supplements."},
            format="json",
        )
        self.assertEqual(comment_response.status_code, 201)

        save_response = self.client.post(f"/api/community/posts/{post_id}/save/")
        self.assertEqual(save_response.status_code, 200)
        self.assertTrue(CommunitySavedPost.objects.filter(user=self.user, post_id=post_id).exists())

        report_response = self.client.post(
            "/api/community/reports/",
            {"target_type": "post", "target_id": post_id, "reason": "other", "notes": "Testing report flow."},
            format="json",
        )
        self.assertEqual(report_response.status_code, 201)

    def test_chat_only_groups_include_seeded_rooms(self):
        response = self.client.get("/api/community/groups/?group_type=country&chat_only=1")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        slugs = {group["slug"] for group in payload}
        self.assertIn("central-asia-applicants", slugs)
        self.assertIn("kyrgyzstan-applicants", slugs)

    def test_member_can_post_chat_message_without_explicit_title(self):
        self.client.post("/api/community/groups/central-asia-applicants/join/")
        response = self.client.post(
            "/api/community/groups/central-asia-applicants/posts/",
            {
                "body": "Anyone else working on football stories for personal statement brainstorming?",
                "tag": "essay",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["tag"], "essay")
        self.assertTrue(payload["title"])

    def test_non_member_cannot_post(self):
        response = self.client.post(
            "/api/community/groups/kyrgyzstan-applicants/posts/",
            {
                "post_type": "question",
                "title": "Can I post?",
                "body": "Trying to post without joining.",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
