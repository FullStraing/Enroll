from __future__ import annotations

import secrets
from dataclasses import dataclass
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.accounts.services import ensure_user_plan
from apps.analytics.services import record_product_event
from apps.universities.categorying import category_from_acceptance_rate
from apps.universities.models import StudentUniversity, University

from .models import PendingRegistration, StudentProfile, UserAuthIdentity, normalize_identity_email

VERIFICATION_CODE_LENGTH = 6
VERIFICATION_CODE_TTL = timedelta(minutes=10)
VERIFICATION_RESEND_COOLDOWN = timedelta(seconds=60)
VERIFICATION_MAX_ATTEMPTS = 5
VERIFICATION_CODE_EXPIRY_MINUTES = int(VERIFICATION_CODE_TTL.total_seconds() // 60)

AUTH_MESSAGE_INVALID_CODE = "Invalid or expired verification code."
AUTH_MESSAGE_CODE_EXPIRED = "Verification code has expired. Request a new code."
AUTH_MESSAGE_TOO_MANY_ATTEMPTS = "Too many incorrect attempts. Request a new code."
AUTH_MESSAGE_RESEND_COOLDOWN = "Please wait before requesting another code."
AUTH_MESSAGE_VERIFY_EMAIL_BEFORE_LOGIN = "Verify your email before logging in."
AUTH_MESSAGE_VERIFICATION_EMAIL_SEND_FAILED = "Could not send verification email. Try again in a moment."
AUTH_MESSAGE_VERIFICATION_CODE_SENT = "Verification code sent."
AUTH_MESSAGE_RESEND_GENERIC = "If the registration is still pending, a fresh code has been sent."
EMAIL_VERIFICATION_SUBJECT = "Your Enroll verification code"


class PendingRegistrationError(serializers.ValidationError):
    pass


@dataclass
class VerificationDispatchResult:
    verification_required: bool
    resend_available_in_seconds: int
    expires_in_seconds: int


def _generate_verification_code() -> str:
    return f"{secrets.randbelow(10**VERIFICATION_CODE_LENGTH):0{VERIFICATION_CODE_LENGTH}d}"


def _extract_request_meta(request) -> tuple[str | None, str]:
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded_for:
        request_ip = forwarded_for.split(",")[0].strip()
    else:
        request_ip = (request.META.get("REMOTE_ADDR") or "").strip() or None

    return request_ip, (request.META.get("HTTP_USER_AGENT") or "").strip()[:1024]


def _seed_example_university(user: User) -> None:
    if StudentUniversity.objects.filter(student=user).exists():
        return

    example_names = [
        "Stanford University",
        "Harvard University",
        "New York University",
        "University of Michigan - Ann Arbor",
        "Abilene Christian University",
    ]
    university = None
    for example_name in example_names:
        university = University.objects.filter(is_active=True, name=example_name).first()
        if university:
            break
    if not university:
        university = University.objects.filter(is_active=True).order_by("name").first()
    if not university:
        return

    StudentUniversity.objects.get_or_create(
        student=user,
        university=university,
        defaults={
            "sort_order": 1,
            "category": category_from_acceptance_rate(university.acceptance_rate),
            "status": "planning",
        },
    )


def _verification_email_subject() -> str:
    return EMAIL_VERIFICATION_SUBJECT


def _verification_email_body(*, code: str) -> str:
    return (
        "Enroll email verification\n\n"
        f"Your verification code is: {code}\n\n"
        f"This code expires in {VERIFICATION_CODE_EXPIRY_MINUTES} minutes.\n\n"
        "If you did not request this code, you can ignore this email."
    )


def send_registration_verification_email(*, email: str, code: str) -> None:
    send_mail(
        subject=_verification_email_subject(),
        message=_verification_email_body(code=code),
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", ""),
        recipient_list=[email],
        fail_silently=False,
    )


def validate_registration_username(username: str, *, exclude_email: str | None = None) -> str:
    normalized_username = str(username or "").strip()
    if not normalized_username:
        raise PendingRegistrationError({"username": ["Username is required."]})

    if User.objects.filter(username=normalized_username).exists():
        raise PendingRegistrationError({"username": ["This username is already taken."]})

    pending_queryset = PendingRegistration.objects.filter(requested_username=normalized_username, completed_at__isnull=True)
    if exclude_email:
        pending_queryset = pending_queryset.exclude(normalized_email=exclude_email)
    if pending_queryset.exists():
        raise PendingRegistrationError({"username": ["This username is already reserved."]})

    return normalized_username


def validate_registration_email(email: str) -> str:
    normalized_email = normalize_identity_email(email)
    if not normalized_email:
        raise PendingRegistrationError({"email": ["Email is required."]})

    if UserAuthIdentity.objects.filter(normalized_email=normalized_email).exists():
        raise PendingRegistrationError({"email": ["An account with this email already exists."]})

    if User.objects.filter(email__iexact=normalized_email).exists():
        raise PendingRegistrationError({"email": ["An account with this email already exists."]})

    return normalized_email


def validate_registration_password(*, username: str, email: str, password: str) -> None:
    user = User(username=username, email=email)
    try:
        from django.contrib.auth.password_validation import validate_password

        validate_password(password, user)
    except DjangoValidationError as exc:
        raise PendingRegistrationError({"password": list(exc.messages)}) from exc


def issue_pending_registration(*, username: str, email: str, password: str, request) -> VerificationDispatchResult:
    normalized_email = validate_registration_email(email)
    normalized_username = validate_registration_username(username, exclude_email=normalized_email)
    validate_registration_password(username=normalized_username, email=normalized_email, password=password)

    request_ip, user_agent = _extract_request_meta(request)
    now = timezone.now()
    code = _generate_verification_code()

    with transaction.atomic():
        pending_registration, created = PendingRegistration.objects.select_for_update().update_or_create(
            normalized_email=normalized_email,
            defaults={
                "requested_username": normalized_username,
                "password_hash": "",
                "code_hash": "",
                "code_expires_at": now + VERIFICATION_CODE_TTL,
                "resend_available_at": now + VERIFICATION_RESEND_COOLDOWN,
                "last_code_sent_at": now,
                "failed_attempts": 0,
                "code_send_count": 1,
                "last_request_ip": request_ip,
                "last_user_agent": user_agent,
                "completed_at": None,
            },
        )
        pending_registration.requested_username = normalized_username
        pending_registration.set_password(password)
        pending_registration.set_code(code)
        pending_registration.code_expires_at = now + VERIFICATION_CODE_TTL
        pending_registration.resend_available_at = now + VERIFICATION_RESEND_COOLDOWN
        pending_registration.last_code_sent_at = now
        pending_registration.failed_attempts = 0
        pending_registration.code_send_count = 1 if created else pending_registration.code_send_count + 1
        pending_registration.last_request_ip = request_ip
        pending_registration.last_user_agent = user_agent
        pending_registration.completed_at = None
        pending_registration.save()

    send_registration_verification_email(email=normalized_email, code=code)
    record_product_event(
        "verification_code_sent",
        source="password_registration",
        metadata={"email": normalized_email, "request_ip": request_ip or ""},
    )

    return VerificationDispatchResult(
        verification_required=True,
        resend_available_in_seconds=int(VERIFICATION_RESEND_COOLDOWN.total_seconds()),
        expires_in_seconds=int(VERIFICATION_CODE_TTL.total_seconds()),
    )


def resend_pending_registration_code(*, email: str, request) -> VerificationDispatchResult:
    normalized_email = normalize_identity_email(email)
    now = timezone.now()
    request_ip, user_agent = _extract_request_meta(request)

    with transaction.atomic():
        try:
            pending_registration = PendingRegistration.objects.select_for_update().get(
                normalized_email=normalized_email,
                completed_at__isnull=True,
            )
        except PendingRegistration.DoesNotExist:
            return VerificationDispatchResult(
                verification_required=True,
                resend_available_in_seconds=int(VERIFICATION_RESEND_COOLDOWN.total_seconds()),
                expires_in_seconds=int(VERIFICATION_CODE_TTL.total_seconds()),
            )

        cooldown_remaining = max(0, int((pending_registration.resend_available_at - now).total_seconds()))
        if cooldown_remaining > 0:
            raise PendingRegistrationError(
                {"detail": AUTH_MESSAGE_RESEND_COOLDOWN, "retry_after_seconds": cooldown_remaining}
            )

        code = _generate_verification_code()
        pending_registration.set_code(code)
        pending_registration.code_expires_at = now + VERIFICATION_CODE_TTL
        pending_registration.resend_available_at = now + VERIFICATION_RESEND_COOLDOWN
        pending_registration.last_code_sent_at = now
        pending_registration.failed_attempts = 0
        pending_registration.code_send_count += 1
        pending_registration.last_request_ip = request_ip
        pending_registration.last_user_agent = user_agent
        pending_registration.save()

    send_registration_verification_email(email=normalized_email, code=code)
    record_product_event(
        "verification_code_resent",
        source="password_registration",
        metadata={"email": normalized_email, "request_ip": request_ip or ""},
    )

    return VerificationDispatchResult(
        verification_required=True,
        resend_available_in_seconds=int(VERIFICATION_RESEND_COOLDOWN.total_seconds()),
        expires_in_seconds=int(VERIFICATION_CODE_TTL.total_seconds()),
    )


def complete_pending_registration(*, email: str, code: str) -> User:
    normalized_email = normalize_identity_email(email)
    now = timezone.now()
    user: User | None = None
    error_message: str | None = None
    error_metadata: dict[str, object] | None = None

    with transaction.atomic():
        try:
            pending_registration = PendingRegistration.objects.select_for_update().get(
                normalized_email=normalized_email,
                completed_at__isnull=True,
            )
        except PendingRegistration.DoesNotExist as exc:
            record_product_event(
                "verification_code_failed",
                source="password_registration",
                metadata={"email": normalized_email, "reason": "missing_pending_registration"},
            )
            raise PendingRegistrationError({"detail": AUTH_MESSAGE_INVALID_CODE}) from exc

        if pending_registration.is_expired:
            error_message = AUTH_MESSAGE_CODE_EXPIRED
            error_metadata = {"email": normalized_email, "reason": "expired"}
        elif pending_registration.failed_attempts >= VERIFICATION_MAX_ATTEMPTS:
            error_message = AUTH_MESSAGE_TOO_MANY_ATTEMPTS
            error_metadata = {"email": normalized_email, "reason": "too_many_attempts"}
        elif not pending_registration.check_code(code):
            pending_registration.failed_attempts += 1
            pending_registration.save(update_fields=["failed_attempts", "updated_at"])
            error_message = AUTH_MESSAGE_INVALID_CODE
            error_metadata = {
                "email": normalized_email,
                "reason": "wrong_code",
                "failed_attempts": pending_registration.failed_attempts,
            }

        if error_message is not None:
            record_product_event(
                "verification_code_failed",
                source="password_registration",
                metadata=error_metadata,
            )
        else:
            if User.objects.filter(username=pending_registration.requested_username).exists():
                raise PendingRegistrationError({"username": ["This username is already taken."]})
            if UserAuthIdentity.objects.filter(normalized_email=normalized_email).exists() or User.objects.filter(email__iexact=normalized_email).exists():
                raise PendingRegistrationError({"email": ["An account with this email already exists."]})

            user = User(
                username=pending_registration.requested_username,
                email=normalized_email,
                password=pending_registration.password_hash,
            )
            user.save()
            StudentProfile.objects.create(user=user)
            UserAuthIdentity.objects.create(
                user=user,
                normalized_email=normalized_email,
                email_verified=True,
                email_verified_at=now,
            )
            ensure_user_plan(user=user, source="default_signup")
            _seed_example_university(user)
            pending_registration.mark_completed()
            pending_registration.save(update_fields=["completed_at", "updated_at"])

    if error_message is not None:
        raise PendingRegistrationError({"detail": error_message})

    record_product_event("verification_code_verified", user=user, source="password_registration")
    record_product_event("signup_completed", user=user, source="password")
    return user
