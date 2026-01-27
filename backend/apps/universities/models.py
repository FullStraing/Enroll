from django.conf import settings
from django.db import models


class University(models.Model):
    SELECTIVITY_CHOICES = [
        ("high", "Высокая селективность"),
        ("medium", "Средняя селективность"),
        ("low", "Низкая селективность"),
    ]

    name = models.CharField(max_length=200)
    country = models.CharField(max_length=100, default="USA")
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)

    selectivity = models.CharField(
        max_length=10,
        choices=SELECTIVITY_CHOICES,
        default="medium",
    )

    website_url = models.URLField(blank=True)
    main_deadline = models.DateField(null=True, blank=True)

    min_profile_score = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Условный минимальный скор профиля от 0 до 100",
    )
    avg_profile_score = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Условный средний скор профиля от 0 до 100",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class StudentUniversity(models.Model):
    CATEGORY_CHOICES = [
        ("reach", "Reach"),
        ("target", "Target"),
        ("safety", "Safety"),
    ]

    STATUS_CHOICES = [
        ("planning", "Планирую"),
        ("preparing", "Готовлюсь"),
        ("applying", "Подаюсь"),
        ("submitted", "Отправлено",
        ),
        ("admitted", "Принят"),
        ("rejected", "Отказ"),
    ]

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_universities",
    )
    university = models.ForeignKey(
        University,
        on_delete=models.CASCADE,
        related_name="student_universities",
    )

    category = models.CharField(
        max_length=10,
        choices=CATEGORY_CHOICES,
        default="target",
    )
    status = models.CharField(
        max_length=15,
        choices=STATUS_CHOICES,
        default="planning",
    )

    tests_done = models.BooleanField(default=False)
    essays_done = models.BooleanField(default=False)
    recommendations_done = models.BooleanField(default=False)
    application_form_done = models.BooleanField(default=False)
    application_fee_paid = models.BooleanField(default=False)

    deadline_override = models.DateField(
        null=True,
        blank=True,
        help_text="Если личный дедлайн отличается от основного",
    )

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("student", "university")

    def __str__(self):
        return f"{self.student.username} – {self.university.name}"

    @property
    def progress_percent(self):
        total = 5
        done = sum(
            [
                1 if self.tests_done else 0,
                1 if self.essays_done else 0,
                1 if self.recommendations_done else 0,
                1 if self.application_form_done else 0,
                1 if self.application_fee_paid else 0,
            ]
        )
        return int(done / total * 100)


class Application(models.Model):
    STATUS_CHOICES = [
        ("planned", "Planned"),
        ("in_progress", "In progress"),
        ("submitted", "Submitted"),
    ]

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="applications",
    )
    university = models.ForeignKey(
        University,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="applications",
    )
    university_name = models.CharField(max_length=200, blank=True)
    deadline_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="planned",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.university:
            return f"{self.student.username} – {self.university.name}"
        return f"{self.student.username} – {self.university_name}"
