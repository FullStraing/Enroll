from django.urls import path
from .views import (
    UniversityListView,
    UniversityDetailView,
    StudentUniversityListCreateView,
    StudentUniversityDetailView,
    ApplicationListCreateView,
    ApplicationDetailView,
    UniversityDeadlinesView,
    UniversityLatestSnapshotView,
    UniversityMetricsView,
)

urlpatterns = [
    path("universities/", UniversityListView.as_view(), name="universities_list"),
    path("universities/<int:pk>/", UniversityDetailView.as_view(), name="universities_detail"),
    path("my-universities/", StudentUniversityListCreateView.as_view(), name="my_universities_list_create"),
    path("my-universities/<int:pk>/", StudentUniversityDetailView.as_view(), name="my_universities_detail"),
    path("applications/", ApplicationListCreateView.as_view(), name="applications_list_create"),
    path("applications/<int:pk>/", ApplicationDetailView.as_view(), name="applications_detail"),
    path("universities/<int:pk>/deadlines/", UniversityDeadlinesView.as_view(), name="universities_deadlines"),
    path("universities/<int:pk>/source-snapshot/", UniversityLatestSnapshotView.as_view(), name="universities_latest_snapshot"),
    path("universities/<int:pk>/metrics/", UniversityMetricsView.as_view(), name="universities_metrics"),
]
