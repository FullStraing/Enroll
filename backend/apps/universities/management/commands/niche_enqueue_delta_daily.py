from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone
from kombu.exceptions import OperationalError

from apps.universities.models import University
from apps.universities.services.niche_automation import enqueue_run
from apps.universities.tasks import scrape_niche_university_task


class Command(BaseCommand):
    help = "Enqueue daily delta Niche scraping run."

    def add_arguments(self, parser):
        parser.add_argument("--since-days", type=int, default=1)
        parser.add_argument("--limit", type=int, default=None)
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument("--local", action="store_true", help="Execute tasks inline without Redis queue.")

    def handle(self, *args, **options):
        threshold = timezone.now() - timedelta(days=options["since_days"])
        qs = (
            University.objects.filter(is_active=True)
            .exclude(source_url="")
            .exclude(source_snapshots__fetched_at__gte=threshold, source_snapshots__status="success")
            .distinct()
            .order_by("id")
        )
        if options["limit"]:
            qs = qs[: options["limit"]]
        university_ids = list(qs.values_list("id", flat=True))
        if not university_ids:
            self.stdout.write(self.style.WARNING("No delta universities to enqueue."))
            return
        run = enqueue_run("daily_delta", university_ids)
        for university_id in university_ids:
            payload = {
                "university_id": university_id,
                "run_id": run.id,
                "max_sections": 4,
                "full_depth": False,
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
            self.style.SUCCESS(f"Enqueued daily delta run #{run.id}: {len(university_ids)} tasks.")
        )
