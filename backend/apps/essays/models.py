from django.conf import settings
from django.db import models

from apps.universities.models import University


class Essay(models.Model):
    TYPE_CHOICES = [
        ("personal_statement", "Personal Statement"),
        ("motivation_essay", "Motivation Essay"),
        ("supplemental_essay", "Supplemental Essay"),
        ("other", "Other"),
    ]

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="essays",
    )
    title = models.CharField(max_length=200)
    essay_type = models.CharField(max_length=40, choices=TYPE_CHOICES)
    university = models.ForeignKey(
        University,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="essays",
    )
    prompt_title = models.CharField(max_length=300, blank=True, default="")
    prompt_text = models.TextField(blank=True, default="")
    target_word_count = models.PositiveIntegerField(default=650)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "-id"]

    def __str__(self):
        return self.title


class EssayVersion(models.Model):
    SOURCE_CHOICES = [
        ("user", "User"),
        ("ai", "AI"),
    ]
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("revised", "Revised"),
        ("ai_improved", "AI Improved"),
        ("final", "Final"),
    ]

    essay = models.ForeignKey(
        Essay,
        on_delete=models.CASCADE,
        related_name="versions",
    )
    version_number = models.PositiveIntegerField()
    label = models.CharField(max_length=120, blank=True, default="")
    content = models.TextField(blank=True, default="")
    source = models.CharField(max_length=10, choices=SOURCE_CHOICES, default="user")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-version_number"]
        unique_together = ("essay", "version_number")

    def __str__(self):
        return f"{self.essay.title} v{self.version_number}"
