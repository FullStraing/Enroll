from django.db import migrations


def backfill_student_university_categories(apps, schema_editor):
    StudentUniversity = apps.get_model("universities", "StudentUniversity")

    for item in StudentUniversity.objects.select_related("university").all():
        acceptance_rate = getattr(item.university, "acceptance_rate", None)
        if acceptance_rate is None:
            category = "target"
        elif acceptance_rate <= 24:
            category = "reach"
        elif acceptance_rate <= 49:
            category = "target"
        else:
            category = "safety"

        if item.category != category:
            item.category = category
            item.save(update_fields=["category"])


class Migration(migrations.Migration):

    dependencies = [
        ("universities", "0011_studentuniversity_sort_order"),
    ]

    operations = [
        migrations.RunPython(backfill_student_university_categories, migrations.RunPython.noop),
    ]
