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


def _build_activities_fields():
    activity_type_options = [
        "Arts",
        "Athletics: Club",
        "Athletics: JV/Varsity",
        "Career oriented",
        "Community service (volunteer)",
        "Computer/Technology",
        "Cultural",
        "Dance",
        "Debate/Speech",
        "Environmental",
        "Family responsibilities",
        "Foreign exchange",
        "Journalism/Publication",
        "JROTC",
        "LGBTQ",
        "Music: Instrumental",
        "Music: Vocal",
        "Religious",
        "Research",
        "Robotics",
        "School spirit",
        "Science/Math",
        "Social justice",
        "Student gov.",
        "Theater/Drama",
        "Work (paid)",
        "Other club/activity",
    ]
    participation_grade_levels = ["9", "10", "11", "12", "Post-graduate"]
    timing_options = ["During school year", "During school break", "All year"]
    count_options = [str(index) for index in range(1, 11)]

    fields = [
        {
            "id": "has_activities",
            "label": "Do you have any activities that you wish to report?",
            "bind": "json",
            "path": "has_activities",
            "type": "choice",
            "required": True,
            "ui": "radio",
            "clearable": True,
            "options": _choice_yes_no_field_options(),
            "help": "Choose Yes if you want to report extracurricular activities.",
        },
        {
            "id": "activities_count",
            "label": "How many activities would you like to report?",
            "bind": "json",
            "path": "activities_count",
            "type": "choice",
            "required": False,
            "required_if": {"field_id": "has_activities", "equals": "Yes"},
            "show_if": {"field_id": "has_activities", "equals": "Yes"},
            "options": count_options,
            "help": "List activities in order of importance to you, up to 10.",
        },
    ]

    for index in range(1, 11):
        show_values = [str(value) for value in range(index, 11)]
        shared_show = {
            "all": [
                {"field_id": "has_activities", "equals": "Yes"},
                {"field_id": "activities_count", "in": show_values},
            ]
        }
        fields.extend(
            [
                {
                    "id": f"activity_{index}_type",
                    "label": "Activity type",
                    "bind": "json",
                    "path": f"activity_{index}_type",
                    "type": "choice",
                    "required": False,
                    "required_if": shared_show,
                    "show_if": shared_show,
                    "options": activity_type_options,
                    "help": "Choose the category that best matches this activity.",
                },
                {
                    "id": f"activity_{index}_position",
                    "label": "Position/Leadership description (Max characters: 50)",
                    "bind": "json",
                    "path": f"activity_{index}_position",
                    "type": "text",
                    "required": False,
                    "required_if": shared_show,
                    "show_if": shared_show,
                    "help": "Example: Founder, Captain, Volunteer Tutor.",
                },
                {
                    "id": f"activity_{index}_organization",
                    "label": "Organization name (Max characters: 100)",
                    "bind": "json",
                    "path": f"activity_{index}_organization",
                    "type": "text",
                    "required": False,
                    "show_if": shared_show,
                    "help": "Name of the club, employer, team, or family responsibility context.",
                },
                {
                    "id": f"activity_{index}_description",
                    "label": "Please describe this activity, including what you accomplished and any recognition you received, etc. (Max characters: 150)",
                    "bind": "json",
                    "path": f"activity_{index}_description",
                    "type": "text",
                    "required": False,
                    "required_if": shared_show,
                    "show_if": shared_show,
                    "ui": "textarea",
                    "help": "Focus on impact, leadership, and measurable outcomes.",
                },
                {
                    "id": f"activity_{index}_grade_levels",
                    "label": "Participation grade levels",
                    "bind": "json",
                    "path": f"activity_{index}_grade_levels",
                    "type": "list",
                    "required": False,
                    "required_if": shared_show,
                    "show_if": shared_show,
                    "ui": "checkbox",
                    "options": participation_grade_levels,
                    "help": "Select all grade levels in which you participated.",
                },
                {
                    "id": f"activity_{index}_timing",
                    "label": "Timing of participation",
                    "bind": "json",
                    "path": f"activity_{index}_timing",
                    "type": "list",
                    "required": False,
                    "required_if": shared_show,
                    "show_if": shared_show,
                    "ui": "checkbox",
                    "options": timing_options,
                    "help": "Select all options that apply.",
                },
                {
                    "id": f"activity_{index}_hours_per_week",
                    "label": "Hours spent per week",
                    "bind": "json",
                    "path": f"activity_{index}_hours_per_week",
                    "type": "number",
                    "required": False,
                    "required_if": shared_show,
                    "show_if": shared_show,
                    "help": "Average weekly commitment for this activity.",
                },
                {
                    "id": f"activity_{index}_weeks_per_year",
                    "label": "Weeks spent per year",
                    "bind": "json",
                    "path": f"activity_{index}_weeks_per_year",
                    "type": "number",
                    "required": False,
                    "required_if": shared_show,
                    "show_if": shared_show,
                    "help": "Approximate number of weeks per year.",
                },
                {
                    "id": f"activity_{index}_continue_in_college",
                    "label": "I intend to participate in a similar activity in college.",
                    "bind": "json",
                    "path": f"activity_{index}_continue_in_college",
                    "type": "choice",
                    "required": False,
                    "required_if": shared_show,
                    "show_if": shared_show,
                    "ui": "radio",
                    "clearable": True,
                    "options": _choice_yes_no_field_options(),
                    "help": "Choose Yes if you plan to continue this type of activity in college.",
                },
            ]
        )

    return fields
