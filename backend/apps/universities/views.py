import re
import unicodedata
from difflib import SequenceMatcher

from django.http import Http404
from django.db import models
from django.db.models import Max
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

CYRILLIC_TO_LATIN = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e", "ж": "zh", "з": "z",
    "и": "i", "й": "y", "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r",
    "с": "s", "т": "t", "у": "u", "ф": "f", "х": "h", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sch",
    "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
}

RU_TO_EN_LAYOUT = str.maketrans(
    "йцукенгшщзхъфывапролджэячсмитьбю",
    "qwertyuiop[]asdfghjkl;'zxcvbnm,.",
)
EN_TO_RU_LAYOUT = str.maketrans(
    "qwertyuiop[]asdfghjkl;'zxcvbnm,.",
    "йцукенгшщзхъфывапролджэячсмитьбю",
)


def _normalize_search_text(value: str) -> str:
    lowered = value.lower().strip()
    ascii_folded = unicodedata.normalize("NFKD", lowered).encode("ascii", "ignore").decode("ascii")
    cleaned = re.sub(r"[^a-z0-9\s]+", " ", ascii_folded)
    return re.sub(r"\s+", " ", cleaned).strip()


def _transliterate_cyrillic(value: str) -> str:
    return "".join(CYRILLIC_TO_LATIN.get(char, char) for char in value.lower())


def _build_search_variants(value: str) -> set[str]:
    raw = value.strip()
    if not raw:
        return set()

    candidates = {
        raw,
        raw.translate(RU_TO_EN_LAYOUT),
        raw.translate(EN_TO_RU_LAYOUT),
        _transliterate_cyrillic(raw),
        _transliterate_cyrillic(raw.translate(EN_TO_RU_LAYOUT)),
    }

    return {normalized for normalized in (_normalize_search_text(item) for item in candidates) if normalized}


def _candidate_matches_query(query_variants: set[str], candidate_text: str) -> bool:
    candidate_variants = _build_search_variants(candidate_text)
    if not candidate_variants:
        return False

    for query in query_variants:
        for candidate in candidate_variants:
            if query in candidate:
                return True
            if len(query) >= 4:
                candidate_tokens = candidate.split()
                if any(SequenceMatcher(None, query, token).ratio() >= 0.82 for token in candidate_tokens):
                    return True
    return False


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
        selectivity = (self.request.query_params.get("selectivity") or "").strip().lower()
        acceptance_min = self.request.query_params.get("acceptance_min")
        acceptance_max = self.request.query_params.get("acceptance_max")
        avg_sat_min = self.request.query_params.get("avg_sat_min")
        avg_sat_max = self.request.query_params.get("avg_sat_max")
        avg_act_min = self.request.query_params.get("avg_act_min")
        avg_act_max = self.request.query_params.get("avg_act_max")
        avg_gpa_min = self.request.query_params.get("avg_gpa_min")
        avg_gpa_max = self.request.query_params.get("avg_gpa_max")
        net_price_min = self.request.query_params.get("net_price_min")
        net_price_max = self.request.query_params.get("net_price_max")
        tuition_min = self.request.query_params.get("tuition_min")
        tuition_max = self.request.query_params.get("tuition_max")
        housing_min = self.request.query_params.get("housing_min")
        housing_max = self.request.query_params.get("housing_max")

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

        if selectivity in {"high", "medium", "low"}:
            qs = qs.filter(selectivity=selectivity)

        if query:
            query_variants = _build_search_variants(query)
            matching_ids = []
            for row in qs.values("id", "name", "city", "state", "country"):
                candidate_text = " ".join(
                    part.strip()
                    for part in [row.get("name"), row.get("city"), row.get("state"), row.get("country")]
                    if isinstance(part, str) and part.strip()
                )
                if _candidate_matches_query(query_variants, candidate_text):
                    matching_ids.append(row["id"])
            qs = qs.filter(id__in=matching_ids)

        metric_keys_to_annotate = set()
        if avg_sat_min or avg_sat_max:
            metric_keys_to_annotate.add("avg_sat")
        if avg_act_min or avg_act_max:
            metric_keys_to_annotate.add("avg_act")
        if avg_gpa_min or avg_gpa_max:
            metric_keys_to_annotate.add("avg_gpa")
        if net_price_min or net_price_max:
            metric_keys_to_annotate.update(["net_price", "net_price_in_state", "net_price_out_state"])
        if housing_min or housing_max:
            metric_keys_to_annotate.add("housing_cost")
        if tuition_min or tuition_max:
            metric_keys_to_annotate.update(["tuition_in_state", "tuition_out_state"])

        metric_annotations = {}
        for key in metric_keys_to_annotate:
            metric_annotations[f"{key}_value"] = models.Subquery(
                UniversityMetric.objects.filter(university=models.OuterRef("pk"), key=key)
                .order_by("-updated_at")
                .values("value_number")[:1],
                output_field=models.FloatField(),
            )
        if metric_annotations:
            qs = qs.annotate(**metric_annotations)

        def _to_float(raw):
            if raw in (None, ""):
                return None
            try:
                return float(raw)
            except (TypeError, ValueError):
                return None

        acceptance_min_value = _to_float(acceptance_min)
        acceptance_max_value = _to_float(acceptance_max)
        avg_sat_min_value = _to_float(avg_sat_min)
        avg_sat_max_value = _to_float(avg_sat_max)
        avg_act_min_value = _to_float(avg_act_min)
        avg_act_max_value = _to_float(avg_act_max)
        avg_gpa_min_value = _to_float(avg_gpa_min)
        avg_gpa_max_value = _to_float(avg_gpa_max)
        net_price_min_value = _to_float(net_price_min)
        net_price_max_value = _to_float(net_price_max)
        tuition_min_value = _to_float(tuition_min)
        tuition_max_value = _to_float(tuition_max)
        housing_min_value = _to_float(housing_min)
        housing_max_value = _to_float(housing_max)

        if acceptance_min_value is not None:
            qs = qs.filter(acceptance_rate__gte=acceptance_min_value)
        if acceptance_max_value is not None:
            qs = qs.filter(acceptance_rate__lte=acceptance_max_value)

        if avg_sat_min_value is not None:
            qs = qs.filter(avg_sat_value__gte=avg_sat_min_value)
        if avg_sat_max_value is not None:
            qs = qs.filter(avg_sat_value__lte=avg_sat_max_value)

        if avg_act_min_value is not None:
            qs = qs.filter(avg_act_value__gte=avg_act_min_value)
        if avg_act_max_value is not None:
            qs = qs.filter(avg_act_value__lte=avg_act_max_value)

        if avg_gpa_min_value is not None:
            qs = qs.filter(avg_gpa_value__gte=avg_gpa_min_value)
        if avg_gpa_max_value is not None:
            qs = qs.filter(avg_gpa_value__lte=avg_gpa_max_value)

        if net_price_min_value is not None or net_price_max_value is not None:
            qs = qs.annotate(
                net_price_filter=models.functions.Coalesce(
                    "net_price_value",
                    "net_price_out_state_value",
                    "net_price_in_state_value",
                )
            )
            if net_price_min_value is not None:
                qs = qs.filter(net_price_filter__gte=net_price_min_value)
            if net_price_max_value is not None:
                qs = qs.filter(net_price_filter__lte=net_price_max_value)

        if tuition_min_value is not None or tuition_max_value is not None:
            qs = qs.annotate(
                tuition_filter=models.functions.Coalesce("tuition_out_state_value", "tuition_in_state_value")
            )
            if tuition_min_value is not None:
                qs = qs.filter(tuition_filter__gte=tuition_min_value)
            if tuition_max_value is not None:
                qs = qs.filter(tuition_filter__lte=tuition_max_value)

        if housing_min_value is not None:
            qs = qs.filter(housing_cost_value__gte=housing_min_value)
        if housing_max_value is not None:
            qs = qs.filter(housing_cost_value__lte=housing_max_value)

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
        return (
            StudentUniversity.objects.filter(student=self.request.user)
            .select_related("university")
            .prefetch_related("university__metrics")
            .order_by("sort_order", "id")
        )

    def perform_create(self, serializer):
        next_order = (
            StudentUniversity.objects.filter(student=self.request.user).aggregate(max_order=Max("sort_order"))["max_order"] or 0
        ) + 1
        serializer.save(student=self.request.user, sort_order=next_order)


class StudentUniversityDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudentUniversitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StudentUniversity.objects.filter(student=self.request.user).select_related("university").prefetch_related("university__metrics")


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
