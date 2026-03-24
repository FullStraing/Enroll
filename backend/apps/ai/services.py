import json
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from django.conf import settings
from rest_framework import serializers

from apps.ai.serializers import (
    EssayExplainPromptResponseSerializer,
    EssayOutlineResponseSerializer,
    EssaySelectionFeedbackResponseSerializer,
    EssayStarterDraftResponseSerializer,
)


class AiProviderError(Exception):
    def __init__(
        self,
        message: str,
        *,
        error_type: str = "provider_error",
        latency_ms: int | None = None,
        provider: str | None = None,
        model: str | None = None,
    ):
        super().__init__(message)
        self.error_type = error_type
        self.latency_ms = latency_ms
        self.provider = provider
        self.model = model


def _validate_json_response(serializer_cls: type[serializers.Serializer], data: dict[str, Any]):
    serializer = serializer_cls(data=data)
    serializer.is_valid(raise_exception=True)
    return serializer.validated_data


def _extract_openai_output_text(payload: dict[str, Any]) -> str:
    output_text = payload.get("output_text")
    if isinstance(output_text, str) and output_text.strip():
        return output_text

    for item in payload.get("output", []):
        if item.get("type") != "message":
            continue
        for content in item.get("content", []):
            text = content.get("text")
            if isinstance(text, str) and text.strip():
                return text

    raise AiProviderError(
        "AI provider returned no text output.",
        error_type="empty_output",
        provider="openai",
    )


def _extract_gemini_output_text(payload: dict[str, Any]) -> str:
    for candidate in payload.get("candidates", []):
        content = candidate.get("content", {})
        for part in content.get("parts", []):
            text = part.get("text")
            if isinstance(text, str) and text.strip():
                return text

    prompt_feedback = payload.get("promptFeedback", {})
    block_reason = prompt_feedback.get("blockReason")
    if block_reason:
        raise AiProviderError(
            f"Gemini blocked the request: {block_reason}",
            error_type="blocked",
            provider="gemini",
        )

    raise AiProviderError(
        "AI provider returned no text output.",
        error_type="empty_output",
        provider="gemini",
    )


def _read_error_message(error: urllib.error.HTTPError) -> str:
    try:
        error_payload = json.loads(error.read().decode("utf-8"))
        return error_payload.get("error", {}).get("message") or str(error.reason)
    except Exception:
        return str(error.reason)


def _call_openai_json(*, model: str, system_prompt: str, user_payload: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    provider = "openai"
    if not settings.OPENAI_API_KEY:
        raise AiProviderError("OpenAI is not configured yet.", error_type="not_configured", provider=provider, model=model)

    body = {
        "model": model,
        "store": False,
        "text": {
            "format": {
                "type": "json_object",
            }
        },
        "input": [
            {
                "role": "system",
                "content": [{"type": "input_text", "text": system_prompt}],
            },
            {
                "role": "user",
                "content": [{"type": "input_text", "text": json.dumps(user_payload, ensure_ascii=False)}],
            },
        ],
    }
    request = urllib.request.Request(
        settings.OPENAI_RESPONSES_URL,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    started_at = time.perf_counter()
    try:
        with urllib.request.urlopen(request, timeout=settings.AI_TIMEOUT_SECONDS) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        latency_ms = int((time.perf_counter() - started_at) * 1000)
        raise AiProviderError(
            f"AI request failed: {_read_error_message(error)}",
            error_type="http_error",
            latency_ms=latency_ms,
            provider=provider,
            model=model,
        ) from error
    except Exception as error:
        latency_ms = int((time.perf_counter() - started_at) * 1000)
        raise AiProviderError(
            "AI request failed. Please try again.",
            error_type="request_failed",
            latency_ms=latency_ms,
            provider=provider,
            model=model,
        ) from error

    latency_ms = int((time.perf_counter() - started_at) * 1000)
    text = _extract_openai_output_text(payload)
    try:
        return json.loads(text), {
            "provider": provider,
            "model": model,
            "latency_ms": latency_ms,
            "response_id": payload.get("id"),
        }
    except json.JSONDecodeError as error:
        raise AiProviderError(
            "AI returned invalid JSON.",
            error_type="invalid_json",
            latency_ms=latency_ms,
            provider=provider,
            model=model,
        ) from error


def _call_gemini_json(*, model: str, system_prompt: str, user_payload: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    provider = "gemini"
    if not settings.GEMINI_API_KEY:
        raise AiProviderError("Gemini is not configured yet.", error_type="not_configured", provider=provider, model=model)

    url = settings.GEMINI_API_URL_TEMPLATE.format(
        model=urllib.parse.quote(model, safe=""),
        api_key=urllib.parse.quote(settings.GEMINI_API_KEY, safe=""),
    )
    body = {
        "system_instruction": {
            "parts": [{"text": system_prompt}],
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": json.dumps(user_payload, ensure_ascii=False)}],
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.4,
        },
    }
    request = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    started_at = time.perf_counter()
    try:
        with urllib.request.urlopen(request, timeout=settings.AI_TIMEOUT_SECONDS) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        latency_ms = int((time.perf_counter() - started_at) * 1000)
        raise AiProviderError(
            f"AI request failed: {_read_error_message(error)}",
            error_type="http_error",
            latency_ms=latency_ms,
            provider=provider,
            model=model,
        ) from error
    except Exception as error:
        latency_ms = int((time.perf_counter() - started_at) * 1000)
        raise AiProviderError(
            "AI request failed. Please try again.",
            error_type="request_failed",
            latency_ms=latency_ms,
            provider=provider,
            model=model,
        ) from error

    latency_ms = int((time.perf_counter() - started_at) * 1000)
    text = _extract_gemini_output_text(payload)
    try:
        return json.loads(text), {
            "provider": provider,
            "model": model,
            "latency_ms": latency_ms,
            "response_id": payload.get("responseId") or payload.get("modelVersion"),
        }
    except json.JSONDecodeError as error:
        raise AiProviderError(
            "AI returned invalid JSON.",
            error_type="invalid_json",
            latency_ms=latency_ms,
            provider=provider,
            model=model,
        ) from error


def _call_ai_json(*, model: str, system_prompt: str, user_payload: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    provider = settings.AI_PROVIDER
    if provider == "gemini":
        return _call_gemini_json(model=model, system_prompt=system_prompt, user_payload=user_payload)
    if provider == "openai":
        return _call_openai_json(model=model, system_prompt=system_prompt, user_payload=user_payload)
    raise AiProviderError(f"Unsupported AI provider: {provider}", error_type="invalid_provider", provider=provider, model=model)


def generate_starter_draft(*, context: dict[str, Any]):
    system_prompt = """
You are an admissions essay coach.
Return JSON only.

Task:
- Generate a SHORT starter draft for a student's essay.
- It must reduce blank-page fear and provide a possible direction.
- It must NOT sound final, polished, admissions-ready, or overly impressive.
- Keep it intentionally incomplete, lightweight, and human.
- Aim for 120 to 180 words unless the target word count is below that.
- Follow the essay language implied by the prompt and existing draft.
- Read generation_mode carefully:
  - fresh_angle: ignore the structure of current_draft and produce a different plausible starting direction
  - build_on_my_draft: use the strongest idea already present in current_draft and REWRITE it into a cleaner short starter draft
- If generation_mode is build_on_my_draft, do not append a new paragraph to the end. Produce a compact rewritten starter version instead.
- If there is no meaningful current_draft, fresh_angle is the fallback behavior.
- Respect user preferences when they are present:
  - tone: reflective, direct, warm, or confident
  - focus: auto, challenge, growth, leadership, community_impact, academic_fit
  - revision_goal: clarity, specificity, stronger_opening, deeper_reflection
  - context_note: short user note about what to preserve or emphasize
- For fresh_angle, use tone + focus + context_note to choose the direction.
- For build_on_my_draft, use tone + revision_goal + context_note to improve the student's existing material.
- If context_note includes a concrete detail, topic, activity, or theme, explicitly use it.
- Never invent a completely new central story, person, or event unless it already exists in current_draft or context_note.
- In build_on_my_draft mode, the new draft must still feel anchored to the user's real material.
- Do not add meta commentary inside the draft.
- Prefer a simple, concrete first-person voice.
- Do not try to conclude the whole essay. Leave room for the student to continue.
- Keep the draft to one or two short paragraphs.

Output keys:
- draft_title
- draft_content
- summary
- why_it_works
- what_admissions_reads_for
- next_steps
- generation_mode
- word_count_estimate

Formatting rules:
- draft_title: max 5 words
- summary: max 18 words, one compact sentence
- why_it_works: max 30 words, one compact sentence
- what_admissions_reads_for: 2 to 3 short bullet-ready phrases
- next_steps: 2 to 3 short bullet-ready actions
- generation_mode: echo either fresh_angle or build_on_my_draft
- draft_content: plain text only
""".strip()
    raw, meta = _call_ai_json(
        model=settings.AI_ESSAY_COMPLEX_MODEL,
        system_prompt=system_prompt,
        user_payload=context,
    )
    return _validate_json_response(EssayStarterDraftResponseSerializer, raw), meta


def generate_selection_feedback(*, context: dict[str, Any]):
    system_prompt = """
You are an admissions essay sentence coach.
Return JSON only.

Task:
- Review ONLY the selected text.
- If the text is already strong, say so and avoid rewriting.
- If it needs improvement, return one targeted revision only.
- Do not rewrite anything outside the selected span.
- Preserve the language of the selected text.

Output keys:
- verdict (keep or revise)
- message
- suggested_text
- what_changed
- why_it_helps
- reviewer_expectation
- confidence
""".strip()
    raw, meta = _call_ai_json(
        model=settings.AI_ESSAY_COMPLEX_MODEL,
        system_prompt=system_prompt,
        user_payload=context,
    )
    validated = _validate_json_response(EssaySelectionFeedbackResponseSerializer, raw)
    if validated["verdict"] == "keep":
        validated["suggested_text"] = None
    return validated, meta


def generate_prompt_explanation(*, context: dict[str, Any]):
    system_prompt = """
You are an admissions essay coach.
Return JSON only.

Task:
- Explain the essay prompt in plain language.
- Clarify what the school is actually asking.
- Give practical direction, not generic motivation.

Output keys:
- plain_english_summary
- what_the_school_is_asking
- avoid
- must_cover
- good_angle_examples
""".strip()
    raw, meta = _call_ai_json(
        model=settings.AI_ESSAY_GUIDANCE_MODEL,
        system_prompt=system_prompt,
        user_payload=context,
    )
    return _validate_json_response(EssayExplainPromptResponseSerializer, raw), meta


def generate_outline(*, context: dict[str, Any]):
    system_prompt = """
You are an admissions essay coach.
Return JSON only.

Task:
- Suggest a strong essay direction and structure.
- Prefer clarity and specificity over hype.
- Give a practical outline the student can write from.

Output keys:
- recommended_angle
- alternatives
- outline_points
- opening_idea
- risks_to_avoid
""".strip()
    raw, meta = _call_ai_json(
        model=settings.AI_ESSAY_GUIDANCE_MODEL,
        system_prompt=system_prompt,
        user_payload=context,
    )
    return _validate_json_response(EssayOutlineResponseSerializer, raw), meta
