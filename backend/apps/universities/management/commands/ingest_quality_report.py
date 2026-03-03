from django.core.management.base import BaseCommand

from apps.universities.models import ScrapeRun, UniversityMetric


class Command(BaseCommand):
    help = "Show quality report for a licensed ingestion run."

    def add_arguments(self, parser):
        parser.add_argument("--run-id", type=int, required=False)
        parser.add_argument("--failed-threshold", type=int, default=None)

    def handle(self, *args, **options):
        if options["run_id"]:
            run = ScrapeRun.objects.filter(id=options["run_id"]).first()
        else:
            run = ScrapeRun.objects.filter(source="licensed").order_by("-id").first()
        if not run:
            self.stdout.write(self.style.WARNING("No licensed runs found."))
            return

        metrics_count = UniversityMetric.objects.count()
        completeness = 0.0
        if run.targets_total:
            completeness = (run.targets_ok / run.targets_total) * 100

        self.stdout.write(f"Run #{run.id}")
        self.stdout.write(f"Status: {run.status}")
        self.stdout.write(f"Targets: {run.targets_total}  OK: {run.targets_ok}  Failed: {run.targets_failed}")
        self.stdout.write(f"Completeness: {completeness:.2f}%")
        self.stdout.write(f"Total metrics in DB: {metrics_count}")
        if run.error_summary:
            self.stdout.write("Errors (top):")
            self.stdout.write(run.error_summary[:1000])
        threshold = options["failed_threshold"]
        if threshold is not None and run.targets_failed > threshold:
            self.stdout.write(self.style.ERROR(f"ALERT: failed targets {run.targets_failed} > threshold {threshold}"))
