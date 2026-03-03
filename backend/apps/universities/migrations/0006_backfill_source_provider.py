from django.db import migrations


def set_source_provider(apps, schema_editor):
    University = apps.get_model("universities", "University")
    University.objects.filter(source="niche").update(source_provider="niche")
    University.objects.exclude(source="niche").update(source_provider="other")


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("universities", "0005_university_external_id_university_is_active_and_more"),
    ]

    operations = [
        migrations.RunPython(set_source_provider, noop),
    ]
