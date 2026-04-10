from django.conf import settings
from django.db import models


class Plan(models.Model):
    code = models.SlugField(max_length=32, unique=True)
    name = models.CharField(max_length=64)
    description = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=True)
    is_invite_only = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    metadata_json = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"{self.name} ({self.code})"


class Entitlement(models.Model):
    VALUE_TYPE_CHOICES = [
        ("boolean", "Boolean"),
        ("integer", "Integer"),
    ]

    code = models.SlugField(max_length=64, unique=True)
    name = models.CharField(max_length=120)
    description = models.CharField(max_length=255, blank=True)
    value_type = models.CharField(max_length=16, choices=VALUE_TYPE_CHOICES, default="integer")
    unit = models.CharField(max_length=32, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["code"]

    def __str__(self):
        return self.code


class PlanEntitlement(models.Model):
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name="plan_entitlements")
    entitlement = models.ForeignKey(Entitlement, on_delete=models.CASCADE, related_name="plan_entitlements")
    bool_value = models.BooleanField(null=True, blank=True)
    int_value = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("plan", "entitlement")
        ordering = ["plan__sort_order", "entitlement__code"]

    def __str__(self):
        return f"{self.plan.code}:{self.entitlement.code}"


class UserPlanAssignment(models.Model):
    SOURCE_CHOICES = [
        ("default_signup", "Default signup"),
        ("migration_existing_user", "Migration existing user"),
        ("admin", "Admin"),
        ("management_command", "Management command"),
        ("system", "System"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="plan_assignment",
    )
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name="user_assignments")
    source = models.CharField(max_length=32, choices=SOURCE_CHOICES, default="system")
    notes = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["user_id"]

    def __str__(self):
        return f"{self.user.username} -> {self.plan.code}"


class PlanSettings(models.Model):
    singleton_enforcer = models.PositiveSmallIntegerField(default=1, unique=True, editable=False)
    default_signup_plan = models.ForeignKey(
        Plan,
        on_delete=models.PROTECT,
        related_name="default_for_settings",
        null=True,
        blank=True,
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Plan settings"
        verbose_name_plural = "Plan settings"

    def save(self, *args, **kwargs):
        self.singleton_enforcer = 1
        return super().save(*args, **kwargs)

    def __str__(self):
        default_code = self.default_signup_plan.code if self.default_signup_plan_id else "unset"
        return f"Plan settings (default signup: {default_code})"

