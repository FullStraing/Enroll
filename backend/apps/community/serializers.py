from __future__ import annotations

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import serializers

from apps.users.models import StudentProfile

from .models import CommunityComment, CommunityGroup, CommunityMembership, CommunityPost, CommunityReport


def _profile_for(user: User) -> StudentProfile | None:
    try:
        return user.student_profile
    except StudentProfile.DoesNotExist:
        return None


def _community_status(user: User) -> str:
    profile = _profile_for(user)
    if profile:
        common = profile.common_app_profile if isinstance(profile.common_app_profile, dict) else {}
        explicit = str(common.get("community_status") or common.get("application_status") or "").strip().lower()
        if explicit in {"admitted", "enrolled"}:
            return explicit.title()

    if user.student_universities.filter(status="admitted").exists():
        return "Admitted"
    return "Applicant"


def _intake_label(profile: StudentProfile | None) -> str:
    if not profile or not isinstance(profile.common_app_profile, dict):
        return ""

    common = profile.common_app_profile
    dashboard_snapshot = common.get("dashboard_snapshot") if isinstance(common.get("dashboard_snapshot"), dict) else {}
    intake = str(dashboard_snapshot.get("intake", "")).strip()
    if intake:
        return intake

    intro = common.get("intro_quiz_answers") if isinstance(common.get("intro_quiz_answers"), dict) else {}
    intake_year = str(intro.get("intakeYear", "")).strip()
    if intake_year and intake_year[0].isdigit():
        return f"Fall {intake_year}"
    return intake_year


class CommunityAuthorSerializer(serializers.Serializer):
    display_name = serializers.SerializerMethodField()
    country = serializers.SerializerMethodField()
    intended_major = serializers.SerializerMethodField()
    intake = serializers.SerializerMethodField()
    status_badge = serializers.SerializerMethodField()

    def get_display_name(self, user: User):
        profile = _profile_for(user)
        if profile and profile.full_name:
            return profile.full_name
        return user.username

    def get_country(self, user: User):
        profile = _profile_for(user)
        return profile.country if profile else ""

    def get_intended_major(self, user: User):
        profile = _profile_for(user)
        return profile.intended_major if profile else ""

    def get_intake(self, user: User):
        return _intake_label(_profile_for(user))

    def get_status_badge(self, user: User):
        return _community_status(user)


class CommunityCommentSerializer(serializers.ModelSerializer):
    author = CommunityAuthorSerializer(read_only=True)
    can_edit = serializers.SerializerMethodField()
    can_moderate = serializers.SerializerMethodField()

    class Meta:
        model = CommunityComment
        fields = [
            "id",
            "body",
            "status",
            "created_at",
            "updated_at",
            "author",
            "can_edit",
            "can_moderate",
        ]

    def get_can_edit(self, obj: CommunityComment):
        request = self.context.get("request")
        if not request or request.user.id != obj.author_id:
            return False
        return timezone.now() - obj.created_at <= timezone.timedelta(minutes=30)

    def get_can_moderate(self, obj: CommunityComment):
        request = self.context.get("request")
        group = self.context.get("group")
        if not request or not group:
            return False
        return CommunityMembership.objects.filter(
            group=group,
            user=request.user,
            role__in=["moderator", "staff"],
        ).exists()


class CommunityGroupSummarySerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(read_only=True)
    post_count = serializers.IntegerField(read_only=True)
    is_member = serializers.SerializerMethodField()
    audience = serializers.SerializerMethodField()
    pinned_prompt = serializers.SerializerMethodField()
    is_chat_room = serializers.SerializerMethodField()

    class Meta:
        model = CommunityGroup
        fields = [
            "slug",
            "title",
            "description",
            "group_type",
            "member_count",
            "post_count",
            "is_member",
            "audience",
            "pinned_prompt",
            "is_chat_room",
        ]

    def get_is_member(self, obj: CommunityGroup):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        membership_group_ids = self.context.get("membership_group_ids")
        if membership_group_ids is not None:
            return obj.id in membership_group_ids
        return CommunityMembership.objects.filter(group=obj, user=request.user).exists()

    def get_audience(self, obj: CommunityGroup):
        return str(obj.metadata.get("audience", "")).strip()

    def get_pinned_prompt(self, obj: CommunityGroup):
        return str(obj.metadata.get("pinned_prompt", "")).strip()

    def get_is_chat_room(self, obj: CommunityGroup):
        return bool(obj.metadata.get("chat_room"))


class CommunityPostSerializer(serializers.ModelSerializer):
    author = CommunityAuthorSerializer(read_only=True)
    comments = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_moderate = serializers.SerializerMethodField()
    group_slug = serializers.CharField(source="group.slug", read_only=True)
    group_title = serializers.CharField(source="group.title", read_only=True)

    class Meta:
        model = CommunityPost
        fields = [
            "id",
            "group_slug",
            "group_title",
            "post_type",
            "title",
            "body",
            "tag",
            "status",
            "is_pinned",
            "created_at",
            "updated_at",
            "author",
            "comment_count",
            "comments",
            "is_saved",
            "can_edit",
            "can_moderate",
        ]

    def get_comments(self, obj: CommunityPost):
        comments = [comment for comment in getattr(obj, "prefetched_comments", list(obj.comments.all())) if comment.status == "active"]
        return CommunityCommentSerializer(comments, many=True, context=self.context).data

    def get_comment_count(self, obj: CommunityPost):
        return len([comment for comment in getattr(obj, "prefetched_comments", list(obj.comments.all())) if comment.status == "active"])

    def get_is_saved(self, obj: CommunityPost):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        saved_post_ids = self.context.get("saved_post_ids")
        if saved_post_ids is not None:
            return obj.id in saved_post_ids
        return obj.saved_by.filter(user=request.user).exists()

    def get_can_edit(self, obj: CommunityPost):
        request = self.context.get("request")
        if not request:
            return False
        return request.user.id == obj.author_id and obj.status != "locked"

    def get_can_moderate(self, obj: CommunityPost):
        request = self.context.get("request")
        if not request:
            return False
        moderated_group_ids = self.context.get("moderated_group_ids")
        if moderated_group_ids is not None:
            return obj.group_id in moderated_group_ids
        return CommunityMembership.objects.filter(
            group=obj.group,
            user=request.user,
            role__in=["moderator", "staff"],
        ).exists()


class CommunityGroupDetailSerializer(CommunityGroupSummarySerializer):
    rules = serializers.SerializerMethodField()
    resources = serializers.SerializerMethodField()
    can_post = serializers.SerializerMethodField()

    class Meta(CommunityGroupSummarySerializer.Meta):
        fields = CommunityGroupSummarySerializer.Meta.fields + ["rules", "resources", "can_post"]

    def get_rules(self, obj: CommunityGroup):
        return [str(rule).strip() for rule in obj.metadata.get("rules", []) if str(rule).strip()]

    def get_resources(self, obj: CommunityGroup):
        return [str(resource).strip() for resource in obj.metadata.get("resources", []) if str(resource).strip()]

    def get_can_post(self, obj: CommunityGroup):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return CommunityMembership.objects.filter(group=obj, user=request.user).exists()


class CommunityPostWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityPost
        fields = ["post_type", "title", "body", "tag", "status", "is_pinned"]
        extra_kwargs = {
            "post_type": {"required": False},
            "title": {"required": False, "allow_blank": True},
            "tag": {"required": False, "allow_blank": True},
        }

    def validate(self, attrs):
        request = self.context["request"]
        group: CommunityGroup = self.context["group"]
        membership = CommunityMembership.objects.filter(group=group, user=request.user).first()
        if request.method == "POST" and not membership:
            raise serializers.ValidationError("Join the group to post.")
        if "status" in attrs or "is_pinned" in attrs:
            if not membership or membership.role not in {"moderator", "staff"}:
                raise serializers.ValidationError("Only moderators can change moderation fields.")
        attrs["post_type"] = attrs.get("post_type") or "question"
        body = str(attrs.get("body", "")).strip()
        attrs["body"] = body
        title = str(attrs.get("title", "")).strip()
        attrs["title"] = title or (body[:72] if body else "Community message")
        return attrs


class CommunityCommentWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityComment
        fields = ["body", "status"]

    def validate(self, attrs):
        request = self.context["request"]
        post: CommunityPost = self.context["post"]
        membership = CommunityMembership.objects.filter(group=post.group, user=request.user).first()
        if request.method == "POST" and not membership:
            raise serializers.ValidationError("Join the group to comment.")
        if post.status == "locked":
            raise serializers.ValidationError("This post is locked.")
        if "status" in attrs:
            if not membership or membership.role not in {"moderator", "staff"}:
                raise serializers.ValidationError("Only moderators can moderate comments.")
        return attrs


class CommunityReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityReport
        fields = ["target_type", "target_id", "reason", "notes"]
