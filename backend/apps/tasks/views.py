from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.universities.models import Application
from .models import RoadmapStage, Task
from .serializers import RoadmapStageSerializer, TaskSerializer


ROADMAP_STAGES = [
    {"code": "profile", "title": "Profile", "order": 1},
    {"code": "university_list", "title": "University list", "order": 2},
    {"code": "tests_plan", "title": "Tests plan", "order": 3},
    {"code": "documents", "title": "Documents", "order": 4},
    {"code": "common_app_prep", "title": "Common App prep", "order": 5},
    {"code": "submission_readiness", "title": "Submission readiness", "order": 6},
]

TASK_TEMPLATES = [
    {
        "title": "Draft Common App personal info",
        "description": "Fill personal info draft for Common App.",
        "stage_code": "common_app_prep",
        "priority": "medium",
    },
    {
        "title": "Write personal statement v1",
        "description": "Create first draft of personal statement.",
        "stage_code": "documents",
        "priority": "high",
    },
    {
        "title": "Create resume",
        "description": "Prepare baseline resume draft.",
        "stage_code": "documents",
        "priority": "medium",
    },
    {
        "title": "Request recommendations",
        "description": "Reach out for recommendation letters.",
        "stage_code": "submission_readiness",
        "priority": "medium",
    },
    {
        "title": "Finalize university list",
        "description": "Finalize list of target/reach/safety universities.",
        "stage_code": "university_list",
        "priority": "high",
    },
]


def ensure_roadmap_stages():
    for stage in ROADMAP_STAGES:
        RoadmapStage.objects.get_or_create(
            code=stage["code"],
            defaults={
                "title": stage["title"],
                "order": stage["order"],
            },
        )


class RoadmapStageListView(generics.ListAPIView):
    queryset = RoadmapStage.objects.all()
    serializer_class = RoadmapStageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        ensure_roadmap_stages()
        return super().get_queryset()


class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Task.objects.filter(user=self.request.user)
        status_param = self.request.query_params.get("status")
        application_id = self.request.query_params.get("application_id")
        if status_param:
            queryset = queryset.filter(status=status_param)
        if application_id:
            queryset = queryset.filter(application_id=application_id)
        return queryset.select_related("roadmap_stage", "application", "application__university")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TaskDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user).select_related(
            "roadmap_stage",
            "application",
            "application__university",
        )


class TaskGenerateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ensure_roadmap_stages()
        application_id = request.data.get("application_id")
        application = None
        if application_id:
            application = Application.objects.filter(
                id=application_id,
                student=request.user,
            ).first()
            if not application:
                return Response(
                    {"detail": "Application not found."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        created = []
        due_date = None
        if application and application.deadline_date:
            due_date = application.deadline_date

        for template in TASK_TEMPLATES:
            stage = RoadmapStage.objects.filter(
                code=template["stage_code"]
            ).first()
            exists = Task.objects.filter(
                user=request.user,
                application=application,
                title=template["title"],
            ).exists()
            if exists:
                continue
            created.append(
                Task.objects.create(
                    user=request.user,
                    application=application,
                    roadmap_stage=stage,
                    title=template["title"],
                    description=template["description"],
                    due_date=due_date,
                    status="planned",
                    priority=template["priority"],
                )
            )

        serializer = TaskSerializer(created, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
