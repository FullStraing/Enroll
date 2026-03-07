from .schema import COMMON_APP_SCHEMA

def _is_filled(value):
    if value is None:
        return False
    if isinstance(value, bool):
        return True
    if isinstance(value, (list, tuple, set, dict)):
        return len(value) > 0
    if isinstance(value, str):
        return bool(value.strip())
    return True


def _resolve_value(profile, field_config: dict):
    bind = field_config.get("bind")
    path = field_config.get("path")
    if bind == "model":
        return getattr(profile, path, None)
    if bind == "user":
        return getattr(profile.user, path, None)
    return (profile.common_app_profile or {}).get(path)


def _condition_matches(condition: dict, field_values: dict):
    if not condition:
        return True
    if "all" in condition:
        nested = condition.get("all") or []
        return all(_condition_matches(item, field_values) for item in nested)
    if "any" in condition:
        nested = condition.get("any") or []
        return any(_condition_matches(item, field_values) for item in nested)
    field_id = condition.get("field_id")
    current = field_values.get(field_id)
    if "in" in condition:
        allowed = condition.get("in") or []
        return current in allowed
    expected = condition.get("equals")
    return current == expected


def build_common_app_progress(profile):
    sections_payload = []
    total_required = 0
    total_completed = 0

    for section in COMMON_APP_SCHEMA:
        section_required = 0
        section_completed = 0
        subsections_payload = []

        for subsection in section["subsections"]:
            sub_required = 0
            sub_completed = 0
            fields_payload = []
            field_values = {field["id"]: _resolve_value(profile, field) for field in subsection["fields"]}

            for field in subsection["fields"]:
                value = field_values.get(field["id"])
                visible = _condition_matches(field.get("show_if"), field_values)
                required = bool(field.get("required", False))
                if field.get("required_if"):
                    required = _condition_matches(field.get("required_if"), field_values)
                filled = _is_filled(value)
                if visible and required:
                    sub_required += 1
                    total_required += 1
                    section_required += 1
                    if filled:
                        sub_completed += 1
                        total_completed += 1
                        section_completed += 1

                fields_payload.append(
                    {
                        "id": field["id"],
                        "label": field["label"],
                        "type": field["type"],
                        "options": field.get("options", []),
                        "ui": field.get("ui"),
                        "clearable": bool(field.get("clearable", False)),
                        "searchable": bool(field.get("searchable", False)),
                        "show_if": field.get("show_if"),
                        "required_if": field.get("required_if"),
                        "visible": visible,
                        "required": required,
                        "readonly": bool(field.get("readonly", False)),
                        "help": field["help"],
                        "bind": field["bind"],
                        "path": field["path"],
                        "value": value,
                        "filled": filled,
                    }
                )

            sub_percent = int((sub_completed / sub_required) * 100) if sub_required else 100
            subsections_payload.append(
                {
                    "key": subsection["key"],
                    "title": subsection["title"],
                    "completed_required": sub_completed,
                    "required_total": sub_required,
                    "percent": sub_percent,
                    "fields": fields_payload,
                }
            )

        section_percent = int((section_completed / section_required) * 100) if section_required else 100
        sections_payload.append(
            {
                "key": section["key"],
                "title": section["title"],
                "completed_required": section_completed,
                "required_total": section_required,
                "percent": section_percent,
                "subsections": subsections_payload,
            }
        )

    overall_percent = int((total_completed / total_required) * 100) if total_required else 100
    return {
        "overall": {
            "completed_required": total_completed,
            "required_total": total_required,
            "percent": overall_percent,
        },
        "sections": sections_payload,
    }
