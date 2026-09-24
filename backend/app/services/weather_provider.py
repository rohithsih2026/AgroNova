"""Weather provider abstraction.

A real IMD/IMD-compatible provider can implement the same interface and be selected
with WEATHER_PROVIDER. DemoWeatherProvider remains the default and needs no key.
"""

from __future__ import annotations

from typing import Any, Protocol

from ..data.demo_data import build_forecast


class WeatherProvider(Protocol):
    def get_current(self, location_id: str = "demo-block") -> dict[str, Any]: ...
    def get_forecast(self, location_id: str = "demo-block", days: int = 7) -> dict[str, Any]: ...


class DemoWeatherProvider:
    provider_name = "Prototype Demonstration Dataset"

    def get_current(self, location_id: str = "demo-block") -> dict[str, Any]:
        return build_forecast()["block"]

    def get_forecast(self, location_id: str = "demo-block", days: int = 7) -> dict[str, Any]:
        payload = build_forecast()
        payload["forecast"] = payload["forecast"][: max(1, min(days, 7))]
        return payload


def get_weather_provider() -> WeatherProvider:
    # Deliberately deterministic until a real provider is explicitly configured.
    return DemoWeatherProvider()
