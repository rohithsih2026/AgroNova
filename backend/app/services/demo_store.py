"""In-process demo repository with a replaceable persistence boundary."""

from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from ..data.demo_data import (
    BLOCK,
    DISTRICT,
    STATE,
    build_alerts,
    build_block_weather,
    build_crops,
    build_forecast,
    build_history,
    build_officer_rows,
    build_panchayats,
)
from ..ml.model_metrics import calculate_metrics
from ..ml.predict import predict_downscaled_bundle


class DemoStore:
    def __init__(self) -> None:
        self.panchayats = build_panchayats()
        self.alerts = build_alerts()
        self.downscaled: dict[str, dict[str, Any]] = {}
        self._metrics: dict[str, Any] | None = None
        self.last_run: str | None = None

    def location_context(self) -> dict[str, Any]:
        return {"state": STATE, "district": DISTRICT, "block": BLOCK, "panchayat": "Demo Panchayat", "state_code": "TN", "district_id": "tn-madurai", "block_id": "demo-block", "panchayat_id": "p-01"}

    def _merge_downscaled(self, item: dict[str, Any]) -> dict[str, Any]:
        merged = deepcopy(item)
        result = self.downscaled.get(item["id"])
        if result:
            merged.update({
                "temperature": result["temperature"],
                "rainfall": result["rainfall"],
                "humidity": result["humidity"],
                "wind_speed": result["wind"],
                "soil_moisture": result["soil_moisture"],
                "confidence": result["confidence"],
                "source": "AI-downscaled prototype",
            })
        return merged

    def list_panchayats(self, block_id: str = "demo-block") -> list[dict[str, Any]]:
        return [self._merge_downscaled(item) for item in self.panchayats if item["block_id"] == block_id]

    def get_panchayat(self, panchayat_id: str) -> dict[str, Any] | None:
        item = next((entry for entry in self.panchayats if entry["id"] == panchayat_id), None)
        return self._merge_downscaled(item) if item else None

    def block_weather(self) -> dict[str, Any]:
        return build_block_weather()

    def forecast(self) -> dict[str, Any]:
        return build_forecast()

    def weather_for_panchayat(self, panchayat_id: str) -> dict[str, Any]:
        panchayat = self.get_panchayat(panchayat_id)
        if not panchayat:
            return {}
        result = self.downscaled.get(panchayat_id)
        if result:
            return {**result, "source": "AI-downscaled prototype", "panchayat": panchayat["name"], "location": panchayat}
        return {**panchayat, "source": "Prototype demonstration fallback", "location": panchayat}

    def run_downscaling(self, model: str = "random_forest") -> dict[str, Any]:
        block = self.block_weather()
        records = []
        for item in self.panchayats:
            records.append(
                {
                    "latitude": item["latitude"],
                    "longitude": item["longitude"],
                    "elevation": item["elevation"],
                    "land_use": item["land_use"],
                    "vegetation_index": item["vegetation_index"],
                    "soil_type": item["soil_type"],
                    "distance_to_water": item["distance_to_water"],
                    "historical_temperature": item["temperature"] - 0.8,
                    "historical_rainfall": item["rainfall"] * 0.9,
                    "block_temperature": block["temperature"],
                    "block_rainfall": block["rainfall"],
                    "block_humidity": block["humidity"],
                    "block_wind": block["wind_speed"],
                    "pressure": block["pressure"],
                    "cloud_cover": block["cloud_cover"],
                    "solar_radiation": block["solar_radiation"],
                }
            )
        predictions = predict_downscaled_bundle(records, block, model_name=model)
        for item, prediction in zip(self.panchayats, predictions):
            self.downscaled[item["id"]] = {
                "panchayat_id": item["id"],
                "panchayat": item["name"],
                "temperature": round(prediction["temperature"], 1),
                "rainfall": round(prediction["rainfall"], 1),
                "humidity": round(prediction["humidity"], 1),
                "wind": round(prediction["wind"], 1),
                "soil_moisture": round(prediction["soil_moisture"], 1),
                "confidence": prediction["confidence"],
                "baseline": prediction["baseline"],
                "explanation": prediction["explanation"],
                "model_version": prediction["model_version"],
                "generated_at": datetime.now(timezone.utc).isoformat(),
            }
        self.last_run = datetime.now(timezone.utc).isoformat()
        model_version = predictions[0].get("model_version") if predictions else "unknown"
        model_used = predictions[0].get("model_used") if predictions else "unknown"
        return {"model": model, "model_version": model_version, "model_used": model_used, "block": block, "panchayats": list(self.downscaled.values()), "status": "completed", "processed_at": self.last_run, "data_label": "Prototype Demonstration Dataset"}

    def get_downscaled(self, panchayat_id: str) -> dict[str, Any] | None:
        return deepcopy(self.downscaled.get(panchayat_id)) if self.downscaled else None

    def metrics(self) -> dict[str, Any]:
        if self._metrics is None:
            self._metrics = calculate_metrics()
        return deepcopy(self._metrics)

    def history(self, panchayat_id: str, variable: str = "rainfall", days: int = 30) -> list[dict[str, Any]]:
        panchayat = self.get_panchayat(panchayat_id) or self.panchayats[0]
        return build_history(panchayat, days=max(7, min(days, 90)))

    def officer_rows(self) -> list[dict[str, Any]]:
        return build_officer_rows()

    def crops(self) -> list[dict[str, Any]]:
        return build_crops()


store = DemoStore()
