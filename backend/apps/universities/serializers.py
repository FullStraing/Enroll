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
        allow_null=False,
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
        read_only_fields = ["university_name"]

    def validate(self, attrs):
        university = attrs.get("university", getattr(self.instance, "university", None))
        if not university and self.instance is None:
            raise serializers.ValidationError("Provide university_id.")
        request = self.context.get("request")
        if (
            university
            and request
            and request.user
            and request.user.is_authenticated
            and not StudentUniversity.objects.filter(
                student=request.user,
                university=university,
            ).exists()
        ):
            raise serializers.ValidationError("Select university from My Universities.")
        return attrs
