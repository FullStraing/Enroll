from rest_framework import serializers

from apps.universities.models import Application
from .models import RoadmapStage, Task


class RoadmapStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoadmapStage
        fields = ["id", "code", "title", "order"]


class TaskSerializer(serializers.ModelSerializer):
    roadmap_stage = RoadmapStageSerializer(read_only=True)
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
            "roadmap_stage_id",
            "application_id",
        ]

    def validate_application(self, application):
        request = self.context.get("request")
        if application and request and request.user and request.user.is_authenticated:
            if application.student_id != request.user.id:
                raise serializers.ValidationError("Invalid application.")
        return application
