from django.core.management.base import BaseCommand
from kombu.exceptions import OperationalError

from apps.universities.models import ScrapeRun, ScrapeRunItem
from apps.universities.services.niche_automation import enqueue_run
from apps.universities.tasks import scrape_niche_university_task


class Command(BaseCommand):
    help = "Enqueue recovery run for previously failed Niche scrape items."

    def add_arguments(self, parser):
        parser.add_argument("--run-id", type=int, default=None)
        parser.add_argument("--limit", type=int, default=200)
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument("--local", action="store_true", help="Execute tasks inline without Redis queue.")

    def handle(self, *args, **options):
        run_id = options["run_id"]
        if run_id is None:
            source_run = ScrapeRun.objects.filter(source="niche").order_by("-id").first()
            if not source_run:
                self.stdout.write(self.style.WARNING("No niche runs found for recovery."))
                return
            run_id = source_run.id

        failed_items = (
            ScrapeRunItem.objects.filter(run_id=run_id, status="failed", university_id__isnull=False)
            .values_list("university_id", flat=True)
            .distinct()[: options["limit"]]
        )
        university_ids = list(failed_items)
        if not university_ids:
            self.stdout.write(self.style.WARNING("No failed universities to recover."))
            return
        recovery_run = enqueue_run("recovery_failed", university_ids)
        for university_id in university_ids:
            payload = {
                "university_id": university_id,
                "run_id": recovery_run.id,
                "max_sections": 8,
                "full_depth": True,
                "dry_run": options["dry_run"],
            }
            if options["local"]:
                scrape_niche_university_task.apply(kwargs=payload)
                continue
            try:
                scrape_niche_university_task.delay(**payload)
            except OperationalError:
                self.stdout.write(self.style.WARNING("Redis is unavailable, switching to local execution."))
                scrape_niche_university_task.apply(kwargs=payload)
        self.stdout.write(
            self.style.SUCCESS(
                f"Enqueued recovery run #{recovery_run.id} from source run #{run_id}: {len(university_ids)} tasks."
            )
        )
