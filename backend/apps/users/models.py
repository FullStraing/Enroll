from django.conf import settings
from django.db import models


def normalize_identity_email(email: str) -> str:
    return str(email or "").strip().lower()


class StudentProfile(models.Model):
    ACTIVITIES_LEVEL_CHOICES = [
        ("low", "Низкий"),
        ("medium", "Средний"),
        ("high", "Высокий"),
    ]
    BUDGET_RANGE_CHOICES = [
        ("low", "Низкий"),
        ("medium", "Средний"),
        ("high", "Высокий"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_profile",
    )
    full_name = models.CharField(max_length=150, blank=True)
    country = models.CharField(max_length=100, blank=True)
    school_name = models.CharField(max_length=150, blank=True)
    graduation_year = models.PositiveIntegerField(null=True, blank=True)
    intended_major = models.CharField(max_length=150, blank=True)

    gpa = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
    )
    grades_summary = models.CharField(max_length=255, blank=True)
    ielts_overall = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        null=True,
        blank=True,
    )
    ielts_date = models.DateField(null=True, blank=True)
    toefl_total = models.PositiveIntegerField(
        null=True,
        blank=True,
    )
    toefl_date = models.DateField(null=True, blank=True)
    sat_total = models.PositiveIntegerField(
        null=True,
        blank=True,
    )
    sat_date = models.DateField(null=True, blank=True)
    det_score = models.PositiveIntegerField(null=True, blank=True)
    det_date = models.DateField(null=True, blank=True)
    activities = models.JSONField(default=list, blank=True)
    honors = models.JSONField(default=list, blank=True)
    budget_range = models.CharField(
        max_length=10,
        choices=BUDGET_RANGE_CHOICES,
        blank=True,
    )

    activities_level = models.CharField(
        max_length=10,
        choices=ACTIVITIES_LEVEL_CHOICES,
        default="low",
    )

    target_country = models.CharField(
        max_length=100,
        default="USA",
    )
    common_app_profile = models.JSONField(default=dict, blank=True)
    essays_onboarding_seen = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.username}"


class UserAuthIdentity(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="auth_identity",
    )
    normalized_email = models.EmailField(max_length=254, unique=True)
    email_verified = models.BooleanField(default=False)
    google_sub = models.CharField(max_length=255, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["user_id"]

    def save(self, *args, **kwargs):
        self.normalized_email = normalize_identity_email(self.normalized_email)
        if self.google_sub == "":
            self.google_sub = None
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} <{self.normalized_email}>"
