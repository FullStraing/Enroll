from django.conf import settings
from django.db import models

from apps.universities.models import Application, StudentUniversity


def document_upload_path(instance: "Document", filename: str) -> str:
    return f"documents/user_{instance.user_id}/{filename}"


class Document(models.Model):
    TYPE_CHOICES = [
        ("transcript", "Transcript"),
        ("resume", "Resume"),
        ("recommendation_letter", "Recommendation letter"),
        ("passport", "Passport / ID"),
        ("test_score", "Test score"),
        ("financial", "Financial document"),
        ("essay", "Essay"),
        ("other", "Other"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    application = models.ForeignKey(
        Application,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
    )
    student_university = models.ForeignKey(
        StudentUniversity,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
    )
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to=document_upload_path, blank=True, null=True)
    file_name = models.CharField(max_length=255, blank=True)
    mime_type = models.CharField(max_length=120, blank=True)
    file_size = models.PositiveIntegerField(default=0)
    checksum = models.CharField(max_length=64, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "-id"]

    def __str__(self):
        return self.title
