import json
from dataclasses import dataclass
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen


GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo"


class GoogleTokenVerificationError(Exception):
    pass


@dataclass
class GoogleIdentity:
    email: str
    email_verified: bool
    given_name: str
    family_name: str
    full_name: str
    sub: str


def verify_google_id_token(id_token: str, expected_client_ids: set[str], timeout: int = 10) -> GoogleIdentity:
    if not id_token:
        raise GoogleTokenVerificationError("Missing id_token.")
    if not expected_client_ids:
        raise GoogleTokenVerificationError("Google OAuth is not configured.")

    query = urlencode({"id_token": id_token})
    url = f"{GOOGLE_TOKEN_INFO_URL}?{query}"
    try:
        with urlopen(url, timeout=timeout) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        raise GoogleTokenVerificationError("Google token verification failed.") from exc
    except URLError as exc:
        raise GoogleTokenVerificationError("Google verification service is unreachable.") from exc
    except json.JSONDecodeError as exc:
        raise GoogleTokenVerificationError("Invalid response from Google verification service.") from exc

    audience = payload.get("aud", "")
    issuer = payload.get("iss", "")
    if audience not in expected_client_ids:
        raise GoogleTokenVerificationError("Invalid Google token audience.")
    if issuer not in {"accounts.google.com", "https://accounts.google.com"}:
        raise GoogleTokenVerificationError("Invalid Google token issuer.")

    email = payload.get("email", "").strip().lower()
    email_verified = str(payload.get("email_verified", "")).lower() == "true"
    if not email:
        raise GoogleTokenVerificationError("Google account email is missing.")
    if not email_verified:
        raise GoogleTokenVerificationError("Google account email is not verified.")

    return GoogleIdentity(
        email=email,
        email_verified=email_verified,
        given_name=(payload.get("given_name") or "").strip(),
        family_name=(payload.get("family_name") or "").strip(),
        full_name=(payload.get("name") or "").strip(),
        sub=(payload.get("sub") or "").strip(),
    )
