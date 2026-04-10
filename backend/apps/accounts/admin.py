from django.contrib import admin

from .models import Entitlement, Plan, PlanEntitlement, PlanSettings, UserPlanAssignment
from .services import PLAN_FREE, PLAN_PILOT, PLAN_PREMIUM, PLAN_PRO, assign_user_plan


class PlanEntitlementInline(admin.TabularInline):
    model = PlanEntitlement
    extra = 0


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "is_active", "is_public", "is_invite_only", "sort_order")
    list_filter = ("is_active", "is_public", "is_invite_only")
    search_fields = ("code", "name")
    inlines = [PlanEntitlementInline]


@admin.register(Entitlement)
class EntitlementAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "value_type", "unit")
    list_filter = ("value_type",)
    search_fields = ("code", "name")


@admin.register(PlanEntitlement)
class PlanEntitlementAdmin(admin.ModelAdmin):
    list_display = ("plan", "entitlement", "bool_value", "int_value")
    list_filter = ("plan", "entitlement")
    search_fields = ("plan__code", "entitlement__code")


@admin.register(UserPlanAssignment)
class UserPlanAssignmentAdmin(admin.ModelAdmin):
    list_display = ("user", "plan", "source", "updated_at")
    list_filter = ("plan", "source")
    search_fields = ("user__username", "user__email", "plan__code")
    actions = ["set_plan_free", "set_plan_pilot", "set_plan_pro", "set_plan_premium"]

    @admin.action(description="Set selected users to Free")
    def set_plan_free(self, request, queryset):
        self._assign(queryset, PLAN_FREE)

    @admin.action(description="Set selected users to Pilot")
    def set_plan_pilot(self, request, queryset):
        self._assign(queryset, PLAN_PILOT)

    @admin.action(description="Set selected users to Pro")
    def set_plan_pro(self, request, queryset):
        self._assign(queryset, PLAN_PRO)

    @admin.action(description="Set selected users to Premium")
    def set_plan_premium(self, request, queryset):
        self._assign(queryset, PLAN_PREMIUM)

    def _assign(self, queryset, plan_code: str):
        for assignment in queryset.select_related("user"):
            assign_user_plan(user=assignment.user, plan_code=plan_code, source="admin")


@admin.register(PlanSettings)
class PlanSettingsAdmin(admin.ModelAdmin):
    list_display = ("default_signup_plan", "updated_at")

    def has_add_permission(self, request):
        if PlanSettings.objects.exists():
            return False
        return super().has_add_permission(request)

    def has_delete_permission(self, request, obj=None):
        return False

