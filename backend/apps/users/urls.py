from django.urls import path
from .views import RegisterView, StudentProfileView, ChangePasswordView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("profile/", StudentProfileView.as_view(), name="profile"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
]
