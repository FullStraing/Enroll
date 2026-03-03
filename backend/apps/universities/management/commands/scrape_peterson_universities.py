from __future__ import annotations

import time

from django.core.management.base import BaseCommand
from django.db.models import Q
from django.utils import timezone

from apps.universities.models import ScrapeRun, ScrapeRunItem, University, UniversityMetric
from apps.universities.services.niche_persistence import persist_university_scrape_result
from apps.universities.services.peterson_scraper import PARSER_VERSION, scrape_peterson_profile


class Command(BaseCommand):
    help = "Enrich universities with Peterson profile blocks (location, majors, applying, aid, campus life, athletics, GPA)."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=100)
        parser.add_argument("--only-id", type=int, action="append")
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument("--timeout", type=int, default=30)

    def handle(self, *args, **options):
        qs = University.objects.filter(
            Q(source_provider="gradgpt") | Q(source_url__icontains="petersons.com/college-search/")
        ).order_by("id")
        if options["only_id"]:
            qs = qs.filter(id__in=options["only_id"])
        if options["limit"]:
            qs = qs[: options["limit"]]
        universities = list(qs)

        if not universities:
            self.stdout.write(self.style.WARNING("No universities matched."))
            return

        run = ScrapeRun.objects.create(source="petersons", status="success", targets_total=len(universities))
        self.stdout.write(f"Starting Peterson scrape run #{run.id} for {len(universities)} universities")

        ok_count = 0
        failed_count = 0
        run_errors: list[str] = []

        for index, university in enumerate(universities, start=1):
            started = time.time()
            status = "failed"
            payload: dict = {}
            source_url = university.source_url
            error_text = ""

            try:
                result = scrape_peterson_profile(university.name, timeout=options["timeout"])
                payload = result.get("raw_payload", {})
                source_url = payload.get("root_url") or source_url
                status = result.get("status", "failed")
                reason_codes = result.get("reason_codes", [])
                completeness = result.get("completeness_score")
                if completeness is not None:
                    error_text = f"completeness={completeness}"

                if status in {"success", "partial"}:
                    if not options["dry_run"]:
                        persist_university_scrape_result(
                            university=university,
                            result=result,
                            parser_version=PARSER_VERSION,
                            source="petersons",
                            root_url=source_url,
                            mark_ingested=True,
                            replace_media=False,
                        )
                        self._ensure_gpa_metric(university, source_url=source_url)
                    ok_count += 1
                    if status == "partial":
                        details = ",".join(reason_codes[:5]) if reason_codes else "partial_data"
                        run_errors.append(f"{university.name}: {details}")
                        error_text = f"{error_text} | {details}" if error_text else details
                else:
                    failed_count += 1
                    details = ",".join(reason_codes[:5]) if reason_codes else "missing_required_blocks"
                    run_errors.append(f"{university.name}: {details}")
                    error_text = f"{error_text} | {details}" if error_text else details
            except Exception as exc:  # noqa: BLE001
                failed_count += 1
                status = "failed"
                error_text = str(exc)
                run_errors.append(f"{university.name}: {error_text}")

            duration_ms = int((time.time() - started) * 1000)
            ScrapeRunItem.objects.create(
                run=run,
                university=university,
                source_url=source_url,
                status=status if status in {"success", "partial"} else "failed",
                retries=0,
                duration_ms=duration_ms,
                parsed_payload=payload,
                error_text=error_text,
            )
            self.stdout.write(f"[{index}] {university.name}: {status} ({duration_ms}ms)")

        run.targets_ok = ok_count
        run.targets_failed = failed_count
        run.finished_at = timezone.now()
        run.error_summary = "\n".join(run_errors[:200])
        if failed_count == 0 and not run_errors:
            run.status = "success"
        elif ok_count > 0:
            run.status = "partial"
        else:
            run.status = "failed"
        run.save(update_fields=["targets_ok", "targets_failed", "finished_at", "status", "error_summary"])

        if options["dry_run"]:
            self.stdout.write(self.style.WARNING("Dry-run mode: no DB updates."))
        self.stdout.write(self.style.SUCCESS(f"Run #{run.id} finished: {run.status}"))

    @staticmethod
    def _ensure_gpa_metric(university: University, source_url: str) -> None:
        existing = UniversityMetric.objects.filter(university=university, key="avg_gpa").first()
        if existing and existing.value_number is not None:
            return
        if existing and isinstance(existing.value_json, dict):
            lo = existing.value_json.get("min")
            hi = existing.value_json.get("max")
            if isinstance(lo, (int, float)) and isinstance(hi, (int, float)):
                existing.value_number = round((float(lo) + float(hi)) / 2, 2)
                existing.value_text = existing.value_text or f"{existing.value_number:.2f}"
                existing.source_url = source_url or existing.source_url
                existing.save(update_fields=["value_number", "value_text", "source_url", "updated_at"])
                return
        fallback = (
            UniversityMetric.objects.filter(university=university, key__in=["avg_gpa_weighted", "avg_gpa_unweighted"])
            .exclude(value_number__isnull=True)
            .order_by("key")
            .first()
        )
        if not fallback:
            return
        UniversityMetric.objects.update_or_create(
            university=university,
            key="avg_gpa",
            defaults={
                "unit": "count",
                "value_number": fallback.value_number,
                "value_text": fallback.value_text or f"{fallback.value_number:.2f}",
                "value_json": None,
                "source_url": source_url or fallback.source_url,
                "section_key": "peterson_profile",
                "confidence": 0.8,
            },
        )
