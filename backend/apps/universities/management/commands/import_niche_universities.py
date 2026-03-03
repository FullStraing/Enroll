from django.core.management.base import BaseCommand

from apps.universities.models import University
from apps.universities.services.niche import NICHE_TARGETS, scrape_niche_card


class Command(BaseCommand):
    help = "Imports 5 sample US universities from Niche references."

    def add_arguments(self, parser):
        parser.add_argument(
            "--no-scrape",
            action="store_true",
            help="Use predefined values only (skip live scrape attempt).",
        )

    def handle(self, *args, **options):
        use_scrape = not options["no_scrape"]

        for item in NICHE_TARGETS:
            scraped = {}
            if use_scrape:
                try:
                    scraped = scrape_niche_card(item.source_url)
                    self.stdout.write(self.style.SUCCESS(f"Scraped: {item.name}"))
                except RuntimeError as exc:
                    self.stdout.write(self.style.WARNING(f"{item.name}: {exc}. Using fallback values."))

            defaults = {
                "country": "USA",
                "city": item.city,
                "state": item.state,
                "selectivity": item.selectivity,
                "website_url": item.website_url,
                "main_deadline": item.main_deadline,
                "min_profile_score": item.min_profile_score,
                "avg_profile_score": item.avg_profile_score,
                "acceptance_rate": scraped.get("acceptance_rate") or item.acceptance_rate,
                "sat_range": scraped.get("sat_range") or item.sat_range,
                "act_range": scraped.get("act_range") or item.act_range,
                "source": "niche",
                "source_provider": "niche",
                "external_id": f"niche-{item.name.lower().replace(' ', '-')}",
                "source_url": item.source_url,
            }
            University.objects.update_or_create(name=item.name, defaults=defaults)

        self.stdout.write(self.style.SUCCESS("Niche sample import complete (5 universities)."))
