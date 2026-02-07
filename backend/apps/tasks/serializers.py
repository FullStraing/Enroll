from rest_framework import serializers

from apps.universities.models import Application
from .models import RoadmapStage, Task


class RoadmapStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoadmapStage
        fields = ["id", "code", "title", "order"]


class TaskApplicationSerializer(serializers.ModelSerializer):
    university_id = serializers.IntegerField(source="university_id", read_only=True)
    university_name = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = ["id", "university_id", "university_name", "deadline_date", "status"]

    def get_university_name(self, obj):
        if obj.university:
            return obj.university.name
        return obj.university_name


class TaskSerializer(serializers.ModelSerializer):
    roadmap_stage = RoadmapStageSerializer(read_only=True)
    application = TaskApplicationSerializer(read_only=True)
    roadmap_stage_id = serializers.PrimaryKeyRelatedField(
        queryset=RoadmapStage.objects.all(),
        source="roadmap_stage",
        write_only=True,
        required=False,
        allow_null=True,
    )
    application_id = serializers.PrimaryKeyRelatedField(
        queryset=Application.objects.all(),
        source="application",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "due_date",
            "status",
            "priority",
            "roadmap_stage",
            "application",
            "roadmap_stage_id",
            "application_id",
        ]

    def validate_application(self, application):
        request = self.context.get("request")
        if application and request and request.user and request.user.is_authenticated:
            if application.student_id != request.user.id:
                raise serializers.ValidationError("Invalid application.")
        return application
