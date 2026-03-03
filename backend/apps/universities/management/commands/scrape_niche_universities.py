import os
import time
from datetime import timedelta
from pathlib import Path

from django.core.management.base import BaseCommand
from django.utils import timezone
from playwright.sync_api import sync_playwright

from apps.universities.models import (
    ScrapeRun,
    ScrapeRunItem,
    University,
)
from apps.universities.services.ingestion import evaluate_quality
from apps.universities.services.niche_persistence import persist_university_scrape_result
from apps.universities.services.niche_scraper import PARSER_VERSION, scrape_university


class Command(BaseCommand):
    help = "Scrape Niche data for universities and store full snapshots + normalized metrics."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=None)
        parser.add_argument("--only-id", type=int, action="append")
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument("--full-depth", action="store_true")
        parser.add_argument("--max-sections", type=int, default=20)
        parser.add_argument("--since-days", type=int, default=None)
        parser.add_argument("--headful", action="store_true")

    def handle(self, *args, **options):
        session_path = Path(os.getenv("NICHE_SESSION_STATE_PATH", "backend/.secrets/niche_session.json"))
        profile_dir = Path(os.getenv("NICHE_PROFILE_DIR", "backend/.secrets/playwright-profile"))
        profile_dir.mkdir(parents=True, exist_ok=True)
        if not profile_dir.exists():
            self.stdout.write(self.style.ERROR(f"Profile dir not found: {profile_dir}"))
            self.stdout.write("Run: python backend/manage.py niche_session_bootstrap")
            return

        qs = University.objects.filter(source="niche").exclude(source_url="")
        if options["only_id"]:
            qs = qs.filter(id__in=options["only_id"])
        if options["since_days"] is not None:
            threshold = timezone.now() - timedelta(days=options["since_days"])
            qs = qs.exclude(source_snapshots__fetched_at__gte=threshold, source_snapshots__status="success")
        qs = qs.distinct().order_by("id")
        if options["limit"]:
            qs = qs[: options["limit"]]

        universities = list(qs)
        if not universities:
            self.stdout.write(self.style.WARNING("No universities matched scrape filters."))
            return

        run = ScrapeRun.objects.create(source="niche", status="success", targets_total=len(universities))
        self.stdout.write(f"Starting scrape run #{run.id} for {len(universities)} universities")

        ok_count = 0
        failed_count = 0
        run_errors = []
        pending_results = []

        with sync_playwright() as playwright:
            channel = os.getenv("NICHE_BROWSER_CHANNEL", "chrome")
            launch_kwargs = {
                "user_data_dir": str(profile_dir),
                "headless": not options["headful"],
                "args": ["--disable-blink-features=AutomationControlled"],
            }
            if channel:
                launch_kwargs["channel"] = channel
            try:
                context = playwright.chromium.launch_persistent_context(**launch_kwargs)
            except Exception:
                launch_kwargs.pop("channel", None)
                context = playwright.chromium.launch_persistent_context(**launch_kwargs)

            for university in universities:
                started = time.time()
                retries = 0
                max_retries = 2
                manual_waits = 0
                item_status = "failed"
                result_payload = {}
                item_error = ""
                scrape_result = None

                while retries <= max_retries:
                    try:
                        result = scrape_university(
                            context=context,
                            root_url=university.source_url,
                            full_depth=options["full_depth"],
                            max_sections=options["max_sections"],
                        )
                        result_payload = result["raw_payload"]
                        gate = evaluate_quality(result.get("metrics", []))
                        if gate.status == "failed":
                            result["status"] = "failed"
                            if gate.reason:
                                result.setdefault("errors", []).append(gate.reason)
                        elif result["status"] == "success" and gate.status == "partial":
                            result["status"] = "partial"
                            if gate.reason:
                                result.setdefault("errors", []).append(gate.reason)
                        item_status = result["status"]
                        item_error = "; ".join(result["errors"][:5])
                        scrape_result = result
                        if item_status in {"success", "partial"}:
                            break
                    except Exception as exc:  # noqa: BLE001
                        item_error = str(exc)
                        if options["headful"] and "challenge_detected" in item_error and manual_waits < 2:
                            manual_waits += 1
                            self.stdout.write(
                                self.style.WARNING(
                                    f"{university.name}: Niche challenge detected. Solve it in browser, then press Enter."
                                )
                            )
                            input()
                            continue
                    retries += 1
                    time.sleep(min(2**retries + manual_waits, 10))

                duration_ms = int((time.time() - started) * 1000)
                pending_results.append(
                    {
                        "university": university,
                        "status": item_status if item_status in {"success", "partial"} else "failed",
                        "retries": retries,
                        "duration_ms": duration_ms,
                        "parsed_payload": result_payload,
                        "error_text": item_error,
                        "scrape_result": scrape_result,
                    }
                )

                if item_status == "success":
                    ok_count += 1
                elif item_status == "partial":
                    ok_count += 1
                    run_errors.append(f"{university.name}: partial")
                else:
                    failed_count += 1
                    run_errors.append(f"{university.name}: {item_error}")

                self.stdout.write(f"[{university.id}] {university.name}: {item_status} ({duration_ms}ms)")

            context.storage_state(path=str(session_path))
            context.close()

        for item in pending_results:
            university = item["university"]
            if item["status"] in {"success", "partial"} and not options["dry_run"]:
                persist_university_scrape_result(university, item["scrape_result"], PARSER_VERSION)
            ScrapeRunItem.objects.create(
                run=run,
                university=university,
                source_url=university.source_url,
                status=item["status"],
                retries=item["retries"],
                duration_ms=item["duration_ms"],
                parsed_payload=item["parsed_payload"],
                error_text=item["error_text"],
            )

        run.targets_ok = ok_count
        run.targets_failed = failed_count
        run.finished_at = timezone.now()
        run.error_summary = "\n".join(run_errors[:50])
        if failed_count == 0 and not run_errors:
            run.status = "success"
        elif ok_count > 0:
            run.status = "partial"
        else:
            run.status = "failed"
        run.save(update_fields=["targets_ok", "targets_failed", "finished_at", "status", "error_summary"])

        if options["dry_run"]:
            self.stdout.write(self.style.WARNING("Dry-run mode: University records were not updated."))
        self.stdout.write(self.style.SUCCESS(f"Run #{run.id} finished: {run.status}"))
