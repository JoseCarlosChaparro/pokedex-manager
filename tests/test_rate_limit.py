from pokedex_manager.services.rate_limit import SlidingWindowRateLimiter
from tests.conftest import TEST_PASSWORD, login, register
from tests.fakes import FakeClock

WINDOW_SECONDS = 60
MAX_FAILED_LOGINS_PER_EMAIL = 5
MAX_FAILED_LOGINS_PER_IP = 20


def test_limiter_allows_attempts_under_the_limit():
    limiter = SlidingWindowRateLimiter(max_attempts=2, window_seconds=WINDOW_SECONDS, clock=FakeClock())
    limiter.record("k")

    assert limiter.retry_after("k") == 0


def test_limiter_blocks_until_the_oldest_attempt_leaves_the_window():
    clock = FakeClock()
    limiter = SlidingWindowRateLimiter(max_attempts=2, window_seconds=WINDOW_SECONDS, clock=clock)
    limiter.record("k")
    clock.advance(10)
    limiter.record("k")

    assert limiter.retry_after("k") == WINDOW_SECONDS - 10
    clock.advance(WINDOW_SECONDS - 10)
    assert limiter.retry_after("k") == 0


def test_limiter_reset_forgets_attempts():
    limiter = SlidingWindowRateLimiter(max_attempts=1, window_seconds=WINDOW_SECONDS, clock=FakeClock())
    limiter.record("k")
    limiter.reset("k")

    assert limiter.retry_after("k") == 0


def fail_logins(client, email: str, times: int) -> None:
    for _ in range(times):
        login(client, email, password="WrongPassword")


def test_login_is_blocked_after_too_many_failures_for_one_email(client):
    register(client, "ash@example.com")
    fail_logins(client, "ash@example.com", MAX_FAILED_LOGINS_PER_EMAIL)

    response = login(client, "ASH@example.com", password=TEST_PASSWORD)

    assert response.status_code == 429
    assert int(response.headers["Retry-After"]) > 0


def test_login_is_allowed_again_after_the_window(client, clock):
    register(client, "ash@example.com")
    fail_logins(client, "ash@example.com", MAX_FAILED_LOGINS_PER_EMAIL)

    clock.advance(WINDOW_SECONDS)

    assert login(client, "ash@example.com").status_code == 200


def test_successful_login_resets_the_email_counter(client):
    register(client, "ash@example.com")
    fail_logins(client, "ash@example.com", MAX_FAILED_LOGINS_PER_EMAIL - 1)
    login(client, "ash@example.com")
    fail_logins(client, "ash@example.com", MAX_FAILED_LOGINS_PER_EMAIL - 1)

    assert login(client, "ash@example.com").status_code == 200


def test_login_is_blocked_after_too_many_failures_from_one_ip(client):
    register(client, "ash@example.com")
    for attempt in range(MAX_FAILED_LOGINS_PER_IP):
        login(client, f"user{attempt}@example.com", password="WrongPassword")

    assert login(client, "ash@example.com").status_code == 429
