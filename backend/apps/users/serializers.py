from django.contrib.auth.models import User
from rest_framework import serializers
from .models import StudentProfile
from .progress import has_completed_minimum_profile


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(
            username=validated_data.get("username"),
            email=validated_data.get("email"),
        )
        user.set_password(password)
        user.save()
        StudentProfile.objects.create(user=user)
        return user


class StudentProfileSerializer(serializers.ModelSerializer):
    onboarding_completed = serializers.SerializerMethodField(read_only=True)
    is_staff = serializers.SerializerMethodField(read_only=True)
    is_superuser = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
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
        ]

    def get_onboarding_completed(self, obj: StudentProfile):
        return has_completed_minimum_profile(obj)

    def get_is_staff(self, obj: StudentProfile):
        return bool(obj.user.is_staff)

    def get_is_superuser(self, obj: StudentProfile):
        return bool(obj.user.is_superuser)

    def update(self, instance, validated_data):
        # Merge Common App draft payload instead of overwriting whole object on partial updates.
        if "common_app_profile" in validated_data:
            incoming = validated_data.pop("common_app_profile") or {}
            merged = dict(instance.common_app_profile or {})
            merged.update(incoming)
            instance.common_app_profile = merged
        return super().update(instance, validated_data)
