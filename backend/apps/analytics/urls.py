from django.urls import path

from .views import ProductAnalyticsSummaryView, ProductEventTrackView

urlpatterns = [
    path("events/", ProductEventTrackView.as_view(), name="analytics-events"),
    path("summary/", ProductAnalyticsSummaryView.as_view(), name="analytics-summary"),
]

