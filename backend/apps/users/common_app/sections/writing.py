from ..builders import _choice_yes_no_field_options, _build_current_year_courses_fields, _build_community_based_org_fields

WRITING_SECTION =     {
        "key": "writing",
        "title": "Writing",
        "subsections": [
            {
                "key": "personal_essay",
                "title": "Personal Essay",
                "fields": [
                    {"id": "personal_essay_status", "label": "Personal essay status", "bind": "json", "path": "personal_essay_status", "type": "text", "required": False, "help": "Drafting / revising / final."},
                    {"id": "personal_essay_word_count", "label": "Word count", "bind": "json", "path": "personal_essay_word_count", "type": "number", "required": False, "help": "Current word count (target around 650)."},
                    {"id": "personal_essay_focus", "label": "Main story focus", "bind": "json", "path": "personal_essay_focus", "type": "text", "required": False, "help": "Short sentence about your main narrative."},
                ],
            },
            {
                "key": "additional_information",
                "title": "Additional Information",
                "fields": [
                    {"id": "additional_information", "label": "Additional information text", "bind": "json", "path": "additional_information", "type": "text", "required": False, "help": "Context not covered elsewhere in your application."},
                ],
            },
        ],
    }
