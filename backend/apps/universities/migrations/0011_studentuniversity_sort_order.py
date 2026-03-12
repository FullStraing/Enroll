from django.db import migrations, models


def backfill_sort_order(apps, schema_editor):
    StudentUniversity = apps.get_model("universities", "StudentUniversity")
    student_ids = StudentUniversity.objects.values_list("student_id", flat=True).distinct()
    for student_id in student_ids:
        items = StudentUniversity.objects.filter(student_id=student_id).order_by("created_at", "id")
        for idx, item in enumerate(items, start=1):
            item.sort_order = idx
            item.save(update_fields=["sort_order"])


class Migration(migrations.Migration):

    dependencies = [
        ("universities", "0010_universitydeadline_notification_date_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="studentuniversity",
            name="sort_order",
            field=models.PositiveIntegerField(db_index=True, default=0),
        ),
        migrations.RunPython(backfill_sort_order, migrations.RunPython.noop),
    ]