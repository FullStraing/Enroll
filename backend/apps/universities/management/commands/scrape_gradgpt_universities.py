import time
import os

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.universities.models import ScrapeRun, ScrapeRunItem, University
from apps.universities.services.gradgpt_scraper import INDEX_URL, PARSER_VERSION, discover_university_urls, scrape_gradgpt_university
from apps.universities.services.niche_persistence import persist_university_scrape_result


class Command(BaseCommand):
    help = "Scrape universities from gradgpt.com/common-data-set and store snapshots/metrics."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=None)
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument("--only-url", action="append")
        parser.add_argument("--timeout", type=int, default=None)
        parser.add_argument("--index-url", type=str, default=None)

    def handle(self, *args, **options):
        index_url = options["index_url"] or os.getenv("GRADGPT_INDEX_URL", INDEX_URL)
        timeout = options["timeout"] or int(os.getenv("GRADGPT_REQUEST_TIMEOUT", "30"))
        target_urls = options["only_url"] or discover_university_urls(index_url=index_url, limit=options["limit"])
        if options["only_url"] and options["limit"]:
            target_urls = target_urls[: options["limit"]]
        target_urls = list(dict.fromkeys(target_urls))

        if not target_urls:
            self.stdout.write(self.style.WARNING("No GradGPT university URLs found."))
            return

        run = ScrapeRun.objects.create(source="gradgpt", status="success", targets_total=len(target_urls))
        self.stdout.write(f"Starting GradGPT scrape run #{run.id} for {len(target_urls)} universities")
        self.stdout.write(f"Index: {index_url}")

        ok_count = 0
        failed_count = 0
        run_errors = []

        for idx, source_url in enumerate(target_urls, start=1):
            started = time.time()
            status = "failed"
            parsed_payload = {}
            error_text = ""
            university = None
            scrape_result = None
            completeness = None

            try:
                scrape_result = scrape_gradgpt_university(source_url, timeout=timeout)
                parsed_payload = scrape_result.get("raw_payload", {})
                status = scrape_result.get("status", "failed")
                reason_codes = scrape_result.get("reason_codes", [])
                completeness = scrape_result.get("completeness_score")

                external_id = scrape_result.get("external_id")
                name = scrape_result.get("name") or source_url
                if not external_id:
                    raise ValueError(f"Missing external_id for {source_url}")

                university, _ = University.objects.update_or_create(
                    source_provider="gradgpt",
                    external_id=external_id,
                    defaults={
                        "name": name,
                        "source": "gradgpt",
                        "source_provider": "gradgpt",
                        "source_url": source_url,
                        "country": "USA",
                        "is_active": True,
                    },
                )

                if status in {"success", "partial"} and not options["dry_run"]:
                    persist_university_scrape_result(
                        university=university,
                        result=scrape_result,
                        parser_version=PARSER_VERSION,
                        source="gradgpt",
                        root_url=source_url,
                    )

                if status in {"success", "partial"}:
                    ok_count += 1
                    if status == "partial":
                        codes_text = ",".join(reason_codes[:5]) if reason_codes else "PARTIAL_DATA"
                        run_errors.append(f"{name}: {codes_text}")
                        error_text = f"partial:{codes_text}"
                else:
                    failed_count += 1
                    error_text = "; ".join(reason_codes[:5]) or "; ".join(scrape_result.get("errors", [])[:3])
                    if not error_text:
                        error_text = "missing core metrics"
                    run_errors.append(f"{name}: {error_text}")
            except Exception as exc:  # noqa: BLE001
                failed_count += 1
                status = "failed"
                error_text = str(exc)
                run_errors.append(f"{source_url}: {error_text}")

            duration_ms = int((time.time() - started) * 1000)
            item_error_text = error_text
            if completeness is not None:
                suffix = f"completeness={completeness}"
                item_error_text = f"{item_error_text} | {suffix}" if item_error_text else suffix
            ScrapeRunItem.objects.create(
                run=run,
                university=university,
                source_url=source_url,
                status=status if status in {"success", "partial"} else "failed",
                retries=0,
                duration_ms=duration_ms,
                parsed_payload=parsed_payload,
                error_text=item_error_text,
            )
            self.stdout.write(f"[{idx}] {source_url}: {status} ({duration_ms}ms)")

        run.targets_ok = ok_count
        run.targets_failed = failed_count
        run.finished_at = timezone.now()
        run.error_summary = "\n".join(run_errors[:100])
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
