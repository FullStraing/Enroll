from django.core.management.base import BaseCommand
from django.db import transaction

from apps.universities.models import University, UniversityMetric, UniversitySourceSnapshot
from apps.universities.services.niche_scraper import PARSER_VERSION


class Command(BaseCommand):
    help = "Reparse stored snapshots and refresh normalized metrics without new web requests."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=None)
        parser.add_argument("--only-id", type=int, action="append")
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        snapshots = UniversitySourceSnapshot.objects.select_related("university").order_by("-fetched_at")
        if options["only_id"]:
            snapshots = snapshots.filter(university_id__in=options["only_id"])
        if options["limit"]:
            snapshots = snapshots[: options["limit"]]

        total = 0
        updated = 0
        for snapshot in snapshots:
            total += 1
            metrics_payload = snapshot.raw_payload.get("metrics")
            if metrics_payload is None:
                continue
            if options["dry_run"]:
                updated += 1
                continue
            self._persist_metrics(snapshot.university, metrics_payload)
            snapshot.parser_version = PARSER_VERSION
            snapshot.save(update_fields=["parser_version"])
            updated += 1

        if options["dry_run"]:
            self.stdout.write(self.style.WARNING(f"Dry-run: reparsed {updated}/{total} snapshots"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Reparsed {updated}/{total} snapshots"))

    @transaction.atomic
    def _persist_metrics(self, university: University, metrics_payload):
        for metric in metrics_payload:
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
            UniversityMetric.objects.update_or_create(university=university, key=key, defaults=defaults)
