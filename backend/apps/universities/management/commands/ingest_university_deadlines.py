from __future__ import annotations

import time

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.universities.models import ScrapeRun, ScrapeRunItem, University
from apps.universities.services.deadline_ingestion import ingest_deadlines_for_university


class Command(BaseCommand):
    help = "Ingest admission deadlines for universities (Peterson's by default)."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=100)
        parser.add_argument("--only-id", type=int, action="append")
        parser.add_argument("--official-only", action="store_true")
        parser.add_argument("--source", type=str, default="petersons", choices=["petersons", "bigfuture", "official"])
        parser.add_argument("--debug", action="store_true")

    def handle(self, *args, **options):
        qs = University.objects.filter(is_active=True).order_by("id")
        if options["only_id"]:
            qs = qs.filter(id__in=options["only_id"])
        if options["limit"]:
            qs = qs[: options["limit"]]
        universities = list(qs)

        if not universities:
            self.stdout.write(self.style.WARNING("No universities matched for deadline ingestion."))
            return

        run = ScrapeRun.objects.create(source="deadlines", status="success", targets_total=len(universities))
        self.stdout.write(f"Starting deadline ingest run #{run.id} for {len(universities)} universities")

        ok_count = 0
        failed_count = 0
        run_errors: list[str] = []

        for index, university in enumerate(universities, start=1):
            started = time.time()
            error_text = ""
            result = {"kind": "deadline_ingestion"}
            try:
                source = "official" if options["official_only"] else options["source"]
                result = ingest_deadlines_for_university(university, source=source, debug=options["debug"])
                status = result["status"]
                saved = result.get("saved", 0)
                low_conf = result.get("low_confidence", 0)
                source_url = result.get("source_url") or university.source_url
                errors = result.get("errors", [])
                if errors:
                    error_text = "; ".join(errors[:3])
                error_text = f"{error_text} | saved={saved} low_conf={low_conf} main={result.get('main_deadline')}".strip()

                if status in {"success", "partial"}:
                    ok_count += 1
                    if status == "partial":
                        run_errors.append(f"{university.name}: partial ({error_text})")
                else:
                    failed_count += 1
                    run_errors.append(f"{university.name}: failed ({error_text})")
            except Exception as exc:  # noqa: BLE001
                status = "failed"
                source_url = university.source_url
                failed_count += 1
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
                parsed_payload=result if isinstance(result, dict) else {"kind": "deadline_ingestion"},
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
        self.stdout.write(self.style.SUCCESS(f"Run #{run.id} finished: {run.status}"))
