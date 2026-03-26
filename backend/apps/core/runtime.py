from django.conf import settings
from rest_framework import status
from rest_framework.response import Response


def runtime_flags():
    return {
        "ai_enabled": bool(getattr(settings, "AI_ENABLED", True)),
        "file_uploads_enabled": bool(getattr(settings, "FILE_UPLOADS_ENABLED", True)),
        "community_posting_enabled": bool(getattr(settings, "COMMUNITY_POSTING_ENABLED", True)),
        "registration_enabled": bool(getattr(settings, "REGISTRATION_ENABLED", True)),
        "google_auth_enabled": bool(getattr(settings, "GOOGLE_AUTH_ENABLED", True)),
        "maintenance_mode": bool(getattr(settings, "MAINTENANCE_MODE", False)),
    }


def file_uploads_runtime():
    return {
        "enabled": bool(getattr(settings, "FILE_UPLOADS_ENABLED", True)),
        "reason": getattr(settings, "FILE_UPLOADS_DISABLED_REASON", ""),
    }


def feature_disabled_response(detail: str, status_code: int = status.HTTP_503_SERVICE_UNAVAILABLE):
    return Response({"detail": detail, "feature_disabled": True}, status=status_code)
