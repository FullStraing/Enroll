import hashlib
import json
import random
import re
import time
from dataclasses import dataclass
from datetime import datetime
from typing import Any
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup
from playwright.sync_api import BrowserContext, TimeoutError as PlaywrightTimeoutError


PARSER_VERSION = "niche-v1"
DEFAULT_SECTION_KEYS = {
    "admissions",
    "cost",
    "housing",
    "academics",
    "campus-life",
    "majors",
    "students",
    "diversity",
    "safety",
    "athletics",
    "after-college",
}

METRIC_PATTERNS = {
    "acceptance_rate": (r"Acceptance Rate[^0-9]{0,50}([0-9]{1,2})\s*%", "percent"),
    "sat_range": (r"SAT Range[^0-9]{0,50}([0-9]{3,4}\s*[-to]+\s*[0-9]{3,4})", "range"),
    "act_range": (r"ACT Range[^0-9]{0,50}([0-9]{1,2}\s*[-to]+\s*[0-9]{1,2})", "range"),
    "tuition_in_state": (r"In-State Tuition[^0-9$]{0,50}\$?\s*([0-9,]{2,})", "usd"),
    "tuition_out_state": (r"Out-of-State Tuition[^0-9$]{0,50}\$?\s*([0-9,]{2,})", "usd"),
    "net_price": (r"Net Price[^0-9$]{0,50}\$?\s*([0-9,]{2,})", "usd"),
    "room_and_board": (r"Room and Board[^0-9$]{0,50}\$?\s*([0-9,]{2,})", "usd"),
    "housing_cost": (r"Housing[^0-9$]{0,50}\$?\s*([0-9,]{2,})", "usd"),
    "off_campus_cost": (r"Off Campus[^0-9$]{0,50}\$?\s*([0-9,]{2,})", "usd"),
    "books_supplies": (r"Books & Supplies[^0-9$]{0,50}\$?\s*([0-9,]{2,})", "usd"),
    "student_faculty_ratio": (r"Student-Faculty Ratio[^0-9]{0,50}([0-9]{1,2}:[0-9]{1,2})", "text"),
    "graduation_rate": (r"Graduation Rate[^0-9]{0,50}([0-9]{1,3})\s*%", "percent"),
    "undergrad_enrollment": (r"Undergraduate Enrollment[^0-9]{0,50}([0-9,]{2,})", "count"),
    "employment_rate": (r"Employed 2 Years After Graduation[^0-9]{0,50}([0-9]{1,3})\s*%", "percent"),
    "median_earnings": (r"Median Earnings[^0-9$]{0,50}\$?\s*([0-9,]{2,})", "usd"),
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
    return re.sub(r"\s+", " ", value).strip()


def _to_number(value: str) -> float | None:
    digits = re.sub(r"[^0-9.]", "", value)
    if not digits:
        return None
    try:
        return float(digits)
    except ValueError:
        return None


def _slug_from_url(url: str) -> str:
    path = urlparse(url).path.strip("/")
    parts = path.split("/")
    if len(parts) >= 2 and parts[0] == "colleges":
        return parts[1]
    return ""


def is_challenge_page(html: str) -> bool:
    lower = html.lower()
    markers = [
        "press & hold",
        "press and hold",
        "access denied",
        "verify you are human",
        "attention required",
        "cloudflare",
    ]
    return any(marker in lower for marker in markers)


def discover_sections(root_url: str, html: str, full_depth: bool = True, max_sections: int = 20) -> dict[str, str]:
    soup = BeautifulSoup(html, "html.parser")
    section_map = {"overview": root_url}
    slug = _slug_from_url(root_url)

    for anchor in soup.select("a[href]"):
        href = anchor.get("href", "").strip()
        if not href:
            continue
        absolute = urljoin(root_url, href)
        parsed = urlparse(absolute)
        if "niche.com" not in parsed.netloc or "/colleges/" not in parsed.path:
            continue
        if slug and f"/colleges/{slug}/" not in parsed.path:
            continue
        path_parts = parsed.path.strip("/").split("/")
        if len(path_parts) < 3:
            continue
        section_key = path_parts[2].lower()
        if not full_depth and section_key not in DEFAULT_SECTION_KEYS:
            continue
        if full_depth or section_key in DEFAULT_SECTION_KEYS:
            section_map[section_key] = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
        if len(section_map) >= max_sections:
            break
    return section_map


def parse_section_html(html: str, section_key: str, url: str) -> dict[str, Any]:
    soup = BeautifulSoup(html, "html.parser")

    headings = [_clean_text(item.get_text(" ", strip=True)) for item in soup.select("h1, h2, h3")]
    paragraphs = [_clean_text(item.get_text(" ", strip=True)) for item in soup.select("p")]
    list_items = [_clean_text(item.get_text(" ", strip=True)) for item in soup.select("li")]

    key_values: list[dict[str, str]] = []
    for dt in soup.select("dt"):
        dd = dt.find_next("dd")
        if not dd:
            continue
        key = _clean_text(dt.get_text(" ", strip=True))
        val = _clean_text(dd.get_text(" ", strip=True))
        if key and val:
            key_values.append({"key": key, "value": val})

    tables: list[dict[str, Any]] = []
    for table in soup.select("table"):
        headers = [_clean_text(cell.get_text(" ", strip=True)) for cell in table.select("thead th")]
        rows: list[list[str]] = []
        for row in table.select("tbody tr"):
            cols = [_clean_text(cell.get_text(" ", strip=True)) for cell in row.select("th, td")]
            if cols:
                rows.append(cols)
        if headers or rows:
            tables.append({"headers": headers, "rows": rows})

    media: list[dict[str, Any]] = []
    for image in soup.select("img[src]"):
        src = image.get("src", "").strip()
        if not src:
            continue
        media.append(
            {
                "url": urljoin(url, src),
                "type": "image",
                "alt": _clean_text(image.get("alt", "")),
                "caption": "",
                "width": image.get("width"),
                "height": image.get("height"),
            }
        )

    text_blob = _clean_text(soup.get_text(" ", strip=True))
    metrics = extract_metrics_from_text(text_blob)

    return {
        "section_key": section_key,
        "url": url,
        "headings": headings[:100],
        "paragraphs": paragraphs[:200],
        "list_items": list_items[:300],
        "key_values": key_values[:200],
        "tables": tables[:50],
        "media": media[:200],
        "metrics": metrics,
        "captured_at": datetime.utcnow().isoformat() + "Z",
    }


def extract_metrics_from_text(text: str) -> list[dict[str, Any]]:
    metrics: list[dict[str, Any]] = []
    for key, (pattern, unit) in METRIC_PATTERNS.items():
        match = re.search(pattern, text, re.IGNORECASE)
        if not match:
            continue
        raw_value = _clean_text(match.group(1))
        metric = {
            "key": key,
            "unit": unit,
            "value_text": raw_value,
            "confidence": 0.85,
        }
        if unit in {"percent", "usd", "count"}:
            metric["value_number"] = _to_number(raw_value)
        elif unit == "range":
            pieces = [piece for piece in re.split(r"[-to]+", raw_value) if piece.strip()]
            if len(pieces) >= 2:
                left = _to_number(pieces[0])
                right = _to_number(pieces[-1])
                if left is not None and right is not None:
                    metric["value_json"] = {"min": left, "max": right}
        metrics.append(metric)
    return metrics


def aggregate_metrics(sections: list[SectionScrapeResult]) -> list[dict[str, Any]]:
    seen: dict[str, dict[str, Any]] = {}
    for section in sections:
        section_metrics = section.parsed_payload.get("metrics", [])
        for metric in section_metrics:
            key = metric.get("key")
            if not key:
                continue
            current = seen.get(key)
            next_item = {
                **metric,
                "section_key": section.section_key,
                "source_url": section.url,
            }
            if not current or (next_item.get("confidence") or 0) >= (current.get("confidence") or 0):
                seen[key] = next_item
    return list(seen.values())


def aggregate_media(sections: list[SectionScrapeResult]) -> list[dict[str, Any]]:
    unique: dict[str, dict[str, Any]] = {}
    for section in sections:
        for item in section.parsed_payload.get("media", []):
            media_url = item.get("url")
            if not media_url:
                continue
            unique_key = f"{section.section_key}:{media_url}"
            unique[unique_key] = {
                "section_key": section.section_key,
                "media_url": media_url,
                "media_type": item.get("type", "image"),
                "alt_text": item.get("alt", ""),
                "caption": item.get("caption", ""),
                "meta_json": {
                    "width": item.get("width"),
                    "height": item.get("height"),
                },
            }
    return list(unique.values())


def scrape_university(
    context: BrowserContext,
    root_url: str,
    full_depth: bool = True,
    max_sections: int = 20,
    timeout_ms: int = 45000,
) -> dict[str, Any]:
    page = context.new_page()
    sections: list[SectionScrapeResult] = []
    errors: list[str] = []

    try:
        page.goto(root_url, wait_until="domcontentloaded", timeout=timeout_ms)
        page.wait_for_timeout(500)
        root_html = page.content()
        if is_challenge_page(root_html):
            page.close()
            raise RuntimeError("challenge_detected: root page is blocked by anti-bot")
    except PlaywrightTimeoutError as exc:
        page.close()
        raise RuntimeError(f"Failed to open root URL: {exc}") from exc

    section_map = discover_sections(root_url, root_html, full_depth=full_depth, max_sections=max_sections)

    for section_key, section_url in section_map.items():
        status = "success"
        error_text = ""
        parsed_payload: dict[str, Any] = {}
        html_hash = ""
        try:
            page.goto(section_url, wait_until="domcontentloaded", timeout=timeout_ms)
            page.wait_for_timeout(350)
            html = page.content()
            if is_challenge_page(html):
                raise RuntimeError("challenge_detected: section page is blocked by anti-bot")
            html_hash = hashlib.sha256(html.encode("utf-8", errors="ignore")).hexdigest()
            parsed_payload = parse_section_html(html, section_key, section_url)
        except Exception as exc:  # noqa: BLE001
            status = "failed"
            error_text = str(exc)
            errors.append(f"{section_key}: {error_text}")
        sections.append(
            SectionScrapeResult(
                section_key=section_key,
                url=section_url,
                status=status,
                html_hash=html_hash,
                parsed_payload=parsed_payload,
                error_text=error_text,
            )
        )
        time.sleep(random.uniform(1.5, 3.0))

    page.close()

    metrics = aggregate_metrics(sections)
    media = aggregate_media(sections)
    raw_payload = {
        "root_url": root_url,
        "section_map": section_map,
        "sections": [
            {
                "section_key": item.section_key,
                "url": item.url,
                "status": item.status,
                "raw_html_hash": item.html_hash,
                "parsed_payload": item.parsed_payload,
                "error_text": item.error_text,
            }
            for item in sections
        ],
        "metrics": metrics,
        "media": media,
        "parser_version": PARSER_VERSION,
        "fetched_at": datetime.utcnow().isoformat() + "Z",
    }
    raw_text_index = _clean_text(
        " ".join(
            " ".join(section.parsed_payload.get("paragraphs", []))
            + " "
            + " ".join(section.parsed_payload.get("list_items", []))
            for section in sections
        )
    )
    status = "success"
    if errors and len(errors) < len(sections):
        status = "partial"
    elif errors and len(errors) >= len(sections):
        status = "failed"

    core = {
        "acceptance_rate": None,
        "sat_range": "",
        "act_range": "",
        "main_deadline": None,
    }
    by_key = {item.get("key"): item for item in metrics}
    if by_key.get("acceptance_rate"):
        number = by_key["acceptance_rate"].get("value_number")
        core["acceptance_rate"] = int(number) if number is not None else None
    if by_key.get("sat_range"):
        core["sat_range"] = by_key["sat_range"].get("value_text", "").replace(" ", "")
    if by_key.get("act_range"):
        core["act_range"] = by_key["act_range"].get("value_text", "").replace(" ", "")

    deadline_match = re.search(
        r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}",
        json.dumps(raw_payload),
        re.IGNORECASE,
    )
    if deadline_match:
        core["main_deadline"] = deadline_match.group(0)

    return {
        "status": status,
        "errors": errors,
        "sections": sections,
        "metrics": metrics,
        "media": media,
        "raw_payload": raw_payload,
        "raw_text_index": raw_text_index,
        "core": core,
    }
