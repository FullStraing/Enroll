from django.conf import settings
from django.db import models

from apps.universities.models import University


class CommunityGroup(models.Model):
    GROUP_TYPE_CHOICES = [
        ("country", "Country"),
        ("university", "University"),
        ("intake", "Intake"),
        ("topic", "Topic"),
    ]
    VISIBILITY_CHOICES = [
        ("members_only", "Members only"),
    ]

    slug = models.SlugField(max_length=120, unique=True)
    title = models.CharField(max_length=160)
    description = models.TextField()
    group_type = models.CharField(max_length=20, choices=GROUP_TYPE_CHOICES)
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default="members_only")
    metadata = models.JSONField(default=dict, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "title", "id"]

    def __str__(self):
        return self.title


class CommunityGroupLink(models.Model):
    group = models.ForeignKey(CommunityGroup, on_delete=models.CASCADE, related_name="links")
    university = models.ForeignKey(
        University,
        on_delete=models.CASCADE,
        related_name="community_links",
        null=True,
        blank=True,
    )
    country_key = models.CharField(max_length=80, blank=True)
    intake_key = models.CharField(max_length=80, blank=True)
    topic_key = models.CharField(max_length=80, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["country_key"]),
            models.Index(fields=["intake_key"]),
            models.Index(fields=["topic_key"]),
        ]

    def __str__(self):
        return f"{self.group.title} link"


class CommunityMembership(models.Model):
    ROLE_CHOICES = [
        ("member", "Member"),
        ("moderator", "Moderator"),
        ("staff", "Staff"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="community_memberships")
    group = models.ForeignKey(CommunityGroup, on_delete=models.CASCADE, related_name="memberships")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="member")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "group")
        ordering = ["-joined_at", "-id"]

    def __str__(self):
        return f"{self.user.username} in {self.group.slug}"


class CommunityPost(models.Model):
    POST_TYPE_CHOICES = [
        ("question", "Question"),
        ("experience", "Experience"),
        ("guide", "Guide"),
        ("accepted_profile", "Accepted profile"),
        ("deadline_update", "Deadline update"),
    ]
    STATUS_CHOICES = [
        ("active", "Active"),
        ("hidden", "Hidden"),
        ("locked", "Locked"),
    ]

    group = models.ForeignKey(CommunityGroup, on_delete=models.CASCADE, related_name="posts")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="community_posts")
    post_type = models.CharField(max_length=30, choices=POST_TYPE_CHOICES)
    title = models.CharField(max_length=180)
    body = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_pinned", "-updated_at", "-id"]
        indexes = [
            models.Index(fields=["group", "status"]),
            models.Index(fields=["post_type", "status"]),
        ]

    def __str__(self):
        return self.title


class CommunityComment(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("hidden", "Hidden"),
    ]

    post = models.ForeignKey(CommunityPost, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="community_comments")
    body = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at", "id"]
        indexes = [
            models.Index(fields=["post", "status"]),
        ]

    def __str__(self):
        return f"Comment by {self.author.username}"


class CommunityReport(models.Model):
    TARGET_TYPE_CHOICES = [
        ("post", "Post"),
        ("comment", "Comment"),
    ]
    STATUS_CHOICES = [
        ("open", "Open"),
        ("reviewed", "Reviewed"),
        ("resolved", "Resolved"),
        ("dismissed", "Dismissed"),
    ]
    REASON_CHOICES = [
        ("spam", "Spam"),
        ("harassment", "Harassment"),
        ("misleading", "Misleading"),
        ("plagiarism", "Plagiarism"),
        ("other", "Other"),
    ]

    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="community_reports")
    target_type = models.CharField(max_length=20, choices=TARGET_TYPE_CHOICES)
    target_id = models.PositiveIntegerField()
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [
            models.Index(fields=["target_type", "target_id"]),
            models.Index(fields=["status", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.target_type}:{self.target_id} ({self.reason})"


class CommunitySavedPost(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_community_posts")
    post = models.ForeignKey(CommunityPost, on_delete=models.CASCADE, related_name="saved_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "post")
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.user.username} saved {self.post_id}"
