from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

from apps.universities.views import ApplicationsBrowserView

urlpatterns = [
    path("", TemplateView.as_view(template_name="landing.html"), name="landing"),
    path("register", TemplateView.as_view(template_name="auth/register.html"), name="register"),
    path("login", TemplateView.as_view(template_name="auth/login.html"), name="login"),
    path("app/", TemplateView.as_view(template_name="frontend.html"), name="frontend"),
    path("dashboard/", TemplateView.as_view(template_name="ui/dashboard.html"), name="dashboard"),
    path("onboarding/", TemplateView.as_view(template_name="ui/onboarding.html"), name="onboarding"),
    path("applications/", TemplateView.as_view(template_name="ui/applications.html"), name="applications"),
    path("tasks/", TemplateView.as_view(template_name="ui/tasks.html"), name="tasks"),
    path("documents/", TemplateView.as_view(template_name="ui/documents.html"), name="documents"),
    path("common-app/", TemplateView.as_view(template_name="ui/common_app.html"), name="common_app"),
    path("settings/", TemplateView.as_view(template_name="ui/settings.html"), name="settings"),
    path("admin/", admin.site.urls),
    path("api/", include("apps.core.urls")),
    path("applications-ui/", ApplicationsBrowserView.as_view(), name="applications_ui"),
]
