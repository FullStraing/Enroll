from rest_framework import serializers

from apps.universities.models import Application
from .models import Document, DocumentVersion


class DocumentSerializer(serializers.ModelSerializer):
    application_id = serializers.PrimaryKeyRelatedField(
        queryset=Application.objects.all(),
        source="application",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Document
        fields = [
            "id",
            "title",
            "type",
            "application_id",
        ]

    def validate_application(self, application):
        request = self.context.get("request")
        if application and request and request.user and request.user.is_authenticated:
            if application.student_id != request.user.id:
                raise serializers.ValidationError("Invalid application.")
        return application


class DocumentVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentVersion
        fields = [
            "id",
            "version_number",
            "content",
            "created_by",
            "created_at",
        ]
        read_only_fields = ["version_number", "created_at"]
