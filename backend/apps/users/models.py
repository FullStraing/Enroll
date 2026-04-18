from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.db import models
from django.utils import timezone


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
    email_verified_at = models.DateTimeField(null=True, blank=True)
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


class PendingRegistration(models.Model):
    normalized_email = models.EmailField(max_length=254, unique=True)
    requested_username = models.CharField(max_length=150)
    password_hash = models.CharField(max_length=255)
    code_hash = models.CharField(max_length=255)
    code_expires_at = models.DateTimeField()
    resend_available_at = models.DateTimeField()
    last_code_sent_at = models.DateTimeField()
    failed_attempts = models.PositiveSmallIntegerField(default=0)
    code_send_count = models.PositiveSmallIntegerField(default=1)
    last_request_ip = models.GenericIPAddressField(null=True, blank=True)
    last_user_agent = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "-id"]
        indexes = [
            models.Index(fields=["requested_username", "completed_at"]),
            models.Index(fields=["code_expires_at"]),
        ]

    def save(self, *args, **kwargs):
        self.normalized_email = normalize_identity_email(self.normalized_email)
        self.requested_username = str(self.requested_username or "").strip()
        return super().save(*args, **kwargs)

    @property
    def is_completed(self) -> bool:
        return self.completed_at is not None

    @property
    def is_expired(self) -> bool:
        return self.code_expires_at <= timezone.now()

    def set_password(self, raw_password: str) -> None:
        self.password_hash = make_password(raw_password)

    def set_code(self, raw_code: str) -> None:
        self.code_hash = make_password(raw_code)

    def check_code(self, raw_code: str) -> bool:
        if not raw_code:
            return False
        return check_password(raw_code, self.code_hash)

    def mark_completed(self) -> None:
        self.completed_at = timezone.now()

    def __str__(self):
        return f"Pending registration <{self.normalized_email}>"
