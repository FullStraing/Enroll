from django.core.management.base import BaseCommand

from apps.universities.connectors import LicensedFeedConnector
from apps.universities.services.licensed_ingestion import ingest_records


class Command(BaseCommand):
    help = "Run backfill ingestion in controllable batches."

    def add_arguments(self, parser):
        parser.add_argument("--start-offset", type=int, default=0)
        parser.add_argument("--limit", type=int, default=100)
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        connector = LicensedFeedConnector()
        records = connector.fetch_university_list()
        start = max(options["start_offset"], 0)
        end = start + max(options["limit"], 1)
        batch = records[start:end]
        if not batch:
            self.stdout.write(self.style.WARNING("Backfill slice is empty."))
            return

        summary = ingest_records(batch, dry_run=options["dry_run"], parser_version="licensed-v1-backfill")
        if options["dry_run"]:
            self.stdout.write(self.style.WARNING("Dry-run enabled: university tables were not updated."))
        self.stdout.write(
            self.style.SUCCESS(
                f"Licensed backfill run #{summary.run_id}: status={summary.status} ok={summary.ok} failed={summary.failed}/{summary.total}"
            )
        )
