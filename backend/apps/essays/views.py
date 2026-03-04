from django.db import models
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied

from apps.essays.models import Essay, EssayVersion
from apps.essays.serializers import EssaySerializer, EssayVersionSerializer


def _default_title(essay_type: str) -> str:
    mapping = {
        "personal_statement": "Personal Statement",
        "motivation_essay": "Motivation Essay",
        "supplemental_essay": "Supplemental Essay",
        "other": "Essay",
    }
    return mapping.get(essay_type, "Essay")


class EssayListCreateView(generics.ListCreateAPIView):
    serializer_class = EssaySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Essay.objects.filter(student=self.request.user)
            .annotate(
                versions_count=models.Count("versions", distinct=True),
                last_edited_at=Coalesce(models.Max("versions__updated_at"), models.F("updated_at")),
            )
            .select_related("university")
            .order_by("-last_edited_at", "-updated_at")
        )

    def perform_create(self, serializer):
        essay_type = serializer.validated_data.get("essay_type", "other")
        title = serializer.validated_data.get("title", "").strip() or _default_title(essay_type)
        essay = serializer.save(student=self.request.user, title=title)
        EssayVersion.objects.create(
            essay=essay,
            version_number=1,
            label="Initial draft",
            content="",
            source="user",
        )
        Essay.objects.filter(pk=essay.pk).update(updated_at=timezone.now())


class EssayDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EssaySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Essay.objects.filter(student=self.request.user)
            .annotate(
                versions_count=models.Count("versions", distinct=True),
                last_edited_at=Coalesce(models.Max("versions__updated_at"), models.F("updated_at")),
            )
            .select_related("university")
        )


class EssayVersionListCreateView(generics.ListCreateAPIView):
    serializer_class = EssayVersionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _get_essay(self) -> Essay:
        essay = generics.get_object_or_404(Essay, pk=self.kwargs["essay_id"])
        if essay.student_id != self.request.user.id:
            raise PermissionDenied("Not allowed.")
        return essay

    def get_queryset(self):
        essay = self._get_essay()
        return EssayVersion.objects.filter(essay=essay).order_by("-version_number")

    def perform_create(self, serializer):
        essay = self._get_essay()
        latest = EssayVersion.objects.filter(essay=essay).order_by("-version_number").first()
        next_version = (latest.version_number if latest else 0) + 1
        serializer.save(
            essay=essay,
            version_number=next_version,
            source="user",
        )
        Essay.objects.filter(pk=essay.pk).update(updated_at=timezone.now())


class EssayVersionDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = EssayVersionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EssayVersion.objects.filter(essay__student=self.request.user).select_related("essay")

    def perform_update(self, serializer):
        version = serializer.save()
        Essay.objects.filter(pk=version.essay_id).update(updated_at=timezone.now())

