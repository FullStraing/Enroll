from django.urls import path

from .views import (
    CommunityCommentDetailView,
    CommunityGroupDetailView,
    CommunityGroupJoinView,
    CommunityGroupLeaveView,
    CommunityGroupListView,
    CommunityGroupPostsView,
    CommunityHomeView,
    CommunityPostCommentCreateView,
    CommunityPostDetailView,
    CommunityPostSaveView,
    CommunityReportCreateView,
)


urlpatterns = [
    path("home/", CommunityHomeView.as_view()),
    path("groups/", CommunityGroupListView.as_view()),
    path("groups/<slug:slug>/", CommunityGroupDetailView.as_view()),
    path("groups/<slug:slug>/join/", CommunityGroupJoinView.as_view()),
    path("groups/<slug:slug>/leave/", CommunityGroupLeaveView.as_view()),
    path("groups/<slug:slug>/posts/", CommunityGroupPostsView.as_view()),
    path("posts/<int:post_id>/", CommunityPostDetailView.as_view()),
    path("posts/<int:post_id>/comments/", CommunityPostCommentCreateView.as_view()),
    path("posts/<int:post_id>/save/", CommunityPostSaveView.as_view()),
    path("comments/<int:comment_id>/", CommunityCommentDetailView.as_view()),
    path("reports/", CommunityReportCreateView.as_view()),
]

