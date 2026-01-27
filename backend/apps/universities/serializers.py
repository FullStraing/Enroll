from rest_framework import serializers
from .models import University, StudentUniversity, Application


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


class ApplicationSerializer(serializers.ModelSerializer):
    university = UniversitySerializer(read_only=True)
    university_id = serializers.PrimaryKeyRelatedField(
        queryset=University.objects.all(),
        source="university",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Application
        fields = [
            "id",
            "university",
            "university_id",
            "university_name",
            "deadline_date",
            "status",
        ]

    def validate(self, attrs):
        university = attrs.get("university", getattr(self.instance, "university", None))
        university_name = attrs.get(
            "university_name",
            getattr(self.instance, "university_name", ""),
        )
        if not university and not university_name:
            raise serializers.ValidationError(
                "Provide university_id or university_name."
            )
        return attrs
