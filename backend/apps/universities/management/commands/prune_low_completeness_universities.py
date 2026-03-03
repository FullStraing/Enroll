from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db.models import Count, Q

from apps.universities.models import University


KNOWN_KEEP_KEYWORDS = [
    "harvard",
    "stanford",
    "mit",
    "yale",
    "princeton",
    "columbia",
    "cornell",
    "upenn",
    "duke",
    "berkeley",
    "ucla",
    "carnegie mellon",
    "northwestern",
    "johns hopkins",
    "chicago",
    "nyu",
    "georgia tech",
    "usc",
    "university of michigan",
]


class Command(BaseCommand):
    help = "Remove/deactivate low-completeness universities; keep known universities and strong profiles."

    def add_arguments(self, parser):
        parser.add_argument("--threshold", type=int, default=40)
        parser.add_argument("--apply", action="store_true")
        parser.add_argument("--delete", action="store_true")

    def handle(self, *args, **options):
        threshold = max(0, min(100, options["threshold"]))
        apply_changes = options["apply"]
        hard_delete = options["delete"]

        core_keys = [
            "acceptance_rate",
            "avg_sat",
            "avg_act",
            "avg_gpa",
            "tuition_in_state",
            "tuition_out_state",
            "net_price_in_state",
            "net_price_out_state",
            "housing_cost",
        ]
        total_core = len(core_keys)

        qs = (
            University.objects.filter(is_active=True)
            .annotate(
                core_metrics_count=Count("metrics", filter=Q(metrics__key__in=core_keys), distinct=True),
                deadlines_count_ann=Count("deadlines", distinct=True),
                factors_count=Count("metrics", filter=Q(metrics__key__startswith="factor_"), distinct=True),
                diversity_count=Count("metrics", filter=Q(metrics__key__startswith="diversity_"), distinct=True),
                rank_count=Count("metrics", filter=Q(metrics__key="overall_rank"), distinct=True),
            )
            .order_by("name")
        )

        to_prune: list[University] = []
        keep_for_name = 0
        keep_for_quality = 0
        for u in qs:
            name_l = (u.name or "").lower()
            is_known = any(keyword in name_l for keyword in KNOWN_KEEP_KEYWORDS)
            if is_known or u.source_provider == "gradgpt":
                keep_for_name += 1
                continue
            if "university" in name_l:
                continue

            core_score = int((u.core_metrics_count / total_core) * 70)
            deadline_score = 20 if u.deadlines_count_ann > 0 else 0
            factors_score = 5 if u.factors_count > 0 else 0
            diversity_score = 5 if u.diversity_count > 0 else 0
            completeness = core_score + deadline_score + factors_score + diversity_score

            if completeness >= threshold:
                keep_for_quality += 1
                continue

            # Low-completeness "college"-type entries are pruned first.
            if "college" in name_l:
                to_prune.append(u)

        if not to_prune:
            self.stdout.write(self.style.SUCCESS("No universities matched prune criteria."))
            return

        self.stdout.write(f"Candidates to prune: {len(to_prune)} (threshold<{threshold})")
        for u in to_prune[:40]:
            self.stdout.write(f"- {u.id}: {u.name}")
        if len(to_prune) > 40:
            self.stdout.write(f"... and {len(to_prune) - 40} more")

        self.stdout.write(
            f"Kept by known-profile/name: {keep_for_name}; kept by quality threshold or 'university' naming: {keep_for_quality}"
        )

        if not apply_changes:
            self.stdout.write(self.style.WARNING("Dry-run only. Add --apply to execute changes."))
            return

        ids = [u.id for u in to_prune]
        if hard_delete:
            deleted, _ = University.objects.filter(id__in=ids).delete()
            self.stdout.write(self.style.SUCCESS(f"Deleted records: {deleted}"))
        else:
            updated = University.objects.filter(id__in=ids).update(is_active=False)
            self.stdout.write(self.style.SUCCESS(f"Deactivated universities: {updated}"))
