import os
import re
import subprocess
import sys
from pathlib import Path


EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
VALID_ROLES = {"owner", "admin", "viewer"}


def main() -> int:
    raw_emails = os.environ.get("ADMIN_EMAILS", "")
    emails = [email.strip().lower() for email in raw_emails.split(",") if email.strip()]
    if not emails:
        print("Set ADMIN_EMAILS to a comma-separated list of Google account emails.", file=sys.stderr)
        return 2

    if any(not EMAIL_PATTERN.fullmatch(email) for email in emails):
        print("ADMIN_EMAILS contains an invalid email address.", file=sys.stderr)
        return 2
    if len(set(emails)) != len(emails):
        print("ADMIN_EMAILS contains duplicate addresses.", file=sys.stderr)
        return 2

    role = os.environ.get("ADMIN_ROLE", "admin").strip().lower()
    if role not in VALID_ROLES:
        print("ADMIN_ROLE must be owner, admin, or viewer.", file=sys.stderr)
        return 2

    repo_root = Path(__file__).resolve().parent.parent
    for email in emails:
        result = subprocess.run(
            [
                "npm",
                "run",
                "admin:bootstrap",
                "--",
                "--email",
                email,
                "--role",
                role,
            ],
            cwd=repo_root,
            check=False,
        )
        if result.returncode != 0:
            return result.returncode

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
