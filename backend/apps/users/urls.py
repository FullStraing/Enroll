from django.urls import path
from .views import RegisterView, StudentProfileView, ChangePasswordView, CommonAppProgressView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("profile/", StudentProfileView.as_view(), name="profile"),
    path("common-app-progress/", CommonAppProgressView.as_view(), name="common_app_progress"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
]
