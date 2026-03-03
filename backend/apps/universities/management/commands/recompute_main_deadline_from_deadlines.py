from django.core.management.base import BaseCommand

from apps.universities.models import University
from apps.universities.services.deadline_ingestion import recompute_main_deadline_for_university


class Command(BaseCommand):
    help = "Recompute University.main_deadline from typed UniversityDeadline records."

    def add_arguments(self, parser):
        parser.add_argument("--only-id", type=int, action="append")

    def handle(self, *args, **options):
        qs = University.objects.all().order_by("id")
        if options["only_id"]:
            qs = qs.filter(id__in=options["only_id"])
        updated = 0
        total = 0
        for university in qs:
            total += 1
            before = university.main_deadline
            after = recompute_main_deadline_for_university(university)
            if before != after:
                updated += 1
        self.stdout.write(self.style.SUCCESS(f"Processed {total} universities, updated {updated} main_deadline values."))
