from django.db import migrations, models


def backfill_student_university_categories(apps, schema_editor):
    StudentUniversity = apps.get_model("universities", "StudentUniversity")

    for item in StudentUniversity.objects.select_related("university").all():
        acceptance_rate = getattr(item.university, "acceptance_rate", None)
        if acceptance_rate is None:
            category = "target"
        elif acceptance_rate <= 10:
            category = "high_reach"
        elif acceptance_rate <= 24:
            category = "reach"
        elif acceptance_rate <= 49:
            category = "target"
        elif acceptance_rate <= 74:
            category = "likely"
        else:
            category = "safety"

        if item.category != category:
            item.category = category
            item.save(update_fields=["category"])


class Migration(migrations.Migration):

    dependencies = [
        ("universities", "0012_backfill_student_university_categories"),
    ]

    operations = [
        migrations.AlterField(
            model_name="studentuniversity",
            name="category",
            field=models.CharField(
                choices=[
                    ("high_reach", "High Reach"),
                    ("reach", "Reach"),
                    ("target", "Target"),
                    ("likely", "Likely"),
                    ("safety", "Safety"),
                ],
                default="target",
                max_length=20,
            ),
        ),
        migrations.RunPython(backfill_student_university_categories, migrations.RunPython.noop),
    ]
