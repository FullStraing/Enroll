from django.http import Http404
from django.db import models
from rest_framework import generics, permissions
from rest_framework.pagination import PageNumberPagination
from .models import Application, StudentUniversity, University, UniversityDeadline, UniversityMetric, UniversitySourceSnapshot
from .serializers import (
    UniversitySerializer,
    StudentUniversitySerializer,
    ApplicationSerializer,
    UniversityDeadlineSerializer,
    UniversityMetricSerializer,
    UniversitySourceSnapshotSerializer,
)


class UniversityListView(generics.ListAPIView):
    class UniversityPagination(PageNumberPagination):
        page_size = 5
        page_size_query_param = "page_size"
        max_page_size = 100

    serializer_class = UniversitySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = UniversityPagination

    def get_queryset(self):
        query = (self.request.query_params.get("q") or "").strip()
        core_keys = [
            "acceptance_rate",
            "avg_sat",
            "avg_act",
            "avg_gpa",
            "tuition_in_state",
            "tuition_out_state",
            "net_price_in_state",
            "net_price_out_state",
            "housing_cost",
        ]
        qs = University.objects.filter(is_active=True)
        if query:
            qs = qs.filter(
                models.Q(name__icontains=query)
                | models.Q(city__icontains=query)
                | models.Q(state__icontains=query)
                | models.Q(country__icontains=query)
            )

        return (
            qs
            .annotate(
                core_metrics_count=models.Count(
                    "metrics",
                    filter=models.Q(metrics__key__in=core_keys),
                    distinct=True,
                ),
                deadlines_count_ann=models.Count("deadlines", distinct=True),
                factors_count=models.Count(
                    "metrics",
                    filter=models.Q(metrics__key__startswith="factor_"),
                    distinct=True,
                ),
                diversity_count=models.Count(
                    "metrics",
                    filter=models.Q(metrics__key__startswith="diversity_"),
                    distinct=True,
                ),
            )
            .annotate(
                completeness_bucket=models.Case(
                    models.When(
                        core_metrics_count__gte=7,
                        deadlines_count_ann__gt=0,
                        factors_count__gt=0,
                        diversity_count__gt=0,
                        then=models.Value(2),
                    ),
                    models.When(
                        core_metrics_count__gte=4,
                        deadlines_count_ann__gt=0,
                        then=models.Value(1),
                    ),
                    default=models.Value(0),
                    output_field=models.IntegerField(),
                )
            )
            .prefetch_related("metrics", "source_snapshots", "deadlines")
            .order_by("-completeness_bucket", "-core_metrics_count", "name")
        )


class UniversityDetailView(generics.RetrieveAPIView):
    queryset = University.objects.all()
    serializer_class = UniversitySerializer
    permission_classes = [permissions.IsAuthenticated]


class StudentUniversityListCreateView(generics.ListCreateAPIView):
    serializer_class = StudentUniversitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StudentUniversity.objects.filter(student=self.request.user).select_related("university").order_by("-updated_at")

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)


class StudentUniversityDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudentUniversitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StudentUniversity.objects.filter(student=self.request.user).select_related("university")


class ApplicationListCreateView(generics.ListCreateAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Application.objects.filter(student=self.request.user).select_related("university").order_by("-updated_at")

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)


class ApplicationDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Application.objects.filter(student=self.request.user).select_related("university")


class UniversityLatestSnapshotView(generics.RetrieveAPIView):
    serializer_class = UniversitySourceSnapshotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        university = generics.get_object_or_404(University, pk=self.kwargs["pk"])
        source = (self.request.query_params.get("source") or "").strip().lower()
        base_qs = UniversitySourceSnapshot.objects.filter(university=university)

        if source:
            snapshot = base_qs.filter(source=source).order_by("-fetched_at").first()
        else:
            # Default behavior: prefer GradGPT profile snapshot for UI-rich blocks
            # (important factors/diversity), then fallback to latest available snapshot.
            snapshot = base_qs.filter(source="gradgpt").order_by("-fetched_at").first()
            if not snapshot:
                snapshot = base_qs.order_by("-fetched_at").first()

        if not snapshot:
            raise Http404("Snapshot not found.")
        return snapshot


class UniversityMetricsView(generics.ListAPIView):
    serializer_class = UniversityMetricSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        university = generics.get_object_or_404(University, pk=self.kwargs["pk"])
        return UniversityMetric.objects.filter(university=university).order_by("key")


class UniversityDeadlinesView(generics.ListAPIView):
    serializer_class = UniversityDeadlineSerializer
    permission_classes = [permissions.IsAuthenticated]

    TYPE_ORDER = ["RD", "EA", "ED1", "ED2", "REA", "PRIORITY", "TRANSFER_FALL", "TRANSFER_SPRING", "ROLLING", "OTHER"]

    def get_queryset(self):
        university = generics.get_object_or_404(University, pk=self.kwargs["pk"])
        qs = UniversityDeadline.objects.filter(university=university)
        order = models.Case(
            *[models.When(deadline_type=value, then=models.Value(idx)) for idx, value in enumerate(self.TYPE_ORDER)],
            default=models.Value(999),
            output_field=models.IntegerField(),
        )
        return qs.order_by(order, "deadline_date", "-confidence")
