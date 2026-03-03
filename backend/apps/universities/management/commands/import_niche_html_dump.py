import hashlib
import json
import re
from datetime import datetime
from pathlib import Path

from django.core.management.base import BaseCommand

from apps.universities.models import University
from apps.universities.services.ingestion import evaluate_quality
from apps.universities.services.niche_persistence import persist_university_scrape_result
from apps.universities.services.niche_scraper import (
    PARSER_VERSION,
    SectionScrapeResult,
    aggregate_media,
    aggregate_metrics,
    parse_section_html,
)


class Command(BaseCommand):
    help = "Import local Niche HTML dumps and persist snapshots/metrics without web requests."

    def add_arguments(self, parser):
        parser.add_argument("--university-id", type=int, required=True)
        parser.add_argument("--html-dir", type=str, required=True)
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        university = University.objects.get(id=options["university_id"])
        html_dir = Path(options["html_dir"])
        if not html_dir.exists():
            raise FileNotFoundError(f"Directory not found: {html_dir}")

        files = sorted(html_dir.glob("*.html"))
        if not files:
            self.stdout.write(self.style.ERROR("No .html files found in html-dir"))
            return

        sections = []
        errors = []
        for file_path in files:
            section_key = file_path.stem.lower()
            url = self._section_url(university.source_url, section_key)
            html = file_path.read_text(encoding="utf-8", errors="ignore")
            try:
                parsed_payload = parse_section_html(html, section_key, url)
                html_hash = hashlib.sha256(html.encode("utf-8", errors="ignore")).hexdigest()
                status = "success"
                error_text = ""
            except Exception as exc:  # noqa: BLE001
                parsed_payload = {}
                html_hash = ""
                status = "failed"
                error_text = str(exc)
                errors.append(f"{section_key}: {error_text}")
            sections.append(
                SectionScrapeResult(
                    section_key=section_key,
                    url=url,
                    status=status,
                    html_hash=html_hash,
                    parsed_payload=parsed_payload,
                    error_text=error_text,
                )
            )

        metrics = aggregate_metrics(sections)
        media = aggregate_media(sections)
        raw_payload = {
            "root_url": university.source_url,
            "section_map": {s.section_key: s.url for s in sections},
            "sections": [
                {
                    "section_key": s.section_key,
                    "url": s.url,
                    "status": s.status,
                    "raw_html_hash": s.html_hash,
                    "parsed_payload": s.parsed_payload,
                    "error_text": s.error_text,
                }
                for s in sections
            ],
            "metrics": metrics,
            "media": media,
            "parser_version": PARSER_VERSION,
            "fetched_at": datetime.utcnow().isoformat() + "Z",
            "import_mode": "local_html",
        }
        raw_text_index = " ".join(
            " ".join(section.parsed_payload.get("paragraphs", [])) for section in sections if section.parsed_payload
        )[:50000]
        gate = evaluate_quality(metrics)
        status = gate.status if gate.status != "failed" else ("partial" if not errors else "failed")
        if gate.reason:
            errors.append(gate.reason)
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

        result = {
            "status": status,
            "errors": errors,
            "sections": sections,
            "metrics": metrics,
            "media": media,
            "raw_payload": raw_payload,
            "raw_text_index": raw_text_index,
            "core": core,
        }

        if options["dry_run"]:
            self.stdout.write(
                self.style.WARNING(
                    f"Dry-run: parsed sections={len(sections)}, metrics={len(metrics)}, media={len(media)}"
                )
            )
            return

        persist_university_scrape_result(university, result, PARSER_VERSION)
        self.stdout.write(
            self.style.SUCCESS(f"Imported local HTML for {university.name}: sections={len(sections)} metrics={len(metrics)}")
        )

    @staticmethod
    def _section_url(root_url: str, section_key: str) -> str:
        root = root_url.rstrip("/")
        if root.endswith(section_key):
            return root + "/"
        if "/colleges/" in root and root.count("/") >= 4:
            base = "/".join(root.split("/")[:5])
            return f"{base}/{section_key}/"
        return root + "/"
