"""Prediction orchestration for Panchayat forecasts."""

from __future__ import annotations

from typing import Any

from .downscaler import SpatialDownscaler
from .feature_engineering import idw_predict

_models: dict[str, SpatialDownscaler] = {}


def get_model(model_name: str = "random_forest") -> SpatialDownscaler:
    if model_name not in _models:
        _models[model_name] = SpatialDownscaler(model_name=model_name)
    return _models[model_name]


def predict_downscaled_bundle(records: list[dict[str, Any]], block_values: dict[str, Any] | None = None, model_name: str = "random_forest") -> list[dict[str, Any]]:
    model = get_model(model_name)
    predictions = model.predict(records) if model_name != "baseline" else [None for _ in records]
    block_values = block_values or {}
    block_lat = float(block_values.get("latitude", 9.92))
    block_lon = float(block_values.get("longitude", 78.12))
    output: list[dict[str, Any]] = []
    for record, prediction in zip(records, predictions):
        lat = float(record.get("latitude", block_lat))
        lon = float(record.get("longitude", block_lon))
        baseline = {
            "temperature": idw_predict([float(block_values.get("temperature", record.get("block_temperature", 30.8)))], [block_lat], [block_lon], lat, lon),
            "rainfall": idw_predict([float(block_values.get("rainfall", record.get("block_rainfall", 24.0)))], [block_lat], [block_lon], lat, lon),
            "humidity": idw_predict([float(block_values.get("humidity", record.get("block_humidity", 72.0)))], [block_lat], [block_lon], lat, lon),
        }
        baseline.update(
            {
                "wind": float(block_values.get("wind_speed", record.get("block_wind", 12.0))),
                "soil_moisture": float(block_values.get("soil_moisture", 48.0)),
            }
        )
        if prediction is None:
            prediction = dict(baseline)
        confidence = round(float(np_clip(68 + abs(prediction["temperature"] - baseline["temperature"]) * 2.2, 68, 94)), 1)
        explanation = [
            f"Elevation ({record.get('elevation', 240)} m) adjusts the block temperature signal.",
            f"Vegetation index ({record.get('vegetation_index', 0.55):.2f}) and water distance ({record.get('distance_to_water', 2):.1f} km) inform local moisture.",
            "Historical weather and block observations are fused as model features.",
        ]
        if model_name == "baseline":
            explanation = ["Inverse-distance interpolation is the transparent spatial baseline.", "No learned environmental adjustment is applied in baseline mode."]
        output.append(
            {
                **prediction,
                "confidence": confidence,
                "baseline": {key: round(float(value), 2) for key, value in baseline.items()},
                "explanation": explanation,
                "model_version": model.model_version,
                "model_used": model.estimator_kind,
            }
        )
    return output


def np_clip(value: float, low: float, high: float) -> float:
    return max(low, min(high, float(value)))
