"""Exercise deployed HTML forms, Auth.js cookies, and the independent Render API.

Usage: venv/bin/python scripts/smoke_production_auth.py FRONTEND_ORIGIN BACKEND_ORIGIN
Creates one disposable test account. Never prints passwords or token values.
"""
import json
import secrets
import sys
from html.parser import HTMLParser
from urllib.parse import urlsplit
from uuid import uuid4

import httpx


class FormInputs(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hidden = []
        self.in_form = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "form":
            self.in_form = True
        if self.in_form and tag == "input" and attrs.get("type") == "hidden":
            self.hidden.append((attrs["name"], attrs.get("value", "")))

    def handle_endtag(self, tag):
        if tag == "form":
            self.in_form = False


def main():
    frontend, backend = (value.rstrip("/") for value in sys.argv[1:3])
    for origin in [frontend, backend]:
        url = urlsplit(origin)
        assert url.scheme == "https" and url.hostname not in {"localhost", "127.0.0.1", "::1"}, "Use deployed HTTPS origins"
    email = f"production-smoke-{uuid4().hex}@example.com"
    password = secrets.token_urlsafe(32)
    with httpx.Client(timeout=150, follow_redirects=True) as client:
        def submit_form(path):
            response = client.get(frontend + path)
            response.raise_for_status()
            parser = FormInputs()
            parser.feed(response.text)
            assert parser.hidden, "Missing rendered Server Action inputs"
            fields = parser.hidden + [("email", email), ("password", password)]
            response = client.post(frontend + path,
                files=[(key, (None, value)) for key, value in fields],
                headers={"Origin": frontend, "Referer": frontend + path})
            response.raise_for_status()
            if response.url.path != "/dashboard":
                # Report the user-facing error without printing form payloads.
                import re
                alert = re.search(r'role="alert"[^>]*>(.*?)</p>', response.text)
                raise AssertionError(f"{path} did not reach dashboard: {alert.group(1) if alert else response.url.path}")
            return response

        response = client.get(frontend)
        response.raise_for_status()
        print("PASS live frontend HTTPS", response.status_code, flush=True)
        health = client.get(frontend + "/api/health")
        assert health.status_code == 200 and health.json()["status"] == "ok", "Vercel-to-Render health failed"
        print("PASS Vercel -> Render -> database health", flush=True)
        submit_form("/register")
        session = client.get(frontend + "/api/auth/session").json()
        assert session["user"]["email"] == email, "Registration did not establish a session"
        assert "accessToken" not in json.dumps(session), "Backend token exposed to browser session"
        print("PASS live frontend signup and authenticated dashboard", flush=True)
        csrf = client.get(frontend + "/api/auth/csrf").json()["csrfToken"]
        client.post(frontend + "/api/auth/signout", data={"csrfToken": csrf, "callbackUrl": frontend + "/login"}, headers={"Origin": frontend})
        assert not client.get(frontend + "/api/auth/session").json(), "Signout did not clear session"
        submit_form("/login")
        session = client.get(frontend + "/api/auth/session").json()
        assert session["user"]["email"] == email, "Login did not restore session"
        cookies = [c for c in client.cookies.jar if c.name.startswith("__Secure-authjs.session-token")]
        assert cookies and all(c.secure and "HttpOnly" in c._rest and c._rest.get("SameSite", "").lower() == "lax" for c in cookies)
        print("PASS live frontend login, HTTPS session cookies, dashboard", flush=True)
        response = client.post(backend + "/api/auth/login", json={"email": email, "password": password})
        response.raise_for_status()
        token = response.json()
        assert token["user"]["id"] == session["user"]["id"], "Frontend is using a different backend"
        response = client.get(backend + "/api/auth/me", headers={"Authorization": "Bearer " + token["access_token"]})
        assert response.status_code == 200 and response.json()["email"] == email
        print("PASS same account authenticated directly against Render", flush=True)
        preflight = client.options(backend + "/api/auth/login", headers={"Origin": frontend, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type"})
        cors_ok = preflight.status_code == 200 and preflight.headers.get("access-control-allow-origin") == frontend
        print("CORS allowlist:", "PASS" if cors_ok else "NEEDS UPDATE (server-side auth is unaffected)", flush=True)
        print("Test account:", email, flush=True)


if __name__ == "__main__":
    main()
