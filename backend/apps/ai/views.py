import json

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AIInteraction


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
