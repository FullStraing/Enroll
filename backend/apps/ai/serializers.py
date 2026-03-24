from rest_framework import serializers


SELECTION_ACTION_CHOICES = [
    "improve_clarity",
    "make_more_specific",
    "make_less_generic",
    "fix_grammar",
    "shorten",
    "review_only",
]


class EssayAiBaseSerializer(serializers.Serializer):
    essay_id = serializers.IntegerField(min_value=1)


class EssayStarterDraftRequestSerializer(EssayAiBaseSerializer):
    mode = serializers.CharField(required=False, default="starter_draft")

    def validate_mode(self, value: str):
        if value != "starter_draft":
            raise serializers.ValidationError("mode must be starter_draft.")
        return value


class EssaySelectionFeedbackRequestSerializer(EssayAiBaseSerializer):
    selected_text = serializers.CharField(max_length=800)
    selection_start = serializers.IntegerField(min_value=0)
    selection_end = serializers.IntegerField(min_value=1)
    action = serializers.ChoiceField(choices=SELECTION_ACTION_CHOICES)

    def validate(self, attrs):
        if attrs["selection_end"] <= attrs["selection_start"]:
            raise serializers.ValidationError({"selection_end": "selection_end must be greater than selection_start."})
        if not attrs["selected_text"].strip():
            raise serializers.ValidationError({"selected_text": "Select some text first."})
        return attrs


class EssayExplainPromptRequestSerializer(EssayAiBaseSerializer):
    pass


class EssayOutlineRequestSerializer(EssayAiBaseSerializer):
    pass


class EssayStarterDraftResponseSerializer(serializers.Serializer):
    draft_title = serializers.CharField()
    draft_content = serializers.CharField()
    rationale = serializers.CharField()
    tone_notes = serializers.CharField()
    word_count_estimate = serializers.IntegerField(min_value=0)


class EssaySelectionFeedbackResponseSerializer(serializers.Serializer):
    verdict = serializers.ChoiceField(choices=["keep", "revise"])
    message = serializers.CharField()
    suggested_text = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    why = serializers.CharField()
    confidence = serializers.FloatField(min_value=0, max_value=1)


class EssayExplainPromptResponseSerializer(serializers.Serializer):
    plain_english_summary = serializers.CharField()
    what_the_school_is_asking = serializers.CharField()
    avoid = serializers.ListField(child=serializers.CharField(), allow_empty=True)
    must_cover = serializers.ListField(child=serializers.CharField(), allow_empty=True)
    good_angle_examples = serializers.ListField(child=serializers.CharField(), allow_empty=True)


class EssayOutlineResponseSerializer(serializers.Serializer):
    recommended_angle = serializers.CharField()
    alternatives = serializers.ListField(child=serializers.CharField(), allow_empty=True)
    outline_points = serializers.ListField(child=serializers.CharField(), allow_empty=True)
    opening_idea = serializers.CharField()
    risks_to_avoid = serializers.ListField(child=serializers.CharField(), allow_empty=True)
