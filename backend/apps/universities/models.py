from django.conf import settings
from django.db import models
from django.utils import timezone


class University(models.Model):
    SELECTIVITY_CHOICES = [
        ("high", "High"),
        ("medium", "Medium"),
        ("low", "Low"),
    ]
    SOURCE_CHOICES = [
        ("manual", "Manual"),
        ("niche", "Niche"),
        ("gradgpt", "GradGPT"),
        ("other", "Other"),
    ]
    SOURCE_PROVIDER_CHOICES = [
        ("licensed", "Licensed"),
        ("niche", "Niche"),
        ("gradgpt", "GradGPT"),
        ("other", "Other"),
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
        help_text="Estimated minimum profile score from 0 to 100",
    )
    avg_profile_score = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Estimated average profile score from 0 to 100",
    )

    acceptance_rate = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Acceptance rate in percent",
    )
    sat_range = models.CharField(max_length=50, blank=True)
    act_range = models.CharField(max_length=50, blank=True)
    source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default="manual",
    )
    source_provider = models.CharField(
        max_length=20,
        choices=SOURCE_PROVIDER_CHOICES,
        default="other",
        help_text="Primary ingestion provider: licensed, gradgpt, niche, other.",
    )
    external_id = models.CharField(max_length=120, blank=True, null=True, db_index=True)
    source_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    last_ingested_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["source_provider", "external_id"],
                name="unique_university_provider_external_id",
                condition=~models.Q(external_id__isnull=True),
            )
        ]

    def __str__(self):
        return self.name

    @property
    def last_scraped_at(self):
        latest = self.source_snapshots.filter(status__in=["success", "partial"]).order_by("-fetched_at").first()
        return latest.fetched_at if latest else None

    @property
    def data_freshness_days(self):
        last = self.last_scraped_at
        if not last:
            return None
        return (timezone.now() - last).days

    @property
    def deadlines_count(self):
        return self.deadlines.count()

    @property
    def has_deadlines(self):
        return self.deadlines.exists()

    @property
    def deadline_freshness_days(self):
        latest = self.deadlines.order_by("-last_verified_at").first()
        if not latest:
            return None
        return (timezone.now() - latest.last_verified_at).days


class StudentUniversity(models.Model):
    CATEGORY_CHOICES = [
        ("reach", "Reach"),
        ("target", "Target"),
        ("safety", "Safety"),
    ]

    STATUS_CHOICES = [
        ("planning", "Planning"),
        ("preparing", "Preparing"),
        ("applying", "Applying"),
        ("submitted", "Submitted"),
        ("admitted", "Admitted"),
        ("rejected", "Rejected"),
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
        help_text="Personal deadline override",
    )

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("student", "university")

    def __str__(self):
        return f"{self.student.username} - {self.university.name}"

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
            return f"{self.student.username} - {self.university.name}"
        return f"{self.student.username} - {self.university_name}"


class UniversitySourceSnapshot(models.Model):
    STATUS_CHOICES = [
        ("success", "Success"),
        ("partial", "Partial"),
        ("failed", "Failed"),
    ]

    university = models.ForeignKey(
        University,
        on_delete=models.CASCADE,
        related_name="source_snapshots",
    )
    source = models.CharField(max_length=20, default="niche")
    root_url = models.URLField()
    fetched_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="success")
    parser_version = models.CharField(max_length=30, default="v1")
    raw_payload = models.JSONField(default=dict, blank=True)
    raw_text_index = models.TextField(blank=True)
    error_summary = models.TextField(blank=True)

    class Meta:
        ordering = ["-fetched_at"]
        indexes = [
            models.Index(fields=["source", "-fetched_at"]),
            models.Index(fields=["university", "-fetched_at"]),
        ]

    def __str__(self):
        return f"{self.university.name} [{self.source}] {self.status}"


class UniversitySourceSection(models.Model):
    STATUS_CHOICES = UniversitySourceSnapshot.STATUS_CHOICES

    snapshot = models.ForeignKey(
        UniversitySourceSnapshot,
        on_delete=models.CASCADE,
        related_name="sections",
    )
    section_key = models.CharField(max_length=64)
    url = models.URLField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="success")
    raw_html_hash = models.CharField(max_length=64, blank=True)
    parsed_payload = models.JSONField(default=dict, blank=True)
    error_text = models.TextField(blank=True)

    class Meta:
        ordering = ["section_key"]
        unique_together = ("snapshot", "section_key")

    def __str__(self):
        return f"{self.snapshot.university.name}:{self.section_key}"


class UniversityMetric(models.Model):
    UNIT_CHOICES = [
        ("percent", "Percent"),
        ("usd", "USD"),
        ("range", "Range"),
        ("count", "Count"),
        ("text", "Text"),
        ("bool", "Boolean"),
        ("json", "JSON"),
    ]

    university = models.ForeignKey(
        University,
        on_delete=models.CASCADE,
        related_name="metrics",
    )
    key = models.CharField(max_length=120)
    value_number = models.FloatField(null=True, blank=True)
    value_text = models.TextField(blank=True)
    value_json = models.JSONField(null=True, blank=True)
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES, default="text")
    source_url = models.URLField(blank=True)
    section_key = models.CharField(max_length=64, blank=True)
    confidence = models.FloatField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["key"]
        unique_together = ("university", "key")
        indexes = [
            models.Index(fields=["key"]),
            models.Index(fields=["section_key"]),
        ]

    def __str__(self):
        return f"{self.university.name}:{self.key}"


class UniversityMediaRef(models.Model):
    MEDIA_TYPE_CHOICES = [
        ("image", "Image"),
        ("icon", "Icon"),
        ("chart", "Chart"),
    ]

    university = models.ForeignKey(
        University,
        on_delete=models.CASCADE,
        related_name="media_refs",
    )
    section_key = models.CharField(max_length=64, blank=True)
    media_url = models.URLField()
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPE_CHOICES, default="image")
    alt_text = models.CharField(max_length=300, blank=True)
    caption = models.CharField(max_length=300, blank=True)
    meta_json = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["section_key", "media_url"]
        unique_together = ("university", "section_key", "media_url")

    def __str__(self):
        return f"{self.university.name}:{self.media_type}"


class UniversityDeadline(models.Model):
    DEADLINE_TYPE_CHOICES = [
        ("EA", "Early Action"),
        ("ED1", "Early Decision I"),
        ("ED2", "Early Decision II"),
        ("REA", "Restrictive Early Action"),
        ("RD", "Regular Decision"),
        ("TRANSFER_FALL", "Transfer Fall"),
        ("TRANSFER_SPRING", "Transfer Spring"),
        ("PRIORITY", "Priority"),
        ("ROLLING", "Rolling"),
        ("OTHER", "Other"),
    ]
    TERM_CHOICES = [
        ("fall", "Fall"),
        ("spring", "Spring"),
        ("summer", "Summer"),
        ("other", "Other"),
    ]

    university = models.ForeignKey(University, on_delete=models.CASCADE, related_name="deadlines")
    deadline_type = models.CharField(max_length=20, choices=DEADLINE_TYPE_CHOICES)
    term = models.CharField(max_length=10, choices=TERM_CHOICES, blank=True)
    deadline_date = models.DateField(null=True, blank=True)
    deadline_text = models.CharField(max_length=120, blank=True)
    notification_date = models.DateField(null=True, blank=True)
    notification_text = models.CharField(max_length=120, blank=True)
    is_rolling = models.BooleanField(default=False)
    source_url = models.URLField()
    source_label = models.CharField(max_length=60, default="official_admissions")
    confidence = models.FloatField(default=0.6)
    last_verified_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["deadline_date", "deadline_type"]
        unique_together = ("university", "deadline_type", "term", "deadline_text")
        indexes = [
            models.Index(fields=["deadline_type"]),
            models.Index(fields=["deadline_date"]),
            models.Index(fields=["last_verified_at"]),
        ]

    def __str__(self):
        return f"{self.university.name}:{self.deadline_type}:{self.deadline_text or self.deadline_date}"


class ScrapeRun(models.Model):
    STATUS_CHOICES = UniversitySourceSnapshot.STATUS_CHOICES

    source = models.CharField(max_length=20, default="niche")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="success")
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    targets_total = models.PositiveIntegerField(default=0)
    targets_ok = models.PositiveIntegerField(default=0)
    targets_failed = models.PositiveIntegerField(default=0)
    error_summary = models.TextField(blank=True)

    class Meta:
        ordering = ["-started_at"]
        indexes = [models.Index(fields=["source", "-started_at"])]

    def __str__(self):
        return f"{self.source} run #{self.id} ({self.status})"


class ScrapeRunItem(models.Model):
    STATUS_CHOICES = UniversitySourceSnapshot.STATUS_CHOICES

    run = models.ForeignKey(
        ScrapeRun,
        on_delete=models.CASCADE,
        related_name="items",
    )
    university = models.ForeignKey(
        University,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="scrape_items",
    )
    source_url = models.URLField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="success")
    retries = models.PositiveIntegerField(default=0)
    duration_ms = models.PositiveIntegerField(default=0)
    parsed_payload = models.JSONField(default=dict, blank=True)
    error_text = models.TextField(blank=True)
    fetched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fetched_at"]
        indexes = [models.Index(fields=["status", "-fetched_at"])]

    def __str__(self):
        name = self.university.name if self.university else self.source_url
        return f"{self.run_id}:{name}"
