from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers
from apps.accounts.services import build_user_entitlement_summary, ensure_user_plan, get_user_plan_assignment
from .models import StudentProfile, UserAuthIdentity, normalize_identity_email
from .progress import has_completed_minimum_profile


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True, allow_blank=False)
    password = serializers.CharField(write_only=True, min_length=8, trim_whitespace=False)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def validate_email(self, value):
        normalized = normalize_identity_email(value)
        if not normalized:
            raise serializers.ValidationError("Email is required.")
        if UserAuthIdentity.objects.filter(normalized_email=normalized).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return normalized

    def validate_password(self, value):
        user = User(
            username=self.initial_data.get("username", ""),
            email=normalize_identity_email(self.initial_data.get("email", "")),
        )
        try:
            validate_password(value, user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        with transaction.atomic():
            user = User(
                username=validated_data.get("username"),
                email=validated_data.get("email"),
            )
            user.set_password(password)
            user.save()
            StudentProfile.objects.create(user=user)
            UserAuthIdentity.objects.create(
                user=user,
                normalized_email=validated_data["email"],
                email_verified=False,
            )
            ensure_user_plan(user=user, source="default_signup")
        return user


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
