from rest_framework import serializers
from .models import (
    Application,
    StudentUniversity,
    University,
    UniversityDeadline,
    UniversityMetric,
    UniversitySourceSnapshot,
)


class UniversitySerializer(serializers.ModelSerializer):
    last_scraped_at = serializers.DateTimeField(read_only=True)
    data_freshness_days = serializers.IntegerField(read_only=True)
    net_price = serializers.SerializerMethodField()
    tuition_out_state = serializers.SerializerMethodField()
    tuition_in_state = serializers.SerializerMethodField()
    room_and_board = serializers.SerializerMethodField()
    housing_cost = serializers.SerializerMethodField()
    aid_package = serializers.SerializerMethodField()
    deadlines_count = serializers.IntegerField(read_only=True)
    has_deadlines = serializers.BooleanField(read_only=True)
    deadline_freshness_days = serializers.IntegerField(read_only=True)

    class Meta:
        model = University
        fields = [
            "id",
            "name",
            "country",
            "city",
            "state",
            "selectivity",
            "website_url",
            "main_deadline",
            "min_profile_score",
            "avg_profile_score",
            "acceptance_rate",
            "sat_range",
            "act_range",
            "source",
            "source_provider",
            "external_id",
            "source_url",
            "is_active",
            "last_ingested_at",
            "last_scraped_at",
            "data_freshness_days",
            "net_price",
            "tuition_out_state",
            "tuition_in_state",
            "room_and_board",
            "housing_cost",
            "aid_package",
            "deadlines_count",
            "has_deadlines",
            "deadline_freshness_days",
        ]

    def _metric_value(self, obj, key):
        prefetched = getattr(obj, "_prefetched_objects_cache", {})
        metrics = prefetched.get("metrics")
        if metrics is None:
            metric = obj.metrics.filter(key=key).first()
            if not metric:
                return None
            return metric.value_number if metric.value_number is not None else metric.value_text or metric.value_json

        for metric in metrics:
            if metric.key == key:
                return metric.value_number if metric.value_number is not None else metric.value_text or metric.value_json
        return None

    def get_net_price(self, obj):
        return self._metric_value(obj, "net_price")

    def get_room_and_board(self, obj):
        return self._metric_value(obj, "room_and_board")

    def get_tuition_out_state(self, obj):
        return self._metric_value(obj, "tuition_out_state")

    def get_tuition_in_state(self, obj):
        return self._metric_value(obj, "tuition_in_state")

    def get_housing_cost(self, obj):
        return self._metric_value(obj, "housing_cost")

    def get_aid_package(self, obj):
        # Prefer international aid package, then freshman, then generic average package.
        prefetched = getattr(obj, "_prefetched_objects_cache", {})
        metrics = prefetched.get("metrics")
        if metrics is None:
            metric = obj.metrics.filter(key="financial_aid_items").first()
            if not metric or not isinstance(metric.value_json, list):
                return None
            rows = metric.value_json
        else:
            rows = None
            for metric in metrics:
                if metric.key == "financial_aid_items" and isinstance(metric.value_json, list):
                    rows = metric.value_json
                    break
            if rows is None:
                return None

        labels_priority = [
            "avg. international student financial aid package",
            "avg. freshman financial aid package",
            "avg. financial aid package",
        ]

        for target in labels_priority:
            for row in rows:
                label = str(row.get("label", "")).strip().lower()
                value = str(row.get("value", "")).strip()
                if target not in label:
                    continue
                normalized = value.replace("$", "").replace(",", "").strip()
                try:
                    return float(normalized)
                except (TypeError, ValueError):
                    continue
        return None


class UniversityMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = UniversityMetric
        fields = [
            "key",
            "value_number",
            "value_text",
            "value_json",
            "unit",
            "source_url",
            "section_key",
            "confidence",
            "updated_at",
        ]


class UniversityDeadlineSerializer(serializers.ModelSerializer):
    class Meta:
        model = UniversityDeadline
        fields = [
            "id",
            "deadline_type",
            "term",
            "deadline_date",
            "deadline_text",
            "notification_date",
            "notification_text",
            "is_rolling",
            "source_url",
            "source_label",
            "confidence",
            "last_verified_at",
        ]


class UniversitySourceSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = UniversitySourceSnapshot
        fields = [
            "id",
            "source",
            "root_url",
            "fetched_at",
            "status",
            "parser_version",
            "raw_payload",
            "error_summary",
        ]


class StudentUniversitySerializer(serializers.ModelSerializer):
    university = UniversitySerializer(read_only=True)
    university_id = serializers.PrimaryKeyRelatedField(
        queryset=University.objects.all(),
        source="university",
        write_only=True,
    )
    progress_percent = serializers.IntegerField(read_only=True)

    class Meta:
        model = StudentUniversity
        fields = [
            "id",
            "university",
            "university_id",
            "category",
            "status",
            "tests_done",
            "essays_done",
            "recommendations_done",
            "application_form_done",
            "application_fee_paid",
            "deadline_override",
            "notes",
            "progress_percent",
        ]


class ApplicationSerializer(serializers.ModelSerializer):
    university = UniversitySerializer(read_only=True)
    university_id = serializers.PrimaryKeyRelatedField(
        queryset=University.objects.all(),
        source="university",
        write_only=True,
        required=False,
        allow_null=False,
    )

    class Meta:
        model = Application
        fields = [
            "id",
            "university",
            "university_id",
            "university_name",
            "deadline_date",
            "status",
        ]
        read_only_fields = ["university_name"]

    def validate(self, attrs):
        university = attrs.get("university", getattr(self.instance, "university", None))
        if not university and self.instance is None:
            raise serializers.ValidationError("Provide university_id.")
        request = self.context.get("request")
        if (
            university
            and request
            and request.user
            and request.user.is_authenticated
            and not StudentUniversity.objects.filter(
                student=request.user,
                university=university,
            ).exists()
        ):
            raise serializers.ValidationError("Select university from My Universities.")
        return attrs
