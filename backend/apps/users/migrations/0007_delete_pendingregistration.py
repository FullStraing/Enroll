from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0006_pendingregistration_email_verified_at"),
    ]

    operations = [
        migrations.DeleteModel(
            name="PendingRegistration",
        ),
    ]
