from rest_framework import serializers

from .models import ProductEvent


class ProductEventWriteSerializer(serializers.Serializer):
    name = serializers.ChoiceField(choices=[choice[0] for choice in ProductEvent.EVENT_CHOICES])
    source = serializers.CharField(required=False, allow_blank=True, max_length=64)
    client_id = serializers.CharField(required=False, allow_blank=True, max_length=128)
    metadata = serializers.JSONField(required=False)

    def validate(self, attrs):
        request = self.context["request"]
        name = attrs["name"]
        client_id = str(attrs.get("client_id", "")).strip()
        attrs["client_id"] = client_id
        metadata = attrs.get("metadata")
        attrs["metadata"] = metadata if isinstance(metadata, dict) else {}

        if not request.user.is_authenticated and name != "signup_started":
            raise serializers.ValidationError("Authentication required for this event.")
        if name == "signup_started" and not client_id:
            raise serializers.ValidationError("client_id is required for signup_started.")
        return attrs

