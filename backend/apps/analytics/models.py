from django.conf import settings
from django.db import models


class ProductEvent(models.Model):
    EVENT_CHOICES = [
        ("signup_started", "Signup started"),
        ("signup_completed", "Signup completed"),
        ("onboarding_completed", "Onboarding completed"),
        ("first_task_created", "First task created"),
        ("first_university_added", "First university added"),
        ("first_essay_started", "First essay started"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="product_events",
        null=True,
        blank=True,
    )
    client_id = models.CharField(max_length=128, blank=True, db_index=True)
    name = models.CharField(max_length=64, choices=EVENT_CHOICES, db_index=True)
    source = models.CharField(max_length=64, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [
            models.Index(fields=["name", "created_at"]),
            models.Index(fields=["user", "name"]),
            models.Index(fields=["client_id", "name"]),
        ]

    def __str__(self):
        who = self.user.username if self.user_id else self.client_id or "anonymous"
        return f"{self.name} ({who})"

