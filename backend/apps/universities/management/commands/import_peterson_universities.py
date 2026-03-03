from __future__ import annotations

from django.core.management.base import BaseCommand

from apps.universities.models import University
from apps.universities.services.deadline_ingestion import _load_peterson_directory, _normalize_key, _normalize_name


class Command(BaseCommand):
    help = "Import universities from Peterson sitemap into local University table."

    def add_arguments(self, parser):
        parser.add_argument("--target-total", type=int, default=200)
        parser.add_argument("--limit", type=int, default=None)
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        target_total = options["target_total"]
        dry_run = options["dry_run"]
        hard_limit = options["limit"]

        directory = _load_peterson_directory()
        if not directory:
            self.stdout.write(self.style.ERROR("Peterson directory is empty/unavailable."))
            return

        existing = list(University.objects.all().only("id", "name"))
        existing_keys = {_normalize_key(_normalize_name(item.name)): item.id for item in existing}
        current_total = len(existing)
        need = max(0, target_total - current_total)
        if hard_limit is not None:
            need = min(need, max(0, hard_limit))

        if need == 0:
            self.stdout.write(self.style.WARNING(f"Nothing to add. Current total universities: {current_total}."))
            return

        added = 0
        skipped = 0
        for entry in directory:
            if added >= need:
                break
            raw_name = (entry.get("name") or "").strip()
            source_url = (entry.get("url") or "").strip()
            if not raw_name or not source_url:
                skipped += 1
                continue
            name = " ".join(part.capitalize() for part in raw_name.split())
            name_key = _normalize_key(_normalize_name(name))
            if name_key in existing_keys:
                skipped += 1
                continue

            if not dry_run:
                created = University.objects.create(
                    name=name,
                    country="USA",
                    source="other",
                    source_provider="other",
                    source_url=source_url,
                    is_active=True,
                )
                existing_keys[name_key] = created.id
            added += 1
            self.stdout.write(f"+ {name}")

        final_total = current_total + added
        mode = "DRY-RUN " if dry_run else ""
        self.stdout.write(self.style.SUCCESS(f"{mode}Added: {added}, skipped: {skipped}, total: {final_total}"))
