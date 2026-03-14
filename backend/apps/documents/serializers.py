from rest_framework import serializers

from apps.universities.models import Application, StudentUniversity
from .constants import MAX_DOCUMENTS_PER_USER, MAX_DOCUMENT_FILE_SIZE_BYTES
from .models import Document


class LinkedApplicationSerializer(serializers.ModelSerializer):
    university = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = ["id", "university_name", "university"]

    def get_university(self, obj):
        if not obj.university:
            return None
        return {
            "id": obj.university.id,
            "name": obj.university.name,
        }


class LinkedStudentUniversitySerializer(serializers.ModelSerializer):
    university = serializers.SerializerMethodField()

    class Meta:
        model = StudentUniversity
        fields = ["id", "category", "status", "university"]

    def get_university(self, obj):
        return {
            "id": obj.university.id,
            "name": obj.university.name,
        }


class DocumentSerializer(serializers.ModelSerializer):
    application = LinkedApplicationSerializer(read_only=True)
    application_id = serializers.PrimaryKeyRelatedField(
        queryset=Application.objects.all(),
        source="application",
        write_only=True,
        required=False,
        allow_null=True,
    )
    student_university = LinkedStudentUniversitySerializer(read_only=True)
    student_university_id = serializers.PrimaryKeyRelatedField(
        queryset=StudentUniversity.objects.all(),
        source="student_university",
        write_only=True,
        required=False,
        allow_null=True,
    )
    type_label = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()
    has_university_link = serializers.SerializerMethodField()
    file = serializers.FileField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Document
        fields = [
            "id",
            "title",
            "type",
            "type_label",
            "file",
            "file_name",
            "mime_type",
            "file_size",
            "download_url",
            "application",
            "application_id",
            "student_university",
            "student_university_id",
            "has_university_link",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "file_name",
            "mime_type",
            "file_size",
            "download_url",
            "application",
            "has_university_link",
            "created_at",
            "updated_at",
        ]

    def validate_application(self, application):
        request = self.context.get("request")
        if application and request and request.user and request.user.is_authenticated:
            if application.student_id != request.user.id:
                raise serializers.ValidationError("Invalid application.")
        return application

    def validate_student_university(self, student_university):
        request = self.context.get("request")
        if student_university and request and request.user and request.user.is_authenticated:
            if student_university.student_id != request.user.id:
                raise serializers.ValidationError("Invalid university link.")
        return student_university

    def get_type_label(self, obj):
        return obj.get_type_display()

    def get_download_url(self, obj):
        request = self.context.get("request")
        if not obj.file:
            return ""
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url

    def get_has_university_link(self, obj):
        if obj.student_university_id and obj.student_university and obj.student_university.university_id:
            return True
        return bool(obj.application_id and obj.application and obj.application.university_id)

    def validate_file(self, file):
        if file.size <= 0:
            raise serializers.ValidationError("Upload a non-empty file.")
        if file.size > MAX_DOCUMENT_FILE_SIZE_BYTES:
            raise serializers.ValidationError("File must be 5 MB or smaller.")
        return file

    def validate(self, attrs):
        if self.instance is None and not attrs.get("file"):
            raise serializers.ValidationError({"file": "Upload a file."})
        request = self.context.get("request")
        if self.instance is None and request and request.user and request.user.is_authenticated:
            existing_count = Document.objects.filter(user=request.user).count()
            if existing_count >= MAX_DOCUMENTS_PER_USER:
                raise serializers.ValidationError(
                    {"detail": f"You can store up to {MAX_DOCUMENTS_PER_USER} documents."}
                )
        return attrs

    def create(self, validated_data):
        uploaded_file = validated_data.get("file")
        if uploaded_file is not None:
            validated_data["file_name"] = uploaded_file.name
            validated_data["mime_type"] = getattr(uploaded_file, "content_type", "") or ""
            validated_data["file_size"] = uploaded_file.size
        return super().create(validated_data)
