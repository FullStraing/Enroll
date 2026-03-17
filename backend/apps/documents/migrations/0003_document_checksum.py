import hashlib
from django.db import migrations, models


def backfill_document_checksums(apps, schema_editor):
    Document = apps.get_model("documents", "Document")
    for document in Document.objects.exclude(file="").exclude(file__isnull=True):
        if document.checksum:
            continue
        try:
            document.file.open("rb")
        except Exception:
            continue
        try:
            digest = hashlib.sha256()
            for chunk in document.file.chunks():
                digest.update(chunk)
            document.checksum = digest.hexdigest()
            document.save(update_fields=["checksum"])
        finally:
            try:
                document.file.close()
            except Exception:
                pass


class Migration(migrations.Migration):

    dependencies = [
        ("documents", "0002_document_file_document_file_name_document_file_size_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="document",
            name="checksum",
            field=models.CharField(blank=True, db_index=True, max_length=64),
        ),
        migrations.RunPython(backfill_document_checksums, migrations.RunPython.noop),
    ]
