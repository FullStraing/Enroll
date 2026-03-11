from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from datetime import datetime
from typing import Any
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup, Tag

from apps.universities.services.deadline_ingestion import _normalize_name, _resolve_peterson_profile_url


PARSER_VERSION = "peterson-v1"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)


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


def _normalize_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (value or "").lower()).strip()


def _to_number(value: str) -> float | None:
    digits = re.sub(r"[^0-9.]", "", value or "")
    if not digits:
        return None
    try:
        return float(digits)
    except ValueError:
        return None


def _fetch_html(url: str, timeout: int = 30) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    with urlopen(request, timeout=timeout) as response:
        return response.read().decode("utf-8", "ignore")


def resolve_peterson_url(university_name: str) -> str:
    return _resolve_peterson_profile_url(_normalize_name(university_name))


def _extract_table(table: Tag) -> dict[str, Any]:
    headers = [_clean_text(node.get_text(" ", strip=True)) for node in table.select("thead th")]
    rows: list[list[str]] = []
    for row in table.select("tbody tr"):
        cells = [_clean_text(cell.get_text(" ", strip=True)) for cell in row.select("th,td")]
        if cells:
            rows.append(cells)
    if not rows:
        for row in table.select("tr"):
            cells = [_clean_text(cell.get_text(" ", strip=True)) for cell in row.select("th,td")]
            if cells:
                rows.append(cells)
    return {"headers": headers, "rows": rows}


def _collect_section_content(heading: Tag) -> dict[str, Any]:
    text_chunks: list[str] = []
    tables: list[dict[str, Any]] = []
    seen_tables: set[int] = set()

    for node in heading.next_elements:
        if node is heading:
            continue
        if isinstance(node, Tag) and node.name in {"h1", "h2", "h3"}:
            break
        if not isinstance(node, Tag):
            continue
        if node.name == "table":
            node_id = id(node)
            if node_id not in seen_tables:
                tables.append(_extract_table(node))
                seen_tables.add(node_id)
        if node.name in {"p", "li", "td", "th", "span", "div"}:
            text = _clean_text(node.get_text(" ", strip=True))
            if text and len(text) > 2:
                text_chunks.append(text)

    deduped_text = list(dict.fromkeys(text_chunks))
    return {"text": " ".join(deduped_text[:300]), "tables": tables[:20]}


def _get_section_by_heading(soup: BeautifulSoup, heading_phrase: str) -> dict[str, Any]:
    target = _normalize_key(heading_phrase)
    for heading in soup.find_all(["h2", "h3"]):
        h = _normalize_key(heading.get_text(" ", strip=True))
        if target in h:
            return _collect_section_content(heading)
    return {"text": "", "tables": []}


def _extract_majors(section: dict[str, Any]) -> list[str]:
    majors: list[str] = []
    for table in section.get("tables", []):
        headers = table.get("headers", [])
        for item in headers:
            normalized = _normalize_key(item)
            if item and normalized not in {"", "type"}:
                majors.append(item)
        for row in table.get("rows", []):
            for cell in row:
                normalized = _normalize_key(cell)
                if (
                    cell
                    and normalized
                    and normalized
                    not in {"required", "recommended", "yes", "no", "type", "application closing", "notification date"}
                    and len(normalized.split()) >= 2
                ):
                    majors.append(cell)
    return list(dict.fromkeys(majors))[:800]


def _extract_gpa(admissions_text: str, test_text: str, tables: list[dict[str, Any]], fallback_text: str = "") -> float | None:
    blob = f"{admissions_text} {test_text} {fallback_text}"
    match = re.search(r"(average|avg)\s*gpa[^0-9]{0,15}([0-4](?:\.[0-9]{1,2})?)", blob, re.IGNORECASE)
    if match:
        return _to_number(match.group(2))
    for table in tables:
        rows = table.get("rows", [])
        for row in rows:
            row_text = " ".join(row)
            m = re.search(r"(average|avg)\s*gpa[^0-9]{0,15}([0-4](?:\.[0-9]{1,2})?)", row_text, re.IGNORECASE)
            if m:
                return _to_number(m.group(2))
    return None


def _find_labeled_number(text: str, labels: list[str]) -> int | None:
    for label in labels:
        # Pattern A: "19,420 Females Applied"
        m_before = re.search(rf"([0-9][0-9,]*)\s+{label}", text, re.IGNORECASE)
        if m_before:
            return int(m_before.group(1).replace(",", ""))
        # Pattern B: "Females Applied: 19,420"
        m_after = re.search(rf"{label}[^0-9]{{0,12}}([0-9][0-9,]*)", text, re.IGNORECASE)
        if m_after:
            return int(m_after.group(1).replace(",", ""))
    return None


def _extract_admissions_by_gender(section: dict[str, Any], gender: str) -> dict[str, Any]:
    text = section.get("text", "")
    tables = section.get("tables", [])
    gender_l = gender.lower()

    if gender_l == "female":
        applied_labels = [r"females?\s+applied", r"women\s+applied", r"female\s+applicants?"]
        accepted_labels = [r"females?\s+accepted", r"women\s+accepted", r"female\s+admits?"]
    else:
        applied_labels = [r"males?\s+applied", r"men\s+applied", r"male\s+applicants?"]
        accepted_labels = [r"males?\s+accepted", r"men\s+accepted", r"male\s+admits?"]

    applied = _find_labeled_number(text, applied_labels)
    accepted = _find_labeled_number(text, accepted_labels)

    acceptance_percent: int | None = None
    pct = re.search(r"([0-9]{1,3})\s*%\s*(acceptance\s*rate)?", text, re.IGNORECASE)
    if pct:
        acceptance_percent = int(pct.group(1))

    # Table fallback with row labels when text blob is noisy.
    for table in tables:
        for row in table.get("rows", []):
            if not row:
                continue
            row_text = " ".join(row)
            if applied is None:
                applied = _find_labeled_number(row_text, applied_labels)
            if accepted is None:
                accepted = _find_labeled_number(row_text, accepted_labels)
            if acceptance_percent is None:
                p = re.search(r"([0-9]{1,3})\s*%", row_text)
                if p and "accept" in row_text.lower():
                    acceptance_percent = int(p.group(1))

    # Compute missing fields only when we have enough signal.
    if acceptance_percent is None and applied and accepted and applied > 0:
        acceptance_percent = round((accepted / applied) * 100)
    if accepted is None and applied and acceptance_percent is not None:
        accepted = round((applied * acceptance_percent) / 100)

    return {
        "text": text,
        "acceptance_percent": acceptance_percent,
        "applied": applied,
        "accepted": accepted,
        "tables": tables,
    }


def _extract_requirements(section: dict[str, Any]) -> list[dict[str, str]]:
    rows_out: list[dict[str, str]] = []
    for table in section.get("tables", []):
        headers = table.get("headers", [])
        rows = table.get("rows", [])
        for row in rows:
            if len(row) < 2:
                continue
            record = {
                "requirement": row[0],
                "required": row[2] if len(row) > 2 else "",
                "recommended": row[3] if len(row) > 3 else "",
                "raw": " | ".join(row),
            }
            if not record["requirement"]:
                continue
            rows_out.append(record)
    if not rows_out and section.get("text"):
        rows_out.append({"requirement": "raw_text", "required": "", "recommended": "", "raw": section["text"]})
    return rows_out[:200]


def _extract_labeled_rows(section: dict[str, Any]) -> list[dict[str, str]]:
    rows_out: list[dict[str, str]] = []
    for table in section.get("tables", []):
        headers = [str(h).strip() for h in table.get("headers", [])]
        for row in table.get("rows", []):
            if not row:
                continue
            first = _clean_text(row[0] if len(row) > 0 else "")
            second = _clean_text(row[1] if len(row) > 1 else "")
            third = _clean_text(row[2] if len(row) > 2 else "")
            fourth = _clean_text(row[3] if len(row) > 3 else "")
            item: dict[str, str] = {
                "label": first,
                "value": second,
            }
            if third:
                item["value_2"] = third
            if fourth:
                item["value_3"] = fourth
            if headers:
                item["headers"] = " | ".join(headers[:4])
            item["raw"] = " | ".join([value for value in [first, second, third, fourth] if value])
            if item["raw"]:
                rows_out.append(item)
    if not rows_out and section.get("text"):
        text = _clean_text(section["text"])
        # Fallback for non-tabular sections like:
        # "62,183 Avg. Financial Aid Package 68,339 Avg. Freshman Financial Aid Package ..."
        pair_pattern = re.compile(
            r"([0-9][0-9,]*(?:\.[0-9]+)?%?)\s+([A-Za-z][A-Za-z/&(),.\-\s]{3,90}?)(?=\s+[0-9][0-9,]*(?:\.[0-9]+)?%?|$)"
        )
        for value, label in pair_pattern.findall(text):
            label_clean = _clean_text(label).strip(":")
            if not label_clean:
                continue
            rows_out.append(
                {
                    "label": label_clean,
                    "value": _clean_text(value),
                    "raw": f"{label_clean}: {value}",
                }
            )
        if not rows_out and text:
            rows_out.append({"label": "summary", "value": text[:500], "raw": text[:500]})

    # Deduplicate repeated rows from noisy source HTML blocks.
    deduped: list[dict[str, str]] = []
    seen = set()
    for row in rows_out:
        key = (
            row.get("label", "").strip().lower(),
            row.get("value", "").strip().lower(),
            row.get("value_2", "").strip().lower(),
            row.get("value_3", "").strip().lower(),
        )
        if key in seen:
            continue
        seen.add(key)
        deduped.append(row)
    return deduped[:200]


def _extract_application_fee(
    applying_rows: list[dict[str, str]], applying_section: dict[str, Any], source_url: str
) -> list[dict[str, Any]]:
    metrics: list[dict[str, Any]] = []
    best_fee_text = ""
    best_fee_number: float | None = None

    for row in applying_rows:
        blob = " ".join([row.get("label", ""), row.get("value", ""), row.get("value_2", ""), row.get("value_3", "")]).strip()
        if not blob:
            continue
        normalized = _normalize_key(blob)
        if "application fee" not in normalized:
            continue
        money = re.search(r"\$\s*([0-9]{1,4}(?:\.[0-9]{1,2})?)", blob)
        if money:
            best_fee_number = _to_number(money.group(1))
            best_fee_text = _clean_text(blob)
            break
        number = _to_number(blob)
        # Avoid GPA-like decimals; fee should be an amount (typically >= 10) unless explicitly no-fee.
        if number is not None and number >= 10 and best_fee_number is None:
            best_fee_number = number
            best_fee_text = _clean_text(blob)
        elif not best_fee_text and number is not None:
            best_fee_text = _clean_text(blob)

    if best_fee_number is None:
        section_text = _clean_text(applying_section.get("text", ""))
        if re.search(r"\b(no application fee|application fee waived|fee waived)\b", section_text, re.IGNORECASE):
            best_fee_number = 0
            best_fee_text = "No application fee"
        else:
            # Pattern where amount appears before label: "50 Application Fee"
            before_label = re.search(r"\b([0-9]{1,4})\s+Application Fee\b", section_text, re.IGNORECASE)
            if before_label:
                best_fee_number = _to_number(before_label.group(1))
                best_fee_text = f"Application Fee {before_label.group(1)}"
            else:
                # Pattern where amount appears after label: "Application Fee $75"
                after_label = re.search(
                    r"\b(Application Fee|App Fee)\b[^0-9$]{0,20}\$?\s*([0-9]{1,4}(?:\.[0-9]{1,2})?)",
                    section_text,
                    re.IGNORECASE,
                )
                if after_label:
                    candidate = _to_number(after_label.group(2))
                    if candidate is not None and candidate >= 10:
                        best_fee_number = candidate
                    best_fee_text = _clean_text(after_label.group(0))

    if best_fee_number is not None:
        metrics.append(
            {
                "key": "application_fee_usd",
                "unit": "usd",
                "value_text": f"${int(round(best_fee_number))}",
                "value_number": best_fee_number,
                "value_json": None,
                "confidence": 0.95,
                "section_key": "peterson_profile",
                "source_url": source_url,
            }
        )
    if best_fee_text:
        metrics.append(
            {
                "key": "application_fee_text",
                "unit": "text",
                "value_text": best_fee_text,
                "value_number": None,
                "value_json": None,
                "confidence": 0.95,
                "section_key": "peterson_profile",
                "source_url": source_url,
            }
        )

    return metrics


def _extract_athletics_summaries(section: dict[str, Any], mens: dict[str, Any], womens: dict[str, Any]) -> dict[str, Any]:
    def _sports_count(block: dict[str, Any]) -> int:
        count = 0
        for table in block.get("tables", []):
            for row in table.get("rows", []):
                if row and row[0] and _normalize_key(row[0]) != "sport":
                    count += 1
        return count

    return {
        "overview": section,
        "mens_sports_count": _sports_count(mens),
        "womens_sports_count": _sports_count(womens),
        "mens": mens,
        "womens": womens,
    }


def _extract_test_metrics(section: dict[str, Any], source_url: str) -> list[dict[str, Any]]:
    metrics: list[dict[str, Any]] = []
    sat_part_p25: dict[str, float] = {}
    sat_part_p75: dict[str, float] = {}
    sat_avg_total: float | None = None
    act_p25: float | None = None
    act_p75: float | None = None
    act_avg: float | None = None

    for table in section.get("tables", []):
        headers = [_normalize_key(h) for h in table.get("headers", [])]
        if not headers:
            continue
        has_test = any("test" in h for h in headers)
        has_25 = any("25th" in h for h in headers)
        has_75 = any("75th" in h for h in headers)
        if not (has_test and has_25 and has_75):
            continue

        idx_test = next((i for i, h in enumerate(headers) if "test" in h), 0)
        idx_avg = next((i for i, h in enumerate(headers) if "avg" in h), -1)
        idx_25 = next((i for i, h in enumerate(headers) if "25th" in h), -1)
        idx_75 = next((i for i, h in enumerate(headers) if "75th" in h), -1)
        if idx_25 == -1 or idx_75 == -1:
            continue

        for row in table.get("rows", []):
            if len(row) <= max(idx_test, idx_25, idx_75):
                continue
            test_name = _normalize_key(row[idx_test])
            avg_raw = row[idx_avg] if idx_avg != -1 and len(row) > idx_avg else ""
            p25_raw = row[idx_25] if len(row) > idx_25 else ""
            p75_raw = row[idx_75] if len(row) > idx_75 else ""

            p25_val = _to_number(p25_raw)
            p75_val = _to_number(p75_raw)
            avg_val = _to_number(avg_raw)

            if "sat" in test_name:
                if "critical" in test_name or "evidence" in test_name or "reading" in test_name:
                    if p25_val is not None:
                        sat_part_p25["reading"] = p25_val
                    if p75_val is not None:
                        sat_part_p75["reading"] = p75_val
                elif "math" in test_name:
                    if p25_val is not None:
                        sat_part_p25["math"] = p25_val
                    if p75_val is not None:
                        sat_part_p75["math"] = p75_val
                else:
                    if p25_val is not None:
                        sat_part_p25["total"] = p25_val
                    if p75_val is not None:
                        sat_part_p75["total"] = p75_val
                    if avg_val is not None:
                        sat_avg_total = avg_val

            if "act" in test_name and "composite" in test_name:
                if p25_val is not None:
                    act_p25 = p25_val
                if p75_val is not None:
                    act_p75 = p75_val
                if avg_val is not None:
                    act_avg = avg_val

    sat25 = sat_part_p25.get("total")
    sat75 = sat_part_p75.get("total")
    if sat25 is None and {"reading", "math"}.issubset(sat_part_p25.keys()):
        sat25 = sat_part_p25["reading"] + sat_part_p25["math"]
    if sat75 is None and {"reading", "math"}.issubset(sat_part_p75.keys()):
        sat75 = sat_part_p75["reading"] + sat_part_p75["math"]
    if sat_avg_total is None and sat25 is not None and sat75 is not None:
        sat_avg_total = round((sat25 + sat75) / 2, 2)

    if sat25 is not None:
        metrics.append(
            {
                "key": "sat_25th_p",
                "unit": "count",
                "value_text": str(int(sat25)),
                "value_number": sat25,
                "value_json": None,
                "confidence": 0.94,
                "section_key": "peterson_profile",
                "source_url": source_url,
            }
        )
    if sat75 is not None:
        metrics.append(
            {
                "key": "sat_75th_p",
                "unit": "count",
                "value_text": str(int(sat75)),
                "value_number": sat75,
                "value_json": None,
                "confidence": 0.94,
                "section_key": "peterson_profile",
                "source_url": source_url,
            }
        )
    if sat25 is not None and sat75 is not None:
        metrics.append(
            {
                "key": "sat_range",
                "unit": "range",
                "value_text": f"{int(sat25)}-{int(sat75)}",
                "value_number": None,
                "value_json": {"min": sat25, "max": sat75},
                "confidence": 0.94,
                "section_key": "peterson_profile",
                "source_url": source_url,
            }
        )
    if sat_avg_total is not None:
        metrics.append(
            {
                "key": "avg_sat",
                "unit": "count",
                "value_text": str(int(round(sat_avg_total))),
                "value_number": sat_avg_total,
                "value_json": None,
                "confidence": 0.94,
                "section_key": "peterson_profile",
                "source_url": source_url,
            }
        )

    if act_avg is None and act_p25 is not None and act_p75 is not None:
        act_avg = round((act_p25 + act_p75) / 2, 2)
    if act_p25 is not None:
        metrics.append(
            {
                "key": "act_25th_p",
                "unit": "count",
                "value_text": str(int(act_p25)),
                "value_number": act_p25,
                "value_json": None,
                "confidence": 0.94,
                "section_key": "peterson_profile",
                "source_url": source_url,
            }
        )
    if act_p75 is not None:
        metrics.append(
            {
                "key": "act_75th_p",
                "unit": "count",
                "value_text": str(int(act_p75)),
                "value_number": act_p75,
                "value_json": None,
                "confidence": 0.94,
                "section_key": "peterson_profile",
                "source_url": source_url,
            }
        )
    if act_p25 is not None and act_p75 is not None:
        metrics.append(
            {
                "key": "act_range",
                "unit": "range",
                "value_text": f"{int(act_p25)}-{int(act_p75)}",
                "value_number": None,
                "value_json": {"min": act_p25, "max": act_p75},
                "confidence": 0.94,
                "section_key": "peterson_profile",
                "source_url": source_url,
            }
        )
    if act_avg is not None:
        metrics.append(
            {
                "key": "avg_act",
                "unit": "count",
                "value_text": str(int(round(act_avg))),
                "value_number": act_avg,
                "value_json": None,
                "confidence": 0.94,
                "section_key": "peterson_profile",
                "source_url": source_url,
            }
        )

    return metrics


def scrape_peterson_profile(university_name: str, timeout: int = 30) -> dict[str, Any]:
    source_url = resolve_peterson_url(university_name)
    if not source_url:
        raise ValueError(f"Peterson profile not found for {university_name}")

    html = _fetch_html(source_url, timeout=timeout)
    soup = BeautifulSoup(html, "html.parser")
    html_hash = hashlib.sha256(html.encode("utf-8", "ignore")).hexdigest()
    page_title = _clean_text(soup.select_one("h1").get_text(" ", strip=True) if soup.select_one("h1") else university_name)

    location_contact = _get_section_by_heading(soup, "Location & Contact")
    majors_degrees = _get_section_by_heading(soup, "Majors & Degrees")
    applying = _get_section_by_heading(soup, "Applying")
    female_admissions = _get_section_by_heading(soup, "Female Admissions")
    male_admissions = _get_section_by_heading(soup, "Male Admissions")
    test_scores = _get_section_by_heading(soup, "Test Scores Accepted")
    financial_aid = _get_section_by_heading(soup, "Financial Aid")
    campus_life = _get_section_by_heading(soup, "Campus Life")
    athletics = _get_section_by_heading(soup, "Athletics")
    mens_sports = _get_section_by_heading(soup, "Men's Sports")
    womens_sports = _get_section_by_heading(soup, "Women's Sports")

    majors = _extract_majors(majors_degrees)
    applying_matrix = _extract_requirements(applying)
    applying_rows = _extract_labeled_rows(applying)
    financial_aid_rows = _extract_labeled_rows(financial_aid)
    female_stats = _extract_admissions_by_gender(female_admissions, "female")
    male_stats = _extract_admissions_by_gender(male_admissions, "male")
    athletics_summary = _extract_athletics_summaries(athletics, mens_sports, womens_sports)
    gpa_value = _extract_gpa(
        admissions_text=f"{female_admissions.get('text', '')} {male_admissions.get('text', '')}",
        test_text=test_scores.get("text", ""),
        tables=test_scores.get("tables", []),
        fallback_text=_clean_text(soup.get_text(" ", strip=True)),
    )

    metrics: list[dict[str, Any]] = []

    def add_json_metric(key: str, payload: Any, confidence: float = 0.95):
        metrics.append(
            {
                "key": key,
                "unit": "json",
                "value_text": "",
                "value_number": None,
                "value_json": payload,
                "confidence": confidence,
                "section_key": "peterson_profile",
                "source_url": source_url,
            }
        )

    add_json_metric("location_contact", location_contact)
    add_json_metric("majors_degrees", {"majors": majors, "raw": majors_degrees})
    add_json_metric("admission_requirements_matrix", applying_matrix)
    add_json_metric("applying_extended", applying_rows)
    add_json_metric("female_admissions", female_stats)
    add_json_metric("male_admissions", male_stats)
    add_json_metric("test_policy_details", test_scores)
    add_json_metric("financial_aid_extended", financial_aid)
    add_json_metric("financial_aid_items", financial_aid_rows)
    add_json_metric("campus_life", campus_life)
    add_json_metric("athletics", athletics_summary)
    metrics.extend(_extract_test_metrics(test_scores, source_url=source_url))
    metrics.extend(_extract_application_fee(applying_rows=applying_rows, applying_section=applying, source_url=source_url))

    if majors:
        metrics.append(
            {
                "key": "majors_count",
                "unit": "count",
                "value_text": str(len(majors)),
                "value_number": float(len(majors)),
                "value_json": None,
                "confidence": 0.95,
                "section_key": "peterson_profile",
                "source_url": source_url,
            }
        )

    if gpa_value is not None:
        metrics.append(
            {
                "key": "avg_gpa",
                "unit": "count",
                "value_text": f"{gpa_value:.2f}",
                "value_number": gpa_value,
                "value_json": None,
                "confidence": 0.92,
                "section_key": "peterson_profile",
                "source_url": source_url,
            }
        )

    blocks = {
        "location_contact": bool(location_contact.get("text") or location_contact.get("tables")),
        "majors_degrees": bool(majors),
        "applying_requirements": bool(applying_matrix),
        "female_male_admissions": bool(female_stats.get("text") or male_stats.get("text")),
        "test_policy_details": bool(test_scores.get("text") or test_scores.get("tables")),
        "financial_aid_extended": bool(financial_aid.get("text") or financial_aid.get("tables")),
        "campus_life": bool(campus_life.get("text") or campus_life.get("tables")),
        "athletics": bool(athletics.get("text") or athletics.get("tables") or athletics_summary.get("mens_sports_count")),
    }
    completeness = int(round((sum(1 for ok in blocks.values() if ok) / len(blocks)) * 100))
    status = "success" if all(blocks.values()) else ("partial" if any(blocks.values()) else "failed")
    missing = [key for key, ok in blocks.items() if not ok]

    standard_profile = {
        "source_provider": "petersons",
        "source_url": source_url,
        "university_name": page_title,
        "fetched_at": datetime.utcnow().isoformat() + "Z",
        "parser_version": PARSER_VERSION,
        "raw_html_hash": html_hash,
        "location_contact": location_contact,
        "majors_degrees": {"majors": majors, "raw": majors_degrees},
        "applying_requirements": applying_matrix,
        "applying_extended": applying_rows,
        "female_admissions": female_stats,
        "male_admissions": male_stats,
        "test_policy_details": test_scores,
        "financial_aid_extended": financial_aid,
        "financial_aid_items": financial_aid_rows,
        "campus_life": campus_life,
        "athletics": athletics_summary,
        "gpa_value": gpa_value,
        "data_completeness_score": completeness,
    }

    section_payload = {
        "section_key": "peterson_profile",
        "url": source_url,
        "standard_profile": standard_profile,
        "metrics": metrics,
        "captured_at": datetime.utcnow().isoformat() + "Z",
    }
    section = SectionScrapeResult(
        section_key="peterson_profile",
        url=source_url,
        status=status,
        html_hash=html_hash,
        parsed_payload=section_payload,
        error_text="; ".join(missing[:20]),
    )

    raw_payload = {
        "provider": "petersons",
        "root_url": source_url,
        "standard_profile": standard_profile,
        "quality_checks": {
            "status": status,
            "checks": blocks,
            "missing_codes": missing,
            "completeness_score": completeness,
        },
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
        "media": [],
        "parser_version": PARSER_VERSION,
        "fetched_at": datetime.utcnow().isoformat() + "Z",
    }

    return {
        "name": page_title,
        "status": status,
        "errors": missing,
        "reason_codes": missing,
        "completeness_score": completeness,
        "sections": [section],
        "metrics": metrics,
        "media": [],
        "raw_payload": raw_payload,
        "raw_text_index": _clean_text(soup.get_text(" ", strip=True))[:50000],
        "core": {},
    }
