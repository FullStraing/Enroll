from django.contrib import admin
from django.urls import path, include

from apps.universities.views import ApplicationsBrowserView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.core.urls")),
    path("applications-ui/", ApplicationsBrowserView.as_view(), name="applications_ui"),
]
