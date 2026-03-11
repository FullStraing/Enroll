import re

from django.core.management.base import BaseCommand

from apps.universities.models import University


class Command(BaseCommand):
    help = "Normalize university names by removing trailing admission-year suffixes like ' 2025'."

    def handle(self, *args, **options):
        updated = 0
        for university in University.objects.all().order_by("id"):
            original = university.name or ""
            normalized = re.sub(r"\s+20\d{2}$", "", original.strip(), flags=re.IGNORECASE).strip()
            normalized = re.sub(r"\s{2,}", " ", normalized)
            if normalized and normalized != original:
                university.name = normalized
                university.save(update_fields=["name", "updated_at"])
                updated += 1
        self.stdout.write(self.style.SUCCESS(f"Updated {updated} university names."))
