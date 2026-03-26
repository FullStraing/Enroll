from __future__ import annotations

from typing import Any

from apps.universities.models import University

from .models import CommunityGroup, CommunityGroupLink


SEED_GROUPS: list[dict[str, Any]] = [
    {
        "slug": "kyrgyzstan-applicants",
        "title": "Kyrgyzstan Applicants",
        "description": "Questions, timelines, and examples for students applying from Kyrgyzstan.",
        "group_type": "country",
        "sort_order": 10,
        "metadata": {
            "audience": "Students applying from Kyrgyzstan to U.S. universities.",
            "rules": [
                "Keep discussions admissions-specific.",
                "Share timelines, essays process, and document advice.",
            ],
            "resources": ["Visa prep", "Financial docs", "Common App tips"],
            "country_key": "kyrgyzstan",
        },
    },
    {
        "slug": "kazakhstan-applicants",
        "title": "Kazakhstan Applicants",
        "description": "Admissions-focused support for students applying from Kazakhstan.",
        "group_type": "country",
        "sort_order": 11,
        "metadata": {
            "audience": "Applicants from Kazakhstan planning U.S. admissions.",
            "rules": ["Share useful deadlines and advice.", "Keep posts specific and actionable."],
            "resources": ["Testing plan", "Essay help", "Recommendation tips"],
            "country_key": "kazakhstan",
        },
    },
    {
        "slug": "uzbekistan-applicants",
        "title": "Uzbekistan Applicants",
        "description": "A support group for students applying from Uzbekistan.",
        "group_type": "country",
        "sort_order": 12,
        "metadata": {
            "audience": "Applicants from Uzbekistan building a U.S. application strategy.",
            "rules": ["Keep it admissions-only.", "Share concrete examples over generic advice."],
            "resources": ["Transcript prep", "Financial aid questions", "Country-specific issues"],
            "country_key": "uzbekistan",
        },
    },
    {
        "slug": "fall-2027-applicants",
        "title": "Fall 2027 Applicants",
        "description": "Deadlines, timelines, and pacing help for the Fall 2027 cycle.",
        "group_type": "intake",
        "sort_order": 20,
        "metadata": {
            "audience": "Students targeting a Fall 2027 intake.",
            "rules": ["Use this group for timeline and planning questions."],
            "resources": ["Monthly checklist", "Deadline reminders", "Application pacing"],
            "intake_key": "2027",
        },
    },
    {
        "slug": "essay-help",
        "title": "Essay Help",
        "description": "Discuss prompts, brainstorming, outlines, and essay revision strategy.",
        "group_type": "topic",
        "sort_order": 30,
        "metadata": {
            "audience": "Students who want guidance on writing stronger essays.",
            "rules": ["No ghostwriting requests.", "Focus on structure, clarity, and reflection."],
            "resources": ["Prompt analysis", "Outline ideas", "Revision feedback"],
            "topic_key": "essay_help",
        },
    },
    {
        "slug": "financial-aid",
        "title": "Financial Aid",
        "description": "Questions about aid, affordability, sponsor letters, and budgeting.",
        "group_type": "topic",
        "sort_order": 31,
        "metadata": {
            "audience": "Students comparing cost and aid options.",
            "rules": ["Share sources and specifics when possible."],
            "resources": ["Aid forms", "Sponsor docs", "Budget planning"],
            "topic_key": "financial_aid",
        },
    },
    {
        "slug": "visa-and-interviews",
        "title": "Visa and Interviews",
        "description": "Advice on interview prep, visa stages, and next steps after admission.",
        "group_type": "topic",
        "sort_order": 32,
        "metadata": {
            "audience": "Applicants who want clarity on post-admit logistics.",
            "rules": ["Keep guidance practical and country-aware."],
            "resources": ["Visa checklist", "Interview tips"],
            "topic_key": "visa",
        },
    },
    {
        "slug": "recommendations",
        "title": "Recommendations",
        "description": "How to ask, follow up, and prepare strong recommendation packets.",
        "group_type": "topic",
        "sort_order": 33,
        "metadata": {
            "audience": "Students working on recommendation strategy and timing.",
            "rules": ["Share what actually helped your recommenders."],
            "resources": ["Teacher outreach", "Brag sheet tips"],
            "topic_key": "recommendations",
        },
    },
    {
        "slug": "brown-applicants",
        "title": "Brown Applicants",
        "description": "Deadlines, supplements, and strategy for students applying to Brown.",
        "group_type": "university",
        "sort_order": 40,
        "metadata": {
            "audience": "Applicants building a Brown application.",
            "rules": ["Keep discussion relevant to Brown-specific requirements."],
            "resources": ["Supplement ideas", "Deadline reminders"],
            "university_names": ["Brown University"],
        },
    },
    {
        "slug": "columbia-applicants",
        "title": "Columbia Applicants",
        "description": "Support for students applying to Columbia University.",
        "group_type": "university",
        "sort_order": 41,
        "metadata": {
            "audience": "Applicants working on a Columbia application.",
            "rules": ["Stay specific to Columbia prompts and timing."],
            "resources": ["Short answer strategy", "Application pacing"],
            "university_names": ["Columbia University", "Columbia university"],
        },
    },
    {
        "slug": "princeton-applicants",
        "title": "Princeton Applicants",
        "description": "A focused space for Princeton-specific admissions questions.",
        "group_type": "university",
        "sort_order": 42,
        "metadata": {
            "audience": "Students building a Princeton application.",
            "rules": ["Ask focused questions that others can reuse."],
            "resources": ["Supplements", "Timeline planning"],
            "university_names": ["Princeton University", "Princeton"],
        },
    },
]


def ensure_seeded_groups():
    for item in SEED_GROUPS:
        group, created = CommunityGroup.objects.get_or_create(
            slug=item["slug"],
            defaults={
                "title": item["title"],
                "description": item["description"],
                "group_type": item["group_type"],
                "visibility": "members_only",
                "metadata": item["metadata"],
                "sort_order": item["sort_order"],
                "is_active": True,
            },
        )

        if not created:
            continue

        metadata = item["metadata"]
        if country_key := metadata.get("country_key"):
            CommunityGroupLink.objects.get_or_create(group=group, country_key=country_key)
        if intake_key := metadata.get("intake_key"):
            CommunityGroupLink.objects.get_or_create(group=group, intake_key=intake_key)
        if topic_key := metadata.get("topic_key"):
            CommunityGroupLink.objects.get_or_create(group=group, topic_key=topic_key)

        for university_name in metadata.get("university_names", []):
            university = University.objects.filter(name__iexact=university_name).first()
            if university:
                CommunityGroupLink.objects.get_or_create(group=group, university=university)
