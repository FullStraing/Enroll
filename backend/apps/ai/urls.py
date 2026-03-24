from django.urls import path

from .views import (
    AiNextStepView,
    AiDocumentDraftView,
    AiDocumentFeedbackView,
    AiCommonAppDraftView,
    EssayExplainPromptAiView,
    EssayOutlineAiView,
    EssaySelectionFeedbackAiView,
    EssayStarterDraftAiView,
)

urlpatterns = [
    path("ai/next-step/", AiNextStepView.as_view(), name="ai_next_step"),
    path("ai/document-draft/", AiDocumentDraftView.as_view(), name="ai_document_draft"),
    path("ai/document-feedback/", AiDocumentFeedbackView.as_view(), name="ai_document_feedback"),
    path("ai/commonapp-draft/", AiCommonAppDraftView.as_view(), name="ai_commonapp_draft"),
    path("ai/essays/starter-draft/", EssayStarterDraftAiView.as_view(), name="ai_essay_starter_draft"),
    path("ai/essays/selection-feedback/", EssaySelectionFeedbackAiView.as_view(), name="ai_essay_selection_feedback"),
    path("ai/essays/explain-prompt/", EssayExplainPromptAiView.as_view(), name="ai_essay_explain_prompt"),
    path("ai/essays/outline/", EssayOutlineAiView.as_view(), name="ai_essay_outline"),
]
