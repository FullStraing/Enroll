from rest_framework import serializers
from .models import University, StudentUniversity


class UniversitySerializer(serializers.ModelSerializer):
    class Meta:
        model = University
        fields = [
            "id",
            "name",
            "country",
            "city",
            "state",
            "selectivity",
            "website_url",
            "main_deadline",
        ]


class StudentUniversitySerializer(serializers.ModelSerializer):
    university = UniversitySerializer(read_only=True)
    university_id = serializers.PrimaryKeyRelatedField(
        queryset=University.objects.all(),
        source="university",
        write_only=True,
    )
    progress_percent = serializers.IntegerField(read_only=True)

    class Meta:
        model = StudentUniversity
        fields = [
            "id",
            "university",
            "university_id",
            "category",
            "status",
            "tests_done",
            "essays_done",
            "recommendations_done",
            "application_form_done",
            "application_fee_paid",
            "deadline_override",
            "notes",
            "progress_percent",
        ]
