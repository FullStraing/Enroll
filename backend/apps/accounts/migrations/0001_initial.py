from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def seed_account_plans(apps, schema_editor):
    Plan = apps.get_model("accounts", "Plan")
    Entitlement = apps.get_model("accounts", "Entitlement")
    PlanEntitlement = apps.get_model("accounts", "PlanEntitlement")
    PlanSettings = apps.get_model("accounts", "PlanSettings")
    UserPlanAssignment = apps.get_model("accounts", "UserPlanAssignment")
    User = apps.get_model("auth", "User")

    plans = {
        "free": {
            "name": "Free",
            "description": "Entry plan for new signups.",
            "is_public": True,
            "is_invite_only": False,
            "sort_order": 10,
        },
        "pilot": {
            "name": "Pilot",
            "description": "Internal or invited access plan.",
            "is_public": False,
            "is_invite_only": True,
            "sort_order": 20,
        },
        "pro": {
            "name": "Pro",
            "description": "Main paid plan.",
            "is_public": True,
            "is_invite_only": False,
            "sort_order": 30,
        },
        "premium": {
            "name": "Premium",
            "description": "High-capacity paid plan.",
            "is_public": True,
            "is_invite_only": False,
            "sort_order": 40,
        },
    }

    entitlements = {
        "universities.max_count": {
            "name": "Maximum universities",
            "description": "Maximum number of universities in My Universities.",
            "value_type": "integer",
            "unit": "count",
        },
        "essays.max_count": {
            "name": "Maximum essays",
            "description": "Maximum number of essay workspaces.",
            "value_type": "integer",
            "unit": "count",
        },
        "essay_versions.max_per_essay": {
            "name": "Maximum essay versions per essay",
            "description": "Maximum number of versions per single essay.",
            "value_type": "integer",
            "unit": "count",
        },
        "ai.requests.monthly_limit": {
            "name": "Monthly AI requests",
            "description": "Maximum AI requests across all AI endpoints within the current month.",
            "value_type": "integer",
            "unit": "monthly_count",
        },
    }

    plan_values = {
        "free": {
            "universities.max_count": 2,
            "essays.max_count": 5,
            "essay_versions.max_per_essay": 10,
            "ai.requests.monthly_limit": 20,
        },
        "pilot": {
            "universities.max_count": 125,
            "essays.max_count": 300,
            "essay_versions.max_per_essay": 125,
            "ai.requests.monthly_limit": 1500,
        },
        "pro": {
            "universities.max_count": 25,
            "essays.max_count": 60,
            "essay_versions.max_per_essay": 25,
            "ai.requests.monthly_limit": 300,
        },
        "premium": {
            "universities.max_count": 125,
            "essays.max_count": 300,
            "essay_versions.max_per_essay": 125,
            "ai.requests.monthly_limit": 1500,
        },
    }

    plan_rows = {}
    for code, payload in plans.items():
        plan_rows[code], _ = Plan.objects.update_or_create(code=code, defaults=payload)

    entitlement_rows = {}
    for code, payload in entitlements.items():
        entitlement_rows[code], _ = Entitlement.objects.update_or_create(code=code, defaults=payload)

    for plan_code, values in plan_values.items():
        for entitlement_code, value in values.items():
            PlanEntitlement.objects.update_or_create(
                plan=plan_rows[plan_code],
                entitlement=entitlement_rows[entitlement_code],
                defaults={"int_value": value, "bool_value": None},
            )

    settings_row, _ = PlanSettings.objects.get_or_create(
        singleton_enforcer=1,
        defaults={"default_signup_plan": plan_rows["free"]},
    )
    if settings_row.default_signup_plan_id != plan_rows["free"].id:
        settings_row.default_signup_plan = plan_rows["free"]
        settings_row.save(update_fields=["default_signup_plan", "updated_at"])

    for user in User.objects.order_by("id"):
        UserPlanAssignment.objects.update_or_create(
            user=user,
            defaults={
                "plan": plan_rows["pilot"],
                "source": "migration_existing_user",
                "notes": "Assigned to pilot during initial plan migration.",
            },
        )


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Entitlement",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.SlugField(max_length=64, unique=True)),
                ("name", models.CharField(max_length=120)),
                ("description", models.CharField(blank=True, max_length=255)),
                ("value_type", models.CharField(choices=[("boolean", "Boolean"), ("integer", "Integer")], default="integer", max_length=16)),
                ("unit", models.CharField(blank=True, default="", max_length=32)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["code"]},
        ),
        migrations.CreateModel(
            name="Plan",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.SlugField(max_length=32, unique=True)),
                ("name", models.CharField(max_length=64)),
                ("description", models.CharField(blank=True, max_length=255)),
                ("is_active", models.BooleanField(default=True)),
                ("is_public", models.BooleanField(default=True)),
                ("is_invite_only", models.BooleanField(default=False)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("metadata_json", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["sort_order", "id"]},
        ),
        migrations.CreateModel(
            name="PlanEntitlement",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("bool_value", models.BooleanField(blank=True, null=True)),
                ("int_value", models.PositiveIntegerField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("entitlement", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="plan_entitlements", to="accounts.entitlement")),
                ("plan", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="plan_entitlements", to="accounts.plan")),
            ],
            options={"ordering": ["plan__sort_order", "entitlement__code"]},
        ),
        migrations.CreateModel(
            name="PlanSettings",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("singleton_enforcer", models.PositiveSmallIntegerField(default=1, editable=False, unique=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("default_signup_plan", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="default_for_settings", to="accounts.plan")),
            ],
            options={"verbose_name": "Plan settings", "verbose_name_plural": "Plan settings"},
        ),
        migrations.CreateModel(
            name="UserPlanAssignment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("source", models.CharField(choices=[("default_signup", "Default signup"), ("migration_existing_user", "Migration existing user"), ("admin", "Admin"), ("management_command", "Management command"), ("system", "System")], default="system", max_length=32)),
                ("notes", models.CharField(blank=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("plan", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="user_assignments", to="accounts.plan")),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="plan_assignment", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["user_id"]},
        ),
        migrations.AlterUniqueTogether(
            name="planentitlement",
            unique_together={("plan", "entitlement")},
        ),
        migrations.RunPython(seed_account_plans, migrations.RunPython.noop),
    ]
