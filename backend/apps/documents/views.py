from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Document, DocumentVersion
from .serializers import DocumentSerializer, DocumentVersionSerializer


class DocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user).select_related("application")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DocumentDetailView(generics.RetrieveAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user).select_related("application")


class DocumentVersionListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_document(self, document_id, user):
        return Document.objects.filter(id=document_id, user=user).first()

    def get(self, request, document_id):
        document = self.get_document(document_id, request.user)
        if not document:
            return Response({"detail": "Document not found."}, status=status.HTTP_404_NOT_FOUND)
        versions = document.versions.all()
        serializer = DocumentVersionSerializer(versions, many=True)
        return Response(serializer.data)

    def post(self, request, document_id):
        document = self.get_document(document_id, request.user)
        if not document:
            return Response({"detail": "Document not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = DocumentVersionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        last_version = document.versions.first()
        next_version = 1 if not last_version else last_version.version_number + 1

        version = DocumentVersion.objects.create(
            document=document,
            version_number=next_version,
            content=serializer.validated_data["content"],
            created_by=serializer.validated_data["created_by"],
        )
        output = DocumentVersionSerializer(version)
        return Response(output.data, status=status.HTTP_201_CREATED)
