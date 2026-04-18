from django.urls import path

from .views import (
    ChangePasswordView,
    CommonAppProgressView,
    GoogleAuthView,
    RegisterResendCodeView,
    RegisterStartView,
    RegisterVerifyView,
    StudentProfileView,
)

urlpatterns = [
    path("register/", RegisterStartView.as_view(), name="register"),
    path("register/start/", RegisterStartView.as_view(), name="register_start"),
    path("register/verify/", RegisterVerifyView.as_view(), name="register_verify"),
    path("register/resend-code/", RegisterResendCodeView.as_view(), name="register_resend_code"),
    path("google/", GoogleAuthView.as_view(), name="google_auth"),
    path("profile/", StudentProfileView.as_view(), name="profile"),
    path("common-app-progress/", CommonAppProgressView.as_view(), name="common_app_progress"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
]
