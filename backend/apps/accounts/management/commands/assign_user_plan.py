from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from apps.accounts.services import bulk_assign_plan, get_assignable_users_queryset


class Command(BaseCommand):
    help = "Assign a plan to all users or a targeted subset."

    def add_arguments(self, parser):
        parser.add_argument("--plan", required=True, help="Plan code to assign.")
        parser.add_argument("--all-users", action="store_true", help="Assign the plan to all users.")
        parser.add_argument("--username", action="append", default=[], help="Username to target. Repeatable.")
        parser.add_argument("--email", action="append", default=[], help="Email to target. Repeatable.")
        parser.add_argument("--user-id", action="append", type=int, default=[], help="User ID to target. Repeatable.")
        parser.add_argument(
            "--create-missing-only",
            action="store_true",
            help="Only create missing assignments and leave existing assignments untouched.",
        )
        parser.add_argument("--notes", default="", help="Optional note stored on the assignment.")

    def handle(self, *args, **options):
        user_model = get_user_model()
        base_qs = get_assignable_users_queryset()
        queryset = user_model.objects.none()

        if options["all_users"]:
            queryset = base_qs
        else:
            if options["username"]:
                queryset = queryset | base_qs.filter(username__in=options["username"])
            if options["email"]:
                queryset = queryset | base_qs.filter(email__in=options["email"])
            if options["user_id"]:
                queryset = queryset | base_qs.filter(id__in=options["user_id"])

        queryset = queryset.distinct().order_by("id")

        if not queryset.exists():
            raise CommandError("No users matched the provided filters.")

        if options["create_missing_only"]:
            queryset = queryset.filter(plan_assignment__isnull=True)
            if not queryset.exists():
                self.stdout.write(self.style.WARNING("No users without a plan assignment matched the filters."))
                return

        updated = bulk_assign_plan(
            plan_code=options["plan"],
            users=queryset,
            source="management_command",
            notes=options["notes"],
        )
        self.stdout.write(self.style.SUCCESS(f"Assigned plan '{options['plan']}' to {updated} user(s)."))

