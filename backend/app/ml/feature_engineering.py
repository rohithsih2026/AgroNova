"""Feature construction for the replaceable downscaling model.

The input contract is intentionally tabular. A future production pipeline can
replace the synthetic frame with IMD/ISRO/field observations without changing the
model service or API response contract.
"""

from __future__ import annotations

from collections.abc import Iterable
from typing import Any

import numpy as np
import pandas as pd

FEATURE_COLUMNS = [
    "block_temperature",
    "block_rainfall",
    "block_humidity",
    "block_wind",
    "pressure",
    "cloud_cover",
    "solar_radiation",
    "latitude",
    "longitude",
    "elevation",
    "land_use_encoded",
    "vegetation_index",
    "soil_type_encoded",
    "distance_to_water",
    "historical_temperature",
    "historical_rainfall",
]

LAND_USE_ENCODING = {"agriculture": 1, "mixed": 2, "forest": 3, "urban": 4, "water": 5}
SOIL_TYPE_ENCODING = {"red loamy": 1, "black": 2, "alluvial": 3, "sandy": 4, "red sandy": 5}


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def engineer_features(records: Iterable[dict[str, Any]]) -> pd.DataFrame:
    """Convert API/demo records into the stable model feature frame."""
    rows: list[dict[str, float]] = []
    for record in records:
        rows.append(
            {
                "block_temperature": _safe_float(record.get("block_temperature", record.get("temperature"))),
                "block_rainfall": _safe_float(record.get("block_rainfall", record.get("rainfall"))),
                "block_humidity": _safe_float(record.get("block_humidity", record.get("humidity"))),
                "block_wind": _safe_float(record.get("block_wind", record.get("wind_speed"))),
                "pressure": _safe_float(record.get("pressure"), 1008.0),
                "cloud_cover": _safe_float(record.get("cloud_cover"), 45.0),
                "solar_radiation": _safe_float(record.get("solar_radiation"), 5.5),
                "latitude": _safe_float(record.get("latitude"), 9.92),
                "longitude": _safe_float(record.get("longitude"), 78.12),
                "elevation": _safe_float(record.get("elevation"), 240.0),
                "land_use_encoded": LAND_USE_ENCODING.get(str(record.get("land_use", "agriculture")).lower(), 1),
                "vegetation_index": _safe_float(record.get("vegetation_index", record.get("ndvi")), 0.55),
                "soil_type_encoded": SOIL_TYPE_ENCODING.get(str(record.get("soil_type", "red loamy")).lower(), 1),
                "distance_to_water": _safe_float(record.get("distance_to_water"), 2.0),
                "historical_temperature": _safe_float(record.get("historical_temperature"), 29.0),
                "historical_rainfall": _safe_float(record.get("historical_rainfall"), 22.0),
            }
        )
    return pd.DataFrame(rows, columns=FEATURE_COLUMNS)


def make_synthetic_training_data(n_samples: int = 640, seed: int = 42) -> pd.DataFrame:
    """Create a labelled demonstration set for the local prototype only."""
    rng = np.random.default_rng(seed)
    block_temp = rng.normal(30.4, 2.0, n_samples)
    block_rain = rng.gamma(1.5, 13.0, n_samples)
    block_humidity = np.clip(rng.normal(70, 11, n_samples), 35, 98)
    block_wind = np.clip(rng.normal(12, 4, n_samples), 2, 32)
    pressure = rng.normal(1008, 7, n_samples)
    cloud = np.clip(rng.normal(48, 22, n_samples), 0, 100)
    solar = np.clip(6.2 - cloud / 28 + rng.normal(0, 0.7, n_samples), 1.5, 9)
    latitude = rng.normal(9.92, 0.42, n_samples)
    longitude = rng.normal(78.12, 0.46, n_samples)
    elevation = np.clip(260 + (latitude - 9.92) * 90 + rng.normal(0, 42, n_samples), 90, 720)
    land_use = rng.choice([1, 2, 3, 4], n_samples, p=[0.62, 0.2, 0.12, 0.06])
    vegetation = np.clip(rng.normal(0.58, 0.12, n_samples), 0.15, 0.9)
    soil_type = rng.choice([1, 2, 3, 4, 5], n_samples, p=[0.48, 0.18, 0.2, 0.09, 0.05])
    distance_water = np.clip(rng.gamma(2.0, 1.2, n_samples), 0.05, 12)
    history_temp = block_temp + rng.normal(0, 0.6, n_samples)
    history_rain = np.clip(block_rain + rng.normal(0, 4, n_samples), 0, None)

    # These relationships are intentionally simple and are not scientific claims.
    local_temp = block_temp - elevation / 950 + vegetation * 1.8 + rng.normal(0, 0.28, n_samples)
    local_rain = np.clip(block_rain * (0.72 + distance_water * 0.045) + cloud / 70 + rng.normal(0, 2.2, n_samples), 0, None)
    local_humidity = np.clip(block_humidity + distance_water * 0.65 + cloud / 24 + rng.normal(0, 1.8, n_samples), 20, 100)
    local_wind = np.clip(block_wind + elevation / 170 + rng.normal(0, 1.3, n_samples), 0, None)
    local_moisture = np.clip(49 + local_rain * 0.22 - local_temp * 0.18 + distance_water * 0.8 + rng.normal(0, 2.5, n_samples), 12, 92)

    frame = pd.DataFrame(
        {
            "block_temperature": block_temp,
            "block_rainfall": block_rain,
            "block_humidity": block_humidity,
            "block_wind": block_wind,
            "pressure": pressure,
            "cloud_cover": cloud,
            "solar_radiation": solar,
            "latitude": latitude,
            "longitude": longitude,
            "elevation": elevation,
            "land_use_encoded": land_use,
            "vegetation_index": vegetation,
            "soil_type_encoded": soil_type,
            "distance_to_water": distance_water,
            "historical_temperature": history_temp,
            "historical_rainfall": history_rain,
        },
        columns=FEATURE_COLUMNS,
    )
    frame["target_temperature"] = local_temp
    frame["target_rainfall"] = local_rain
    frame["target_humidity"] = local_humidity
    frame["target_wind"] = local_wind
    frame["target_soil_moisture"] = local_moisture
    return frame


def idw_predict(values: list[float], latitudes: list[float], longitudes: list[float], target_lat: float, target_lon: float, power: float = 2.0) -> float:
    """Simple inverse-distance weighted spatial baseline."""
    if not values:
        return 0.0
    if len(values) == 1:
        return values[0]
    distances: list[float] = []
    for lat, lon in zip(latitudes, longitudes):
        # Scale longitude for a stable local distance at the demo latitude.
        dx = (lon - target_lon) * 0.88
        distances.append(max((lat - target_lat) ** 2 + dx**2, 1e-8) ** 0.5)
    weights = [1 / (distance**power) for distance in distances]
    denominator = sum(weights)
    return float(sum(value * weight for value, weight in zip(values, weights)) / denominator) if denominator else values[0]
