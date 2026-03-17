from __future__ import annotations


def category_from_acceptance_rate(acceptance_rate: int | None) -> str:
    if acceptance_rate is None:
        return "target"
    if acceptance_rate <= 24:
        return "reach"
    if acceptance_rate <= 49:
        return "target"
    return "safety"
