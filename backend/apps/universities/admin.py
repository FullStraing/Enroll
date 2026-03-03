from django.contrib import admin
from .models import (
    Application,
    ScrapeRun,
    ScrapeRunItem,
    StudentUniversity,
    University,
    UniversityMediaRef,
    UniversityDeadline,
    UniversityMetric,
    UniversitySourceSection,
    UniversitySourceSnapshot,
)


@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    list_display = ("name", "source_provider", "external_id", "country", "state", "selectivity", "last_ingested_at")
    list_filter = ("country", "selectivity", "source_provider", "is_active")
    search_fields = ("name", "city", "state", "external_id")


@admin.register(StudentUniversity)
class StudentUniversityAdmin(admin.ModelAdmin):
    list_display = ("student", "university", "category", "status", "progress_percent")
    list_filter = ("category", "status")
    search_fields = ("student__username", "university__name")


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("student", "university", "status", "deadline_date", "updated_at")
    list_filter = ("status",)
    search_fields = ("student__username", "university__name", "university_name")


@admin.register(UniversitySourceSnapshot)
class UniversitySourceSnapshotAdmin(admin.ModelAdmin):
    list_display = ("university", "source", "status", "parser_version", "fetched_at")
    list_filter = ("source", "status")
    search_fields = ("university__name", "root_url")


@admin.register(UniversitySourceSection)
class UniversitySourceSectionAdmin(admin.ModelAdmin):
    list_display = ("snapshot", "section_key", "status")
    list_filter = ("section_key", "status")
    search_fields = ("snapshot__university__name", "url")


@admin.register(UniversityMetric)
class UniversityMetricAdmin(admin.ModelAdmin):
    list_display = ("university", "key", "unit", "updated_at")
    list_filter = ("unit", "section_key")
    search_fields = ("university__name", "key")


@admin.register(UniversityMediaRef)
class UniversityMediaRefAdmin(admin.ModelAdmin):
    list_display = ("university", "section_key", "media_type", "media_url")
    list_filter = ("media_type", "section_key")
    search_fields = ("university__name", "media_url")


@admin.register(UniversityDeadline)
class UniversityDeadlineAdmin(admin.ModelAdmin):
    list_display = ("university", "deadline_type", "term", "deadline_date", "is_rolling", "confidence", "last_verified_at")
    list_filter = ("deadline_type", "term", "is_rolling")
    search_fields = ("university__name", "deadline_text", "source_url")


@admin.register(ScrapeRun)
class ScrapeRunAdmin(admin.ModelAdmin):
    list_display = ("id", "source", "status", "targets_total", "targets_ok", "targets_failed", "started_at")
    list_filter = ("source", "status")


@admin.register(ScrapeRunItem)
class ScrapeRunItemAdmin(admin.ModelAdmin):
    list_display = ("run", "university", "status", "retries", "duration_ms", "fetched_at")
    list_filter = ("status",)
    search_fields = ("university__name", "source_url")
