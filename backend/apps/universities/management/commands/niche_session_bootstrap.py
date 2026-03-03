import os
from pathlib import Path

from django.core.management.base import BaseCommand
from playwright.sync_api import sync_playwright


def get_session_path() -> Path:
    configured = os.getenv("NICHE_SESSION_STATE_PATH", "backend/.secrets/niche_session.json")
    return Path(configured)


def get_profile_dir() -> Path:
    configured = os.getenv("NICHE_PROFILE_DIR", "backend/.secrets/playwright-profile")
    return Path(configured)


class Command(BaseCommand):
    help = "Open a headful browser to complete Niche anti-bot checks and save session state."

    def handle(self, *args, **options):
        session_path = get_session_path()
        session_path.parent.mkdir(parents=True, exist_ok=True)
        profile_dir = get_profile_dir()
        profile_dir.mkdir(parents=True, exist_ok=True)
        channel = os.getenv("NICHE_BROWSER_CHANNEL", "chrome")

        self.stdout.write(
            self.style.WARNING(
                "Browser will open now. Complete Niche verification manually, then press Enter in terminal."
            )
        )
        with sync_playwright() as playwright:
            try:
                context = playwright.chromium.launch_persistent_context(
                    user_data_dir=str(profile_dir),
                    headless=False,
                    channel=channel,
                    args=["--disable-blink-features=AutomationControlled"],
                )
            except Exception:
                # Fallback if Chrome channel is not available on this machine.
                context = playwright.chromium.launch_persistent_context(
                    user_data_dir=str(profile_dir),
                    headless=False,
                    args=["--disable-blink-features=AutomationControlled"],
                )
            page = context.new_page()
            page.goto("https://www.niche.com/", wait_until="domcontentloaded", timeout=60000)
            page.goto(
                "https://www.niche.com/colleges/harvard-university/admissions/",
                wait_until="domcontentloaded",
                timeout=60000,
            )
            input("Press Enter after Niche page is fully accessible...")
            context.storage_state(path=str(session_path))
            context.close()

        self.stdout.write(self.style.SUCCESS(f"Session saved to {session_path}"))
