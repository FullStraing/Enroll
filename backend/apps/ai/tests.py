from unittest.mock import patch

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient

from apps.ai.models import AIInteraction
from apps.essays.models import Essay, EssayVersion


class EssayAiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="student",
            email="student@example.com",
            password="password123",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.essay = Essay.objects.create(
            student=self.user,
            title="Why this university essay",
            essay_type="supplemental_essay",
            prompt_title="Why us?",
            prompt_text="Describe why this university fits you.",
            target_word_count=250,
        )
        self.version = EssayVersion.objects.create(
            essay=self.essay,
            version_number=1,
            label="Initial draft",
            content="I want to study here because it feels right.",
            source="user",
            status="draft",
        )

    @patch("apps.ai.views.generate_starter_draft")
    def test_starter_draft_creates_ai_version(self, mock_generate):
        mock_generate.return_value = (
            {
                "draft_title": "AI starter draft",
                "draft_content": "This school fits my goals because of its academic culture.",
                "summary": "Strong academic-fit opening.",
                "why_it_works": "It gives the essay a clear starting direction with believable focus.",
                "what_admissions_reads_for": ["specific fit", "personal motivation"],
                "next_steps": ["Add one Brown-specific resource", "Show what changed in you"],
                "generation_mode": "fresh_angle",
                "word_count_estimate": 150,
            },
            {"provider": "openai", "model": "gpt-5", "latency_ms": 321, "response_id": "resp_123"},
        )

        response = self.client.post(
            reverse("ai_essay_starter_draft"),
            {"essay_id": self.essay.id, "mode": "starter_draft"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["draft_title"], "AI starter draft")
        self.assertEqual(response.data["version"]["source"], "ai")
        self.assertEqual(response.data["version"]["status"], "ai_improved")
        self.assertEqual(EssayVersion.objects.filter(essay=self.essay).count(), 2)
        self.assertTrue(AIInteraction.objects.filter(user=self.user, context_type="essay_starter_draft").exists())
        interaction = AIInteraction.objects.get(user=self.user, context_type="essay_starter_draft")
        self.assertNotIn("This school fits my goals", interaction.response)
        self.assertIn("redacted_text", interaction.response)

    @patch("apps.ai.views.generate_selection_feedback")
    def test_selection_feedback_returns_preview_payload(self, mock_generate):
        mock_generate.return_value = (
            {
                "verdict": "revise",
                "message": "This sentence can be more specific.",
                "suggested_text": "I want to study here because of its project-based robotics labs.",
                "what_changed": "Generic phrasing was replaced with a concrete academic detail.",
                "why_it_helps": "Specificity makes the sentence more credible and memorable.",
                "reviewer_expectation": "Admissions readers want proof that your interest is grounded in real fit.",
                "confidence": 0.91,
            },
            {"provider": "openai", "model": "gpt-5", "latency_ms": 210, "response_id": "resp_456"},
        )

        response = self.client.post(
            reverse("ai_essay_selection_feedback"),
            {
                "essay_id": self.essay.id,
                "selected_text": "I want to study here because it feels right.",
                "selection_start": 10,
                "selection_end": 56,
                "action": "make_more_specific",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["verdict"], "revise")
        self.assertEqual(response.data["action"], "make_more_specific")
        self.assertTrue(AIInteraction.objects.filter(user=self.user, context_type="essay_selection_feedback").exists())

    def test_selection_feedback_rejects_too_long_selection(self):
        response = self.client.post(
            reverse("ai_essay_selection_feedback"),
            {
                "essay_id": self.essay.id,
                "selected_text": "a" * 801,
                "selection_start": 0,
                "selection_end": 801,
                "action": "review_only",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("selected_text", response.data)

    @patch("apps.ai.views.generate_prompt_explanation")
    def test_explain_prompt_returns_structured_guidance(self, mock_generate):
        mock_generate.return_value = (
            {
                "plain_english_summary": "Explain why the school fits your goals.",
                "what_the_school_is_asking": "Show specific academic fit.",
                "avoid": ["generic praise"],
                "must_cover": ["academic reasons"],
                "good_angle_examples": ["lab, professor, curriculum"],
            },
            {"provider": "openai", "model": "gpt-5-mini", "latency_ms": 111, "response_id": "resp_789"},
        )

        response = self.client.post(
            reverse("ai_essay_explain_prompt"),
            {"essay_id": self.essay.id},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["must_cover"][0], "academic reasons")

    @patch("apps.ai.views.generate_outline")
    def test_outline_returns_structured_guidance(self, mock_generate):
        mock_generate.return_value = (
            {
                "recommended_angle": "Build around robotics and campus research fit.",
                "alternatives": ["community angle"],
                "outline_points": ["hook", "fit", "future"],
                "opening_idea": "Start with your first robotics build.",
                "risks_to_avoid": ["generic ranking talk"],
            },
            {"provider": "openai", "model": "gpt-5-mini", "latency_ms": 140, "response_id": "resp_101"},
        )

        response = self.client.post(
            reverse("ai_essay_outline"),
            {"essay_id": self.essay.id},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["opening_idea"], "Start with your first robotics build.")
