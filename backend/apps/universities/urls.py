from django.urls import path
from .views import (
    UniversityListView,
    UniversityDetailView,
    StudentUniversityListCreateView,
    StudentUniversityDetailView,
)

urlpatterns = [
    path("universities/", UniversityListView.as_view(), name="universities_list"),
    path("universities/<int:pk>/", UniversityDetailView.as_view(), name="universities_detail"),
    path("my-universities/", StudentUniversityListCreateView.as_view(), name="my_universities_list_create"),
    path("my-universities/<int:pk>/", StudentUniversityDetailView.as_view(), name="my_universities_detail"),
]
