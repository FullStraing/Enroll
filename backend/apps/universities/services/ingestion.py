from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any

from django.utils import timezone

from apps.universities.connectors.base import ProviderUniversityRecord
from apps.universities.models import University


REQUIRED_ADMISSIONS_KEYS = {"acceptance_rate"}
REQUIRED_COST_KEYS = {"net_price", "room_and_board", "housing_cost", "tuition_in_state", "tuition_out_state"}


@dataclass
class QualityGateResult:
    status: str
    reason: str = ""


def normalize_metrics(metrics: dict[str, Any]) -> list[dict[str, Any]]:
    normalized = []
    for key, value in metrics.items():
        item = {
            "key": key,
            "unit": "text",
            "value_text": "",
            "value_number": None,
            "value_json": None,
            "confidence": 0.9,
        }
        if isinstance(value, (int, float)):
            item["value_number"] = float(value)
            if key.endswith("_rate") or "percent" in key:
                item["unit"] = "percent"
            elif "price" in key or "cost" in key or "tuition" in key:
                item["unit"] = "usd"
            else:
                item["unit"] = "count"
        elif isinstance(value, dict):
            item["unit"] = "json"
            item["value_json"] = value
        elif isinstance(value, list):
            item["unit"] = "json"
            item["value_json"] = value
        else:
            text = str(value).strip()
            item["value_text"] = text
            if "-" in text and any(char.isdigit() for char in text):
                item["unit"] = "range"
        normalized.append(item)
    return normalized


def evaluate_quality(metrics: list[dict[str, Any]]) -> QualityGateResult:
    keys = {item.get("key") for item in metrics}
    has_admissions = any(key in keys for key in REQUIRED_ADMISSIONS_KEYS)
    has_cost = any(key in keys for key in REQUIRED_COST_KEYS)
    if has_admissions and has_cost:
        return QualityGateResult(status="success")
    if has_admissions or has_cost:
        return QualityGateResult(status="partial", reason="core metrics are incomplete")
    return QualityGateResult(status="failed", reason="missing admissions and cost/housing metrics")


def upsert_university_from_record(record: ProviderUniversityRecord) -> University:
    lookup = {
        "external_id": record.external_id,
        "source_provider": "licensed",
    }
    defaults = {
        "name": record.name,
        "country": record.country or "USA",
        "city": record.city,
        "state": record.state,
        "website_url": record.website_url,
        "source_url": record.source_url,
        "source": "other",
        "is_active": True,
    }
    university, _ = University.objects.update_or_create(**lookup, defaults=defaults)
    return university


def build_result_from_record(record: ProviderUniversityRecord) -> dict[str, Any]:
    metrics = normalize_metrics(record.metrics)
    gate = evaluate_quality(metrics)
    raw_payload = {
        "provider": "licensed",
        "record": record.raw_payload,
        "metadata": record.metadata,
        "fetched_at": timezone.now().isoformat(),
    }
    media = []
    for item in record.media:
        url = item.get("url")
        if not url:
            continue
        media.append(
            {
                "section_key": item.get("section_key", "overview"),
                "media_url": url,
                "media_type": item.get("media_type", "image"),
                "alt_text": item.get("alt_text", ""),
                "caption": item.get("caption", ""),
                "meta_json": item.get("meta_json", {}),
            }
        )
    core = {
        "acceptance_rate": _metric_number(record.metrics.get("acceptance_rate")),
        "sat_range": str(record.metrics.get("sat_range") or ""),
        "act_range": str(record.metrics.get("act_range") or ""),
        "main_deadline": str(record.metrics.get("application_deadline") or ""),
    }
    sections = [
        {
            "section_key": "overview",
            "url": record.source_url or record.website_url or "",
            "status": gate.status,
            "raw_html_hash": "",
            "parsed_payload": {
                "metrics": metrics,
                "metadata": record.metadata,
            },
            "error_text": gate.reason,
        }
    ]
    return {
        "status": gate.status,
        "errors": [gate.reason] if gate.reason else [],
        "sections": sections,
        "metrics": [
            {
                **item,
                "section_key": "overview",
                "source_url": record.source_url or record.website_url or "",
            }
            for item in metrics
        ],
        "media": media,
        "raw_payload": raw_payload,
        "raw_text_index": str(record.raw_payload)[:50000],
        "core": core,
    }


def _metric_number(value: Any) -> int | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return int(value)
    text = str(value)
    digits = "".join(ch for ch in text if ch.isdigit())
    if not digits:
        return None
    return int(digits)
