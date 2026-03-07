# Common App schema and field builders

def _choice_yes_no_field_options():
    return ["Yes", "No"]


def _build_current_year_courses_fields():
    subject_options = [
        "English",
        "Math",
        "Science",
        "Social Studies",
        "World Language",
        "Arts",
        "Computer Science",
        "Engineering",
        "Business",
        "Other",
    ]
    level_options = [
        "Regular/Standard",
        "Honors",
        "Advanced",
        "AP",
        "IB",
        "Dual Enrollment",
        "College Prep",
        "Other",
    ]
    count_options = [str(index) for index in range(1, 16)]

    fields = [
        {
            "id": "courses_report_count",
            "label": "How many courses would you like to report?",
            "bind": "json",
            "path": "courses_report_count",
            "type": "choice",
            "required": True,
            "options": count_options,
            "help": "Select total number of courses for this academic year.",
        },
        {
            "id": "course_scheduling_system",
            "label": "Please select the course scheduling system your institution is using.",
            "bind": "json",
            "path": "course_scheduling_system",
            "type": "choice",
            "required": True,
            "ui": "radio",
            "clearable": True,
            "options": ["Semester", "Trimester", "Quarter", "Yearly"],
            "help": "Choose the schedule type used by your school.",
        },
    ]

    for course_index in range(1, 16):
        show_values = [str(index) for index in range(course_index, 16)]
        fields.extend(
            [
                {
                    "id": f"course_{course_index}_subject",
                    "label": f"Course {course_index} subject",
                    "bind": "json",
                    "path": f"course_{course_index}_subject",
                    "type": "choice",
                    "required": False,
                    "required_if": {"field_id": "courses_report_count", "in": show_values},
                    "show_if": {"field_id": "courses_report_count", "in": show_values},
                    "options": subject_options,
                    "help": f"Select subject area for course {course_index}.",
                },
                {
                    "id": f"course_{course_index}_name",
                    "label": f"Course {course_index} name",
                    "bind": "json",
                    "path": f"course_{course_index}_name",
                    "type": "text",
                    "required": False,
                    "required_if": {"field_id": "courses_report_count", "in": show_values},
                    "show_if": {"field_id": "courses_report_count", "in": show_values},
                    "help": f"Enter official name of course {course_index}.",
                },
                {
                    "id": f"course_{course_index}_level",
                    "label": f"Course {course_index} level",
                    "bind": "json",
                    "path": f"course_{course_index}_level",
                    "type": "choice",
                    "required": False,
                    "required_if": {"field_id": "courses_report_count", "in": show_values},
                    "show_if": {"field_id": "courses_report_count", "in": show_values},
                    "options": level_options,
                    "help": f"Select level for course {course_index}.",
                },
                {
                    "id": f"course_{course_index}_schedule_semester",
                    "label": f"Course {course_index} schedule",
                    "bind": "json",
                    "path": f"course_{course_index}_schedule_semester",
                    "type": "choice",
                    "required": False,
                    "required_if": {
                        "all": [
                            {"field_id": "courses_report_count", "in": show_values},
                            {"field_id": "course_scheduling_system", "equals": "Semester"},
                        ]
                    },
                    "show_if": {
                        "all": [
                            {"field_id": "courses_report_count", "in": show_values},
                            {"field_id": "course_scheduling_system", "equals": "Semester"},
                        ]
                    },
                    "options": ["Full Year", "First Semester", "Second Semester"],
                    "help": f"Select schedule for course {course_index}.",
                },
                {
                    "id": f"course_{course_index}_schedule_trimester",
                    "label": f"Course {course_index} schedule",
                    "bind": "json",
                    "path": f"course_{course_index}_schedule_trimester",
                    "type": "choice",
                    "required": False,
                    "required_if": {
                        "all": [
                            {"field_id": "courses_report_count", "in": show_values},
                            {"field_id": "course_scheduling_system", "equals": "Trimester"},
                        ]
                    },
                    "show_if": {
                        "all": [
                            {"field_id": "courses_report_count", "in": show_values},
                            {"field_id": "course_scheduling_system", "equals": "Trimester"},
                        ]
                    },
                    "options": ["Full Year", "First Trimester", "Second Trimester", "Third Trimester"],
                    "help": f"Select schedule for course {course_index}.",
                },
                {
                    "id": f"course_{course_index}_schedule_quarter",
                    "label": f"Course {course_index} schedule",
                    "bind": "json",
                    "path": f"course_{course_index}_schedule_quarter",
                    "type": "choice",
                    "required": False,
                    "required_if": {
                        "all": [
                            {"field_id": "courses_report_count", "in": show_values},
                            {"field_id": "course_scheduling_system", "equals": "Quarter"},
                        ]
                    },
                    "show_if": {
                        "all": [
                            {"field_id": "courses_report_count", "in": show_values},
                            {"field_id": "course_scheduling_system", "equals": "Quarter"},
                        ]
                    },
                    "options": ["Full Year", "First Quarter", "Second Quarter", "Third Quarter", "Fourth Quarter"],
                    "help": f"Select schedule for course {course_index}.",
                },
                {
                    "id": f"course_{course_index}_schedule_yearly",
                    "label": f"Course {course_index} schedule",
                    "bind": "json",
                    "path": f"course_{course_index}_schedule_yearly",
                    "type": "choice",
                    "required": False,
                    "required_if": {
                        "all": [
                            {"field_id": "courses_report_count", "in": show_values},
                            {"field_id": "course_scheduling_system", "equals": "Yearly"},
                        ]
                    },
                    "show_if": {
                        "all": [
                            {"field_id": "courses_report_count", "in": show_values},
                            {"field_id": "course_scheduling_system", "equals": "Yearly"},
                        ]
                    },
                    "options": ["Full Year"],
                    "help": f"Select schedule for course {course_index}.",
                },
            ]
        )

    return fields


def _build_community_based_org_fields():
    organization_options = [
        "College prep nonprofit",
        "School counselor office",
        "Community mentorship program",
        "Government scholarship/advising program",
        "Private educational consultant",
        "Other",
    ]
    prefix_options = ["Dr.", "Mr.", "Ms.", "Mrs.", "Mx.", "Other"]
    phone_codes = ["+1", "+7", "+44", "+91", "+996", "+998", "+380"]

    fields = [
        {
            "id": "community_org_count",
            "label": "Indicate the number of community programs or organizations that have provided you with free assistance in your application process.",
            "bind": "json",
            "path": "community_org_count",
            "type": "choice",
            "required": True,
            "ui": "radio",
            "clearable": True,
            "options": ["0", "1", "2", "3"],
            "help": "Select how many organizations helped you.",
        }
    ]

    for index in range(1, 4):
        show_values = [str(v) for v in range(index, 4)]
        fields.extend(
            [
                {
                    "id": f"cbo_{index}_organization_type",
                    "label": "Organization from which you received the most help" if index == 1 else f"Organization {index}",
                    "bind": "json",
                    "path": f"cbo_{index}_organization_type",
                    "type": "choice",
                    "required": False,
                    "required_if": {"field_id": "community_org_count", "in": show_values},
                    "show_if": {"field_id": "community_org_count", "in": show_values},
                    "options": organization_options,
                    "help": "Choose the organization type.",
                },
                {
                    "id": f"cbo_{index}_advisor_prefix",
                    "label": "Prefix",
                    "bind": "json",
                    "path": f"cbo_{index}_advisor_prefix",
                    "type": "choice",
                    "required": False,
                    "show_if": {"field_id": "community_org_count", "in": show_values},
                    "options": prefix_options,
                    "help": "Counselor/advisor/mentor title.",
                },
                {
                    "id": f"cbo_{index}_advisor_first_name",
                    "label": "First name",
                    "bind": "json",
                    "path": f"cbo_{index}_advisor_first_name",
                    "type": "text",
                    "required": False,
                    "show_if": {"field_id": "community_org_count", "in": show_values},
                    "help": "Advisor first name.",
                },
                {
                    "id": f"cbo_{index}_advisor_last_name",
                    "label": "Last name",
                    "bind": "json",
                    "path": f"cbo_{index}_advisor_last_name",
                    "type": "text",
                    "required": False,
                    "show_if": {"field_id": "community_org_count", "in": show_values},
                    "help": "Advisor last name.",
                },
                {
                    "id": f"cbo_{index}_advisor_email",
                    "label": "Email",
                    "bind": "json",
                    "path": f"cbo_{index}_advisor_email",
                    "type": "text",
                    "required": False,
                    "show_if": {"field_id": "community_org_count", "in": show_values},
                    "help": "Advisor email address.",
                },
                {
                    "id": f"cbo_{index}_phone_country_code",
                    "label": "Phone country code",
                    "bind": "json",
                    "path": f"cbo_{index}_phone_country_code",
                    "type": "choice",
                    "required": False,
                    "show_if": {"field_id": "community_org_count", "in": show_values},
                    "options": phone_codes,
                    "help": "Phone includes country code, number, and extension.",
                },
                {
                    "id": f"cbo_{index}_phone_number",
                    "label": "Phone number",
                    "bind": "json",
                    "path": f"cbo_{index}_phone_number",
                    "type": "text",
                    "required": False,
                    "show_if": {"field_id": "community_org_count", "in": show_values},
                    "help": "Main phone number.",
                },
                {
                    "id": f"cbo_{index}_phone_extension",
                    "label": "Phone extension",
                    "bind": "json",
                    "path": f"cbo_{index}_phone_extension",
                    "type": "text",
                    "required": False,
                    "show_if": {"field_id": "community_org_count", "in": show_values},
                    "help": "Optional extension.",
                },
            ]
        )
    return fields
