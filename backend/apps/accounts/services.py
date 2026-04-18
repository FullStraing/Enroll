from dataclasses import dataclass
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import Entitlement, Plan, PlanEntitlement, PlanSettings, UserPlanAssignment

PLAN_FREE = "free"
PLAN_PILOT = "pilot"
PLAN_PRO = "pro"
PLAN_PREMIUM = "premium"

ENTITLEMENT_UNIVERSITIES_MAX_COUNT = "universities.max_count"
ENTITLEMENT_UNIVERSITIES_DISCOVER_VISIBLE_COUNT = "universities.discover_visible_count"
ENTITLEMENT_ESSAYS_MAX_COUNT = "essays.max_count"
ENTITLEMENT_ESSAY_VERSIONS_MAX_PER_ESSAY = "essay_versions.max_per_essay"
ENTITLEMENT_AI_REQUESTS_MONTHLY_LIMIT = "ai.requests.monthly_limit"

DEFAULT_PLAN_CODE = PLAN_FREE


@dataclass(frozen=True)
class LimitSnapshot:
    entitlement_code: str
    plan_code: str
    limit: int
    used: int

    @property
    def remaining(self) -> int:
        return max(self.limit - self.used, 0)

    @property
    def reached(self) -> bool:
        return self.used >= self.limit


def get_plan(code: str) -> Plan:
    return Plan.objects.get(code=code, is_active=True)


def get_or_create_plan_settings() -> PlanSettings:
    settings_obj, _ = PlanSettings.objects.select_related("default_signup_plan").get_or_create(singleton_enforcer=1)
    if settings_obj.default_signup_plan_id is None:
        default_plan = Plan.objects.filter(code=DEFAULT_PLAN_CODE, is_active=True).first()
        if default_plan:
            settings_obj.default_signup_plan = default_plan
            settings_obj.save(update_fields=["default_signup_plan", "updated_at"])
    return settings_obj


def get_default_signup_plan() -> Plan:
    settings_obj = get_or_create_plan_settings()
    if settings_obj.default_signup_plan_id:
        return settings_obj.default_signup_plan
    return Plan.objects.filter(is_active=True).order_by("sort_order", "id").first()


def set_default_signup_plan(*, plan_code: str) -> PlanSettings:
    plan = get_plan(plan_code)
    settings_obj = get_or_create_plan_settings()
    settings_obj.default_signup_plan = plan
    settings_obj.save(update_fields=["default_signup_plan", "updated_at"])
    return settings_obj


@transaction.atomic
def assign_user_plan(*, user, plan_code: str, source: str = "system", notes: str = "", overwrite: bool = True) -> UserPlanAssignment:
    plan = get_plan(plan_code)
    assignment, created = UserPlanAssignment.objects.select_for_update().get_or_create(
        user=user,
        defaults={"plan": plan, "source": source, "notes": notes},
    )
    if created:
        return assignment

    updates = []
    if overwrite and assignment.plan_id != plan.id:
        assignment.plan = plan
        updates.append("plan")
    if overwrite and assignment.source != source:
        assignment.source = source
        updates.append("source")
    if overwrite and notes != assignment.notes:
        assignment.notes = notes
        updates.append("notes")
    if updates:
        assignment.save(update_fields=[*updates, "updated_at"])
    return assignment


def ensure_user_plan(*, user, source: str = "default_signup") -> UserPlanAssignment:
    assignment = UserPlanAssignment.objects.select_related("plan").filter(user=user).first()
    if assignment:
        return assignment
    default_plan = get_default_signup_plan()
    return assign_user_plan(user=user, plan_code=default_plan.code, source=source, overwrite=False)


def get_user_plan_assignment(*, user) -> UserPlanAssignment:
    return ensure_user_plan(user=user)


def get_user_plan(*, user) -> Plan:
    assignment = get_user_plan_assignment(user=user)
    return assignment.plan


def get_plan_entitlement_value(*, plan: Plan, entitlement_code: str):
    row = (
        PlanEntitlement.objects.select_related("entitlement")
        .filter(plan=plan, entitlement__code=entitlement_code)
        .first()
    )
    if not row:
        return None
    if row.entitlement.value_type == "boolean":
        return bool(row.bool_value)
    return row.int_value


def get_user_entitlement_value(*, user, entitlement_code: str):
    plan = get_user_plan(user=user)
    return get_plan_entitlement_value(plan=plan, entitlement_code=entitlement_code)


def build_limit_snapshot(*, user, entitlement_code: str, used: int) -> LimitSnapshot:
    plan = get_user_plan(user=user)
    limit = get_plan_entitlement_value(plan=plan, entitlement_code=entitlement_code)
    if limit is None:
        raise ValidationError(
            {
                "detail": "Missing plan entitlement configuration.",
                "code": "plan_entitlement_missing",
                "feature": entitlement_code,
                "plan": plan.code,
            }
        )
    return LimitSnapshot(entitlement_code=entitlement_code, plan_code=plan.code, limit=int(limit), used=int(used))


def enforce_limit(*, user, entitlement_code: str, used: int, detail: str):
    snapshot = build_limit_snapshot(user=user, entitlement_code=entitlement_code, used=used)
    if snapshot.reached:
        raise ValidationError(
            {
                "detail": detail,
                "code": "plan_limit_reached",
                "feature": snapshot.entitlement_code,
                "plan": snapshot.plan_code,
                "limit": snapshot.limit,
                "used": snapshot.used,
                "remaining": snapshot.remaining,
            }
        )
    return snapshot


def get_current_month_window(*, now=None):
    current = now or timezone.now()
    start = current.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if start.month == 12:
        end = start.replace(year=start.year + 1, month=1)
    else:
        end = start.replace(month=start.month + 1)
    return start, end


def get_monthly_ai_request_count(*, user, now=None) -> int:
    from apps.ai.models import AIInteraction

    period_start, period_end = get_current_month_window(now=now)
    return AIInteraction.objects.filter(
        user=user,
        created_at__gte=period_start,
        created_at__lt=period_end,
    ).count()


def build_user_entitlement_summary(*, user) -> dict:
    from apps.ai.models import AIInteraction
    from apps.essays.models import Essay
    from apps.universities.models import StudentUniversity

    universities_used = StudentUniversity.objects.filter(student=user).count()
    essays_used = Essay.objects.filter(student=user).count()
    ai_used = get_monthly_ai_request_count(user=user)

    universities_limit = build_limit_snapshot(
        user=user,
        entitlement_code=ENTITLEMENT_UNIVERSITIES_MAX_COUNT,
        used=universities_used,
    )
    universities_discover_visible_count = int(
        get_user_entitlement_value(user=user, entitlement_code=ENTITLEMENT_UNIVERSITIES_DISCOVER_VISIBLE_COUNT) or 0
    )
    essays_limit = build_limit_snapshot(
        user=user,
        entitlement_code=ENTITLEMENT_ESSAYS_MAX_COUNT,
        used=essays_used,
    )
    ai_limit = build_limit_snapshot(
        user=user,
        entitlement_code=ENTITLEMENT_AI_REQUESTS_MONTHLY_LIMIT,
        used=ai_used,
    )
    essay_versions_limit = int(
        get_user_entitlement_value(user=user, entitlement_code=ENTITLEMENT_ESSAY_VERSIONS_MAX_PER_ESSAY) or 0
    )

    period_start, period_end = get_current_month_window()
    _ = AIInteraction  # keep import local and explicit for serializer callers

    return {
        "universities": {
            "max_count": universities_limit.limit,
            "discover_visible_count": universities_discover_visible_count,
            "used": universities_limit.used,
            "remaining": universities_limit.remaining,
            "can_create": not universities_limit.reached,
        },
        "essays": {
            "max_count": essays_limit.limit,
            "used": essays_limit.used,
            "remaining": essays_limit.remaining,
            "can_create": not essays_limit.reached,
        },
        "essay_versions": {
            "max_per_essay": essay_versions_limit,
        },
        "ai_requests": {
            "monthly_limit": ai_limit.limit,
            "used_this_month": ai_limit.used,
            "remaining_this_month": ai_limit.remaining,
            "period_start": period_start.isoformat(),
            "period_end": (period_end - timedelta(microseconds=1)).isoformat(),
        },
    }


def bulk_assign_plan(*, plan_code: str, users, source: str = "management_command", notes: str = "") -> int:
    count = 0
    for user in users:
        assign_user_plan(user=user, plan_code=plan_code, source=source, notes=notes)
        count += 1
    return count


def get_assignable_users_queryset():
    user_model = get_user_model()
    return user_model.objects.order_by("id")
