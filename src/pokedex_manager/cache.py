from collections.abc import Hashable
from typing import Any

from pokedex_manager.clock import Clock

DEFAULT_MAX_ENTRIES = 2048


class TTLCache:
    """In-memory cache whose entries expire after a fixed time; the oldest entry is evicted when full."""

    def __init__(self, ttl_seconds: float, clock: Clock, max_entries: int = DEFAULT_MAX_ENTRIES):
        self._ttl_seconds = ttl_seconds
        self._clock = clock
        self._max_entries = max_entries
        self._entries: dict[Hashable, tuple[float, Any]] = {}

    def get(self, key: Hashable) -> Any | None:
        entry = self._entries.get(key)
        if entry is None:
            return None
        expires_at, value = entry
        if self._clock() >= expires_at:
            del self._entries[key]
            return None
        return value

    def set(self, key: Hashable, value: Any) -> None:
        self._entries.pop(key, None)
        if len(self._entries) >= self._max_entries:
            oldest_key = next(iter(self._entries))
            del self._entries[oldest_key]
        self._entries[key] = (self._clock() + self._ttl_seconds, value)
