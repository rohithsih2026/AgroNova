"""Weather provider abstraction for the block observation feed.

An IMD/state-compatible provider can implement the same interface and be selected
with WEATHER_PROVIDER. ReferenceWeatherProvider is the built-in feed for the
Ulundurpettai block and needs no API key.
"""

from __future__ import annotations

from typing import Any, Protocol

from ..data.reference_data import BLOCK_ID, DATA_LABEL, build_forecast


class WeatherProvider(Protocol):
    def get_current(self, location_id: str = BLOCK_ID) -> dict[str, Any]: ...
    def get_forecast(self, location_id: str = BLOCK_ID, days: int = 7) -> dict[str, Any]: ...


class ReferenceWeatherProvider:
    provider_name = DATA_LABEL

    def get_current(self, location_id: str = BLOCK_ID) -> dict[str, Any]:
        return build_forecast()["block"]

    def get_forecast(self, location_id: str = BLOCK_ID, days: int = 7) -> dict[str, Any]:
        payload = build_forecast()
        payload["forecast"] = payload["forecast"][: max(1, min(days, 7))]
        return payload


def get_weather_provider() -> WeatherProvider:
    """Return the configured block observation feed."""
    return ReferenceWeatherProvider()
