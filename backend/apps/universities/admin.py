from django.contrib import admin
from .models import University, StudentUniversity


@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    list_display = ("name", "country", "city", "state", "selectivity")
    list_filter = ("country", "selectivity")
    search_fields = ("name", "city", "state")


@admin.register(StudentUniversity)
class StudentUniversityAdmin(admin.ModelAdmin):
    list_display = ("student", "university", "category", "status", "progress_percent")
    list_filter = ("category", "status")
    search_fields = ("student__username", "university__name")
