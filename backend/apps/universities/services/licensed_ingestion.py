from __future__ import annotations

import time
from dataclasses import dataclass

from django.utils import timezone

from apps.universities.connectors.base import ProviderUniversityRecord
from apps.universities.models import ScrapeRun, ScrapeRunItem
from apps.universities.services.ingestion import build_result_from_record, upsert_university_from_record
from apps.universities.services.niche_persistence import persist_university_scrape_result


@dataclass
class IngestionSummary:
    run_id: int
    status: str
    ok: int
    failed: int
    total: int


def ingest_records(records: list[ProviderUniversityRecord], dry_run: bool = False, parser_version: str = "licensed-v1"):
    run = ScrapeRun.objects.create(source="licensed", status="success", targets_total=len(records))
    ok_count = 0
    failed_count = 0
    run_errors: list[str] = []

    for record in records:
        started = time.time()
        status = "failed"
        item_error = ""
        payload = {}
        university = None
        try:
            result = build_result_from_record(record)
            payload = result["raw_payload"]
            university = upsert_university_from_record(record)
            status = result["status"]
            item_error = "; ".join(result["errors"][:3]) if result["errors"] else ""
            if status in {"success", "partial"} and not dry_run:
                persist_university_scrape_result(
                    university,
                    result,
                    parser_version=parser_version,
                    source="licensed",
                    root_url=record.source_url or record.website_url,
                    mark_ingested=True,
                )
                university.last_ingested_at = timezone.now()
                university.source_provider = "licensed"
                university.is_active = True
                university.save(update_fields=["last_ingested_at", "source_provider", "is_active"])
        except Exception as exc:  # noqa: BLE001
            status = "failed"
            item_error = str(exc)

        duration_ms = int((time.time() - started) * 1000)
        ScrapeRunItem.objects.create(
            run=run,
            university=university,
            source_url=record.source_url or record.website_url or "",
            status=status,
            retries=0,
            duration_ms=duration_ms,
            parsed_payload=payload,
            error_text=item_error,
        )

        if status == "failed":
            failed_count += 1
            run_errors.append(f"{record.external_id}: {item_error}")
        else:
            ok_count += 1
            if status == "partial":
                run_errors.append(f"{record.external_id}: partial quality")

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
    run.save(update_fields=["targets_ok", "targets_failed", "finished_at", "error_summary", "status"])
    return IngestionSummary(
        run_id=run.id,
        status=run.status,
        ok=ok_count,
        failed=failed_count,
        total=len(records),
    )
