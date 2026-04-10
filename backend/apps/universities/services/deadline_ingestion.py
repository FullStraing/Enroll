from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from html import unescape
from urllib.parse import quote_plus, urljoin, urlparse
from urllib.request import Request, urlopen
import json

from bs4 import BeautifulSoup
from django.utils import timezone

from apps.universities.models import University, UniversityDeadline, UniversitySourceSnapshot


USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)

DEADLINE_PATTERNS = [
    ("ED2", ["early decision ii", "ed ii", "ed2"]),
    ("ED1", ["early decision i", "ed i", "ed1", "early decision"]),
    ("REA", ["restrictive early action", "single-choice early action", "rea", "scea"]),
    ("EA", ["early action", "ea"]),
    ("RD", ["regular decision", "regular application", "rd"]),
    ("TRANSFER_FALL", ["transfer fall", "fall transfer"]),
    ("TRANSFER_SPRING", ["transfer spring", "spring transfer"]),
    ("PRIORITY", ["priority deadline", "priority"]),
    ("ROLLING", ["rolling admission", "rolling admissions", "rolling"]),
]

TERM_PATTERNS = [
    ("fall", ["fall"]),
    ("spring", ["spring"]),
    ("summer", ["summer"]),
]

MONTH_PATTERN = (
    r"(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|"
    r"Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2}"
)
MM_DD_PATTERN = r"\b\d{1,2}/\d{1,2}\b"

PRIORITY_ORDER = {
    "RD": 0,
    "EA": 1,
    "ED1": 2,
    "ED2": 3,
    "REA": 4,
    "PRIORITY": 5,
    "TRANSFER_FALL": 6,
    "TRANSFER_SPRING": 7,
    "ROLLING": 8,
    "OTHER": 9,
}

BIGFUTURE_DIRECTORY_URL = "https://bigfuture.collegeboard.org/colleges?searchType=college"
PETERSON_SITEMAP_INDEX_URL = "https://www.petersons.com/sitemap.xml"
PETERSON_UG_SITEMAP_URL = "https://www.petersons.com/ug_site_map.xml"
_BIGFUTURE_DIRECTORY_CACHE: list[dict[str, str]] | None = None
_PETERSON_DIRECTORY_CACHE: list[dict[str, str]] | None = None


@dataclass
class ParsedDeadline:
    deadline_type: str
    term: str
    deadline_date: date | None
    deadline_text: str
    notification_date: date | None
    notification_text: str
    is_rolling: bool
    confidence: float
    source_url: str


def _extract_sitemap_locs(xml: str) -> list[str]:
    return re.findall(r"<loc>(.*?)</loc>", xml, flags=re.IGNORECASE)


def _fetch_html(url: str, timeout: int = 30) -> str:
    headers = {
        "User-Agent": USER_AGENT,
        "Accept-Language": "en-US,en;q=0.9",
    }
    request = Request(url, headers=headers)
    try:
        with urlopen(request, timeout=timeout) as response:
            return response.read().decode("utf-8", "ignore")
    except Exception:
        normalized = url.strip()
        if not normalized.startswith("http"):
            raise
        mirror = f"https://r.jina.ai/http://{normalized.split('://', 1)[1]}"
        mirror_request = Request(mirror, headers=headers)
        with urlopen(mirror_request, timeout=timeout) as response:
            return response.read().decode("utf-8", "ignore")


def _normalize_name(name: str) -> str:
    return re.sub(r"\s+20\d{2}$", "", (name or "").strip(), flags=re.IGNORECASE)


def _normalize_key(text: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", " ", (text or "").lower()).strip()
    return re.sub(r"\s+", " ", cleaned)


def _clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", unescape(text or "")).strip()


def _resolve_domain_from_snapshot(university: University) -> str:
    snapshot = UniversitySourceSnapshot.objects.filter(university=university).order_by("-fetched_at").first()
    if not snapshot:
        return ""
    raw = snapshot.raw_payload or {}
    sections = raw.get("sections") or []
    for section in sections:
        payload = (section or {}).get("parsed_payload") or {}
        cds = payload.get("cds_raw_json") or {}
        website = cds.get("website")
        if website and isinstance(website, str):
            return website
    profile = raw.get("standard_profile") or {}
    website = (profile.get("identity") or {}).get("website")
    if website and isinstance(website, str):
        return website
    return ""


def _resolve_domain_from_gradgpt_page(university: University) -> str:
    source_url = (university.source_url or "").strip()
    if "gradgpt.com/common-data-set/" not in source_url:
        return ""
    try:
        html = _fetch_html(source_url, timeout=20)
    except Exception:
        return ""
    soup = BeautifulSoup(html, "html.parser")
    node = soup.select_one("div.cds-raw")
    if not node:
        return ""
    raw = " ".join(node.get_text(" ", strip=True).split())
    if not raw:
        return ""
    try:
        import json

        payload = json.loads(raw)
    except Exception:  # noqa: BLE001
        return ""
    website = payload.get("website") if isinstance(payload, dict) else ""
    return website if isinstance(website, str) else ""


def _search_candidate_urls(query: str, limit: int = 8) -> list[str]:
    search_url = f"https://duckduckgo.com/html/?q={quote_plus(query)}"
    html = _fetch_html(search_url, timeout=20)
    soup = BeautifulSoup(html, "html.parser")
    results = []
    for anchor in soup.select("a.result__a"):
        href = (anchor.get("href") or "").strip()
        if not href:
            continue
        parsed = urlparse(href)
        if parsed.scheme in {"http", "https"}:
            results.append(href)
        if len(results) >= limit:
            break
    return results


def _search_bigfuture_urls(university_name: str, limit: int = 6) -> list[str]:
    query = f'site:bigfuture.collegeboard.org colleges "{university_name}"'
    candidates = _search_candidate_urls(query, limit=limit * 2)
    filtered: list[str] = []
    for url in candidates:
        parsed = urlparse(url)
        host = parsed.netloc.lower()
        path = parsed.path.lower()
        if "bigfuture.collegeboard.org" not in host:
            continue
        if "/colleges/" not in path:
            continue
        filtered.append(url)
        if len(filtered) >= limit:
            break
    return filtered


def _search_peterson_urls(university_name: str, limit: int = 6) -> list[str]:
    query = f'site:petersons.com/college-search "{university_name}"'
    candidates = _search_candidate_urls(query, limit=limit * 3)
    filtered: list[str] = []
    for url in candidates:
        parsed = urlparse(url)
        host = parsed.netloc.lower()
        path = parsed.path.lower()
        if "petersons.com" not in host:
            continue
        if "/college-search/" not in path:
            continue
        filtered.append(url)
        if len(filtered) >= limit:
            break
    return filtered


def _load_peterson_directory() -> list[dict[str, str]]:
    global _PETERSON_DIRECTORY_CACHE
    if _PETERSON_DIRECTORY_CACHE is not None:
        return _PETERSON_DIRECTORY_CACHE

    try:
        sitemap = _fetch_html(PETERSON_SITEMAP_INDEX_URL, timeout=20)
        locs = _extract_sitemap_locs(sitemap)
        ug_url = next((item for item in locs if item.endswith("/ug_site_map.xml")), PETERSON_UG_SITEMAP_URL)
    except Exception:  # noqa: BLE001
        ug_url = PETERSON_UG_SITEMAP_URL

    xml = _fetch_html(ug_url, timeout=30)
    urls = _extract_sitemap_locs(xml)
    items: list[dict[str, str]] = []
    for url in urls:
        parsed = urlparse(url)
        if "petersons.com" not in parsed.netloc.lower():
            continue
        if "/college-search/" not in parsed.path.lower():
            continue
        slug = parsed.path.split("/college-search/", 1)[-1]
        slug = re.sub(r"\.aspx$", "", slug, flags=re.IGNORECASE)
        slug = re.sub(r"-000_\d+$", "", slug, flags=re.IGNORECASE)
        name = slug.replace("-", " ").strip()
        if not name:
            continue
        items.append(
            {
                "name": name,
                "name_key": _normalize_key(name),
                "url": url,
            }
        )
    _PETERSON_DIRECTORY_CACHE = items
    return items


def _resolve_peterson_profile_url(university_name: str) -> str:
    name_key = _normalize_key(_normalize_name(university_name))
    directory = _load_peterson_directory()
    if not directory:
        return ""

    exact = next((item for item in directory if item["name_key"] == name_key), None)
    if exact:
        return exact["url"]

    target_tokens = set(name_key.split())
    best = None
    best_score = 0
    for item in directory:
        tokens = set(item["name_key"].split())
        if not tokens:
            continue
        score = len(target_tokens.intersection(tokens))
        if score > best_score:
            best_score = score
            best = item
    if best and best_score >= max(2, len(target_tokens) // 2):
        return best["url"]
    return ""


def _load_bigfuture_directory() -> list[dict[str, str]]:
    global _BIGFUTURE_DIRECTORY_CACHE
    if _BIGFUTURE_DIRECTORY_CACHE is not None:
        return _BIGFUTURE_DIRECTORY_CACHE

    html = _fetch_html(BIGFUTURE_DIRECTORY_URL, timeout=20)
    match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.S)
    if not match:
        _BIGFUTURE_DIRECTORY_CACHE = []
        return _BIGFUTURE_DIRECTORY_CACHE
    data = json.loads(match.group(1))
    groups = data.get("props", {}).get("pageProps", {}).get("colleges", [])
    items: list[dict[str, str]] = []
    for group in groups:
        for item in group.get("items", []):
            href = item.get("href")
            name = item.get("name")
            if not href or not name:
                continue
            items.append(
                {
                    "name": str(name),
                    "name_key": _normalize_key(str(name)),
                    "href": str(href),
                }
            )
    _BIGFUTURE_DIRECTORY_CACHE = items
    return items


def _resolve_bigfuture_profile_url(university_name: str) -> str:
    name_key = _normalize_key(_normalize_name(university_name))
    directory = _load_bigfuture_directory()
    if not directory:
        return ""

    exact = next((item for item in directory if item["name_key"] == name_key), None)
    if exact:
        return urljoin("https://bigfuture.collegeboard.org", exact["href"])

    # Fallback: contain match with longest token overlap.
    target_tokens = set(name_key.split())
    best = None
    best_score = 0
    for item in directory:
        tokens = set(item["name_key"].split())
        if not tokens:
            continue
        score = len(target_tokens.intersection(tokens))
        if score > best_score:
            best_score = score
            best = item
    if best and best_score >= max(2, len(target_tokens) // 2):
        return urljoin("https://bigfuture.collegeboard.org", best["href"])
    return ""


def _candidate_admissions_urls(base_url: str) -> list[str]:
    base_url = (base_url or "").strip()
    if not base_url:
        return []
    parsed = urlparse(base_url)
    if not parsed.scheme:
        base_url = f"https://{base_url.lstrip('/')}"
        parsed = urlparse(base_url)
    root = f"{parsed.scheme}://{parsed.netloc}"
    return [
        base_url,
        urljoin(root, "/admissions"),
        urljoin(root, "/admissions/apply"),
        urljoin(root, "/admissions/first-year"),
        urljoin(root, "/undergraduate-admissions"),
        urljoin(root, "/apply"),
        urljoin(root, "/apply/first-year"),
        urljoin(root, "/first-year/apply"),
        urljoin(root, "/first-year"),
        urljoin(root, "/application-deadlines"),
        urljoin(root, "/deadlines"),
    ]


def _find_type(text: str) -> str:
    low = text.lower()
    for dtype, tokens in DEADLINE_PATTERNS:
        if any(token in low for token in tokens):
            return dtype
    return "OTHER"


def _find_term(text: str) -> str:
    low = text.lower()
    for term, tokens in TERM_PATTERNS:
        if any(token in low for token in tokens):
            return term
    return ""


def _normalize_date_from_text(value: str) -> date | None:
    if not value:
        return None
    cleaned = _clean_text(value).replace(".", "").replace(",", "")
    cleaned = re.sub(r"(\d{1,2})(st|nd|rd|th)\b", r"\1", cleaned, flags=re.IGNORECASE)
    if cleaned.lower() in {"not reported", "n/a", "na", "none", "tbd", "unknown", "-"}:
        return None
    year = timezone.now().year
    for fmt in ("%b %d", "%B %d", "%m/%d"):
        try:
            parsed = datetime.strptime(cleaned, fmt).replace(year=year).date()
            if parsed < timezone.now().date() - timedelta(days=120):
                parsed = parsed.replace(year=year + 1)
            return parsed
        except ValueError:
            continue
    return None


def _normalize_first_date_from_text(value: str) -> date | None:
    parsed = _normalize_date_from_text(value)
    if parsed:
        return parsed
    for token in _extract_deadline_tokens(value):
        parsed = _normalize_date_from_text(token)
        if parsed:
            return parsed
    return None


def _normalize_bigfuture_date(value: str | None) -> date | None:
    if not value:
        return None
    text = value.strip()
    for fmt in ("%m/%d/%Y", "%m/%d/%y", "%m/%d"):
        try:
            parsed = datetime.strptime(text, fmt).date()
            year = timezone.now().year
            if parsed.year == 9999:
                parsed = parsed.replace(year=year)
            if parsed < timezone.now().date() - timedelta(days=120):
                parsed = parsed.replace(year=parsed.year + 1)
            return parsed
        except ValueError:
            continue
    return None


def _extract_deadline_tokens(text: str) -> list[str]:
    matches = re.findall(MONTH_PATTERN, text, flags=re.IGNORECASE)
    full_month_matches = re.finditer(MONTH_PATTERN, text, flags=re.IGNORECASE)
    values = [m.group(0) for m in full_month_matches]
    mmdd = re.findall(MM_DD_PATTERN, text)
    return values + mmdd + matches


def parse_deadlines_from_html(html: str, source_url: str) -> list[ParsedDeadline]:
    soup = BeautifulSoup(html, "html.parser")
    lines: list[str] = []
    for node in soup.select("h1,h2,h3,h4,p,li,td,th"):
        text = " ".join(node.get_text(" ", strip=True).split())
        if text:
            lines.append(text)

    parsed_items: list[ParsedDeadline] = []
    seen: set[tuple[str, str, str]] = set()

    for line in lines:
        low = line.lower()
        if (
            "deadline" not in low
            and "decision" not in low
            and "early action" not in low
            and "early decision" not in low
            and "restrictive early action" not in low
            and "rolling" not in low
            and "transfer" not in low
            and "application due" not in low
            and "due date" not in low
            and "due" not in low
        ):
            continue

        deadline_type = _find_type(line)
        term = _find_term(line)

        if deadline_type == "ROLLING":
            key = (deadline_type, term, "rolling")
            if key not in seen:
                seen.add(key)
                parsed_items.append(
                    ParsedDeadline(
                        deadline_type="ROLLING",
                        term=term,
                        deadline_date=None,
                        deadline_text="Rolling",
                        notification_date=None,
                        notification_text="",
                        is_rolling=True,
                        confidence=0.9,
                        source_url=source_url,
                    )
                )
            continue

        for token in _extract_deadline_tokens(line):
            parsed_date = _normalize_date_from_text(token)
            if not parsed_date:
                continue
            confidence = 0.8
            if ":" in line or "|" in line:
                confidence = 0.9
            if deadline_type != "OTHER":
                confidence = min(0.95, confidence + 0.05)
            key = (deadline_type, term, token.lower())
            if key in seen:
                continue
            seen.add(key)
            parsed_items.append(
                ParsedDeadline(
                    deadline_type=deadline_type,
                    term=term,
                    deadline_date=parsed_date,
                    deadline_text=token,
                    notification_date=None,
                    notification_text="",
                    is_rolling=False,
                    confidence=confidence,
                    source_url=source_url,
                )
            )

    return parsed_items


def parse_deadlines_from_bigfuture_profile(html: str, source_url: str) -> list[ParsedDeadline]:
    match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.S)
    if not match:
        return []
    data = json.loads(match.group(1))
    college = data.get("props", {}).get("pageProps", {}).get("collegeData", {})
    if not isinstance(college, dict):
        return []

    parsed: list[ParsedDeadline] = []

    ea = _normalize_bigfuture_date(college.get("earlyActionDate"))
    if ea:
        parsed.append(
            ParsedDeadline(
                deadline_type="EA",
                term="fall",
                deadline_date=ea,
                deadline_text=ea.strftime("%b %d"),
                notification_date=None,
                notification_text="",
                is_rolling=False,
                confidence=0.95,
                source_url=source_url,
            )
        )

    ed = _normalize_bigfuture_date(college.get("earlyDecisionDate"))
    if ed:
        parsed.append(
            ParsedDeadline(
                deadline_type="ED1",
                term="fall",
                deadline_date=ed,
                deadline_text=ed.strftime("%b %d"),
                notification_date=None,
                notification_text="",
                is_rolling=False,
                confidence=0.95,
                source_url=source_url,
            )
        )

    rd = _normalize_bigfuture_date(college.get("regularDecisionDate"))
    if rd:
        parsed.append(
            ParsedDeadline(
                deadline_type="RD",
                term="fall",
                deadline_date=rd,
                deadline_text=rd.strftime("%b %d"),
                notification_date=None,
                notification_text="",
                is_rolling=False,
                confidence=0.95,
                source_url=source_url,
            )
        )

    priority = _normalize_bigfuture_date(college.get("financialAidApplicationPriorityDeadline"))
    if priority:
        parsed.append(
            ParsedDeadline(
                deadline_type="PRIORITY",
                term="fall",
                deadline_date=priority,
                deadline_text=priority.strftime("%b %d"),
                notification_date=None,
                notification_text="",
                is_rolling=False,
                confidence=0.9,
                source_url=source_url,
            )
        )

    return parsed


def _map_peterson_type(type_text: str) -> str:
    low = _normalize_key(type_text)
    if "early action" in low:
        return "EA"
    if "early decision ii" in low or "ed ii" in low or "ed2" in low:
        return "ED2"
    if "early decision i" in low or "ed i" in low or "ed1" in low:
        return "ED1"
    if "early decision" in low:
        return "ED1"
    if "restrictive early action" in low or "single choice early action" in low or "rea" in low:
        return "REA"
    if "priority" in low:
        return "PRIORITY"
    if "transfer" in low and "spring" in low:
        return "TRANSFER_SPRING"
    if "transfer" in low:
        return "TRANSFER_FALL"
    if "regular decision" in low or "fall freshmen" in low:
        return "RD"
    if "rolling" in low:
        return "ROLLING"
    return "OTHER"


def parse_deadlines_from_peterson_html(html: str, source_url: str) -> list[ParsedDeadline]:
    soup = BeautifulSoup(html, "html.parser")
    table = None

    for heading in soup.find_all(["h1", "h2", "h3", "h4"]):
        heading_text = _normalize_key(heading.get_text(" ", strip=True))
        if "application deadlines" in heading_text:
            candidate = heading.find_next("table")
            if candidate:
                table = candidate
                break

    if table is None:
        for candidate in soup.find_all("table"):
            header_text = _normalize_key(" ".join(th.get_text(" ", strip=True) for th in candidate.find_all("th")))
            if "application closing" in header_text and "rolling admissions" in header_text:
                table = candidate
                break

    if table is None:
        return []

    rows = table.find_all("tr")
    parsed: list[ParsedDeadline] = []
    seen: set[tuple[str, str, str, str, bool]] = set()

    for row in rows:
        cols = row.find_all(["td", "th"])
        if len(cols) < 4:
            continue

        row_type = _clean_text(cols[0].get_text(" ", strip=True))
        if _normalize_key(row_type) == "type":
            continue
        closing_text = _clean_text(cols[1].get_text(" ", strip=True))
        notification_text = _clean_text(cols[2].get_text(" ", strip=True))
        rolling_text = _clean_text(cols[3].get_text(" ", strip=True)).lower()
        is_rolling = rolling_text in {"yes", "true", "rolling"}

        closing_date = _normalize_first_date_from_text(closing_text)
        notification_date = _normalize_first_date_from_text(notification_text)
        deadline_type = _map_peterson_type(row_type)
        term = _find_term(row_type)

        meaningful = bool(closing_date or notification_date or is_rolling)
        if not meaningful:
            continue

        deadline_label = "Rolling" if is_rolling and not closing_date else (closing_text or row_type)
        notification_label = notification_text if notification_date else ""
        key = (deadline_type, term, deadline_label.lower(), notification_label.lower(), is_rolling)
        if key in seen:
            continue
        seen.add(key)

        confidence = 0.95
        if deadline_type == "OTHER":
            confidence = 0.85

        parsed.append(
            ParsedDeadline(
                deadline_type=deadline_type,
                term=term,
                deadline_date=closing_date,
                deadline_text=deadline_label,
                notification_date=notification_date,
                notification_text=notification_label,
                is_rolling=is_rolling,
                confidence=confidence,
                source_url=source_url,
            )
        )

    return parsed


def _select_main_deadline(deadlines: list[UniversityDeadline]) -> date | None:
    dated = [item for item in deadlines if item.deadline_date and not item.is_rolling]
    if not dated:
        return None
    rd_deadlines = [item for item in dated if item.deadline_type == "RD"]
    if rd_deadlines:
        return min(item.deadline_date for item in rd_deadlines if item.deadline_date is not None)
    return min(item.deadline_date for item in dated if item.deadline_date is not None)


def recompute_main_deadline_for_university(university: University) -> date | None:
    deadlines = list(university.deadlines.all())
    main = _select_main_deadline(deadlines)
    if university.main_deadline != main:
        university.main_deadline = main
        university.save(update_fields=["main_deadline", "updated_at"])
    return main


def _ordered_deadlines(parsed_items: list[ParsedDeadline]) -> list[ParsedDeadline]:
    return sorted(
        parsed_items,
        key=lambda item: (
            PRIORITY_ORDER.get(item.deadline_type, 999),
            item.deadline_date or date.max,
            -item.confidence,
        ),
    )


def ingest_deadlines_for_university(university: University, source: str = "petersons", debug: bool = False) -> dict[str, object]:
    name = _normalize_name(university.name)
    candidates: list[str] = []

    if source == "bigfuture":
        resolved = _resolve_bigfuture_profile_url(name)
        if resolved:
            candidates.append(resolved)
        candidates.extend(_search_bigfuture_urls(name, limit=6))
    elif source == "petersons":
        resolved = _resolve_peterson_profile_url(name)
        if resolved:
            candidates.append(resolved)
        if not candidates:
            candidates.extend(_search_peterson_urls(name, limit=6))
    else:
        snapshot_domain = _resolve_domain_from_snapshot(university)
        if snapshot_domain:
            candidates.extend(_candidate_admissions_urls(snapshot_domain))
        else:
            gradgpt_domain = _resolve_domain_from_gradgpt_page(university)
            if gradgpt_domain:
                candidates.extend(_candidate_admissions_urls(gradgpt_domain))

        if not candidates:
            search_results = _search_candidate_urls(f"{name} undergraduate admissions deadlines")
            official = [url for url in search_results if ".edu" in urlparse(url).netloc]
            fallback = official or search_results
            for url in fallback[:3]:
                candidates.extend(_candidate_admissions_urls(url))

    unique_candidates = list(dict.fromkeys([url for url in candidates if url]))
    parsed_deadlines: list[ParsedDeadline] = []
    used_source = ""
    errors: list[str] = []

    for url in unique_candidates[:10]:
        try:
            html = _fetch_html(url, timeout=12)
            if source == "bigfuture":
                found = parse_deadlines_from_bigfuture_profile(html, url)
                if not found:
                    found = parse_deadlines_from_html(html, url)
            elif source == "petersons":
                found = parse_deadlines_from_peterson_html(html, url)
                if not found:
                    found = parse_deadlines_from_html(html, url)
            else:
                found = parse_deadlines_from_html(html, url)
            if found:
                parsed_deadlines = _ordered_deadlines(found)
                used_source = url
                break
        except Exception as exc:  # noqa: BLE001
            errors.append(str(exc))

    source_label = {
        "bigfuture": "bigfuture",
        "petersons": "petersons",
    }.get(source, "official_admissions")
    UniversityDeadline.objects.filter(university=university, source_label=source_label).delete()

    saved = 0
    low_confidence = 0
    for item in parsed_deadlines:
        if item.confidence < 0.6:
            low_confidence += 1
            continue
        UniversityDeadline.objects.update_or_create(
            university=university,
            deadline_type=item.deadline_type,
            term=item.term,
            deadline_text=item.deadline_text,
            defaults={
                "deadline_date": item.deadline_date,
                "notification_date": item.notification_date,
                "notification_text": item.notification_text,
                "is_rolling": item.is_rolling,
                "source_url": item.source_url,
                "source_label": source_label,
                "confidence": item.confidence,
            },
        )
        saved += 1

    main_deadline = recompute_main_deadline_for_university(university)
    status = "success" if saved > 0 else "failed"
    if saved == 0 and parsed_deadlines:
        status = "partial"
    if saved > 0 and low_confidence > 0:
        status = "partial"

    return {
        "status": status,
        "saved": saved,
        "low_confidence": low_confidence,
        "source_url": used_source,
        "errors": errors[:5],
        "main_deadline": main_deadline.isoformat() if main_deadline else None,
        "debug_candidates": unique_candidates[:10] if debug else [],
    }
