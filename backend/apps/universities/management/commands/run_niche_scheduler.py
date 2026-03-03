from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Run Niche automation scheduler (weekly full + daily delta + daily recovery)."

    def handle(self, *args, **options):
        try:
            from apscheduler.schedulers.blocking import BlockingScheduler
        except ImportError as exc:
            raise RuntimeError("APScheduler is not installed. Install backend requirements first.") from exc

        scheduler = BlockingScheduler(timezone="UTC")
        scheduler.add_job(
            lambda: call_command("niche_enqueue_full_weekly"),
            trigger="cron",
            day_of_week="sun",
            hour=1,
            minute=0,
            id="niche_weekly_full",
            replace_existing=True,
        )
        scheduler.add_job(
            lambda: call_command("niche_enqueue_delta_daily", since_days=1),
            trigger="cron",
            hour=2,
            minute=15,
            id="niche_daily_delta",
            replace_existing=True,
        )
        scheduler.add_job(
            lambda: call_command("niche_enqueue_recovery_failed", limit=150),
            trigger="cron",
            hour=4,
            minute=0,
            id="niche_daily_recovery",
            replace_existing=True,
        )

        self.stdout.write(
            self.style.SUCCESS("Niche scheduler started (weekly full, daily delta, daily recovery). Press Ctrl+C to stop.")
        )
        scheduler.start()
