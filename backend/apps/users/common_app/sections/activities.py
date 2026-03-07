from ..builders import _choice_yes_no_field_options, _build_current_year_courses_fields, _build_community_based_org_fields

ACTIVITIES_SECTION =     {
        "key": "activities",
        "title": "Activities",
        "subsections": [
            {
                "key": "activities",
                "title": "Activities",
                "fields": [
                    {"id": "activities", "label": "Activities list", "bind": "model", "path": "activities", "type": "list", "required": False, "help": "Comma-separated list of your key extracurricular activities."},
                    {"id": "activities_level", "label": "Activities level", "bind": "model", "path": "activities_level", "type": "text", "required": False, "help": "Self-estimated impact level (low/medium/high)."},
                ],
            },
            {
                "key": "responsibilities_circumstances",
                "title": "Responsibilities and Circumstances",
                "fields": [
                    {"id": "family_responsibilities", "label": "Family responsibilities", "bind": "json", "path": "family_responsibilities", "type": "text", "required": False, "help": "If you regularly support family or work while studying."},
                    {"id": "context_circumstances", "label": "Additional circumstances", "bind": "json", "path": "context_circumstances", "type": "text", "required": False, "help": "Anything important that impacted your academics or activities."},
                ],
            },
        ],
    }
