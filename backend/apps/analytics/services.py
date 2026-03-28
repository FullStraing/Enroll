from __future__ import annotations

from django.contrib.auth import get_user_model

from .models import ProductEvent

User = get_user_model()

ONE_TIME_USER_EVENTS = {
    "signup_completed",
    "onboarding_completed",
    "first_task_created",
    "first_university_added",
    "first_essay_started",
}
ONE_TIME_CLIENT_EVENTS = {"signup_started"}


def record_product_event(
    name: str,
    *,
    user: User | None = None,
    client_id: str = "",
    source: str = "",
    metadata: dict | None = None,
) -> tuple[ProductEvent, bool]:
    payload = metadata if isinstance(metadata, dict) else {}
    defaults = {
        "source": source.strip(),
        "metadata": payload,
    }

    if user and name in ONE_TIME_USER_EVENTS:
        return ProductEvent.objects.get_or_create(user=user, name=name, defaults={**defaults, "client_id": client_id.strip()})

    if client_id and name in ONE_TIME_CLIENT_EVENTS:
        return ProductEvent.objects.get_or_create(client_id=client_id.strip(), name=name, defaults=defaults)

    return (
        ProductEvent.objects.create(
            user=user,
            client_id=client_id.strip(),
            name=name,
            source=source.strip(),
            metadata=payload,
        ),
        True,
    )

