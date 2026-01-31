from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

from apps.universities.views import ApplicationsBrowserView

from apps.universities.views import ApplicationsBrowserView

urlpatterns = [
    path("app/", TemplateView.as_view(template_name="frontend.html"), name="frontend"),
    path("admin/", admin.site.urls),
    path("api/", include("apps.core.urls")),
    path("applications-ui/", ApplicationsBrowserView.as_view(), name="applications_ui"),
]
