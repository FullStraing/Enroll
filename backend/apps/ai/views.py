import json
import re
from html import unescape

from django.conf import settings
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.essays.models import Essay, EssayVersion
from .models import AIInteraction
from .serializers import (
    EssayExplainPromptRequestSerializer,
    EssayOutlineRequestSerializer,
    EssaySelectionFeedbackRequestSerializer,
    EssayStarterDraftRequestSerializer,
)
from .services import AiProviderError, generate_outline, generate_prompt_explanation, generate_selection_feedback, generate_starter_draft


def log_interaction(user, payload, response_data):
    AIInteraction.objects.create(
        user=user,
        context_type=str(payload.get("context_type", "")),
        context_id=str(payload.get("context_id", "")),
        prompt=json.dumps(payload, ensure_ascii=False),
        response=json.dumps(response_data, ensure_ascii=False),
    )


class AiStubView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    response_type = "generic"

    def post(self, request):
        payload = request.data if isinstance(request.data, dict) else {}
        response_data = {
            "type": self.response_type,
            "message": "AI stub response (no provider connected yet).",
            "input": payload,
        }
        log_interaction(request.user, payload, response_data)
        return Response(response_data, status=status.HTTP_200_OK)


class AiNextStepView(AiStubView):
    response_type = "next_step"


class AiDocumentDraftView(AiStubView):
    response_type = "document_draft"


class AiDocumentFeedbackView(AiStubView):
    response_type = "document_feedback"


class AiCommonAppDraftView(AiStubView):
    response_type = "commonapp_draft"


def _latest_essay_version(essay: Essay) -> EssayVersion | None:
    return EssayVersion.objects.filter(essay=essay).order_by("-version_number").first()


def _get_user_essay(user, essay_id: int) -> Essay:
    try:
        return Essay.objects.select_related("university").get(id=essay_id, student=user)
    except Essay.DoesNotExist as error:
        raise ValidationError({"essay_id": "Essay not found."}) from error


def _enforce_daily_limit(*, user, context_type: str, limit: int):
    count = AIInteraction.objects.filter(
        user=user,
        context_type=context_type,
        created_at__date=timezone.now().date(),
    ).count()
    if count >= limit:
        raise ValidationError({"detail": "Daily AI limit reached for this action. Try again tomorrow."})


def _essay_context(essay: Essay, latest: EssayVersion | None):
    current_draft = latest.content if latest else ""
    current_draft = re.sub(r"<br\s*/?>", "\n", current_draft, flags=re.IGNORECASE)
    current_draft = re.sub(r"</p>", "\n", current_draft, flags=re.IGNORECASE)
    current_draft = re.sub(r"<[^>]+>", " ", current_draft)
    current_draft = unescape(current_draft).replace("\u00a0", " ")
    current_draft = re.sub(r"\n{3,}", "\n\n", current_draft).strip()
    return {
        "essay_id": essay.id,
        "essay_type": essay.essay_type,
        "title": essay.title,
        "prompt_title": essay.prompt_title,
        "prompt_text": essay.prompt_text,
        "target_word_count": essay.target_word_count,
        "university_name": essay.university.name if essay.university else "",
        "current_draft": current_draft,
    }


def _ai_error_payload(error: AiProviderError):
    return {
        "ok": False,
        "error_type": error.error_type,
        "message": str(error),
        "provider": error.provider or settings.AI_PROVIDER,
        "model": error.model,
        "latency_ms": error.latency_ms,
    }


def _create_ai_version(*, essay: Essay, content: str, label: str):
    latest = _latest_essay_version(essay)
    next_version = (latest.version_number if latest else 0) + 1
    version = EssayVersion.objects.create(
        essay=essay,
        version_number=next_version,
        label=label,
        content=content,
        source="ai",
        status="ai_improved",
    )
    Essay.objects.filter(pk=essay.pk).update(updated_at=timezone.now())
    return version


class EssayStarterDraftAiView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = EssayStarterDraftRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        essay = _get_user_essay(request.user, serializer.validated_data["essay_id"])
        _enforce_daily_limit(
            user=request.user,
            context_type="essay_starter_draft",
            limit=settings.AI_ESSAY_STARTER_DRAFT_DAILY_LIMIT,
        )
        latest = _latest_essay_version(essay)
        payload = {
            **_essay_context(essay, latest),
            "generation_mode": serializer.validated_data["generation_mode"],
            "tone": serializer.validated_data["tone"],
            "focus": serializer.validated_data["focus"],
            "revision_goal": serializer.validated_data["revision_goal"],
            "context_note": serializer.validated_data["context_note"],
        }

        try:
            result, meta = generate_starter_draft(context=payload)
        except AiProviderError as error:
            response_data = _ai_error_payload(error)
            log_interaction(request.user, {"context_type": "essay_starter_draft", "context_id": str(essay.id), **payload}, response_data)
            raise ValidationError({"detail": str(error)})

        version = _create_ai_version(essay=essay, content=result["draft_content"], label="AI starter draft")
        response_data = {
            **result,
            "version": {
                "id": version.id,
                "essay": version.essay_id,
                "version_number": version.version_number,
                "label": version.label,
                "content": version.content,
                "source": version.source,
                "status": version.status,
                "is_latest": True,
                "created_at": version.created_at.isoformat(),
                "updated_at": version.updated_at.isoformat(),
            },
            **meta,
        }
        log_interaction(request.user, {"context_type": "essay_starter_draft", "context_id": str(essay.id), **payload}, response_data)
        return Response(response_data, status=status.HTTP_200_OK)


class EssaySelectionFeedbackAiView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = EssaySelectionFeedbackRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        essay = _get_user_essay(request.user, serializer.validated_data["essay_id"])
        _enforce_daily_limit(
            user=request.user,
            context_type="essay_selection_feedback",
            limit=settings.AI_ESSAY_SELECTION_FEEDBACK_DAILY_LIMIT,
        )
        latest = _latest_essay_version(essay)
        payload = {
            **_essay_context(essay, latest),
            "selected_text": serializer.validated_data["selected_text"],
            "selection_start": serializer.validated_data["selection_start"],
            "selection_end": serializer.validated_data["selection_end"],
            "action": serializer.validated_data["action"],
        }

        try:
            result, meta = generate_selection_feedback(context=payload)
        except AiProviderError as error:
            response_data = _ai_error_payload(error)
            log_interaction(request.user, {"context_type": "essay_selection_feedback", "context_id": str(essay.id), **payload}, response_data)
            raise ValidationError({"detail": str(error)})

        response_data = {
            **result,
            "action": serializer.validated_data["action"],
            "selection_start": serializer.validated_data["selection_start"],
            "selection_end": serializer.validated_data["selection_end"],
            **meta,
        }
        log_interaction(request.user, {"context_type": "essay_selection_feedback", "context_id": str(essay.id), **payload}, response_data)
        return Response(response_data, status=status.HTTP_200_OK)


class EssayExplainPromptAiView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = EssayExplainPromptRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        essay = _get_user_essay(request.user, serializer.validated_data["essay_id"])
        _enforce_daily_limit(
            user=request.user,
            context_type="essay_explain_prompt",
            limit=settings.AI_ESSAY_EXPLAIN_PROMPT_DAILY_LIMIT,
        )
        latest = _latest_essay_version(essay)
        payload = _essay_context(essay, latest)

        try:
            result, meta = generate_prompt_explanation(context=payload)
        except AiProviderError as error:
            response_data = _ai_error_payload(error)
            log_interaction(request.user, {"context_type": "essay_explain_prompt", "context_id": str(essay.id), **payload}, response_data)
            raise ValidationError({"detail": str(error)})

        response_data = {**result, **meta}
        log_interaction(request.user, {"context_type": "essay_explain_prompt", "context_id": str(essay.id), **payload}, response_data)
        return Response(response_data, status=status.HTTP_200_OK)


class EssayOutlineAiView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = EssayOutlineRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        essay = _get_user_essay(request.user, serializer.validated_data["essay_id"])
        _enforce_daily_limit(
            user=request.user,
            context_type="essay_outline",
            limit=settings.AI_ESSAY_OUTLINE_DAILY_LIMIT,
        )
        latest = _latest_essay_version(essay)
        payload = _essay_context(essay, latest)

        try:
            result, meta = generate_outline(context=payload)
        except AiProviderError as error:
            response_data = _ai_error_payload(error)
            log_interaction(request.user, {"context_type": "essay_outline", "context_id": str(essay.id), **payload}, response_data)
            raise ValidationError({"detail": str(error)})

        response_data = {**result, **meta}
        log_interaction(request.user, {"context_type": "essay_outline", "context_id": str(essay.id), **payload}, response_data)
        return Response(response_data, status=status.HTTP_200_OK)
