from __future__ import annotations

import math
import time

from django.contrib.auth.models import User
from django.core.cache import cache
from django.db.models import Count, Prefetch, Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.universities.models import StudentUniversity
from apps.users.models import StudentProfile

from .models import (
    CommunityComment,
    CommunityGroup,
    CommunityMembership,
    CommunityPost,
    CommunityReport,
    CommunitySavedPost,
)
from .seed import ensure_seeded_groups
from .serializers import (
    CommunityAuthorSerializer,
    CommunityCommentSerializer,
    CommunityCommentWriteSerializer,
    CommunityGroupDetailSerializer,
    CommunityGroupSummarySerializer,
    CommunityPostSerializer,
    CommunityPostWriteSerializer,
    CommunityReportSerializer,
)


def _profile(user: User) -> StudentProfile | None:
    try:
        return user.student_profile
    except StudentProfile.DoesNotExist:
        return None


def _normalize_country(value: str) -> str:
    return value.strip().lower()


def _intake_key(profile: StudentProfile | None) -> str:
    if not profile or not isinstance(profile.common_app_profile, dict):
        return ""
    intro = profile.common_app_profile.get("intro_quiz_answers")
    if not isinstance(intro, dict):
        return ""
    intake_year = str(intro.get("intakeYear", "")).strip()
    return intake_year if intake_year[:1].isdigit() else ""


def _get_membership_group_ids(user: User) -> set[int]:
    return set(CommunityMembership.objects.filter(user=user).values_list("group_id", flat=True))


def _get_moderated_group_ids(user: User) -> set[int]:
    return set(
        CommunityMembership.objects.filter(user=user, role__in=["moderator", "staff"]).values_list("group_id", flat=True)
    )


def _get_saved_post_ids(user: User) -> set[int]:
    return set(CommunitySavedPost.objects.filter(user=user).values_list("post_id", flat=True))


def _post_queryset_for_user(user: User):
    comment_prefetch = Prefetch(
        "comments",
        queryset=CommunityComment.objects.filter(status="active").select_related("author", "author__student_profile"),
        to_attr="prefetched_comments",
    )
    return (
        CommunityPost.objects.filter(status__in=["active", "locked"], group__is_active=True)
        .select_related("group", "author", "author__student_profile")
        .prefetch_related(comment_prefetch)
    )


def _rate_limit(user_id: int, action: str, limit: int, window_seconds: int = 600):
    bucket = math.floor(time.time() / window_seconds)
    key = f"community_rate:{action}:{user_id}:{bucket}"
    current = cache.get(key, 0)
    if current >= limit:
        return False
    cache.set(key, current + 1, timeout=window_seconds)
    return True


def _serialize_posts(posts, request):
    return CommunityPostSerializer(
        posts,
        many=True,
        context={
            "request": request,
            "saved_post_ids": _get_saved_post_ids(request.user),
            "moderated_group_ids": _get_moderated_group_ids(request.user),
        },
    ).data


class CommunityHomeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        ensure_seeded_groups()
        profile = _profile(request.user)
        membership_group_ids = _get_membership_group_ids(request.user)

        groups = CommunityGroup.objects.filter(is_active=True).annotate(
            member_count=Count("memberships", distinct=True),
            post_count=Count("posts", filter=Q(posts__status__in=["active", "locked"]), distinct=True),
        )

        country = _normalize_country(profile.country) if profile and profile.country else ""
        intake = _intake_key(profile)
        university_ids = list(StudentUniversity.objects.filter(student=request.user).values_list("university_id", flat=True))

        country_groups = groups.filter(links__country_key=country).distinct()[:3] if country else groups.filter(group_type="country")[:3]
        intake_groups = groups.filter(links__intake_key=intake).distinct()[:3] if intake else groups.filter(group_type="intake")[:3]
        university_groups = (
            groups.filter(links__university_id__in=university_ids).distinct()[:3]
            if university_ids
            else groups.filter(group_type="university")[:3]
        )
        topic_groups = groups.filter(group_type="topic")[:4]

        recommendation_group_ids = {
            *[item.id for item in country_groups],
            *[item.id for item in intake_groups],
            *[item.id for item in university_groups],
            *[item.id for item in topic_groups],
            *membership_group_ids,
        }

        base_posts = _post_queryset_for_user(request.user)
        questions = list(
            base_posts.filter(group_id__in=recommendation_group_ids, post_type="question").order_by("-updated_at", "-id")[:4]
        )
        accepted_insights = list(
            base_posts.filter(post_type__in=["experience", "guide", "accepted_profile"]).order_by("-updated_at", "-id")[:4]
        )
        saved_posts = list(base_posts.filter(saved_by__user=request.user).order_by("-saved_by__created_at", "-id")[:4])

        serializer_context = {"request": request, "membership_group_ids": membership_group_ids}
        return Response(
            {
                "recommendations": {
                    "country": CommunityGroupSummarySerializer(country_groups, many=True, context=serializer_context).data,
                    "universities": CommunityGroupSummarySerializer(university_groups, many=True, context=serializer_context).data,
                    "intake": CommunityGroupSummarySerializer(intake_groups, many=True, context=serializer_context).data,
                    "topics": CommunityGroupSummarySerializer(topic_groups, many=True, context=serializer_context).data,
                },
                "questions_from_path": _serialize_posts(questions, request),
                "accepted_insights": _serialize_posts(accepted_insights, request),
                "saved_posts": _serialize_posts(saved_posts, request),
            }
        )


class CommunityGroupListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CommunityGroupSummarySerializer

    def get_queryset(self):
        ensure_seeded_groups()
        queryset = CommunityGroup.objects.filter(is_active=True).annotate(
            member_count=Count("memberships", distinct=True),
            post_count=Count("posts", filter=Q(posts__status__in=["active", "locked"]), distinct=True),
        )
        group_type = self.request.query_params.get("group_type")
        if group_type:
            queryset = queryset.filter(group_type=group_type)
        if self.request.query_params.get("chat_only") == "1":
            queryset = queryset.filter(metadata__chat_room=True)
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["membership_group_ids"] = _get_membership_group_ids(self.request.user)
        return context


class CommunityGroupDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug: str):
        ensure_seeded_groups()
        membership_group_ids = _get_membership_group_ids(request.user)
        group = (
            CommunityGroup.objects.filter(slug=slug, is_active=True)
            .annotate(
                member_count=Count("memberships", distinct=True),
                post_count=Count("posts", filter=Q(posts__status__in=["active", "locked"]), distinct=True),
            )
            .first()
        )
        if not group:
            return Response({"detail": "Group not found."}, status=status.HTTP_404_NOT_FOUND)

        pinned_posts = list(_post_queryset_for_user(request.user).filter(group=group, is_pinned=True).order_by("-updated_at", "-id")[:3])
        related_groups = (
            CommunityGroup.objects.filter(is_active=True, group_type=group.group_type)
            .exclude(id=group.id)
            .annotate(member_count=Count("memberships", distinct=True), post_count=Count("posts", distinct=True))[:3]
        )
        contributors = (
            CommunityMembership.objects.filter(group=group)
            .select_related("user", "user__student_profile")
            .annotate(posts_count=Count("user__community_posts", filter=Q(user__community_posts__group=group)))
            .order_by("-posts_count", "-joined_at")[:4]
        )

        return Response(
            {
                "group": CommunityGroupDetailSerializer(
                    group,
                    context={"request": request, "membership_group_ids": membership_group_ids},
                ).data,
                "pinned_posts": _serialize_posts(pinned_posts, request),
                "related_groups": CommunityGroupSummarySerializer(
                    related_groups,
                    many=True,
                    context={"request": request, "membership_group_ids": membership_group_ids},
                ).data,
                "top_contributors": [
                    {
                        "profile": CommunityAuthorSerializer(member.user).data,
                        "role": member.role,
                        "posts_count": member.posts_count,
                    }
                    for member in contributors
                ],
            }
        )


class CommunityGroupJoinView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug: str):
        ensure_seeded_groups()
        group = CommunityGroup.objects.filter(slug=slug, is_active=True).first()
        if not group:
            return Response({"detail": "Group not found."}, status=status.HTTP_404_NOT_FOUND)
        CommunityMembership.objects.get_or_create(user=request.user, group=group, defaults={"role": "member"})
        return Response({"detail": "Joined group."})


class CommunityGroupLeaveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug: str):
        group = CommunityGroup.objects.filter(slug=slug, is_active=True).first()
        if not group:
            return Response({"detail": "Group not found."}, status=status.HTTP_404_NOT_FOUND)
        CommunityMembership.objects.filter(user=request.user, group=group, role="member").delete()
        return Response({"detail": "Left group."})


class CommunityGroupPostsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _get_group(self, slug: str):
        ensure_seeded_groups()
        return CommunityGroup.objects.filter(slug=slug, is_active=True).first()

    def get(self, request, slug: str):
        group = self._get_group(slug)
        if not group:
            return Response({"detail": "Group not found."}, status=status.HTTP_404_NOT_FOUND)
        posts = list(_post_queryset_for_user(request.user).filter(group=group).order_by("-is_pinned", "-updated_at", "-id")[:25])
        return Response(_serialize_posts(posts, request))

    def post(self, request, slug: str):
        group = self._get_group(slug)
        if not group:
            return Response({"detail": "Group not found."}, status=status.HTTP_404_NOT_FOUND)
        if not _rate_limit(request.user.id, "post", limit=5):
            return Response({"detail": "Posting limit reached. Please slow down."}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        serializer = CommunityPostWriteSerializer(data=request.data, context={"request": request, "group": group})
        serializer.is_valid(raise_exception=True)
        post = CommunityPost.objects.create(
            group=group,
            author=request.user,
            post_type=serializer.validated_data["post_type"],
            title=serializer.validated_data["title"],
            body=serializer.validated_data["body"],
            tag=serializer.validated_data.get("tag", ""),
            status="active",
        )
        post = _post_queryset_for_user(request.user).get(pk=post.pk)
        return Response(CommunityPostSerializer(post, context={"request": request}).data, status=status.HTTP_201_CREATED)


class CommunityPostDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _get_post(self, request, post_id: int):
        return _post_queryset_for_user(request.user).filter(pk=post_id).first()

    def get(self, request, post_id: int):
        post = self._get_post(request, post_id)
        if not post:
            return Response({"detail": "Post not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(CommunityPostSerializer(post, context={"request": request}).data)

    def patch(self, request, post_id: int):
        post = self._get_post(request, post_id)
        if not post:
            return Response({"detail": "Post not found."}, status=status.HTTP_404_NOT_FOUND)
        membership = CommunityMembership.objects.filter(group=post.group, user=request.user).first()
        is_moderator = membership and membership.role in {"moderator", "staff"}
        if request.user.id != post.author_id and not is_moderator:
            return Response({"detail": "You cannot edit this post."}, status=status.HTTP_403_FORBIDDEN)
        serializer = CommunityPostWriteSerializer(post, data=request.data, partial=True, context={"request": request, "group": post.group})
        serializer.is_valid(raise_exception=True)
        for field, value in serializer.validated_data.items():
            setattr(post, field, value)
        post.save(update_fields=list(serializer.validated_data.keys()) + ["updated_at"])
        post = self._get_post(request, post_id)
        return Response(CommunityPostSerializer(post, context={"request": request}).data)

    def delete(self, request, post_id: int):
        post = self._get_post(request, post_id)
        if not post:
            return Response({"detail": "Post not found."}, status=status.HTTP_404_NOT_FOUND)
        membership = CommunityMembership.objects.filter(group=post.group, user=request.user).first()
        is_moderator = membership and membership.role in {"moderator", "staff"}
        if request.user.id != post.author_id and not is_moderator:
            return Response({"detail": "You cannot delete this post."}, status=status.HTTP_403_FORBIDDEN)
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CommunityPostCommentCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, post_id: int):
        post = CommunityPost.objects.select_related("group").filter(pk=post_id, status__in=["active", "locked"]).first()
        if not post:
            return Response({"detail": "Post not found."}, status=status.HTTP_404_NOT_FOUND)
        if not _rate_limit(request.user.id, "comment", limit=20):
            return Response({"detail": "Comment limit reached. Please slow down."}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        serializer = CommunityCommentWriteSerializer(data=request.data, context={"request": request, "post": post})
        serializer.is_valid(raise_exception=True)
        comment = CommunityComment.objects.create(post=post, author=request.user, body=serializer.validated_data["body"])
        return Response(
            CommunityCommentSerializer(comment, context={"request": request, "group": post.group}).data,
            status=status.HTTP_201_CREATED,
        )


class CommunityCommentDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _get_comment(self, comment_id: int):
        return (
            CommunityComment.objects.select_related("post", "post__group", "author", "author__student_profile")
            .filter(pk=comment_id)
            .first()
        )

    def patch(self, request, comment_id: int):
        comment = self._get_comment(comment_id)
        if not comment:
            return Response({"detail": "Comment not found."}, status=status.HTTP_404_NOT_FOUND)
        membership = CommunityMembership.objects.filter(group=comment.post.group, user=request.user).first()
        is_moderator = membership and membership.role in {"moderator", "staff"}
        is_author = request.user.id == comment.author_id
        can_edit_body = is_author and timezone.now() - comment.created_at <= timezone.timedelta(minutes=30)
        if not is_moderator and not can_edit_body:
            return Response({"detail": "You cannot edit this comment."}, status=status.HTTP_403_FORBIDDEN)
        serializer = CommunityCommentWriteSerializer(comment, data=request.data, partial=True, context={"request": request, "post": comment.post})
        serializer.is_valid(raise_exception=True)
        for field, value in serializer.validated_data.items():
            setattr(comment, field, value)
        comment.save(update_fields=list(serializer.validated_data.keys()) + ["updated_at"])
        return Response(CommunityCommentSerializer(comment, context={"request": request, "group": comment.post.group}).data)

    def delete(self, request, comment_id: int):
        comment = self._get_comment(comment_id)
        if not comment:
            return Response({"detail": "Comment not found."}, status=status.HTTP_404_NOT_FOUND)
        membership = CommunityMembership.objects.filter(group=comment.post.group, user=request.user).first()
        is_moderator = membership and membership.role in {"moderator", "staff"}
        if request.user.id != comment.author_id and not is_moderator:
            return Response({"detail": "You cannot delete this comment."}, status=status.HTTP_403_FORBIDDEN)
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CommunityPostSaveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, post_id: int):
        post = CommunityPost.objects.filter(pk=post_id, status__in=["active", "locked"]).first()
        if not post:
            return Response({"detail": "Post not found."}, status=status.HTTP_404_NOT_FOUND)
        CommunitySavedPost.objects.get_or_create(user=request.user, post=post)
        return Response({"detail": "Saved post."})

    def delete(self, request, post_id: int):
        CommunitySavedPost.objects.filter(user=request.user, post_id=post_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CommunityReportCreateView(generics.CreateAPIView):
    serializer_class = CommunityReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target_type = serializer.validated_data["target_type"]
        target_id = serializer.validated_data["target_id"]
        target_exists = (
            CommunityPost.objects.filter(pk=target_id).exists()
            if target_type == "post"
            else CommunityComment.objects.filter(pk=target_id).exists()
        )
        if not target_exists:
            return Response({"detail": "Target not found."}, status=status.HTTP_400_BAD_REQUEST)
        CommunityReport.objects.create(reporter=request.user, **serializer.validated_data)
        return Response({"detail": "Report submitted."}, status=status.HTTP_201_CREATED)
