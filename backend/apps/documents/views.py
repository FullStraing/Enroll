from django.conf import settings
from rest_framework import generics, permissions, parsers

from apps.core.runtime import feature_disabled_response
from .models import Document
from .serializers import DocumentSerializer


class DocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user).select_related(
            "application",
            "application__university",
            "student_university",
            "student_university__university",
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        if not settings.FILE_UPLOADS_ENABLED:
            return feature_disabled_response("Document uploads are temporarily unavailable.")
        return super().create(request, *args, **kwargs)


class DocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user).select_related(
            "application",
            "application__university",
            "student_university",
            "student_university__university",
        )

    def update(self, request, *args, **kwargs):
        if not settings.FILE_UPLOADS_ENABLED and request.data.get("file"):
            return feature_disabled_response("Document uploads are temporarily unavailable.")
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if not settings.FILE_UPLOADS_ENABLED and request.data.get("file"):
            return feature_disabled_response("Document uploads are temporarily unavailable.")
        return super().partial_update(request, *args, **kwargs)
