import math
from collections import defaultdict, deque

from pokedex_manager.clock import Clock

MAX_FAILED_LOGINS_PER_EMAIL = 5
MAX_FAILED_LOGINS_PER_IP = 20
FAILED_LOGIN_WINDOW_SECONDS = 60


class SlidingWindowRateLimiter:
    """Counts attempts per key over the last `window_seconds`. In memory: one API process only."""

    def __init__(self, max_attempts: int, window_seconds: float, clock: Clock):
        self._max_attempts = max_attempts
        self._window_seconds = window_seconds
        self._clock = clock
        self._attempts: defaultdict[str, deque[float]] = defaultdict(deque)

    def record(self, key: str) -> None:
        self._attempts[key].append(self._clock())

    def reset(self, key: str) -> None:
        self._attempts.pop(key, None)

    def retry_after(self, key: str) -> int:
        """Seconds until the next attempt is allowed; 0 when allowed now."""
        attempts = self._recent_attempts(key)
        if len(attempts) < self._max_attempts:
            return 0
        oldest_relevant = attempts[-self._max_attempts]
        return math.ceil(oldest_relevant + self._window_seconds - self._clock())

    def _recent_attempts(self, key: str) -> deque[float]:
        attempts = self._attempts.get(key, deque())
        window_start = self._clock() - self._window_seconds
        while attempts and attempts[0] <= window_start:
            attempts.popleft()
        if not attempts:
            self._attempts.pop(key, None)
        return attempts


class TooManyLoginAttemptsError(Exception):
    def __init__(self, retry_after_seconds: int):
        self.retry_after_seconds = retry_after_seconds
        super().__init__(f"Too many failed logins, retry in {retry_after_seconds}s")


class LoginAttemptGuard:
    """Brute-force protection: limits failed logins per email and per client IP."""

    def __init__(self, clock: Clock):
        self._by_email = SlidingWindowRateLimiter(MAX_FAILED_LOGINS_PER_EMAIL, FAILED_LOGIN_WINDOW_SECONDS, clock)
        self._by_ip = SlidingWindowRateLimiter(MAX_FAILED_LOGINS_PER_IP, FAILED_LOGIN_WINDOW_SECONDS, clock)

    def check(self, email: str, ip: str) -> None:
        retry_after = max(self._by_email.retry_after(email), self._by_ip.retry_after(ip))
        if retry_after:
            raise TooManyLoginAttemptsError(retry_after)

    def record_failure(self, email: str, ip: str) -> None:
        self._by_email.record(email)
        self._by_ip.record(ip)

    def record_success(self, email: str) -> None:
        self._by_email.reset(email)
