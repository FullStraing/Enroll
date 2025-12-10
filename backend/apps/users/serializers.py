from django.contrib.auth.models import User
from rest_framework import serializers
from .models import StudentProfile


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
    class Meta:
        model = StudentProfile
        fields = [
            "full_name",
            "country",
            "school_name",
            "gpa",
            "ielts_overall",
            "toefl_total",
            "sat_total",
            "activities_level",
            "target_country",
        ]