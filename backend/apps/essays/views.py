import re

from django.db import models
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.analytics.services import record_product_event
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
                latest_version_content=models.Subquery(
                    EssayVersion.objects.filter(essay=models.OuterRef("pk"))
                    .order_by("-version_number")
                    .values("content")[:1],
                    output_field=models.TextField(),
                ),
            )
            .select_related("university")
            .order_by("-last_edited_at", "-updated_at")
        )

    def perform_create(self, serializer):
        essay_type = serializer.validated_data.get("essay_type", "other")
        title = serializer.validated_data.get("title", "").strip() or _default_title(essay_type)
        essay = serializer.save(student=self.request.user, title=title)
        self.created_initial_version = EssayVersion.objects.create(
            essay=essay,
            version_number=1,
            label="Initial draft",
            content="",
            source="user",
            status="draft",
        )
        Essay.objects.filter(pk=essay.pk).update(updated_at=timezone.now())
        if Essay.objects.filter(student=self.request.user).count() == 1:
            record_product_event("first_essay_started", user=self.request.user, source=essay_type)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        initial_version = getattr(self, "created_initial_version", None)
        if initial_version is not None:
            response.data["initial_version"] = EssayVersionSerializer(initial_version).data
        return response


class EssayDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EssaySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Essay.objects.filter(student=self.request.user)
            .annotate(
                versions_count=models.Count("versions", distinct=True),
                last_edited_at=Coalesce(models.Max("versions__updated_at"), models.F("updated_at")),
                latest_version_content=models.Subquery(
                    EssayVersion.objects.filter(essay=models.OuterRef("pk"))
                    .order_by("-version_number")
                    .values("content")[:1],
                    output_field=models.TextField(),
                ),
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
        source = serializer.validated_data.get("source", "user")
        explicit_status = serializer.validated_data.get("status")
        default_status = "ai_improved" if source == "ai" else "revised"
        serializer.save(
            essay=essay,
            version_number=next_version,
            source=source,
            status=explicit_status or default_status,
        )
        created = serializer.instance
        if created and created.status == "final":
            EssayVersion.objects.filter(essay_id=essay.id, status="final").exclude(id=created.id).update(status="revised")
        Essay.objects.filter(pk=essay.pk).update(updated_at=timezone.now())


class EssayVersionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EssayVersionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EssayVersion.objects.filter(essay__student=self.request.user).select_related("essay")

    def perform_update(self, serializer):
        version: EssayVersion = self.get_object()
        next_status = serializer.validated_data.get("status")
        if next_status == "final":
            EssayVersion.objects.filter(essay_id=version.essay_id, status="final").exclude(id=version.id).update(status="revised")

        version = serializer.save()
        Essay.objects.filter(pk=version.essay_id).update(updated_at=timezone.now())

    def perform_destroy(self, instance):
        versions_count = EssayVersion.objects.filter(essay_id=instance.essay_id).count()
        if versions_count <= 1:
            raise ValidationError({"detail": "At least one version must remain."})

        essay_id = instance.essay_id
        instance.delete()
        Essay.objects.filter(pk=essay_id).update(updated_at=timezone.now())


def _html_to_text(value: str) -> str:
    return (
        value.replace("<br>", "\n")
        .replace("<br/>", "\n")
        .replace("<br />", "\n")
        .replace("</p>", "\n")
    )


def _strip_tags(value: str) -> str:
    return re.sub(r"<[^>]+>", " ", value).replace("\xa0", " ").strip()


def _build_diff_rows(left_text: str, right_text: str):
    left_lines = left_text.splitlines() or [""]
    right_lines = right_text.splitlines() or [""]
    max_len = max(len(left_lines), len(right_lines))
    rows = []
    for idx in range(max_len):
        left = left_lines[idx] if idx < len(left_lines) else ""
        right = right_lines[idx] if idx < len(right_lines) else ""
        if left and right and left == right:
            kind = "same"
        elif not left and right:
            kind = "added"
        elif left and not right:
            kind = "removed"
        else:
            kind = "changed"
        rows.append({"kind": kind, "left": left, "right": right})
    return rows


class EssayCompareView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, essay_id: int):
        essay = generics.get_object_or_404(Essay, pk=essay_id, student=request.user)
        from_version_id = request.query_params.get("from_version")
        to_version_id = request.query_params.get("to_version")
        if not from_version_id or not to_version_id:
            raise ValidationError({"detail": "from_version and to_version are required."})

        left = generics.get_object_or_404(EssayVersion, pk=from_version_id, essay=essay)
        right = generics.get_object_or_404(EssayVersion, pk=to_version_id, essay=essay)

        left_text = _strip_tags(_html_to_text(left.content or ""))
        right_text = _strip_tags(_html_to_text(right.content or ""))
        rows = _build_diff_rows(left_text, right_text)
        return Response(
            {
                "essay_id": essay.id,
                "from_version": {"id": left.id, "version_number": left.version_number, "label": left.label},
                "to_version": {"id": right.id, "version_number": right.version_number, "label": right.label},
                "rows": rows,
            }
        )
