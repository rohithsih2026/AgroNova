"""Versioned demo API routes."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
import logging

from fastapi import APIRouter, HTTPException, Query

from ..data.demo_data import build_forecast
from ..schemas import (
    AdvisoryRequest,
    AlertReadRequest,
    DownscaleRequest,
    IrrigationRequest,
    LoginRequest,
    SimulationRequest,
)
from ..services.demo_store import store
from ..services.decision_engine import generate_advisory, irrigation_recommendation, risk_assessment, simulate
from ..services.weather_provider import get_weather_provider

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)


def _panchayat_or_404(panchayat_id: str) -> dict[str, Any]:
    panchayat = store.get_panchayat(panchayat_id)
    if not panchayat:
        raise HTTPException(status_code=404, detail="Panchayat not found")
    return panchayat


@router.get("/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "service": "agronova", "mode": "demo", "data_label": "Prototype Demonstration Dataset", "timestamp": datetime.now(timezone.utc).isoformat()}


@router.post("/auth/login")
def login(payload: LoginRequest) -> dict[str, Any]:
    role = payload.role or ("officer" if "officer" in payload.email else "administrator" if "admin" in payload.email else "farmer")
    names = {"farmer": "Kavitha R", "officer": "Murugan S", "administrator": "AgroNova Admin"}
    emails = {"farmer": "farmer@agronova.demo", "officer": "officer@agronova.demo", "administrator": "admin@agronova.demo"}
    return {"id": f"demo-{role}", "name": names[role], "email": emails[role], "role": role, "organization": "Tamil Nadu Agriculture Department · Demo", "token": f"demo-token-{role}", "demo": True, "data_label": "Prototype Demonstration Dataset"}


@router.get("/locations/context")
def location_context() -> dict[str, Any]:
    return store.location_context()


@router.get("/districts")
def districts() -> dict[str, Any]:
    return {"items": [{"id": "tn-madurai", "name": "Madurai", "state": "Tamil Nadu", "state_code": "TN", "panchayat_count": len(store.panchayats), "data_label": "Prototype Demonstration Dataset"}]}


@router.get("/blocks/{district_id}")
def blocks(district_id: str) -> dict[str, Any]:
    return {"items": [{"id": "demo-block", "name": "Demo Block", "district_id": district_id, "district": "Madurai", "panchayat_count": len(store.panchayats)}]}


@router.get("/panchayats/{block_id}")
def panchayats(block_id: str) -> dict[str, Any]:
    items = store.list_panchayats(block_id)
    return {"items": items, "count": len(items), "data_label": "Prototype Demonstration Dataset"}


@router.get("/weather/current")
def current_weather(panchayat_id: str | None = None) -> dict[str, Any]:
    if panchayat_id:
        _panchayat_or_404(panchayat_id)
        detail = store.weather_for_panchayat(panchayat_id)
        return {"location": detail, "source": detail.get("source", "Prototype demonstration fallback"), "data_label": "Prototype Demonstration Dataset"}
    return {"location": get_weather_provider().get_current(), "source": "Block-level provider", "data_label": "Prototype Demonstration Dataset"}


@router.get("/weather/forecast")
def weather_forecast(panchayat_id: str | None = None, days: int = Query(default=7, ge=1, le=7)) -> dict[str, Any]:
    payload = get_weather_provider().get_forecast(days=days)
    payload["panchayat_id"] = panchayat_id
    if panchayat_id:
        panchayat = _panchayat_or_404(panchayat_id)
        block = payload["block"]
        temperature_delta = float(panchayat["temperature"]) - float(block["temperature"])
        rainfall_delta = float(panchayat["rainfall"]) - float(block["rainfall"])
        humidity_delta = float(panchayat["humidity"]) - float(block["humidity"])
        wind_delta = float(panchayat["wind_speed"]) - float(block["wind_speed"])
        for day in payload["forecast"]:
            day["panchayat_temperature"] = round(float(day["panchayat_temperature"]) + temperature_delta, 1)
            day["panchayat_rainfall"] = round(max(0.0, float(day["panchayat_rainfall"]) + rainfall_delta), 1)
            day["humidity"] = round(min(100.0, max(0.0, float(day["humidity"]) + humidity_delta)), 1)
            day["wind_speed"] = round(max(0.0, float(day["wind_speed"]) + wind_delta), 1)
        payload["panchayat"] = panchayat["name"]
        payload["source"] = "AI-downscaled prototype comparison" if store.downscaled else "Prototype spatial comparison"
    return payload


@router.get("/weather/panchayat/{panchayat_id}")
def weather_panchayat(panchayat_id: str) -> dict[str, Any]:
    return _panchayat_or_404(panchayat_id) | store.weather_for_panchayat(panchayat_id)


@router.post("/downscaling/predict")
def downscale(payload: DownscaleRequest) -> dict[str, Any]:
    try:
        if payload.model == "baseline":
            result = store.run_downscaling("baseline")
        else:
            result = store.run_downscaling(payload.model)
        return result
    except Exception as exc:  # pragma: no cover - defensive API boundary
        logger.exception("Downscaling model failed")
        raise HTTPException(status_code=503, detail="Downscaling model is temporarily unavailable") from exc


@router.get("/downscaling/results/{panchayat_id}")
def downscale_result(panchayat_id: str) -> dict[str, Any]:
    _panchayat_or_404(panchayat_id)
    result = store.get_downscaled(panchayat_id)
    if not result:
        raise HTTPException(status_code=404, detail="No downscoped result yet; run the engine first")
    return result


@router.get("/downscaling/status")
def downscale_status() -> dict[str, Any]:
    return {"status": "completed" if store.last_run else "ready", "last_run": store.last_run, "processed": len(store.downscaled), "data_label": "Prototype Demonstration Dataset"}


@router.get("/downscaling/metrics")
def downscale_metrics() -> dict[str, Any]:
    try:
        return store.metrics()
    except Exception as exc:  # pragma: no cover - defensive API boundary
        logger.exception("Model metrics failed")
        raise HTTPException(status_code=503, detail="Model metrics are temporarily unavailable") from exc


@router.get("/crops")
def crops() -> dict[str, Any]:
    return {"items": store.crops()}


@router.post("/advisory/generate")
def advisory(payload: AdvisoryRequest) -> dict[str, Any]:
    panchayat = _panchayat_or_404(payload.panchayat_id)
    return generate_advisory(payload.model_dump(), panchayat, build_forecast())


@router.post("/irrigation/recommend")
def irrigation(payload: IrrigationRequest) -> dict[str, Any]:
    panchayat = _panchayat_or_404(payload.panchayat_id)
    return irrigation_recommendation(payload.model_dump(), panchayat, build_forecast())


@router.get("/risk/{panchayat_id}")
def risk(panchayat_id: str) -> dict[str, Any]:
    return risk_assessment(_panchayat_or_404(panchayat_id))


@router.get("/satellite/{panchayat_id}")
def satellite(panchayat_id: str) -> dict[str, Any]:
    panchayat = _panchayat_or_404(panchayat_id)
    change = round((panchayat["ndvi"] - panchayat["ndvi_previous"]) / panchayat["ndvi_previous"] * 100, 1)
    return {"panchayat": panchayat["name"], "ndvi": panchayat["ndvi"], "previous_ndvi": panchayat["ndvi_previous"], "change_percent": change, "status": "Moderate vegetation stress" if change < -3 else "Vegetation stable", "ndwi": panchayat["ndwi"], "land_surface_temperature": panchayat["land_surface_temperature"], "geometry": panchayat["geometry"], "data_label": "Prototype Demonstration Dataset", "source": "Synthetic satellite indicator demo"}


@router.get("/alerts")
def alerts(severity: str | None = None, is_read: bool | None = None) -> dict[str, Any]:
    items = store.alerts
    if severity:
        items = [item for item in items if item["severity"].lower() == severity.lower()]
    if is_read is not None:
        items = [item for item in items if item["is_read"] == is_read]
    return {"items": items, "unread": sum(1 for item in items if not item["is_read"]), "data_label": "Prototype Demonstration Dataset"}


@router.post("/alerts/{alert_id}/read")
def mark_alert_read(alert_id: str, payload: AlertReadRequest | None = None) -> dict[str, Any]:
    value = payload.is_read if payload else True
    for item in store.alerts:
        if item["id"] == alert_id:
            item["is_read"] = value
            return item
    raise HTTPException(status_code=404, detail="Alert not found")


@router.get("/alerts/summary")
def alerts_summary() -> dict[str, Any]:
    return {"total": len(store.alerts), "unread": sum(1 for item in store.alerts if not item["is_read"]), "high": sum(1 for item in store.alerts if item["severity"] == "High"), "data_label": "Prototype Demonstration Dataset"}


@router.get("/history/{panchayat_id}")
def history(panchayat_id: str, variable: str = "rainfall", days: int = Query(default=30, ge=7, le=90)) -> dict[str, Any]:
    _panchayat_or_404(panchayat_id)
    allowed = {"rainfall", "temperature", "humidity", "soil_moisture", "ndvi"}
    if variable not in allowed:
        raise HTTPException(status_code=422, detail=f"Unsupported variable: {variable}")
    rows = store.history(panchayat_id, variable, days)
    values = [float(row[variable]) for row in rows]
    average = sum(values) / len(values) if values else 0
    return {"variable": variable, "rows": rows, "summary": {"average": round(average, 2), "maximum": round(max(values), 2) if values else 0, "minimum": round(min(values), 2) if values else 0, "anomaly": round(values[-1] - average, 2) if values else 0, "trend": "rising" if values[-1] > average else "falling" if values[-1] < average else "stable"}, "data_label": "Prototype Demonstration Dataset"}


@router.post("/simulation")
def simulation(payload: SimulationRequest) -> dict[str, Any]:
    panchayat = _panchayat_or_404(payload.panchayat_id)
    return simulate(panchayat, payload.model_dump())


@router.get("/officer/monitoring")
def officer_monitoring() -> dict[str, Any]:
    rows = store.officer_rows()
    return {"summary": {"total_panchayats": len(rows), "at_risk": sum(1 for row in rows if row["risk"] != "Normal"), "heavy_rain_alerts": 3, "drought_alerts": 2, "crop_stress_areas": sum(1 for row in rows if row["crop_stress"] >= 60)}, "rows": rows, "data_label": "Prototype Demonstration Dataset"}


@router.get("/profile")
def profile() -> dict[str, Any]:
    panchayat = store.get_panchayat("p-01") or store.panchayats[0]
    return {"name": "Kavitha R", "village": "Kozhippara village", "panchayat": panchayat["name"], "farm_location": "North plot, 9.9250° N, 78.1190° E", "farm_area": 1.8, "crop": "Paddy", "variety": "ADT 47", "sowing_date": "2026-07-18", "growth_stage": "Vegetative", "soil_type": "Red loamy", "irrigation_type": "Canal", "data_label": "Prototype Demonstration Dataset"}
