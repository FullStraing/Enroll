from rest_framework import serializers
from apps.accounts.services import build_user_entitlement_summary, get_user_plan_assignment
from .models import StudentProfile
from .progress import has_completed_minimum_profile


class RegisterStartSerializer(serializers.Serializer):
    username = serializers.CharField(required=True, allow_blank=False, max_length=150)
    email = serializers.EmailField(required=True, allow_blank=False)
    password = serializers.CharField(write_only=True, min_length=8, trim_whitespace=False)


class RegisterVerifySerializer(serializers.Serializer):
    email = serializers.EmailField(required=True, allow_blank=False)
    code = serializers.CharField(required=True, allow_blank=False, max_length=6, min_length=6, trim_whitespace=True)


class RegisterResendSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True, allow_blank=False)


class StudentProfileSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField(read_only=True)
    email = serializers.SerializerMethodField(read_only=True)
    onboarding_completed = serializers.SerializerMethodField(read_only=True)
    is_staff = serializers.SerializerMethodField(read_only=True)
    is_superuser = serializers.SerializerMethodField(read_only=True)
    has_usable_password = serializers.SerializerMethodField(read_only=True)
    account_plan = serializers.SerializerMethodField(read_only=True)
    entitlements = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            "username",
            "email",
            "full_name",
            "country",
            "school_name",
            "graduation_year",
            "intended_major",
            "gpa",
            "grades_summary",
            "ielts_overall",
            "ielts_date",
            "toefl_total",
            "toefl_date",
            "sat_total",
            "sat_date",
            "det_score",
            "det_date",
            "activities",
            "honors",
            "budget_range",
            "activities_level",
            "target_country",
            "common_app_profile",
            "essays_onboarding_seen",
            "onboarding_completed",
            "is_staff",
            "is_superuser",
            "has_usable_password",
            "account_plan",
            "entitlements",
        ]

    def get_username(self, obj: StudentProfile):
        return obj.user.username

    def get_email(self, obj: StudentProfile):
        return obj.user.email

    def get_onboarding_completed(self, obj: StudentProfile):
        return has_completed_minimum_profile(obj)

    def get_is_staff(self, obj: StudentProfile):
        return bool(obj.user.is_staff)

    def get_is_superuser(self, obj: StudentProfile):
        return bool(obj.user.is_superuser)

    def get_has_usable_password(self, obj: StudentProfile):
        return obj.user.has_usable_password()

    def get_account_plan(self, obj: StudentProfile):
        assignment = get_user_plan_assignment(user=obj.user)
        return {
            "code": assignment.plan.code,
            "name": assignment.plan.name,
            "source": assignment.source,
            "is_public": assignment.plan.is_public,
            "is_invite_only": assignment.plan.is_invite_only,
        }

    def get_entitlements(self, obj: StudentProfile):
        return build_user_entitlement_summary(user=obj.user)

    def update(self, instance, validated_data):
        # Merge Common App draft payload instead of overwriting whole object on partial updates.
        if "common_app_profile" in validated_data:
            incoming = validated_data.pop("common_app_profile") or {}
            if isinstance(incoming, dict):
                incoming = {
                    key: value
                    for key, value in incoming.items()
                    if key not in {"community_status", "application_status"}
                }
            merged = dict(instance.common_app_profile or {})
            merged.update(incoming)
            instance.common_app_profile = merged
        return super().update(instance, validated_data)
