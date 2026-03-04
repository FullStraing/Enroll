from django.urls import path

from apps.essays.views import EssayDetailView, EssayListCreateView, EssayVersionDetailView, EssayVersionListCreateView


urlpatterns = [
    path("essays/", EssayListCreateView.as_view(), name="essay-list-create"),
    path("essays/<int:pk>/", EssayDetailView.as_view(), name="essay-detail"),
    path("essays/<int:essay_id>/versions/", EssayVersionListCreateView.as_view(), name="essay-version-list-create"),
    path("essay-versions/<int:pk>/", EssayVersionDetailView.as_view(), name="essay-version-detail"),
]

