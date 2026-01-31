from django.urls import path

from .views import DocumentListCreateView, DocumentDetailView, DocumentVersionListCreateView

urlpatterns = [
    path("documents/", DocumentListCreateView.as_view(), name="documents_list_create"),
    path("documents/<int:pk>/", DocumentDetailView.as_view(), name="documents_detail"),
    path(
        "documents/<int:document_id>/versions/",
        DocumentVersionListCreateView.as_view(),
        name="documents_versions",
    ),
]
