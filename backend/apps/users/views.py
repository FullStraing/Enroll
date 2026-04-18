import re

from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.services import ensure_user_plan
from apps.analytics.services import record_product_event
from apps.core.runtime import feature_disabled_response

from .common_app import build_common_app_progress
from .google_auth import GoogleTokenVerificationError, verify_google_id_token
from .models import StudentProfile, UserAuthIdentity, normalize_identity_email
from .progress import has_completed_minimum_profile
from .registration import (
    AUTH_MESSAGE_RESEND_GENERIC,
    AUTH_MESSAGE_VERIFICATION_CODE_SENT,
    AUTH_MESSAGE_VERIFICATION_EMAIL_SEND_FAILED,
    PendingRegistrationError,
    _seed_example_university,
    complete_pending_registration,
    issue_pending_registration,
    resend_pending_registration_code,
)
from .serializers import (
    RegisterResendSerializer,
    RegisterStartSerializer,
    RegisterVerifySerializer,
    StudentProfileSerializer,
)


def _build_unique_username(email: str) -> str:
    base = re.sub(r"[^a-zA-Z0-9_]", "_", email.split("@")[0].strip()) or "google_user"
    candidate = base[:150]
    suffix = 1
    while User.objects.filter(username=candidate).exists():
        suffix_str = f"_{suffix}"
        candidate = f"{base[: max(1, 150 - len(suffix_str))]}{suffix_str}"
        suffix += 1
    return candidate


def _get_expected_google_client_ids() -> set[str]:
    raw = getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "") or ""
    return {value.strip() for value in raw.split(",") if value.strip()}


class RegisterStartView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_register_start"

    def post(self, request):
        if not settings.REGISTRATION_ENABLED:
            return feature_disabled_response("Registration is temporarily unavailable.")

        serializer = RegisterStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = issue_pending_registration(
                username=serializer.validated_data["username"],
                email=serializer.validated_data["email"],
                password=serializer.validated_data["password"],
                request=request,
            )
        except PendingRegistrationError as exc:
            raise exc
        except Exception:
            return Response(
                {"detail": AUTH_MESSAGE_VERIFICATION_EMAIL_SEND_FAILED},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {
                "detail": AUTH_MESSAGE_VERIFICATION_CODE_SENT,
                "verification_required": result.verification_required,
                "resend_available_in_seconds": result.resend_available_in_seconds,
                "expires_in_seconds": result.expires_in_seconds,
            },
            status=status.HTTP_202_ACCEPTED,
        )


class RegisterVerifyView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_register_verify"

    def post(self, request):
        serializer = RegisterVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = complete_pending_registration(
            email=serializer.validated_data["email"],
            code=serializer.validated_data["code"],
        )
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "is_new_user": True,
            }
        )


class RegisterResendCodeView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_register_resend"

    def post(self, request):
        serializer = RegisterResendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = resend_pending_registration_code(
                email=serializer.validated_data["email"],
                request=request,
            )
        except PendingRegistrationError as exc:
            raise exc
        except Exception:
            return Response(
                {"detail": AUTH_MESSAGE_VERIFICATION_EMAIL_SEND_FAILED},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {
                "detail": AUTH_MESSAGE_RESEND_GENERIC,
                "verification_required": result.verification_required,
                "resend_available_in_seconds": result.resend_available_in_seconds,
                "expires_in_seconds": result.expires_in_seconds,
            }
        )


class StudentProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = StudentProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = StudentProfile.objects.get_or_create(user=self.request.user)
        return profile

    def perform_update(self, serializer):
        profile = self.get_object()
        was_complete = has_completed_minimum_profile(profile)
        updated = serializer.save()
        if not was_complete and has_completed_minimum_profile(updated):
            record_product_event("onboarding_completed", user=self.request.user, source="profile_update")


class CommonAppProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = StudentProfile.objects.get_or_create(user=request.user)
        payload = build_common_app_progress(profile)
        return Response(payload)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        current_password = request.data.get("current_password") or request.data.get("old_password")
        new_password = request.data.get("new_password")
        confirm_new_password = request.data.get("confirm_new_password")
        user = request.user

        if not new_password:
            return Response(
                {"detail": "New password is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if confirm_new_password is not None and new_password != confirm_new_password:
            return Response(
                {"detail": "New password and confirmation do not match."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.has_usable_password():
            if not current_password:
                return Response(
                    {"detail": "Current password is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not user.check_password(current_password):
                return Response(
                    {"detail": "Current password is incorrect."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            validate_password(new_password, user)
        except ValidationError as exc:
            return Response(
                {"detail": list(exc.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])
        return Response({"detail": "Password updated.", "has_usable_password": True})


class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_google"

    def post(self, request):
        if not settings.GOOGLE_AUTH_ENABLED:
            return feature_disabled_response("Google sign-in is temporarily unavailable.")
        id_token = request.data.get("id_token", "")
        if not id_token:
            return Response({"detail": "id_token is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            identity = verify_google_id_token(id_token, _get_expected_google_client_ids())
        except GoogleTokenVerificationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        normalized_email = normalize_identity_email(identity.email)
        created = False

        with transaction.atomic():
            auth_identity = UserAuthIdentity.objects.select_related("user").filter(google_sub=identity.sub).first()

            if auth_identity is None:
                auth_identity = UserAuthIdentity.objects.select_related("user").filter(normalized_email=normalized_email).first()

                if auth_identity:
                    if auth_identity.google_sub and auth_identity.google_sub != identity.sub:
                        return Response(
                            {"detail": "Google sign-in is already linked to a different account."},
                            status=status.HTTP_409_CONFLICT,
                        )
                    auth_identity.google_sub = identity.sub
                    auth_identity.email_verified = True
                    auth_identity.email_verified_at = auth_identity.email_verified_at or timezone.now()
                    auth_identity.save(update_fields=["google_sub", "email_verified", "email_verified_at", "updated_at"])
                else:
                    legacy_matches = list(User.objects.filter(email__iexact=normalized_email)[:2])
                    if len(legacy_matches) > 1:
                        return Response(
                            {"detail": "Multiple accounts already use this email. Sign in with password and contact support."},
                            status=status.HTTP_409_CONFLICT,
                        )

                    if legacy_matches:
                        user = legacy_matches[0]
                        auth_identity = UserAuthIdentity.objects.create(
                            user=user,
                            normalized_email=normalized_email,
                            email_verified=True,
                            email_verified_at=timezone.now(),
                            google_sub=identity.sub,
                        )
                    else:
                        if not settings.REGISTRATION_ENABLED:
                            return feature_disabled_response("Registration is temporarily unavailable.")
                        user = User.objects.create(
                            username=_build_unique_username(normalized_email),
                            email=normalized_email,
                            first_name=identity.given_name,
                            last_name=identity.family_name,
                        )
                        user.set_unusable_password()
                        user.save(update_fields=["password"])
                        auth_identity = UserAuthIdentity.objects.create(
                            user=user,
                            normalized_email=normalized_email,
                            email_verified=True,
                            email_verified_at=timezone.now(),
                            google_sub=identity.sub,
                        )
                        ensure_user_plan(user=user, source="default_signup")
                        created = True

            user = auth_identity.user
            identity_updates = []
            if auth_identity.normalized_email != normalized_email:
                auth_identity.normalized_email = normalized_email
                identity_updates.append("normalized_email")
            if not auth_identity.email_verified:
                auth_identity.email_verified = True
                identity_updates.append("email_verified")
            if not auth_identity.email_verified_at:
                auth_identity.email_verified_at = timezone.now()
                identity_updates.append("email_verified_at")
            if identity_updates:
                auth_identity.save(update_fields=[*identity_updates, "updated_at"])
            updated_fields = []
            if user.email != normalized_email:
                user.email = normalized_email
                updated_fields.append("email")
            if not user.first_name and identity.given_name:
                user.first_name = identity.given_name
                updated_fields.append("first_name")
            if not user.last_name and identity.family_name:
                user.last_name = identity.family_name
                updated_fields.append("last_name")
            if updated_fields:
                user.save(update_fields=updated_fields)

        profile, _ = StudentProfile.objects.get_or_create(user=user)
        if created and not profile.full_name:
            profile.full_name = identity.full_name or f"{identity.given_name} {identity.family_name}".strip()
            profile.save(update_fields=["full_name"])
        if created:
            _seed_example_university(user)
            record_product_event("signup_completed", user=user, source="google")

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "is_new_user": created,
            }
        )
