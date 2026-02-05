
from django.shortcuts import redirect
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class EnrollLoginRequiredMiddleware:
    """Redirect unauthenticated users from internal UI routes to /login."""

    def __init__(self, get_response):
        self.get_response = get_response
        self.protected_prefixes = (
            "/dashboard/",
            "/onboarding/",
            "/applications/",
            "/tasks/",
            "/documents/",
            "/common-app/",
            "/settings/",
            "/app/",
            "/applications-ui/",
        )

    def __call__(self, request):
        path = request.path
        if path.startswith(self.protected_prefixes):
            token = self._get_token(request)
            if not token or not self._is_token_valid(token):
                return redirect("/login")
        return self.get_response(request)

    @staticmethod
    def _get_token(request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if auth_header.startswith("Bearer "):
            return auth_header.split(" ", 1)[1].strip()
        return request.COOKIES.get("enroll_token")

    @staticmethod
    def _is_token_valid(token):
        try:
            UntypedToken(token)
            return True
        except (InvalidToken, TokenError):
            return False
