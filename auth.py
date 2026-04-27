import threading
import time

from crud import (
    get_connection,
    hash_password,
    password_needs_upgrade,
    release_connection,
    verify_password,
)
from error_utils import log_exception

_MAX_ATTEMPTS    = 5
_LOCKOUT_SECONDS = 15 * 60  # 15 minutes

_login_attempts: dict = {}
_attempts_lock  = threading.Lock()


def _is_locked(username_lower: str):
    """Returns (locked: bool, remaining_seconds: int)."""
    with _attempts_lock:
        entry = _login_attempts.get(username_lower)
        if not entry:
            return False, 0
        until = entry.get("locked_until") or 0
        if time.time() < until:
            return True, int(until - time.time())
        return False, 0


def _record_failure(username_lower: str):
    with _attempts_lock:
        entry = _login_attempts.setdefault(username_lower, {"count": 0, "locked_until": None})
        entry["count"] += 1
        if entry["count"] >= _MAX_ATTEMPTS:
            entry["locked_until"] = time.time() + _LOCKOUT_SECONDS


def _clear_attempts(username_lower: str):
    with _attempts_lock:
        _login_attempts.pop(username_lower, None)


def login(username, password):

    if not username or not password:
        return None, "Missing credentials"

    username_lower = username.strip().lower()
    locked, remaining = _is_locked(username_lower)
    if locked:
        mins = remaining // 60
        secs = remaining % 60
        return None, f"Account locked. Try again in {mins}m {secs}s."

    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        # Fetch user by username, then verify the password in application code.
        cur.execute("""
            SELECT id, username, role, is_active, allowed_modules, password_hash
            FROM users
            WHERE LOWER(username) = LOWER(%s)
        """, (username,))

        row = cur.fetchone()

        if not row:
            _record_failure(username_lower)
            return None, "Invalid username or password"

        is_active = row[3]
        if is_active is False:
            return None, "REVOKED"

        stored_hash = row[5] or ""
        if not verify_password(password, stored_hash):
            _record_failure(username_lower)
            return None, "Invalid username or password"

        if password_needs_upgrade(stored_hash):
            try:
                cur.execute(
                    "UPDATE users SET password_hash = %s WHERE id = %s",
                    (hash_password(password), row[0]),
                )
                conn.commit()
            except Exception as upgrade_err:
                conn.rollback()
                log_exception(f"auth.login.password_upgrade.user_id={row[0]}", upgrade_err)
                # Deny login if we cannot hash — keeps plain-text out of the DB permanently.
                return None, "Login failed: unable to secure password. Contact your administrator."

        _clear_attempts(username_lower)
        role = (row[2] or "operator").lower()
        return {
            "id": row[0],
            "username": row[1],
            "role": role,
            "allowed_modules": row[4]
        }, None

    except Exception as e:
        log_exception("auth.login", e)
        return None, "System error occurred"

    finally:
        if cur:
            cur.close()
        if conn:
            release_connection(conn)


