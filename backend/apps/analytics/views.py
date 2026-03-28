from django.contrib.auth import get_user_model
from django.db.models import Count
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import ProductEvent
from .serializers import ProductEventWriteSerializer
from .services import record_product_event

User = get_user_model()


class ProductEventTrackView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "analytics_track"

    def post(self, request):
        serializer = ProductEventWriteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        _, created = record_product_event(
            payload["name"],
            user=request.user if request.user.is_authenticated else None,
            client_id=payload.get("client_id", ""),
            source=payload.get("source", ""),
            metadata=payload.get("metadata", {}),
        )
        return Response({"recorded": created}, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class ProductAnalyticsSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        event_counts = {
            row["name"]: row["count"]
            for row in ProductEvent.objects.values("name").annotate(count=Count("id"))
        }
        unique_user_counts = {
            row["name"]: row["count"]
            for row in ProductEvent.objects.exclude(user_id__isnull=True).values("name").annotate(count=Count("user", distinct=True))
        }
        recent_events = list(
            ProductEvent.objects.select_related("user").order_by("-created_at", "-id")[:20].values(
                "name",
                "source",
                "client_id",
                "created_at",
                "user__username",
                "user__email",
            )
        )

        return Response(
            {
                "totals": {
                    "registered_users": User.objects.count(),
                    "signup_started": event_counts.get("signup_started", 0),
                    "signup_completed": unique_user_counts.get("signup_completed", 0),
                    "onboarding_completed": unique_user_counts.get("onboarding_completed", 0),
                    "first_task_created": unique_user_counts.get("first_task_created", 0),
                    "first_university_added": unique_user_counts.get("first_university_added", 0),
                    "first_essay_started": unique_user_counts.get("first_essay_started", 0),
                },
                "recent_events": recent_events,
            }
        )
