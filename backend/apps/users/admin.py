from django.contrib import admin
from .models import StudentProfile


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "full_name", "gpa", "ielts_overall", "sat_total", "activities_level")
    search_fields = ("user__username", "full_name", "school_name")
