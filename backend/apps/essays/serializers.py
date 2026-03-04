from rest_framework import serializers

from apps.essays.models import Essay, EssayVersion
from apps.universities.serializers import UniversitySerializer


class EssayVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EssayVersion
        fields = [
            "id",
            "essay",
            "version_number",
            "label",
            "content",
            "source",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "essay", "version_number", "created_at", "updated_at"]


class EssaySerializer(serializers.ModelSerializer):
    versions_count = serializers.IntegerField(read_only=True)
    last_edited_at = serializers.DateTimeField(read_only=True)
    university_detail = UniversitySerializer(source="university", read_only=True)

    class Meta:
        model = Essay
        fields = [
            "id",
            "title",
            "essay_type",
            "university",
            "university_detail",
            "prompt_title",
            "prompt_text",
            "target_word_count",
            "versions_count",
            "last_edited_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "versions_count", "last_edited_at", "created_at", "updated_at"]

    def validate(self, attrs):
        essay_type = attrs.get("essay_type", getattr(self.instance, "essay_type", None))
        university = attrs.get("university", getattr(self.instance, "university", None))
        prompt_title = attrs.get("prompt_title", getattr(self.instance, "prompt_title", ""))

        if essay_type == "supplemental_essay":
            if not university:
                raise serializers.ValidationError({"university": "University is required for supplemental essay."})
            if not prompt_title.strip():
                raise serializers.ValidationError({"prompt_title": "Prompt title is required for supplemental essay."})
        return attrs

