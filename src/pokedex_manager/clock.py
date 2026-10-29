import time
from collections.abc import Callable

# Returns the current time in epoch seconds; injected so tests can control time.
Clock = Callable[[], float]

system_clock: Clock = time.time
