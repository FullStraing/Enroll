from django.urls import path

from .views import (
    AiNextStepView,
    AiDocumentDraftView,
    AiDocumentFeedbackView,
    AiCommonAppDraftView,
)

urlpatterns = [
    path("ai/next-step/", AiNextStepView.as_view(), name="ai_next_step"),
    path("ai/document-draft/", AiDocumentDraftView.as_view(), name="ai_document_draft"),
    path("ai/document-feedback/", AiDocumentFeedbackView.as_view(), name="ai_document_feedback"),
    path("ai/commonapp-draft/", AiCommonAppDraftView.as_view(), name="ai_commonapp_draft"),
]
