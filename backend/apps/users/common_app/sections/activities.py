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
                    {
                        "id": "responsibilities_4plus_hours",
                        "label": "Please select which responsibilities you spend 4 or more hours per week doing.",
                        "bind": "json",
                        "path": "responsibilities_4plus_hours",
                        "type": "list",
                        "required": True,
                        "ui": "checkbox",
                        "options": [
                            "Assisting family or household members with tasks such as doctors’ appointments, bank visits, or visa interviews",
                            "Farm work or unpaid work for a family business",
                            "Interpreting or translating for family or household members",
                            "Managing family or household finances, budget, or paying bills",
                            "Providing transportation for family or household members",
                            "Taking care of sick, disabled, and/or elderly members of my family or household",
                            "Taking care of younger family or household members",
                            "Taking care of my own child or children",
                            "Working at a paid job to contribute to my household’s income",
                            "Other",
                            "None of these",
                        ],
                        "help": "Select all that apply.",
                    },
                    {
                        "id": "circumstances_experienced",
                        "label": "Please select which circumstances you’ve experienced.",
                        "bind": "json",
                        "path": "circumstances_experienced",
                        "type": "list",
                        "required": True,
                        "ui": "checkbox",
                        "options": [
                            "Commuting 60 minutes or more to and from school each day",
                            "Experiencing homelessness or another unstable living situation",
                            "Living without consistent heat, power, water, or access to food",
                            "Living without reliable or usable internet",
                            "Living independently or living on my own (not including boarding school)",
                            "None of these",
                        ],
                        "help": "Select all that apply.",
                    },
                ],
            },
        ],
    }
