from ..builders import _choice_yes_no_field_options, _build_current_year_courses_fields, _build_community_based_org_fields

TESTING_SECTION =     {
        "key": "testing",
        "title": "Testing",
        "subsections": [
            {
                "key": "tests_taken",
                "title": "Tests Taken",
                "fields": [
                    {"id": "sat_total", "label": "SAT total score", "bind": "model", "path": "sat_total", "type": "number", "required": False, "help": "Highest SAT score you plan to report."},
                    {"id": "sat_date", "label": "SAT test date", "bind": "model", "path": "sat_date", "type": "text", "required": False, "help": "Format: YYYY-MM-DD."},
                    {"id": "toefl_total", "label": "TOEFL total", "bind": "model", "path": "toefl_total", "type": "number", "required": False, "help": "If applicable for international applicant."},
                    {"id": "ielts_overall", "label": "IELTS overall", "bind": "model", "path": "ielts_overall", "type": "number", "required": False, "help": "If you submit IELTS score."},
                    {"id": "det_score", "label": "DET score", "bind": "model", "path": "det_score", "type": "number", "required": False, "help": "Duolingo English Test (if used)."},
                    {"id": "testing_notes", "label": "Testing notes", "bind": "json", "path": "testing_notes", "type": "text", "required": False, "help": "Superscore, future test dates, or score context."},
                ],
            },
        ],
    }
