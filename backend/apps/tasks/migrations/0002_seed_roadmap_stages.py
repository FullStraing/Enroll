from django.db import migrations


def seed_roadmap_stages(apps, schema_editor):
    RoadmapStage = apps.get_model("tasks", "RoadmapStage")
    stages = [
        ("profile", "Profile", 1),
        ("university_list", "University list", 2),
        ("tests_plan", "Tests plan", 3),
        ("documents", "Documents", 4),
        ("common_app_prep", "Common App prep", 5),
        ("submission_readiness", "Submission readiness", 6),
    ]
    for code, title, order in stages:
        RoadmapStage.objects.get_or_create(
            code=code,
            defaults={"title": title, "order": order},
        )


def unseed_roadmap_stages(apps, schema_editor):
    RoadmapStage = apps.get_model("tasks", "RoadmapStage")
    RoadmapStage.objects.filter(
        code__in=[
            "profile",
            "university_list",
            "tests_plan",
            "documents",
            "common_app_prep",
            "submission_readiness",
        ]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("tasks", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_roadmap_stages, unseed_roadmap_stages),
    ]
