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
                    {"id": "full_name", "label": "Full legal name", "bind": "model", "path": "full_name", "type": "text", "required": True, "help": "As in passport."},
                    {"id": "graduation_year", "label": "Graduation year", "bind": "model", "path": "graduation_year", "type": "number", "required": True, "help": "Expected high school graduation year."},
                ],
            },
            {
                "key": "address",
                "title": "Address",
                "fields": [
                    {"id": "country", "label": "Country", "bind": "model", "path": "country", "type": "text", "required": True, "help": "Current country of residence."},
                    {"id": "city", "label": "City", "bind": "json", "path": "city", "type": "text", "required": False, "help": "City for mailing address."},
                ],
            },
            {
                "key": "contact_details",
                "title": "Contact Details",
                "fields": [
                    {"id": "email", "label": "Email", "bind": "user", "path": "email", "type": "text", "required": True, "readonly": True, "help": "Primary contact email."},
                    {"id": "phone", "label": "Phone", "bind": "json", "path": "phone", "type": "text", "required": False, "help": "Use international format."},
                ],
            },
            {
                "key": "demographics",
                "title": "Demographics",
                "fields": [
                    {"id": "gender_identity", "label": "Gender identity", "bind": "json", "path": "gender_identity", "type": "text", "required": False, "help": "Optional in many flows."},
                    {"id": "ethnicity", "label": "Ethnicity", "bind": "json", "path": "ethnicity", "type": "text", "required": False, "help": "Optional demographic field."},
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
