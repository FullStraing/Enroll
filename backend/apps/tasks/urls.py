from django.urls import path

from .views import RoadmapStageListView, TaskListCreateView, TaskDetailView, TaskGenerateView

urlpatterns = [
    path("roadmap-stages/", RoadmapStageListView.as_view(), name="roadmap_stages"),
    path("tasks/", TaskListCreateView.as_view(), name="tasks_list_create"),
    path("tasks/generate/", TaskGenerateView.as_view(), name="tasks_generate"),
    path("tasks/<int:pk>/", TaskDetailView.as_view(), name="tasks_detail"),
]
