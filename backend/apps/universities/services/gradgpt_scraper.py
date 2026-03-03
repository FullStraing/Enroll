import hashlib
import json
import re
from dataclasses import dataclass
from datetime import datetime
from typing import Any
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup


PARSER_VERSION = "gradgpt-v2"
INDEX_URL = "https://www.gradgpt.com/common-data-set"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)

ID_METRIC_MAP: dict[str, tuple[str, str]] = {
    "acceptance_rate": ("acceptance_rate", "percent"),
    # SAT/ACT averages are sourced from cds-raw admissions.average_sat_act (authoritative),
    # so we do not trust page id-values for these keys.
    "avg_gpa": ("avg_gpa", "range"),
    "student_count": ("student_count", "count"),
    "instate_total": ("net_price_in_state", "usd"),
    "outstate_total": ("net_price_out_state", "usd"),
    "instate_tuition": ("tuition_in_state", "usd"),
    "outstate_tuition": ("tuition_out_state", "usd"),
    "room_cost": ("housing_cost", "usd"),
    "books_cost": ("books_supplies", "usd"),
    "transportation": ("transportation_cost", "usd"),
    "other_cost": ("other_cost", "usd"),
    "rank": ("overall_rank", "count"),
}

TEXT_METRIC_PATTERNS = {
    "acceptance_rate": (r"Acceptance Rate[^0-9]{0,30}([0-9]{1,3})\s*%", "percent"),
    "sat_range": (r"SAT[^0-9]{0,40}([0-9]{3,4}\s*[-to]+\s*[0-9]{3,4})", "range"),
    "act_range": (r"ACT[^0-9]{0,40}([0-9]{1,2}\s*[-to]+\s*[0-9]{1,2})", "range"),
    "application_deadline": (
        r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}",
        "text",
    ),
}

REQUIRED_CHECKS = {
    "admissions": "MISSING_ADMISSIONS_CORE",
    "costs": "MISSING_COSTS_CORE",
    "factors": "MISSING_IMPORTANT_FACTORS",
    "diversity": "MISSING_CAMPUS_DIVERSITY",
}


@dataclass
class SectionScrapeResult:
    section_key: str
    url: str
    status: str
    html_hash: str
    parsed_payload: dict[str, Any]
    error_text: str = ""


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def _to_number(value: str) -> float | None:
    digits = re.sub(r"[^0-9.]", "", value or "")
    if not digits:
        return None
    try:
        return float(digits)
    except ValueError:
        return None


def _slug_from_url(url: str) -> str:
    parts = [part for part in urlparse(url).path.strip("/").split("/") if part]
    if len(parts) >= 2 and parts[0] == "common-data-set":
        return parts[1]
    return ""


def fetch_html(url: str, timeout: int = 30) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    with urlopen(request, timeout=timeout) as response:
        return response.read().decode("utf-8", "ignore")


def discover_university_urls(index_url: str = INDEX_URL, limit: int | None = None) -> list[str]:
    html = fetch_html(index_url)
    slugs = sorted(set(re.findall(r"/common-data-set/([a-z0-9-]+)", html)))
    urls = [urljoin(index_url, f"/common-data-set/{slug}") for slug in slugs]
    if limit is not None:
        return urls[:limit]
    return urls


def _metric_payload(
    key: str,
    unit: str,
    source_url: str,
    value_text: str = "",
    value_number: float | None = None,
    value_json: Any = None,
    confidence: float = 0.9,
) -> dict[str, Any]:
    return {
        "key": key,
        "unit": unit,
        "value_text": value_text,
        "value_number": value_number,
        "value_json": value_json,
        "confidence": confidence,
        "section_key": "overview",
        "source_url": source_url,
    }


def _load_cds_raw_json(soup: BeautifulSoup) -> dict[str, Any]:
    node = soup.select_one("div.cds-raw")
    if not node:
        return {}
    raw = _clean_text(node.get_text(" ", strip=True))
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _extract_key_values(soup: BeautifulSoup) -> list[dict[str, str]]:
    key_values: list[dict[str, str]] = []

    for dt in soup.select("dt"):
        dd = dt.find_next("dd")
        if not dd:
            continue
        key = _clean_text(dt.get_text(" ", strip=True))
        value = _clean_text(dd.get_text(" ", strip=True))
        if key and value:
            key_values.append({"key": key, "value": value})

    for row_label in soup.select('[class*="row-lead-text"]'):
        key = _clean_text(row_label.get_text(" ", strip=True))
        row = row_label.find_parent()
        if not row:
            continue
        values = []
        for node in row.select('[class*="text-size-medium"]'):
            value = _clean_text(node.get_text(" ", strip=True))
            if value and value != key:
                values.append(value)
        if key and values:
            key_values.append({"key": key, "value": " | ".join(values)})

    return key_values[:400]


def _extract_id_values(soup: BeautifulSoup) -> dict[str, str]:
    id_values: dict[str, str] = {}
    for node in soup.select("[id]"):
        id_key = (node.get("id") or "").strip()
        if not id_key:
            continue
        text = _clean_text(node.get_text(" ", strip=True))
        if text:
            id_values[id_key] = text
    return id_values


def _extract_tables(soup: BeautifulSoup) -> list[dict[str, Any]]:
    tables: list[dict[str, Any]] = []
    for table in soup.select("table"):
        headers = [_clean_text(cell.get_text(" ", strip=True)) for cell in table.select("thead th")]
        rows = []
        for row in table.select("tbody tr"):
            cells = [_clean_text(cell.get_text(" ", strip=True)) for cell in row.select("th,td")]
            if cells:
                rows.append(cells)
        if headers or rows:
            tables.append({"headers": headers, "rows": rows})
    return tables[:80]


def _extract_media(soup: BeautifulSoup, page_url: str) -> list[dict[str, Any]]:
    media: list[dict[str, Any]] = []
    for image in soup.select("img[src]"):
        src = (image.get("src") or "").strip()
        if not src:
            continue
        media.append(
            {
                "url": urljoin(page_url, src),
                "type": "image",
                "alt": _clean_text(image.get("alt", "")),
                "caption": "",
                "width": image.get("width"),
                "height": image.get("height"),
            }
        )
    return media[:300]


def _extract_metrics(
    text_blob: str,
    id_values: dict[str, str],
    page_url: str,
    cds_json: dict[str, Any],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    metrics: dict[str, dict[str, Any]] = {}
    important_factors: list[dict[str, Any]] = []
    diversity_breakdown: list[dict[str, Any]] = []

    for id_key, raw_value in id_values.items():
        mapping = ID_METRIC_MAP.get(id_key)
        if not mapping:
            continue
        metric_key, unit = mapping
        payload = _metric_payload(
            key=metric_key,
            unit=unit,
            source_url=page_url,
            value_text=raw_value,
            confidence=0.92,
        )
        if unit in {"usd", "percent", "count"}:
            payload["value_number"] = _to_number(raw_value)
        elif unit == "range":
            parts = [part.strip() for part in re.split(r"[-to]+", raw_value) if part.strip()]
            if len(parts) >= 2:
                left = _to_number(parts[0])
                right = _to_number(parts[-1])
                if left is not None and right is not None:
                    payload["value_json"] = {"min": left, "max": right}
        metrics[metric_key] = payload

    for metric_key, (pattern, unit) in TEXT_METRIC_PATTERNS.items():
        if metric_key in metrics:
            continue
        match = re.search(pattern, text_blob, re.IGNORECASE)
        if not match:
            continue
        raw_value = _clean_text(match.group(1))
        payload = _metric_payload(
            key=metric_key,
            unit=unit,
            source_url=page_url,
            value_text=raw_value,
            confidence=0.75,
        )
        if unit in {"usd", "percent", "count"}:
            payload["value_number"] = _to_number(raw_value)
        elif unit == "range":
            parts = [part.strip() for part in re.split(r"[-to]+", raw_value) if part.strip()]
            if len(parts) >= 2:
                left = _to_number(parts[0])
                right = _to_number(parts[-1])
                if left is not None and right is not None:
                    payload["value_json"] = {"min": left, "max": right}
        metrics[metric_key] = payload

    admissions = cds_json.get("admissions", {}) if isinstance(cds_json.get("admissions"), dict) else {}
    cost = cds_json.get("cost", {}) if isinstance(cds_json.get("cost"), dict) else {}
    factors = admissions.get("factors_of_admission", {}) if isinstance(admissions.get("factors_of_admission"), dict) else {}
    diversity = admissions.get("ethnic_backgrounds", {}) if isinstance(admissions.get("ethnic_backgrounds"), dict) else {}

    acceptance_rate = admissions.get("acceptance_rate")
    if acceptance_rate:
        metrics["acceptance_rate"] = _metric_payload(
            key="acceptance_rate",
            unit="percent",
            source_url=page_url,
            value_text=str(acceptance_rate),
            value_number=_to_number(str(acceptance_rate)),
            confidence=0.97,
        )

    avg_gpa = admissions.get("average_gpa", {})
    if isinstance(avg_gpa, dict):
        for gpa_key, gpa_value in avg_gpa.items():
            metric_key = f"avg_gpa_{gpa_key}"
            metrics[metric_key] = _metric_payload(
                key=metric_key,
                unit="count",
                source_url=page_url,
                value_text=str(gpa_value),
                value_number=_to_number(str(gpa_value)),
                confidence=0.96,
            )

    sat_act = admissions.get("average_sat_act", {})
    if isinstance(sat_act, dict):
        sat = sat_act.get("sat", {})
        act = sat_act.get("act", {})
        if isinstance(sat, dict):
            for sat_key, sat_value in sat.items():
                metric_key = f"sat_{sat_key}".replace("percentile", "p")
                metrics[metric_key] = _metric_payload(
                    key=metric_key,
                    unit="count",
                    source_url=page_url,
                    value_text=str(sat_value),
                    value_number=_to_number(str(sat_value)),
                    confidence=0.96,
                )
            sat_avg = _to_number(str(sat.get("average", "")))
            sat_p25 = _to_number(str(sat.get("25th_percentile", "")))
            sat_p75 = _to_number(str(sat.get("75th_percentile", "")))
            if sat_avg is not None:
                metrics["avg_sat"] = _metric_payload(
                    key="avg_sat",
                    unit="count",
                    source_url=page_url,
                    value_text=str(int(sat_avg)),
                    value_number=sat_avg,
                    confidence=0.99,
                )
            if sat_p25 is not None and sat_p75 is not None:
                metrics["sat_range"] = _metric_payload(
                    key="sat_range",
                    unit="range",
                    source_url=page_url,
                    value_text=f"{int(sat_p25)}-{int(sat_p75)}",
                    value_json={"min": sat_p25, "max": sat_p75},
                    confidence=0.99,
                )
        if isinstance(act, dict):
            for act_key, act_value in act.items():
                metric_key = f"act_{act_key}".replace("percentile", "p")
                metrics[metric_key] = _metric_payload(
                    key=metric_key,
                    unit="count",
                    source_url=page_url,
                    value_text=str(act_value),
                    value_number=_to_number(str(act_value)),
                    confidence=0.96,
                )
            act_avg = _to_number(str(act.get("average", "")))
            act_p25 = _to_number(str(act.get("25th_percentile", "")))
            act_p75 = _to_number(str(act.get("75th_percentile", "")))
            if act_avg is not None:
                metrics["avg_act"] = _metric_payload(
                    key="avg_act",
                    unit="count",
                    source_url=page_url,
                    value_text=str(int(act_avg)),
                    value_number=act_avg,
                    confidence=0.99,
                )
            if act_p25 is not None and act_p75 is not None:
                metrics["act_range"] = _metric_payload(
                    key="act_range",
                    unit="range",
                    source_url=page_url,
                    value_text=f"{int(act_p25)}-{int(act_p75)}",
                    value_json={"min": act_p25, "max": act_p75},
                    confidence=0.99,
                )

    total_undergraduates = admissions.get("total_undergraduates")
    if total_undergraduates is not None:
        metrics["total_undergraduates"] = _metric_payload(
            key="total_undergraduates",
            unit="count",
            source_url=page_url,
            value_text=str(total_undergraduates),
            value_number=_to_number(str(total_undergraduates)),
            confidence=0.96,
        )

    admitted_academics = admissions.get("admitted_student_academics", {})
    if isinstance(admitted_academics, dict):
        for k, v in admitted_academics.items():
            if isinstance(v, dict):
                metrics[f"admitted_{k}"] = _metric_payload(
                    key=f"admitted_{k}",
                    unit="json",
                    source_url=page_url,
                    value_text=json.dumps(v),
                    value_json=v,
                    confidence=0.94,
                )

    tuition = cost.get("tuition", {}) if isinstance(cost.get("tuition"), dict) else {}
    total = cost.get("total", {}) if isinstance(cost.get("total"), dict) else {}
    if tuition:
        metrics["tuition_in_state"] = _metric_payload(
            key="tuition_in_state",
            unit="usd",
            source_url=page_url,
            value_text=str(tuition.get("in_state", "")),
            value_number=_to_number(str(tuition.get("in_state", ""))),
            confidence=0.97,
        )
        metrics["tuition_out_state"] = _metric_payload(
            key="tuition_out_state",
            unit="usd",
            source_url=page_url,
            value_text=str(tuition.get("out_of_state", "")),
            value_number=_to_number(str(tuition.get("out_of_state", ""))),
            confidence=0.97,
        )
    if total:
        metrics["net_price_in_state"] = _metric_payload(
            key="net_price_in_state",
            unit="usd",
            source_url=page_url,
            value_text=str(total.get("in_state", "")),
            value_number=_to_number(str(total.get("in_state", ""))),
            confidence=0.97,
        )
        metrics["net_price_out_state"] = _metric_payload(
            key="net_price_out_state",
            unit="usd",
            source_url=page_url,
            value_text=str(total.get("out_of_state", "")),
            value_number=_to_number(str(total.get("out_of_state", ""))),
            confidence=0.97,
        )
    if cost.get("housing") is not None:
        metrics["housing_cost"] = _metric_payload(
            key="housing_cost",
            unit="usd",
            source_url=page_url,
            value_text=str(cost.get("housing", "")),
            value_number=_to_number(str(cost.get("housing", ""))),
            confidence=0.97,
        )
    if cost.get("books_and_supplies") is not None:
        metrics["books_supplies"] = _metric_payload(
            key="books_supplies",
            unit="usd",
            source_url=page_url,
            value_text=str(cost.get("books_and_supplies", "")),
            value_number=_to_number(str(cost.get("books_and_supplies", ""))),
            confidence=0.97,
        )
    if cost.get("transportation") is not None:
        metrics["transportation_cost"] = _metric_payload(
            key="transportation_cost",
            unit="usd",
            source_url=page_url,
            value_text=str(cost.get("transportation", "")),
            value_number=_to_number(str(cost.get("transportation", ""))),
            confidence=0.95,
        )
    if cost.get("personal_expenses") is not None:
        metrics["other_cost"] = _metric_payload(
            key="other_cost",
            unit="usd",
            source_url=page_url,
            value_text=str(cost.get("personal_expenses", "")),
            value_number=_to_number(str(cost.get("personal_expenses", ""))),
            confidence=0.95,
        )
    living_sum = (
        (_to_number(str(cost.get("housing", ""))) or 0)
        + (_to_number(str(cost.get("books_and_supplies", ""))) or 0)
        + (_to_number(str(cost.get("transportation", ""))) or 0)
        + (_to_number(str(cost.get("personal_expenses", ""))) or 0)
    )
    if living_sum > 0:
        metrics["living_expenses_total"] = _metric_payload(
            key="living_expenses_total",
            unit="usd",
            source_url=page_url,
            value_text=str(int(living_sum)),
            value_number=living_sum,
            confidence=0.9,
        )
    if tuition:
        in_state = _to_number(str(tuition.get("in_state", "")))
        out_state = _to_number(str(tuition.get("out_of_state", "")))
        if in_state is not None:
            metrics["fees_total_in_state"] = _metric_payload(
                key="fees_total_in_state",
                unit="usd",
                source_url=page_url,
                value_text=str(int(in_state)),
                value_number=in_state,
                confidence=0.9,
            )
        if out_state is not None:
            metrics["fees_total_out_state"] = _metric_payload(
                key="fees_total_out_state",
                unit="usd",
                source_url=page_url,
                value_text=str(int(out_state)),
                value_number=out_state,
                confidence=0.9,
            )

    for factor_name, importance in factors.items():
        important_factors.append(
            {
                "factor_name": factor_name,
                "importance_level": str(importance),
                "source_text": str(importance),
            }
        )
        metrics[f"factor_{factor_name}"] = _metric_payload(
            key=f"factor_{factor_name}",
            unit="text",
            source_url=page_url,
            value_text=str(importance),
            confidence=0.95,
        )

    for group_name, group_value in diversity.items():
        number = _to_number(str(group_value))
        diversity_breakdown.append(
            {
                "group_name": group_name,
                "count": number,
                "share_percent": number if "%" in str(group_value) else None,
                "source_text": str(group_value),
            }
        )
        metrics[f"diversity_{group_name}"] = _metric_payload(
            key=f"diversity_{group_name}",
            unit="count" if number is not None else "text",
            source_url=page_url,
            value_text=str(group_value),
            value_number=number,
            confidence=0.95,
        )

    return list(metrics.values()), important_factors, diversity_breakdown


def _core_from_metrics(metrics: list[dict[str, Any]]) -> dict[str, Any]:
    by_key = {item.get("key"): item for item in metrics}
    acceptance_rate = by_key.get("acceptance_rate", {}).get("value_number")
    sat_range = by_key.get("sat_range", {}).get("value_text", "")
    act_range = by_key.get("act_range", {}).get("value_text", "")
    deadline = by_key.get("application_deadline", {}).get("value_text")
    return {
        "acceptance_rate": int(round(acceptance_rate)) if acceptance_rate is not None else None,
        "sat_range": sat_range.replace(" ", "") if sat_range else "",
        "act_range": act_range.replace(" ", "") if act_range else "",
        "main_deadline": deadline,
    }


def _build_quality_report(standard_profile: dict[str, Any], metrics: list[dict[str, Any]]) -> dict[str, Any]:
    keys = {item.get("key") for item in metrics}
    admissions_ok = bool(
        "acceptance_rate" in keys
        and ("avg_sat" in keys or "avg_act" in keys or "avg_gpa" in keys or "avg_gpa_weighted" in keys)
    )
    costs_ok = (
        len(
            keys.intersection(
                {
                    "tuition_in_state",
                    "tuition_out_state",
                    "net_price_in_state",
                    "net_price_out_state",
                    "housing_cost",
                    "books_supplies",
                    "transportation_cost",
                    "other_cost",
                }
            )
        )
        >= 3
    )
    factors_ok = bool(standard_profile.get("important_factors"))
    diversity_ok = bool(standard_profile.get("campus_diversity", {}).get("diversity_breakdown")) or bool(
        standard_profile.get("campus_diversity", {}).get("student_count")
    )

    checks = {
        "admissions": admissions_ok,
        "costs": costs_ok,
        "factors": factors_ok,
        "diversity": diversity_ok,
    }
    missing_codes = [REQUIRED_CHECKS[name] for name, passed in checks.items() if not passed]
    completeness_score = int(round((sum(1 for passed in checks.values() if passed) / len(checks)) * 100))

    if all(checks.values()):
        status = "success"
    elif any(checks.values()):
        status = "partial"
    else:
        status = "failed"

    return {
        "status": status,
        "checks": checks,
        "missing_codes": missing_codes,
        "completeness_score": completeness_score,
    }


def scrape_gradgpt_university(page_url: str, timeout: int = 30) -> dict[str, Any]:
    html = fetch_html(page_url, timeout=timeout)
    soup = BeautifulSoup(html, "html.parser")

    university_name = _clean_text(soup.select_one("h1").get_text(" ", strip=True) if soup.select_one("h1") else "")
    slug = _slug_from_url(page_url)
    html_hash = hashlib.sha256(html.encode("utf-8", "ignore")).hexdigest()

    headings = [_clean_text(node.get_text(" ", strip=True)) for node in soup.select("h1,h2,h3")]
    paragraphs = [_clean_text(node.get_text(" ", strip=True)) for node in soup.select("p")]
    list_items = [_clean_text(node.get_text(" ", strip=True)) for node in soup.select("li")]
    key_values = _extract_key_values(soup)
    tables = _extract_tables(soup)
    id_values = _extract_id_values(soup)
    media_raw = _extract_media(soup, page_url)
    cds_json = _load_cds_raw_json(soup)

    text_blob = _clean_text(soup.get_text(" ", strip=True))
    metrics, important_factors, diversity_breakdown = _extract_metrics(
        text_blob=text_blob,
        id_values=id_values,
        page_url=page_url,
        cds_json=cds_json,
    )

    standard_profile = {
        "source_provider": "gradgpt",
        "source_url": page_url,
        "external_id": slug,
        "university_name": university_name or slug.replace("-", " ").title(),
        "fetched_at": datetime.utcnow().isoformat() + "Z",
        "parser_version": PARSER_VERSION,
        "raw_html_hash": html_hash,
        "identity": cds_json.get("university", {}) if isinstance(cds_json.get("university"), dict) else {},
        "admissions": cds_json.get("admissions", {}) if isinstance(cds_json.get("admissions"), dict) else {},
        "costs": cds_json.get("cost", {}) if isinstance(cds_json.get("cost"), dict) else {},
        "important_factors": important_factors,
        "campus_diversity": {
            "student_count": int(_to_number(id_values.get("student_count", "")))
            if _to_number(id_values.get("student_count", "")) is not None
            else None,
            "diversity_breakdown": diversity_breakdown,
        },
    }
    quality = _build_quality_report(standard_profile=standard_profile, metrics=metrics)
    standard_profile["data_completeness_score"] = quality["completeness_score"]

    section_payload = {
        "section_key": "overview",
        "url": page_url,
        "headings": headings[:140],
        "paragraphs": paragraphs[:400],
        "list_items": list_items[:500],
        "key_values": key_values,
        "tables": tables,
        "id_values": id_values,
        "cds_raw_json": cds_json,
        "standard_profile": standard_profile,
        "quality_checks": quality,
        "metrics": metrics,
        "captured_at": datetime.utcnow().isoformat() + "Z",
    }
    section = SectionScrapeResult(
        section_key="overview",
        url=page_url,
        status=quality["status"],
        html_hash=html_hash,
        parsed_payload=section_payload,
        error_text="; ".join(quality["missing_codes"][:20]),
    )

    media = [
        {
            "section_key": "overview",
            "media_url": item["url"],
            "media_type": item.get("type", "image"),
            "alt_text": item.get("alt", ""),
            "caption": item.get("caption", ""),
            "meta_json": {"width": item.get("width"), "height": item.get("height")},
        }
        for item in media_raw
        if item.get("url")
    ]

    raw_payload = {
        "provider": "gradgpt",
        "root_url": page_url,
        "standard_profile": standard_profile,
        "quality_checks": quality,
        "sections": [
            {
                "section_key": section.section_key,
                "url": section.url,
                "status": section.status,
                "raw_html_hash": section.html_hash,
                "parsed_payload": section.parsed_payload,
                "error_text": section.error_text,
            }
        ],
        "metrics": metrics,
        "media": media,
        "parser_version": PARSER_VERSION,
        "fetched_at": datetime.utcnow().isoformat() + "Z",
    }

    return {
        "name": university_name or slug.replace("-", " ").title(),
        "external_id": slug,
        "status": quality["status"],
        "errors": quality["missing_codes"],
        "reason_codes": quality["missing_codes"],
        "completeness_score": quality["completeness_score"],
        "sections": [section],
        "metrics": metrics,
        "media": media,
        "raw_payload": raw_payload,
        "raw_text_index": text_blob[:50000],
        "core": _core_from_metrics(metrics),
    }
