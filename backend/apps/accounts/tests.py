from django.contrib.auth.models import User
from django.core.management import call_command
from django.test import TestCase

from apps.accounts.models import PlanSettings, UserPlanAssignment


class AccountPlanManagementTests(TestCase):
    def test_assign_user_plan_command_updates_all_users(self):
        first = User.objects.create_user(username="first", email="first@example.com", password="password123")
        second = User.objects.create_user(username="second", email="second@example.com", password="password123")

        call_command("assign_user_plan", "--plan", "pilot", "--all-users")

        self.assertEqual(UserPlanAssignment.objects.get(user=first).plan.code, "pilot")
        self.assertEqual(UserPlanAssignment.objects.get(user=second).plan.code, "pilot")

    def test_set_default_signup_plan_command_updates_settings(self):
        call_command("set_default_signup_plan", "--plan", "premium")

        settings_obj = PlanSettings.objects.get(singleton_enforcer=1)
        self.assertEqual(settings_obj.default_signup_plan.code, "premium")

