from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.universities.connectors import LicensedFeedConnector
from apps.universities.services.licensed_ingestion import ingest_records


class Command(BaseCommand):
    help = "Run delta licensed-feed ingestion using updated_since semantics."

    def add_arguments(self, parser):
        parser.add_argument("--since-days", type=int, default=1)
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument("--limit", type=int, default=None)

    def handle(self, *args, **options):
        connector = LicensedFeedConnector()
        since = timezone.now() - timedelta(days=options["since_days"])
        records = connector.fetch_updates(since=since)
        if options["limit"]:
            records = records[: options["limit"]]
        if not records:
            self.stdout.write(self.style.WARNING("No delta updates returned by connector."))
            return

        summary = ingest_records(records, dry_run=options["dry_run"], parser_version="licensed-v1-delta")
        if options["dry_run"]:
            self.stdout.write(self.style.WARNING("Dry-run enabled: university tables were not updated."))
        self.stdout.write(
            self.style.SUCCESS(
                f"Licensed delta ingest run #{summary.run_id}: status={summary.status} ok={summary.ok} failed={summary.failed}/{summary.total}"
            )
        )
