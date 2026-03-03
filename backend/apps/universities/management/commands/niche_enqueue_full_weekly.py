from django.core.management.base import BaseCommand
from kombu.exceptions import OperationalError

from apps.universities.models import University
from apps.universities.services.niche_automation import enqueue_run
from apps.universities.tasks import scrape_niche_university_task


class Command(BaseCommand):
    help = "Enqueue weekly full Niche scraping run."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=None)
        parser.add_argument("--max-sections", type=int, default=8)
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument("--local", action="store_true", help="Execute tasks inline without Redis queue.")

    def handle(self, *args, **options):
        qs = University.objects.filter(is_active=True).exclude(source_url="").order_by("id")
        if options["limit"]:
            qs = qs[: options["limit"]]
        university_ids = list(qs.values_list("id", flat=True))
        if not university_ids:
            self.stdout.write(self.style.WARNING("No universities to enqueue."))
            return
        run = enqueue_run("weekly_full", university_ids)
        for university_id in university_ids:
            payload = {
                "university_id": university_id,
                "run_id": run.id,
                "max_sections": options["max_sections"],
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
                f"Enqueued weekly full run #{run.id}: {len(university_ids)} tasks (max_sections={options['max_sections']})."
            )
        )
