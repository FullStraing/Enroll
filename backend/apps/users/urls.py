from django.urls import path
from .views import RegisterView, StudentProfileView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("profile/", StudentProfileView.as_view(), name="profile"),
]
