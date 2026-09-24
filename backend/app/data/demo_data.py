"""Deterministic synthetic fixtures for the offline AgroNova demo.

Every value in this module is labelled as demonstration data by the API/UI. Replace
this module with a WeatherProvider, GIS boundary service and observation repository
for operational use.
"""

from __future__ import annotations

import math
from copy import deepcopy
from datetime import date, datetime, timedelta, timezone
from typing import Any

UTC = timezone.utc
STATE = "Tamil Nadu"
DISTRICT = "Madurai"
BLOCK = "Demo Block"

PANCHAYAT_SPECS = [
    ("p-01", "Demo Panchayat", 9.925, 78.119, 238, "agriculture", 0.68, "red loamy", 1.8, "Paddy", "Vegetative"),
    ("p-02", "Kozhippara", 9.948, 78.145, 276, "mixed", 0.61, "red loamy", 2.6, "Maize", "Flowering"),
    ("p-03", "Melur", 9.905, 78.151, 254, "agriculture", 0.64, "alluvial", 3.1, "Paddy", "Vegetative"),
    ("p-04", "Vadipatti", 9.982, 78.195, 289, "agriculture", 0.57, "red sandy", 4.8, "Groundnut", "Pod development"),
    ("p-05", "Thirunagaram", 9.892, 78.087, 211, "agriculture", 0.71, "black", 1.2, "Sugarcane", "Tillering"),
    ("p-06", "Usilampatti", 9.875, 78.142, 318, "mixed", 0.53, "red loamy", 5.4, "Cotton", "Squaring"),
    ("p-07", "Tiruppudaimundu", 9.958, 78.068, 229, "forest", 0.73, "red loamy", 0.9, "Banana", "Fruit development"),
    ("p-08", "Pannaipuram", 9.932, 78.188, 264, "agriculture", 0.59, "sandy", 4.1, "Tomato", "Flowering"),
]

RISK_COLORS = {"Normal": "green", "Moderate": "yellow", "High": "orange", "Critical": "red"}


def iso_day(offset: int) -> str:
    return (date.today() + timedelta(days=offset)).isoformat()


def build_polygon(lat: float, lon: float, index: int) -> list[list[float]]:
    # Illustrative, non-authoritative demo geometry around Madurai.
    width = 0.024 + (index % 3) * 0.003
    height = 0.019 + (index % 2) * 0.003
    return [
        [round(lon - width, 6), round(lat - height, 6)],
        [round(lon + width, 6), round(lat - height * 0.8, 6)],
        [round(lon + width * 0.92, 6), round(lat + height, 6)],
        [round(lon - width * 0.86, 6), round(lat + height * 0.88, 6)],
        [round(lon - width, 6), round(lat - height, 6)],
    ]


def build_panchayats() -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for index, (pid, name, lat, lon, elevation, land_use, ndvi, soil, water, crop, stage) in enumerate(PANCHAYAT_SPECS):
        temp = round(30.1 + index * 0.24 + math.sin(index * 1.7) * 0.7, 1)
        rain = round(max(2.0, 27.5 - index * 2.1 + math.cos(index) * 4.2), 1)
        humidity = round(min(96, 73 + index * 1.4 + math.sin(index * 0.9) * 3), 1)
        wind = round(10.5 + index * 0.8 + math.cos(index * 1.2) * 2.2, 1)
        moisture = round(max(24, 53 - index * 1.7 + (water < 2 and 4 or 0)), 1)
        stress = round(min(92, max(18, 43 + index * 3.1 + (ndvi < 0.6 and 12 or 0))), 1)
        risk = "Critical" if rain > 48 or moisture < 30 else "High" if rain > 38 or stress > 68 else "Moderate" if rain > 28 or moisture < 43 else "Normal"
        records.append(
            {
                "id": pid,
                "name": name,
                "block_id": "demo-block",
                "block": BLOCK,
                "district": DISTRICT,
                "state": STATE,
                "latitude": lat,
                "longitude": lon,
                "elevation": elevation,
                "land_use": land_use,
                "vegetation_index": ndvi,
                "soil_type": soil,
                "distance_to_water": water,
                "crop": crop,
                "growth_stage": stage,
                "temperature": temp,
                "rainfall": rain,
                "humidity": humidity,
                "wind_speed": wind,
                "pressure": round(1007.5 + math.sin(index) * 3.2, 1),
                "cloud_cover": round(46 + index * 3.5, 1),
                "solar_radiation": round(5.4 + math.cos(index) * 0.8, 1),
                "soil_moisture": moisture,
                "crop_stress": stress,
                "drought_risk": round(max(5, 66 - moisture * 0.75 + (25 - rain) * 0.35), 1),
                "flood_risk": round(min(96, 18 + rain * 1.15 + (water < 2 and 12 or 0)), 1),
                "heat_risk": round(min(98, max(8, (temp - 27) * 12 + max(0, 36 - humidity) * 0.7)), 1),
                "wind_risk": round(min(95, max(5, wind * 4.5)), 1),
                "humidity_risk": round(min(96, max(6, (humidity - 68) * 2.4)), 1),
                "confidence": round(86 - index * 0.8, 1),
                "risk_status": risk,
                "risk_color": RISK_COLORS[risk],
                "ndvi": ndvi,
                "ndvi_previous": round(ndvi + 0.06 + index * 0.003, 2),
                "ndwi": round(0.21 + water / 35 + math.sin(index) * 0.02, 2),
                "land_surface_temperature": round(temp + 2.2 + index * 0.12, 1),
                "geometry": {"type": "Polygon", "coordinates": [build_polygon(lat, lon, index)]},
            }
        )
    return records


def build_block_weather() -> dict[str, Any]:
    return {
        "location_id": "demo-block",
        "location_name": BLOCK,
        "district": DISTRICT,
        "state": STATE,
        "latitude": 9.925,
        "longitude": 78.119,
        "temperature": 31.0,
        "rainfall": 24.0,
        "humidity": 74.0,
        "wind_speed": 12.0,
        "pressure": 1008.0,
        "cloud_cover": 48.0,
        "solar_radiation": 5.8,
        "updated_at": datetime.now(UTC).isoformat(),
    }


def build_forecast() -> dict[str, Any]:
    rain = [18.6, 32.4, 11.2, 4.8, 8.6, 25.4, 15.1]
    temps = [31.0, 30.2, 29.6, 31.4, 32.0, 30.8, 31.7]
    humidity = [76, 82, 78, 70, 66, 79, 74]
    wind = [14, 17, 12, 10, 11, 16, 13]
    probability = [42, 68, 31, 18, 26, 57, 38]
    days = []
    for index in range(7):
        days.append(
            {
                "date": iso_day(index),
                "label": (date.today() + timedelta(days=index)).strftime("%a"),
                "block_temperature": round(temps[index] - 0.2, 1),
                "panchayat_temperature": round(temps[index], 1),
                "block_rainfall": round(rain[index] * 0.88, 1),
                "panchayat_rainfall": rain[index],
                "humidity": humidity[index],
                "wind_speed": wind[index],
                "pressure": round(1008 + math.sin(index) * 4, 1),
                "cloud_cover": round(42 + rain[index] * 1.1, 1),
                "rain_probability": probability[index],
            }
        )
    return {"block": build_block_weather(), "forecast": days, "hourly": build_hourly(), "data_label": "Prototype Demonstration Dataset"}


def build_hourly() -> list[dict[str, Any]]:
    now = datetime.now(UTC).replace(minute=0, second=0, microsecond=0)
    values = []
    for index in range(24):
        timestamp = now + timedelta(hours=index)
        values.append(
            {
                "time": timestamp.strftime("%H:%M"),
                "timestamp": timestamp.isoformat(),
                "temperature": round(29.4 + math.sin((index - 6) / 24 * math.pi * 2) * 3.3 + index * 0.05, 1),
                "rainfall": round(max(0, 0.4 + (2.2 if 13 <= index <= 18 else 0) + math.sin(index) * 0.2), 1),
                "humidity": round(76 - math.sin((index - 6) / 24 * math.pi * 2) * 13, 1),
                "wind_speed": round(12 + math.cos(index / 3) * 4, 1),
                "rain_probability": round(30 + (32 if 13 <= index <= 18 else 0) + math.sin(index) * 8, 1),
            }
        )
    return values


def build_history(panchayat: dict[str, Any] | None = None, days: int = 30) -> list[dict[str, Any]]:
    panchayat = panchayat or build_panchayats()[0]
    rows: list[dict[str, Any]] = []
    for index in range(days):
        day = date.today() - timedelta(days=days - index - 1)
        wave = math.sin(index / 3.4) + math.cos(index / 6.2)
        rainfall = round(max(0, 17 + wave * 8 + math.sin(index * 1.8) * 4), 1)
        temperature = round(29.2 + math.sin((index - 8) / 5) * 3.2 + (index % 4) * 0.22, 1)
        humidity = round(min(98, max(42, 73 - temperature * 0.25 + rainfall * 0.12)), 1)
        moisture = round(max(22, min(90, 46 + rainfall * 0.35 - (temperature - 29) * 0.7)), 1)
        ndvi = round(max(0.25, min(0.88, panchayat["ndvi"] + math.sin(index / 8) * 0.055)), 2)
        rows.append({"date": day.isoformat(), "rainfall": rainfall, "temperature": temperature, "humidity": humidity, "soil_moisture": moisture, "ndvi": ndvi})
    return rows


def build_alerts() -> list[dict[str, Any]]:
    return [
        {"id": "alert-01", "type": "Heavy Rain", "severity": "High", "title": "Heavy rain alert", "panchayat": "Demo Panchayat", "panchayat_id": "p-01", "message": "65 mm rainfall is possible in the next 24 hours. Avoid irrigation and ensure drainage channels are clear.", "time": "Next 24 hours", "created_at": datetime.now(UTC).isoformat(), "is_read": False, "recommended_action": "Avoid irrigation and ensure proper drainage."},
        {"id": "alert-02", "type": "Crop Stress", "severity": "Moderate", "title": "Vegetation stress watch", "panchayat": "Vadipatti", "panchayat_id": "p-04", "message": "NDVI decreased while soil moisture is below the comfort range for the current crop.", "time": "Today", "created_at": datetime.now(UTC).isoformat(), "is_read": False, "recommended_action": "Inspect crop canopy and schedule a soil moisture check."},
        {"id": "alert-03", "type": "Irrigation Alert", "severity": "Moderate", "title": "Irrigation window available", "panchayat": "Usilampatti", "panchayat_id": "p-06", "message": "Soil moisture is adequate for the next 12 hours. Reassess before the evening irrigation slot.", "time": "Next 12 hours", "created_at": datetime.now(UTC).isoformat(), "is_read": True, "recommended_action": "Recheck moisture before the evening slot."},
        {"id": "alert-04", "type": "Heat Stress", "severity": "Low", "title": "Heat stress advisory", "panchayat": "Pannaipuram", "panchayat_id": "p-08", "message": "Afternoon temperatures may increase evapotranspiration. Irrigate early morning if required.", "time": "This afternoon", "created_at": datetime.now(UTC).isoformat(), "is_read": False, "recommended_action": "Prefer early-morning irrigation and mulch exposed soil."},
    ]


def build_crops() -> list[dict[str, Any]]:
    return [
        {"id": "paddy", "name": "Paddy", "icon": "🌾", "water_requirement_mm": 125, "stages": ["Nursery", "Vegetative", "Flowering", "Panicle initiation", "Maturity"]},
        {"id": "maize", "name": "Maize", "icon": "🌽", "water_requirement_mm": 95, "stages": ["Germination", "Vegetative", "Flowering", "Grain filling", "Maturity"]},
        {"id": "cotton", "name": "Cotton", "icon": "☁️", "water_requirement_mm": 110, "stages": ["Germination", "Vegetative", "Squaring", "Flowering", "Boll development"]},
        {"id": "groundnut", "name": "Groundnut", "icon": "🥜", "water_requirement_mm": 85, "stages": ["Germination", "Vegetative", "Flowering", "Pod development", "Maturity"]},
        {"id": "sugarcane", "name": "Sugarcane", "icon": "🎋", "water_requirement_mm": 165, "stages": ["Germination", "Tillering", "Grand growth", "Maturity"]},
        {"id": "banana", "name": "Banana", "icon": "🍌", "water_requirement_mm": 180, "stages": ["Establishment", "Vegetative", "Flowering", "Fruit development", "Harvest"]},
        {"id": "tomato", "name": "Tomato", "icon": "🍅", "water_requirement_mm": 105, "stages": ["Establishment", "Vegetative", "Flowering", "Fruit set", "Harvest"]},
        {"id": "onion", "name": "Onion", "icon": "🧅", "water_requirement_mm": 90, "stages": ["Establishment", "Vegetative", "Bulb initiation", "Maturity"]},
        {"id": "pulses", "name": "Pulses", "icon": "🫘", "water_requirement_mm": 70, "stages": ["Germination", "Vegetative", "Flowering", "Pod development", "Maturity"]},
    ]


def build_officer_rows() -> list[dict[str, Any]]:
    rows = []
    for item in build_panchayats():
        risk = item["risk_status"]
        action = {
            "Critical": "Clear drainage immediately and postpone field operations.",
            "High": "Inspect drainage and avoid irrigation before the next rain spell.",
            "Moderate": "Monitor crop and soil moisture; review after 24 hours.",
            "Normal": "Continue the regular crop monitoring plan.",
        }[risk]
        rows.append({"panchayat": item["name"], "panchayat_id": item["id"], "risk": risk, "crop": item["crop"], "rainfall": item["rainfall"], "soil_moisture": item["soil_moisture"], "crop_stress": item["crop_stress"], "recommended_action": action})
    return rows
