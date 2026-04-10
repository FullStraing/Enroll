from django.core.management.base import BaseCommand

from apps.accounts.services import set_default_signup_plan


class Command(BaseCommand):
    help = "Set the default plan for newly registered users."

    def add_arguments(self, parser):
        parser.add_argument("--plan", required=True, help="Plan code to use for new signups.")

    def handle(self, *args, **options):
        settings_obj = set_default_signup_plan(plan_code=options["plan"])
        self.stdout.write(
            self.style.SUCCESS(
                f"Default signup plan is now '{settings_obj.default_signup_plan.code}'."
            )
        )

