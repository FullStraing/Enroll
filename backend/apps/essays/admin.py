from django.contrib import admin

from apps.essays.models import Essay, EssayVersion


@admin.register(Essay)
class EssayAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "essay_type", "student", "university", "updated_at")
    search_fields = ("title", "student__username", "student__email")
    list_filter = ("essay_type", "updated_at")


@admin.register(EssayVersion)
class EssayVersionAdmin(admin.ModelAdmin):
    list_display = ("id", "essay", "version_number", "label", "source", "updated_at")
    search_fields = ("essay__title", "label")
    list_filter = ("source", "updated_at")

