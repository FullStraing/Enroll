APPLICATION_FEE_FALLBACKS = {
    "boston-college": 80.0,
    "george-washington-university": 80.0,
}


def get_application_fee_fallback(university) -> float | None:
    external_id = (getattr(university, "external_id", None) or "").strip().lower()
    if external_id and external_id in APPLICATION_FEE_FALLBACKS:
        return APPLICATION_FEE_FALLBACKS[external_id]
    return None
