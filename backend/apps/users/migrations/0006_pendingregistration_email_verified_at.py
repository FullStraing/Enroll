from django.db import migrations, models
from django.utils import timezone


def backfill_existing_auth_identities(apps, schema_editor):
    UserAuthIdentity = apps.get_model("users", "UserAuthIdentity")
    now = timezone.now()
    UserAuthIdentity.objects.filter(email_verified_at__isnull=True).update(
        email_verified=True,
        email_verified_at=now,
    )


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0005_userauthidentity"),
    ]

    operations = [
        migrations.AddField(
            model_name="userauthidentity",
            name="email_verified_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.CreateModel(
            name="PendingRegistration",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("normalized_email", models.EmailField(max_length=254, unique=True)),
                ("requested_username", models.CharField(max_length=150)),
                ("password_hash", models.CharField(max_length=255)),
                ("code_hash", models.CharField(max_length=255)),
                ("code_expires_at", models.DateTimeField()),
                ("resend_available_at", models.DateTimeField()),
                ("last_code_sent_at", models.DateTimeField()),
                ("failed_attempts", models.PositiveSmallIntegerField(default=0)),
                ("code_send_count", models.PositiveSmallIntegerField(default=1)),
                ("last_request_ip", models.GenericIPAddressField(blank=True, null=True)),
                ("last_user_agent", models.TextField(blank=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["-updated_at", "-id"],
                "indexes": [
                    models.Index(fields=["requested_username", "completed_at"], name="users_pendi_request_557af4_idx"),
                    models.Index(fields=["code_expires_at"], name="users_pendi_code_ex_896d38_idx"),
                ],
            },
        ),
        migrations.RunPython(backfill_existing_auth_identities, migrations.RunPython.noop),
    ]
