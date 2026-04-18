from django.db import migrations


DISCOVER_VISIBLE_ENTITLEMENT = "universities.discover_visible_count"


def apply_preview_limits(apps, schema_editor):
    Plan = apps.get_model("accounts", "Plan")
    Entitlement = apps.get_model("accounts", "Entitlement")
    PlanEntitlement = apps.get_model("accounts", "PlanEntitlement")

    entitlement, _ = Entitlement.objects.update_or_create(
        code=DISCOVER_VISIBLE_ENTITLEMENT,
        defaults={
            "name": "Visible universities in discover",
            "description": "Maximum number of universities visible in discover browsing.",
            "value_type": "integer",
            "unit": "count",
        },
    )

    limits = {
        "free": {
            "universities.max_count": 2,
            DISCOVER_VISIBLE_ENTITLEMENT: 6,
            "essays.max_count": 1,
            "essay_versions.max_per_essay": 5,
            "ai.requests.monthly_limit": 10,
        },
        "pilot": {
            DISCOVER_VISIBLE_ENTITLEMENT: 10000,
        },
        "pro": {
            DISCOVER_VISIBLE_ENTITLEMENT: 10000,
        },
        "premium": {
            DISCOVER_VISIBLE_ENTITLEMENT: 10000,
        },
    }

    for plan_code, plan_limits in limits.items():
        plan = Plan.objects.get(code=plan_code)
        for entitlement_code, value in plan_limits.items():
            current_entitlement = entitlement if entitlement_code == DISCOVER_VISIBLE_ENTITLEMENT else Entitlement.objects.get(code=entitlement_code)
            PlanEntitlement.objects.update_or_create(
                plan=plan,
                entitlement=current_entitlement,
                defaults={"int_value": value, "bool_value": None},
            )


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(apply_preview_limits, migrations.RunPython.noop),
    ]
