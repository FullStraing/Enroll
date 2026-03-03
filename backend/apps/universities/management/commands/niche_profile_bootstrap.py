import os
from pathlib import Path

from django.core.management.base import BaseCommand
from playwright.sync_api import sync_playwright


class Command(BaseCommand):
    help = "Bootstrap a named persistent profile for Niche automation workers."

    def add_arguments(self, parser):
        parser.add_argument("--profile", type=str, required=True)

    def handle(self, *args, **options):
        profile_name = options["profile"].strip()
        profile_root = Path(os.getenv("NICHE_PROFILE_ROOT", "backend/.secrets/profiles"))
        profile_dir = profile_root / profile_name
        profile_dir.mkdir(parents=True, exist_ok=True)
        channel = os.getenv("NICHE_BROWSER_CHANNEL", "chrome")

        with sync_playwright() as playwright:
            launch_kwargs = {
                "user_data_dir": str(profile_dir),
                "headless": False,
                "args": ["--disable-blink-features=AutomationControlled"],
            }
            if channel:
                launch_kwargs["channel"] = channel
            try:
                context = playwright.chromium.launch_persistent_context(**launch_kwargs)
            except Exception:
                launch_kwargs.pop("channel", None)
                context = playwright.chromium.launch_persistent_context(**launch_kwargs)
            page = context.new_page()
            page.goto("https://www.niche.com/", wait_until="domcontentloaded", timeout=60000)
            page.goto("https://www.niche.com/colleges/harvard-university/admissions/", wait_until="domcontentloaded", timeout=60000)
            input(f"Complete challenge for profile '{profile_name}', then press Enter...")
            context.close()

        self.stdout.write(self.style.SUCCESS(f"Profile bootstrap complete: {profile_dir}"))
