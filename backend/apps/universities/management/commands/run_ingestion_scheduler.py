from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Run automated ingestion scheduler (APScheduler fallback: weekly full + daily delta)."

    def handle(self, *args, **options):
        try:
            from apscheduler.schedulers.blocking import BlockingScheduler
        except ImportError as exc:
            raise RuntimeError(
                "APScheduler is not installed. Install dependencies from backend/requirements.txt."
            ) from exc

        scheduler = BlockingScheduler(timezone="UTC")
        scheduler.add_job(
            lambda: call_command("ingest_universities_full"),
            trigger="cron",
            day_of_week="sun",
            hour=2,
            minute=0,
            id="weekly_full_ingest",
            replace_existing=True,
        )
        scheduler.add_job(
            lambda: call_command("ingest_universities_delta", since_days=1),
            trigger="cron",
            hour=3,
            minute=0,
            id="daily_delta_ingest",
            replace_existing=True,
        )

        self.stdout.write(self.style.SUCCESS("Scheduler started: weekly_full_ingest + daily_delta_ingest"))
        self.stdout.write("Press Ctrl+C to stop.")
        scheduler.start()
