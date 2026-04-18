from django.urls import path

from .views import (
    ChangePasswordView,
    CommonAppProgressView,
    GoogleAuthView,
    RegisterView,
    StudentProfileView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("google/", GoogleAuthView.as_view(), name="google_auth"),
    path("profile/", StudentProfileView.as_view(), name="profile"),
    path("common-app-progress/", CommonAppProgressView.as_view(), name="common_app_progress"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
]
