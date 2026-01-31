from django.conf import settings
from django.db import models


class AIInteraction(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ai_interactions",
    )
    context_type = models.CharField(max_length=100, blank=True)
    context_id = models.CharField(max_length=100, blank=True)
    prompt = models.TextField(blank=True)
    response = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.user.username} {self.context_type}"
