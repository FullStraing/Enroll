from django.conf import settings
from django.core.cache import cache
from django.urls import path, include
from django.http import JsonResponse

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


def ping_view(request):
    cache_status = "disabled"

    try:
        cache.set("__ping__", "ok", timeout=5)
        cache_status = "ok" if cache.get("__ping__") == "ok" else "degraded"
    except Exception:
        cache_status = "error"

    return JsonResponse(
        {
            "status": "ok",
            "cache": {
                "backend": getattr(settings, "CACHE_BACKEND_LABEL", "unknown"),
                "status": cache_status,
            },
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    return JsonResponse({"username": request.user.username})


urlpatterns = [
    path("ping/", ping_view),
    path("me/", me_view),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/", include("apps.users.urls")),
    path("", include("apps.universities.urls")),
    path("", include("apps.tasks.urls")),
    path("", include("apps.documents.urls")),
    path("", include("apps.essays.urls")),
    path("", include("apps.ai.urls")),
]
