from django.core.management.base import BaseCommand

from apps.universities.connectors import LicensedFeedConnector
from apps.universities.services.licensed_ingestion import ingest_records


class Command(BaseCommand):
    help = "Run full licensed-feed ingestion for universities."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=None)
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        connector = LicensedFeedConnector()
        records = connector.fetch_university_list()
        if options["limit"]:
            records = records[: options["limit"]]
        if not records:
            self.stdout.write(self.style.WARNING("No records returned by licensed feed connector."))
            return

        summary = ingest_records(records, dry_run=options["dry_run"], parser_version="licensed-v1")
        if options["dry_run"]:
            self.stdout.write(self.style.WARNING("Dry-run enabled: university tables were not updated."))
        self.stdout.write(
            self.style.SUCCESS(
                f"Licensed full ingest run #{summary.run_id}: status={summary.status} ok={summary.ok} failed={summary.failed}/{summary.total}"
            )
        )
