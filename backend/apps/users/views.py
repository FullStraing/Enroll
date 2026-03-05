from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, StudentProfileSerializer
from .models import StudentProfile

COMMON_APP_SCHEMA = [
    {
        "key": "profile",
        "title": "Profile",
        "subsections": [
            {
                "key": "personal_information",
                "title": "Personal Information",
                "fields": [
                    {"id": "legal_first_name", "label": "Legal first/given name", "bind": "json", "path": "legal_first_name", "type": "text", "required": True, "help": "Use the exact first name from legal documents."},
                    {
                        "id": "has_preferred_first_name",
                        "label": "Use a different first name people call you?",
                        "bind": "json",
                        "path": "has_preferred_first_name",
                        "type": "choice",
                        "required": True,
                        "options": ["Yes", "No"],
                        "help": "If yes, fill preferred first name below.",
                    },
                    {"id": "preferred_first_name", "label": "Preferred first name", "bind": "json", "path": "preferred_first_name", "type": "text", "required": False, "help": "Optional nickname/used first name."},
                    {"id": "middle_name", "label": "Middle name", "bind": "json", "path": "middle_name", "type": "text", "required": False, "help": "Leave blank if not applicable."},
                    {"id": "last_name", "label": "Last/family/surname", "bind": "json", "path": "last_name", "type": "text", "required": True, "help": "Use family name from passport/legal docs."},
                    {
                        "id": "suffix",
                        "label": "Suffix",
                        "bind": "json",
                        "path": "suffix",
                        "type": "choice",
                        "required": False,
                        "options": ["None", "Jr.", "Sr.", "II", "III", "IV"],
                        "help": "Select only if part of your legal name.",
                    },
                    {
                        "id": "former_legal_name_materials",
                        "label": "Any materials under a former legal name?",
                        "bind": "json",
                        "path": "former_legal_name_materials",
                        "type": "choice",
                        "required": True,
                        "options": ["Yes", "No"],
                        "help": "For example, records under a maiden/previous legal name.",
                    },
                    {"id": "date_of_birth", "label": "Date of birth", "bind": "json", "path": "date_of_birth", "type": "date", "required": True, "help": "Use format YYYY-MM-DD."},
                ],
            },
            {
                "key": "address",
                "title": "Address",
                "fields": [
                    {"id": "permanent_line1", "label": "Permanent home address line 1", "bind": "json", "path": "permanent_line1", "type": "text", "required": True, "help": "Street and building details."},
                    {"id": "permanent_line2", "label": "Permanent home address line 2", "bind": "json", "path": "permanent_line2", "type": "text", "required": False, "help": "Apartment, unit, etc. (optional)."},
                    {"id": "permanent_city", "label": "City", "bind": "json", "path": "permanent_city", "type": "text", "required": True, "help": "City of permanent residence."},
                    {"id": "permanent_state_region", "label": "State/Region", "bind": "json", "path": "permanent_state_region", "type": "text", "required": False, "help": "State/province/region if applicable."},
                    {"id": "permanent_postal_code", "label": "Postal code", "bind": "json", "path": "permanent_postal_code", "type": "text", "required": False, "help": "ZIP/postal code."},
                    {"id": "country", "label": "Country", "bind": "model", "path": "country", "type": "text", "required": True, "help": "Country of permanent residence."},
                    {
                        "id": "alternate_mailing_address",
                        "label": "Alternate mailing address",
                        "bind": "json",
                        "path": "alternate_mailing_address",
                        "type": "choice",
                        "required": True,
                        "options": ["No alternate address", "Send mail to a temporary or alternate address"],
                        "help": "Choose if you want mail sent to a different address.",
                    },
                    {"id": "alternate_line1", "label": "Alternate address line 1", "bind": "json", "path": "alternate_line1", "type": "text", "required": False, "help": "Fill only if alternate address is used."},
                    {"id": "alternate_city", "label": "Alternate city", "bind": "json", "path": "alternate_city", "type": "text", "required": False, "help": "Fill only if alternate address is used."},
                    {"id": "alternate_country", "label": "Alternate country", "bind": "json", "path": "alternate_country", "type": "text", "required": False, "help": "Fill only if alternate address is used."},
                ],
            },
            {
                "key": "contact_details",
                "title": "Contact Details",
                "fields": [
                    {"id": "email", "label": "Email", "bind": "user", "path": "email", "type": "text", "required": True, "readonly": True, "help": "Primary contact email."},
                    {
                        "id": "preferred_phone_type",
                        "label": "Preferred phone",
                        "bind": "json",
                        "path": "preferred_phone_type",
                        "type": "choice",
                        "required": True,
                        "options": ["Home", "Mobile"],
                        "help": "Primary phone type for colleges to contact you.",
                    },
                    {"id": "preferred_phone_country_code", "label": "Preferred phone country code", "bind": "json", "path": "preferred_phone_country_code", "type": "text", "required": False, "help": "For example +996, +1."},
                    {"id": "preferred_phone_number", "label": "Preferred phone number", "bind": "json", "path": "preferred_phone_number", "type": "text", "required": True, "help": "Include number without spaces/symbols if possible."},
                    {
                        "id": "alternate_phone_type",
                        "label": "Alternate phone",
                        "bind": "json",
                        "path": "alternate_phone_type",
                        "type": "choice",
                        "required": True,
                        "options": ["No other telephone", "Home", "Mobile"],
                        "help": "Set backup phone option if needed.",
                    },
                    {"id": "alternate_phone_country_code", "label": "Alternate phone country code", "bind": "json", "path": "alternate_phone_country_code", "type": "text", "required": False, "help": "Only if alternate phone is provided."},
                    {"id": "alternate_phone_number", "label": "Alternate phone number", "bind": "json", "path": "alternate_phone_number", "type": "text", "required": False, "help": "Only if alternate phone is provided."},
                ],
            },
            {
                "key": "demographics",
                "title": "Demographics",
                "fields": [
                    {
                        "id": "gender",
                        "label": "Gender identity",
                        "bind": "json",
                        "path": "gender",
                        "type": "list",
                        "required": False,
                        "help": "Possible values: Female, Male, Nonbinary, Add another gender.",
                    },
                    {
                        "id": "legal_sex",
                        "label": "Legal sex",
                        "bind": "json",
                        "path": "legal_sex",
                        "type": "choice",
                        "required": True,
                        "options": ["Female", "Male", "X or another legal sex"],
                        "help": "Use your legal document designation.",
                    },
                    {
                        "id": "pronouns",
                        "label": "Pronouns",
                        "bind": "json",
                        "path": "pronouns",
                        "type": "list",
                        "required": False,
                        "help": "Examples: He/Him, She/Her, They/Them.",
                    },
                    {
                        "id": "us_armed_forces_status",
                        "label": "U.S. Armed Forces status",
                        "bind": "json",
                        "path": "us_armed_forces_status",
                        "type": "choice",
                        "required": False,
                        "options": ["None", "Currently Serving", "Previously Served", "Current Dependent"],
                        "help": "Select the option that best describes your status.",
                    },
                    {
                        "id": "is_hispanic_latino",
                        "label": "Are you Hispanic or Latino/a/x?",
                        "bind": "json",
                        "path": "is_hispanic_latino",
                        "type": "choice",
                        "required": True,
                        "options": ["Yes", "No"],
                        "help": "Common App demographic self-identification.",
                    },
                    {
                        "id": "race_ethnicity",
                        "label": "Race / ethnicity (select one or more)",
                        "bind": "json",
                        "path": "race_ethnicity",
                        "type": "list",
                        "required": False,
                        "help": "Examples: American Indian or Alaska Native, Asian, Black or African American, Native Hawaiian or Other Pacific Islander, White.",
                    },
                ],
            },
            {
                "key": "language",
                "title": "Language",
                "fields": [
                    {"id": "native_language", "label": "Native language", "bind": "json", "path": "native_language", "type": "text", "required": False, "help": "Primary language at home."},
                    {"id": "english_proficiency", "label": "English proficiency tests", "bind": "json", "path": "english_proficiency", "type": "text", "required": False, "help": "TOEFL/IELTS/DET context."},
                ],
            },
            {
                "key": "geography_nationality",
                "title": "Geography and Nationality",
                "fields": [
                    {"id": "target_country", "label": "Target country", "bind": "model", "path": "target_country", "type": "text", "required": True, "help": "Country where you apply."},
                    {"id": "citizenship", "label": "Citizenship", "bind": "json", "path": "citizenship", "type": "text", "required": False, "help": "Your citizenship status."},
                ],
            },
            {
                "key": "fee_waiver",
                "title": "Common App Fee Waiver",
                "fields": [
                    {"id": "fee_waiver_needed", "label": "Need fee waiver?", "bind": "json", "path": "fee_waiver_needed", "type": "boolean", "required": False, "help": "Select if you need fee waiver request."},
                ],
            },
        ],
    },
    {
        "key": "family",
        "title": "Family",
        "subsections": [
            {
                "key": "household",
                "title": "Household",
                "fields": [
                    {"id": "household_size", "label": "Household size", "bind": "json", "path": "household_size", "type": "number", "required": False, "help": "Total people in household."},
                    {"id": "household_income_band", "label": "Household income band", "bind": "json", "path": "household_income_band", "type": "text", "required": False, "help": "Approximate range if known."},
                ],
            },
            {
                "key": "parent_1",
                "title": "Parent 1",
                "fields": [
                    {"id": "parent1_education", "label": "Highest education", "bind": "json", "path": "parent1_education", "type": "text", "required": False, "help": "Highest completed level."},
                ],
            },
            {
                "key": "parent_2",
                "title": "Parent 2",
                "fields": [
                    {"id": "parent2_education", "label": "Highest education", "bind": "json", "path": "parent2_education", "type": "text", "required": False, "help": "Highest completed level."},
                ],
            },
            {
                "key": "sibling",
                "title": "Sibling",
                "fields": [
                    {"id": "sibling_count", "label": "Number of siblings", "bind": "json", "path": "sibling_count", "type": "number", "required": False, "help": "Include step/half if required by your strategy."},
                ],
            },
        ],
    },
    {
        "key": "education",
        "title": "Education",
        "subsections": [
            {
                "key": "current_school",
                "title": "Current or Most Recent Secondary/High School",
                "fields": [
                    {"id": "school_name", "label": "School name", "bind": "model", "path": "school_name", "type": "text", "required": True, "help": "Official school name."},
                    {"id": "intended_major", "label": "Intended major", "bind": "model", "path": "intended_major", "type": "text", "required": True, "help": "Planned academic major."},
                ],
            },
            {
                "key": "other_schools",
                "title": "Other Secondary/High Schools",
                "fields": [
                    {"id": "other_schools", "label": "Other schools history", "bind": "json", "path": "other_schools", "type": "text", "required": False, "help": "List previous schools if applicable."},
                ],
            },
            {
                "key": "colleges_universities",
                "title": "Colleges & Universities",
                "fields": [
                    {"id": "college_coursework", "label": "Any college coursework?", "bind": "json", "path": "college_coursework", "type": "boolean", "required": False, "help": "Mark if dual enrollment exists."},
                ],
            },
            {
                "key": "grades",
                "title": "Grades",
                "fields": [
                    {"id": "gpa", "label": "GPA", "bind": "model", "path": "gpa", "type": "number", "required": True, "help": "Use unweighted 4.0 if available."},
                    {"id": "grades_summary", "label": "Grades summary", "bind": "model", "path": "grades_summary", "type": "text", "required": False, "help": "Short context for grading scale/rigor."},
                ],
            },
            {
                "key": "current_year_courses",
                "title": "Current or Most Recent Year Courses",
                "fields": [
                    {"id": "current_year_courses", "label": "Current courses", "bind": "json", "path": "current_year_courses", "type": "text", "required": False, "help": "List major/current courses."},
                ],
            },
            {
                "key": "honors",
                "title": "Honors",
                "fields": [
                    {"id": "honors", "label": "Honors list", "bind": "model", "path": "honors", "type": "list", "required": False, "help": "Awards and distinctions."},
                ],
            },
            {
                "key": "community_based_orgs",
                "title": "Community-Based Organizations",
                "fields": [
                    {"id": "community_orgs", "label": "Community organizations", "bind": "json", "path": "community_orgs", "type": "text", "required": False, "help": "Programs supporting your college process."},
                ],
            },
            {
                "key": "future_plans",
                "title": "Future Plans",
                "fields": [
                    {"id": "future_plans", "label": "Future plans", "bind": "json", "path": "future_plans", "type": "text", "required": False, "help": "Post-college or career intent."},
                ],
            },
        ],
    },
    {
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
    },
    {
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
    },
    {
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
    },
]


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


def _resolve_value(profile: StudentProfile, field_config: dict):
    bind = field_config.get("bind")
    path = field_config.get("path")
    if bind == "model":
        return getattr(profile, path, None)
    if bind == "user":
        return getattr(profile.user, path, None)
    return (profile.common_app_profile or {}).get(path)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class StudentProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = StudentProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = StudentProfile.objects.get_or_create(user=self.request.user)
        return profile


class CommonAppProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = StudentProfile.objects.get_or_create(user=request.user)
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

                for field in subsection["fields"]:
                    value = _resolve_value(profile, field)
                    required = bool(field.get("required", False))
                    filled = _is_filled(value)
                    if required:
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
        return Response(
            {
                "overall": {
                    "completed_required": total_completed,
                    "required_total": total_required,
                    "percent": overall_percent,
                },
                "sections": sections_payload,
            }
        )


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not old_password or not new_password:
            return Response(
                {"detail": "Укажите текущий и новый пароль."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        if not user.check_password(old_password):
            return Response(
                {"detail": "Текущий пароль неверный."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password, user)
        except ValidationError as exc:
            return Response(
                {"detail": exc.messages},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])
        return Response({"detail": "Пароль обновлён."})
