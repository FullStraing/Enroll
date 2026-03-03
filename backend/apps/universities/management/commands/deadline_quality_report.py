from django.core.management.base import BaseCommand
from django.db.models import Count, Q

from apps.universities.models import University, UniversityDeadline


class Command(BaseCommand):
    help = "Print deadline coverage report for universities."

    def handle(self, *args, **options):
        qs = University.objects.filter(
            Q(source_provider="gradgpt") | Q(source_url__icontains="petersons.com/college-search/")
        )
        total = qs.count()
        with_deadlines = qs.filter(deadlines__isnull=False).distinct().count()
        with_rd = qs.filter(deadlines__deadline_type="RD").distinct().count()
        with_early = qs.filter(deadlines__deadline_type__in=["EA", "ED1", "ED2", "REA"]).distinct().count()

        self.stdout.write(f"Universities total: {total}")
        self.stdout.write(f"With >=1 deadline: {with_deadlines} ({(with_deadlines / total * 100) if total else 0:.1f}%)")
        self.stdout.write(f"With RD: {with_rd} ({(with_rd / total * 100) if total else 0:.1f}%)")
        self.stdout.write(f"With early-type: {with_early} ({(with_early / total * 100) if total else 0:.1f}%)")

        by_type = (
            UniversityDeadline.objects.values("deadline_type")
            .annotate(count=Count("id"), high_conf=Count("id", filter=Q(confidence__gte=0.8)))
            .order_by("deadline_type")
        )
        self.stdout.write("By deadline type:")
        for row in by_type:
            self.stdout.write(f"- {row['deadline_type']}: {row['count']} (high_conf={row['high_conf']})")
