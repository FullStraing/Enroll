import json
import re
from dataclasses import dataclass
from datetime import date
from html import unescape
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


@dataclass(frozen=True)
class NicheUniversitySeed:
    name: str
    city: str
    state: str
    website_url: str
    source_url: str
    acceptance_rate: int | None
    sat_range: str
    act_range: str
    main_deadline: date | None
    selectivity: str
    min_profile_score: int
    avg_profile_score: int


NICHE_TARGETS: list[NicheUniversitySeed] = [
    NicheUniversitySeed(
        name="Harvard University",
        city="Cambridge",
        state="MA",
        website_url="https://www.harvard.edu/",
        source_url="https://www.niche.com/colleges/harvard-university/admissions/",
        acceptance_rate=3,
        sat_range="1490-1580",
        act_range="34-36",
        main_deadline=date(2026, 1, 1),
        selectivity="high",
        min_profile_score=92,
        avg_profile_score=98,
    ),
    NicheUniversitySeed(
        name="Stanford University",
        city="Stanford",
        state="CA",
        website_url="https://www.stanford.edu/",
        source_url="https://www.niche.com/colleges/stanford-university/admissions/",
        acceptance_rate=4,
        sat_range="1500-1570",
        act_range="34-35",
        main_deadline=date(2026, 1, 5),
        selectivity="high",
        min_profile_score=91,
        avg_profile_score=97,
    ),
    NicheUniversitySeed(
        name="Massachusetts Institute of Technology",
        city="Cambridge",
        state="MA",
        website_url="https://www.mit.edu/",
        source_url="https://www.niche.com/colleges/massachusetts-institute-of-technology/admissions/",
        acceptance_rate=4,
        sat_range="1520-1570",
        act_range="35-36",
        main_deadline=date(2026, 1, 6),
        selectivity="high",
        min_profile_score=93,
        avg_profile_score=99,
    ),
    NicheUniversitySeed(
        name="New York University",
        city="New York",
        state="NY",
        website_url="https://www.nyu.edu/",
        source_url="https://www.niche.com/colleges/new-york-university/admissions/",
        acceptance_rate=13,
        sat_range="1470-1570",
        act_range="33-35",
        main_deadline=date(2026, 1, 5),
        selectivity="medium",
        min_profile_score=79,
        avg_profile_score=88,
    ),
    NicheUniversitySeed(
        name="University of Michigan - Ann Arbor",
        city="Ann Arbor",
        state="MI",
        website_url="https://umich.edu/",
        source_url="https://www.niche.com/colleges/university-of-michigan-ann-arbor/admissions/",
        acceptance_rate=18,
        sat_range="1350-1530",
        act_range="31-34",
        main_deadline=date(2026, 2, 1),
        selectivity="medium",
        min_profile_score=75,
        avg_profile_score=86,
    ),
]

_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
)


def _extract_field(text: str, pattern: str) -> str | None:
    match = re.search(pattern, text, re.IGNORECASE)
    if not match:
        return None
    value = unescape(match.group(1))
    return re.sub(r"\s+", " ", value).strip()


def scrape_niche_card(source_url: str) -> dict[str, str | int | None]:
    req = Request(source_url, headers={"User-Agent": _USER_AGENT})
    try:
        with urlopen(req, timeout=20) as response:
            html = response.read().decode("utf-8", errors="ignore")
    except (HTTPError, URLError) as exc:
        raise RuntimeError(f"Niche request failed for {source_url}: {exc}") from exc

    if "Access denied" in html or "Press & Hold" in html:
        raise RuntimeError(f"Niche anti-bot challenge detected for {source_url}")

    data: dict[str, str | int | None] = {
        "acceptance_rate": None,
        "sat_range": "",
        "act_range": "",
    }

    rate = _extract_field(html, r"Acceptance Rate[^0-9]{0,50}([0-9]{1,2})%")
    sat = _extract_field(html, r"SAT Range[^0-9]{0,50}([0-9]{3,4}\s*-\s*[0-9]{3,4})")
    act = _extract_field(html, r"ACT Range[^0-9]{0,50}([0-9]{1,2}\s*-\s*[0-9]{1,2})")

    if rate and rate.isdigit():
        data["acceptance_rate"] = int(rate)
    if sat:
        data["sat_range"] = sat.replace(" ", "")
    if act:
        data["act_range"] = act.replace(" ", "")

    # Some pages embed values only in JSON script blocks.
    if not data["acceptance_rate"] or not data["sat_range"] or not data["act_range"]:
        for payload in re.findall(r"<script[^>]*type=\"application/ld\+json\"[^>]*>(.*?)</script>", html, re.DOTALL):
            try:
                obj = json.loads(payload)
            except json.JSONDecodeError:
                continue
            text = json.dumps(obj)
            if not data["acceptance_rate"]:
                rate = _extract_field(text, r"Acceptance Rate[^0-9]{0,50}([0-9]{1,2})")
                if rate and rate.isdigit():
                    data["acceptance_rate"] = int(rate)
            if not data["sat_range"]:
                sat = _extract_field(text, r"SAT Range[^0-9]{0,50}([0-9]{3,4}\s*-\s*[0-9]{3,4})")
                if sat:
                    data["sat_range"] = sat.replace(" ", "")
            if not data["act_range"]:
                act = _extract_field(text, r"ACT Range[^0-9]{0,50}([0-9]{1,2}\s*-\s*[0-9]{1,2})")
                if act:
                    data["act_range"] = act.replace(" ", "")

    return data
