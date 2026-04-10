from datetime import timedelta
from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.core.management import call_command
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient

from apps.analytics.models import ProductEvent
from .connectors.licensed_feed import LicensedFeedConnector
from .categorying import category_from_acceptance_rate
from .models import (
    ScrapeRun,
    StudentUniversity,
    University,
    UniversityDeadline,
    UniversityMetric,
    UniversitySourceSnapshot,
)
from .services.deadline_ingestion import parse_deadlines_from_html, parse_deadlines_from_peterson_html
from .services.ingestion import evaluate_quality, normalize_metrics


class ApplicationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="student",
            email="student@example.com",
            password="password123",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.list_url = reverse("applications_list_create")

    def test_create_application_with_university_id(self):
        university = University.objects.create(name="Test University")
        StudentUniversity.objects.create(student=self.user, university=university)
        payload = {
            "university_id": university.id,
            "deadline_date": "2025-02-01",
            "status": "in_progress",
        }

        response = self.client.post(self.list_url, payload, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["university"]["id"], university.id)
        self.assertEqual(response.data["status"], "in_progress")

    def test_create_application_requires_my_university(self):
        university = University.objects.create(name="Other University")
        payload = {
            "university_id": university.id,
            "deadline_date": "2025-02-01",
            "status": "planned",
        }

        response = self.client.post(self.list_url, payload, format="json")

        self.assertEqual(response.status_code, 400)


class UniversityDataTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="owner", password="password123")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.university = University.objects.create(
            name="Niche University",
            source="niche",
            source_url="https://www.niche.com/colleges/example/",
        )

    def test_university_list_includes_freshness_fields(self):
        snapshot = UniversitySourceSnapshot.objects.create(
            university=self.university,
            source="niche",
            root_url=self.university.source_url,
            status="success",
            parser_version="v1",
            raw_payload={"ok": True},
        )
        UniversitySourceSnapshot.objects.filter(id=snapshot.id).update(
            fetched_at=timezone.now() - timedelta(days=2)
        )
        UniversityMetric.objects.create(
            university=self.university,
            key="net_price",
            value_number=12345,
            unit="usd",
            source_url=self.university.source_url,
            section_key="cost",
        )

        response = self.client.get(reverse("universities_list"))
        self.assertEqual(response.status_code, 200)
        item = response.data["results"][0]
        self.assertIn("last_scraped_at", item)
        self.assertEqual(item["data_freshness_days"], 2)
        self.assertEqual(item["net_price"], 12345.0)

    def test_my_universities_includes_application_fee_metric(self):
        StudentUniversity.objects.create(student=self.user, university=self.university)
        UniversityMetric.objects.create(
            university=self.university,
            key="application_fee_usd",
            value_number=85,
            unit="usd",
            source_url=self.university.source_url,
            section_key="applying",
        )

        response = self.client.get(reverse("my_universities_list_create"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["university"]["application_fee"], 85.0)

    def test_my_universities_application_fee_uses_fallback_when_metric_missing(self):
        university = University.objects.create(
            name="Boston College",
            source="gradgpt",
            source_provider="gradgpt",
            external_id="boston-college",
        )
        StudentUniversity.objects.create(student=self.user, university=university)

        response = self.client.get(reverse("my_universities_list_create"))

        self.assertEqual(response.status_code, 200)
        item = next(row for row in response.data if row["university"]["name"] == "Boston College")
        self.assertEqual(item["university"]["application_fee"], 80.0)

    def test_my_university_create_uses_acceptance_based_default_category(self):
        university = University.objects.create(name="Princeton University", acceptance_rate=5)

        response = self.client.post(
            reverse("my_universities_list_create"),
            {"university_id": university.id},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["category"], "high_reach")
        self.assertEqual(ProductEvent.objects.filter(user=self.user, name="first_university_added").count(), 1)

    def test_free_plan_blocks_third_university(self):
        first = University.objects.create(name="First University", acceptance_rate=15)
        second = University.objects.create(name="Second University", acceptance_rate=25)
        third = University.objects.create(name="Third University", acceptance_rate=35)

        self.client.post(reverse("my_universities_list_create"), {"university_id": first.id}, format="json")
        self.client.post(reverse("my_universities_list_create"), {"university_id": second.id}, format="json")
        response = self.client.post(
            reverse("my_universities_list_create"),
            {"university_id": third.id},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "plan_limit_reached")
        self.assertEqual(response.data["feature"], "universities.max_count")
        self.assertEqual(response.data["plan"], "free")

    def test_category_from_acceptance_rate_helper(self):
        self.assertEqual(category_from_acceptance_rate(5), "high_reach")
        self.assertEqual(category_from_acceptance_rate(16), "reach")
        self.assertEqual(category_from_acceptance_rate(35), "target")
        self.assertEqual(category_from_acceptance_rate(60), "likely")
        self.assertEqual(category_from_acceptance_rate(90), "safety")
        self.assertEqual(category_from_acceptance_rate(None), "target")

    def test_internal_metrics_endpoint(self):
        UniversityMetric.objects.create(
            university=self.university,
            key="acceptance_rate",
            value_number=12,
            unit="percent",
            source_url=self.university.source_url,
            section_key="admissions",
        )
        response = self.client.get(reverse("universities_metrics", kwargs={"pk": self.university.id}))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["key"], "acceptance_rate")

    def test_university_deadlines_endpoint(self):
        UniversityDeadline.objects.create(
            university=self.university,
            deadline_type="RD",
            deadline_date=timezone.now().date() + timedelta(days=90),
            deadline_text="Jan 5",
            source_url="https://example.edu/admissions/deadlines",
            confidence=0.95,
        )
        response = self.client.get(reverse("universities_deadlines", kwargs={"pk": self.university.id}))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["deadline_type"], "RD")

    def test_university_list_supports_numeric_filters(self):
        UniversityMetric.objects.create(
            university=self.university,
            key="avg_sat",
            value_number=1450,
            unit="count",
        )
        UniversityMetric.objects.create(
            university=self.university,
            key="net_price",
            value_number=22000,
            unit="usd",
        )
        response = self.client.get(
            reverse("universities_list"),
            {"avg_sat_min": 1400, "avg_sat_max": 1500, "net_price_max": 25000},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)

    def test_university_search_is_case_insensitive(self):
        university = University.objects.create(name="Princeton University", country="USA")

        response = self.client.get(reverse("universities_list"), {"q": "princeton"})

        self.assertEqual(response.status_code, 200)
        result_names = [item["name"] for item in response.data["results"]]
        self.assertIn(university.name, result_names)

    def test_university_search_handles_keyboard_layout_mismatch(self):
        university = University.objects.create(name="Princeton University", country="USA")

        response = self.client.get(reverse("universities_list"), {"q": "зкштсуещт"})

        self.assertEqual(response.status_code, 200)
        result_names = [item["name"] for item in response.data["results"]]
        self.assertIn(university.name, result_names)

    def test_inactive_university_detail_is_hidden(self):
        inactive = University.objects.create(name="Hidden University", is_active=False)

        response = self.client.get(reverse("universities_detail", kwargs={"pk": inactive.id}))

        self.assertEqual(response.status_code, 404)

    def test_inactive_university_cannot_be_added_to_my_universities(self):
        inactive = University.objects.create(name="Hidden University", is_active=False)

        response = self.client.post(
            reverse("my_universities_list_create"),
            {"university_id": inactive.id},
            format="json",
        )

        self.assertEqual(response.status_code, 400)


class DeadlineParserTests(APITestCase):
    def test_parse_deadlines_from_html(self):
        html = """
        <html><body>
        <h2>Application Deadlines</h2>
        <p>Early Action: Nov 1</p>
        <p>Regular Decision: Jan 5</p>
        <p>Rolling admissions available</p>
        </body></html>
        """
        items = parse_deadlines_from_html(html, "https://example.edu/admissions")
        types = {item.deadline_type for item in items}
        self.assertIn("EA", types)
        self.assertIn("RD", types)
        self.assertIn("ROLLING", types)

    def test_parse_deadlines_from_peterson_html_table(self):
        html = """
        <html><body>
          <h3>Application Deadlines</h3>
          <table>
            <thead>
              <tr>
                <th>Type</th><th>Application Closing</th><th>Notification Date</th><th>Rolling Admissions</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Fall freshmen</td><td>November 30th</td><td>March 31st</td><td>No</td></tr>
              <tr><td>Transfer</td><td>Not reported</td><td>Not reported</td><td>Yes</td></tr>
            </tbody>
          </table>
        </body></html>
        """
        items = parse_deadlines_from_peterson_html(html, "https://www.petersons.com/college-search/example.aspx")
        self.assertEqual(len(items), 2)
        first = items[0]
        self.assertEqual(first.deadline_type, "RD")
        self.assertIsNotNone(first.deadline_date)
        self.assertIsNotNone(first.notification_date)
        second = items[1]
        self.assertEqual(second.deadline_type, "TRANSFER_FALL")
        self.assertTrue(second.is_rolling)


class ScrapeCommandTests(APITestCase):
    def setUp(self):
        self.university = University.objects.create(
            name="Mock University",
            source="niche",
            source_url="https://www.niche.com/colleges/mock/",
        )

    @patch("apps.universities.management.commands.scrape_niche_universities.Path.exists", return_value=True)
    @patch("apps.universities.management.commands.scrape_niche_universities.sync_playwright")
    @patch("apps.universities.management.commands.scrape_niche_universities.scrape_university")
    def test_scrape_command_dry_run_creates_run_items(self, mock_scrape, mock_playwright, _mock_exists):
        mock_scrape.return_value = {
            "status": "success",
            "errors": [],
            "sections": [],
            "metrics": [],
            "media": [],
            "raw_payload": {"sections": []},
            "raw_text_index": "",
            "core": {"acceptance_rate": 10, "sat_range": "1200-1300", "act_range": "28-31", "main_deadline": "Jan 5"},
        }
        mock_context = MagicMock()
        mock_context.storage_state.return_value = {}
        mock_playwright.return_value.__enter__.return_value.chromium.launch_persistent_context.return_value = mock_context

        call_command("scrape_niche_universities", "--dry-run", "--limit", "1")

        self.assertEqual(ScrapeRun.objects.count(), 1)
        run = ScrapeRun.objects.first()
        self.assertEqual(run.targets_total, 1)
        self.assertEqual(run.items.count(), 1)


class LicensedIngestionTests(APITestCase):
    def test_normalize_metrics_and_quality_gate(self):
        metrics = normalize_metrics(
            {
                "acceptance_rate": 11,
                "net_price": 21000,
                "sat_range": "1390-1510",
            }
        )
        gate = evaluate_quality(metrics)
        self.assertEqual(gate.status, "success")

    def test_quality_gate_fails_without_core_metrics(self):
        metrics = normalize_metrics({"students_count": 12000})
        gate = evaluate_quality(metrics)
        self.assertEqual(gate.status, "failed")

    def test_mock_connector_returns_records(self):
        connector = LicensedFeedConnector()
        records = connector.fetch_university_list()
        self.assertTrue(len(records) > 0)
        self.assertTrue(records[0].external_id)

    def test_full_ingest_command_creates_licensed_run(self):
        call_command("ingest_universities_full", "--dry-run", "--limit", "2")
        run = ScrapeRun.objects.filter(source="licensed").order_by("-id").first()
        self.assertIsNotNone(run)
        self.assertEqual(run.targets_total, 2)
