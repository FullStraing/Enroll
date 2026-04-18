from django.contrib.auth.models import User
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.analytics.services import record_product_event
from apps.users.registration import AUTH_MESSAGE_VERIFY_EMAIL_BEFORE_LOGIN


class VerifiedTokenObtainPairSerializer(TokenObtainPairSerializer):
    default_error_messages = {
        "no_active_account": "No active account found with the given credentials.",
    }

    def validate(self, attrs):
        username = str(attrs.get(self.username_field, "")).strip()
        password = attrs.get("password") or ""

        user = (
            User.objects.select_related("auth_identity")
            .filter(**{self.username_field: username})
            .first()
        )
        if user and password and user.has_usable_password() and user.check_password(password):
            identity = getattr(user, "auth_identity", None)
            if identity and not identity.email_verified:
                record_product_event("login_blocked_unverified_email", user=user, source="password")
                raise AuthenticationFailed(
                    detail={"detail": AUTH_MESSAGE_VERIFY_EMAIL_BEFORE_LOGIN, "code": "email_not_verified"}
                )

        return super().validate(attrs)


class ThrottledTokenObtainPairView(TokenObtainPairView):
    serializer_class = VerifiedTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_token"


class ThrottledTokenRefreshView(TokenRefreshView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_refresh"
