from __future__ import annotations

from .models import StudentProfile


def _intro_answers(profile: StudentProfile) -> dict:
    common = profile.common_app_profile if isinstance(profile.common_app_profile, dict) else {}
    intro = common.get("intro_quiz_answers")
    return intro if isinstance(intro, dict) else {}


def has_completed_minimum_profile(profile: StudentProfile) -> bool:
    intro = _intro_answers(profile)
    return bool(
        profile.full_name.strip()
        and profile.country.strip()
        and profile.intended_major.strip()
        and str(intro.get("intakeYear", "")).strip()
        and str(intro.get("schoolLevel", "")).strip()
    )
