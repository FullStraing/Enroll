import re

from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .common_app import build_common_app_progress
from .google_auth import GoogleTokenVerificationError, verify_google_id_token
from .models import StudentProfile
from .serializers import RegisterSerializer, StudentProfileSerializer


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


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class StudentProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = StudentProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = StudentProfile.objects.get_or_create(user=self.request.user)
        return profile


class CommonAppProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = StudentProfile.objects.get_or_create(user=request.user)
        payload = build_common_app_progress(profile)
        return Response(payload)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not old_password or not new_password:
            return Response(
                {"detail": "Укажите текущий и новый пароль."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        if not user.check_password(old_password):
            return Response(
                {"detail": "Текущий пароль неверный."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password, user)
        except ValidationError as exc:
            return Response(
                {"detail": exc.messages},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])
        return Response({"detail": "Пароль обновлен."})


class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        id_token = request.data.get("id_token", "")
        if not id_token:
            return Response({"detail": "id_token is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            identity = verify_google_id_token(id_token, _get_expected_google_client_ids())
        except GoogleTokenVerificationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=identity.email).first()
        created = False
        if not user:
            user = User.objects.create(
                username=_build_unique_username(identity.email),
                email=identity.email,
                first_name=identity.given_name,
                last_name=identity.family_name,
            )
            user.set_unusable_password()
            user.save(update_fields=["password"])
            created = True
        else:
            updated_fields = []
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

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "is_new_user": created,
            }
        )
