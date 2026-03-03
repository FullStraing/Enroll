from datetime import datetime, timedelta

from django.db import transaction
from django.utils import timezone

from apps.universities.models import (
    UniversityMediaRef,
    UniversityMetric,
    UniversitySourceSection,
    UniversitySourceSnapshot,
)


def parse_deadline_to_date(value):
    if not value:
        return None
    try:
        parsed = datetime.strptime(value, "%b %d")
    except ValueError:
        return None
    current_year = timezone.now().year
    candidate = parsed.replace(year=current_year).date()
    if candidate < timezone.now().date() - timedelta(days=120):
        candidate = parsed.replace(year=current_year + 1).date()
    return candidate


def _section_attr(section, key, default=None):
    if hasattr(section, key):
        return getattr(section, key)
    if isinstance(section, dict):
        return section.get(key, default)
    return default


@transaction.atomic
def persist_university_scrape_result(
    university,
    result,
    parser_version,
    source="niche",
    root_url=None,
    mark_ingested=True,
    replace_media=True,
):
    snapshot = UniversitySourceSnapshot.objects.create(
        university=university,
        source=source,
        root_url=root_url or university.source_url,
        status=result["status"],
        parser_version=parser_version,
        raw_payload=result["raw_payload"],
        raw_text_index=result["raw_text_index"][:50000],
        error_summary="\n".join(result["errors"][:50]),
    )

    for section in result["sections"]:
        UniversitySourceSection.objects.create(
            snapshot=snapshot,
            section_key=_section_attr(section, "section_key", "overview"),
            url=_section_attr(section, "url", root_url or university.source_url),
            status=_section_attr(section, "status", "success"),
            raw_html_hash=_section_attr(section, "html_hash", _section_attr(section, "raw_html_hash", "")),
            parsed_payload=_section_attr(section, "parsed_payload", {}),
            error_text=_section_attr(section, "error_text", ""),
        )

    for metric in result["metrics"]:
        key = metric.get("key")
        if not key:
            continue
        defaults = {
            "value_number": metric.get("value_number"),
            "value_text": metric.get("value_text", ""),
            "value_json": metric.get("value_json"),
            "unit": metric.get("unit", "text"),
            "source_url": metric.get("source_url", university.source_url),
            "section_key": metric.get("section_key", ""),
            "confidence": metric.get("confidence"),
        }
        metric_obj, _ = UniversityMetric.objects.get_or_create(university=university, key=key, defaults=defaults)
        if metric_obj and (
            defaults["value_number"] is not None or defaults["value_text"] or defaults["value_json"] is not None
        ):
            for field, value in defaults.items():
                if field == "value_text":
                    if value:
                        setattr(metric_obj, field, value)
                elif value is not None:
                    setattr(metric_obj, field, value)
            metric_obj.save()

    if replace_media:
        UniversityMediaRef.objects.filter(university=university).delete()
        UniversityMediaRef.objects.bulk_create(
            [
                UniversityMediaRef(
                    university=university,
                    section_key=item["section_key"],
                    media_url=item["media_url"],
                    media_type=item["media_type"],
                    alt_text=item["alt_text"],
                    caption=item["caption"],
                    meta_json=item["meta_json"],
                )
                for item in result["media"]
            ]
        )

    core = result["core"]
    updates = []
    if core.get("acceptance_rate") is not None:
        university.acceptance_rate = int(core["acceptance_rate"])
        updates.append("acceptance_rate")
    if core.get("sat_range"):
        university.sat_range = core["sat_range"]
        updates.append("sat_range")
    if core.get("act_range"):
        university.act_range = core["act_range"]
        updates.append("act_range")
    deadline_date = parse_deadline_to_date(core.get("main_deadline"))
    if deadline_date:
        university.main_deadline = deadline_date
        updates.append("main_deadline")
    if source in {"niche", "gradgpt", "manual", "other"}:
        university.source = source
        updates.append("source")
    if source in {"niche", "gradgpt", "licensed", "other"}:
        university.source_provider = source
        updates.append("source_provider")
    if mark_ingested:
        university.last_ingested_at = timezone.now()
        updates.append("last_ingested_at")
    if updates:
        university.save(update_fields=sorted(set(updates)))
