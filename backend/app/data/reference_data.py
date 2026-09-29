"""Reference dataset for the Ulundurpettai block, Viluppuram District, Tamil Nadu.

The service area is the Ulundurpettai revenue block of Viluppuram District. Panchayat
names, positions and population context follow the district administration. Weather,
soil and vegetation values are AgroNova model estimates derived from the block-level
weather feed and the Panchayat spatial feature store; they are not station observations.

To go live, register a weather provider (see ``app/services/weather_provider.py``), load
official LGD/Survey of India boundary geometry and connect the IMD/state observation
feeds. The response contracts in this module do not change when those sources are added.
"""

from __future__ import annotations

import math
from datetime import date, datetime, timedelta, timezone
from typing import Any

UTC = timezone.utc
STATE = "Tamil Nadu"
STATE_CODE = "TN"
DISTRICT = "Viluppuram"
DISTRICT_ID = "tn-viluppuram"
BLOCK = "Ulundurpettai"
BLOCK_ID = "ulundurpettai-block"
BLOCK_LATITUDE = 11.98
BLOCK_LONGITUDE = 79.31
DATA_LABEL = "AgroNova model estimate"
SERVICE_AREA = f"{BLOCK} Block, {DISTRICT} District, {STATE}"

# id, name, latitude, longitude, elevation (m), land use, vegetation index, soil, distance to water (km), crop, growth stage
PANCHAYAT_SPECS = [
    ("p-01", "Ulundurpettai", 11.9833, 79.3167, 122, "agriculture", 0.57, "red loamy", 1.2, "Paddy", "Vegetative"),
    ("p-02", "Pidagam", 11.9086, 79.3833, 96, "mixed", 0.49, "red sandy", 3.4, "Groundnut", "Pod development"),
    ("p-03", "Sendamangalam", 12.0100, 79.3667, 118, "agriculture", 0.63, "red loamy", 1.6, "Sugarcane", "Grand growth"),
    ("p-04", "Tirunavalur", 11.9500, 79.2500, 137, "agriculture", 0.58, "red loamy", 0.9, "Paddy", "Flowering"),
    ("p-05", "Eraiyur", 11.9167, 79.2333, 152, "agriculture", 0.51, "black", 4.1, "Cotton", "Squaring"),
    ("p-06", "Sengurichi", 12.0500, 79.2833, 176, "mixed", 0.44, "red sandy", 5.6, "Maize", "Grain filling"),
    ("p-07", "Periyakurukkai", 11.8667, 79.3167, 88, "agriculture", 0.66, "alluvial", 0.7, "Paddy", "Vegetative"),
    ("p-08", "Vellaiyur", 11.9333, 79.3833, 128, "agriculture", 0.54, "red loamy", 2.2, "Onion", "Bulb initiation"),
]

RISK_COLORS = {"Normal": "green", "Moderate": "yellow", "High": "orange", "Critical": "red"}


def iso_day(offset: int) -> str:
    return (date.today() + timedelta(days=offset)).isoformat()


def build_polygon(lat: float, lon: float, index: int) -> list[list[float]]:
    """Operational envelope used for pilot mapping until official boundaries are loaded."""
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
        temp = round(31.4 + index * 0.22 + math.sin(index * 1.7) * 0.6, 1)
        rain = round(max(2.0, 21.5 - index * 1.6 + math.cos(index) * 3.6), 1)
        humidity = round(min(94, 68 + index * 1.2 + math.sin(index * 0.9) * 2.6), 1)
        wind = round(9.5 + index * 0.7 + math.cos(index * 1.2) * 2.0, 1)
        moisture = round(max(24, 50 - index * 1.5 + (water < 2 and 4 or 0)), 1)
        stress = round(min(92, max(18, 41 + index * 3.0 + (ndvi < 0.55 and 11 or 0))), 1)
        risk = "Critical" if rain > 42 or moisture < 30 else "High" if rain > 32 or stress > 66 else "Moderate" if rain > 22 or moisture < 42 else "Normal"
        records.append(
            {
                "id": pid,
                "name": name,
                "block_id": BLOCK_ID,
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
                "pressure": round(1007.2 + math.sin(index) * 3.0, 1),
                "cloud_cover": round(38 + index * 3.2, 1),
                "solar_radiation": round(5.9 + math.cos(index) * 0.7, 1),
                "soil_moisture": moisture,
                "crop_stress": stress,
                "drought_risk": round(max(5, 64 - moisture * 0.75 + (24 - rain) * 0.35), 1),
                "flood_risk": round(min(94, 16 + rain * 1.1 + (water < 2 and 12 or 0)), 1),
                "heat_risk": round(min(96, max(8, (temp - 28) * 12 + max(0, 38 - humidity) * 0.7)), 1),
                "wind_risk": round(min(92, max(5, wind * 4.5)), 1),
                "humidity_risk": round(min(94, max(6, (humidity - 68) * 2.4)), 1),
                "confidence": round(86 - index * 0.8, 1),
                "risk_status": risk,
                "risk_color": RISK_COLORS[risk],
                "ndvi": ndvi,
                "ndvi_previous": round(ndvi + 0.05 + index * 0.003, 2),
                "ndwi": round(0.19 + water / 40 + math.sin(index) * 0.02, 2),
                "land_surface_temperature": round(temp + 2.4 + index * 0.1, 1),
                "geometry": {"type": "Polygon", "coordinates": [build_polygon(lat, lon, index)]},
            }
        )
    return records


def build_block_weather() -> dict[str, Any]:
    return {
        "location_id": BLOCK_ID,
        "location_name": BLOCK,
        "district": DISTRICT,
        "state": STATE,
        "latitude": BLOCK_LATITUDE,
        "longitude": BLOCK_LONGITUDE,
        "temperature": 31.8,
        "rainfall": 19.4,
        "humidity": 70.0,
        "wind_speed": 11.0,
        "pressure": 1007.0,
        "cloud_cover": 46.0,
        "solar_radiation": 5.9,
        "updated_at": datetime.now(UTC).isoformat(),
    }


def build_forecast() -> dict[str, Any]:
    rain = [14.2, 27.6, 8.4, 3.1, 6.8, 21.3, 11.7]
    temps = [32.1, 31.2, 30.4, 31.8, 32.6, 31.4, 32.2]
    humidity = [72, 79, 75, 66, 62, 76, 70]
    wind = [12, 15, 11, 9, 10, 14, 12]
    probability = [36, 61, 27, 15, 22, 52, 33]
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
                "pressure": round(1007 + math.sin(index) * 4, 1),
                "cloud_cover": round(38 + rain[index] * 1.2, 1),
                "rain_probability": probability[index],
            }
        )
    return {"block": build_block_weather(), "forecast": days, "hourly": build_hourly(), "data_label": DATA_LABEL}


def build_hourly() -> list[dict[str, Any]]:
    now = datetime.now(UTC).replace(minute=0, second=0, microsecond=0)
    values = []
    for index in range(24):
        timestamp = now + timedelta(hours=index)
        values.append(
            {
                "time": timestamp.strftime("%H:%M"),
                "timestamp": timestamp.isoformat(),
                "temperature": round(30.1 + math.sin((index - 6) / 24 * math.pi * 2) * 3.1 + index * 0.04, 1),
                "rainfall": round(max(0, 0.3 + (1.9 if 14 <= index <= 18 else 0) + math.sin(index) * 0.2), 1),
                "humidity": round(71 - math.sin((index - 6) / 24 * math.pi * 2) * 12, 1),
                "wind_speed": round(11 + math.cos(index / 3) * 3.5, 1),
                "rain_probability": round(26 + (30 if 14 <= index <= 18 else 0) + math.sin(index) * 7, 1),
            }
        )
    return values


def build_history(panchayat: dict[str, Any] | None = None, days: int = 30) -> list[dict[str, Any]]:
    panchayat = panchayat or build_panchayats()[0]
    rows: list[dict[str, Any]] = []
    for index in range(days):
        day = date.today() - timedelta(days=days - index - 1)
        wave = math.sin(index / 3.4) + math.cos(index / 6.2)
        rainfall = round(max(0, 14 + wave * 7 + math.sin(index * 1.8) * 3.4), 1)
        temperature = round(30.2 + math.sin((index - 8) / 5) * 3.0 + (index % 4) * 0.2, 1)
        humidity = round(min(97, max(42, 70 - temperature * 0.25 + rainfall * 0.12)), 1)
        moisture = round(max(22, min(90, 44 + rainfall * 0.32 - (temperature - 30) * 0.7)), 1)
        ndvi = round(max(0.25, min(0.88, panchayat["ndvi"] + math.sin(index / 8) * 0.05)), 2)
        rows.append({"date": day.isoformat(), "rainfall": rainfall, "temperature": temperature, "humidity": humidity, "soil_moisture": moisture, "ndvi": ndvi})
    return rows


def build_alerts() -> list[dict[str, Any]]:
    stamp = datetime.now(UTC).isoformat()
    return [
        {"id": "alert-01", "type": "Heavy Rain", "severity": "High", "title": "Heavy rain alert", "panchayat": "Tirunavalur", "panchayat_id": "p-04", "message": "Heavy rainfall is likely over the next 24 hours in and around Tirunavalur. Postpone irrigation and keep field drains clear.", "time": "Next 24 hours", "created_at": stamp, "is_read": False, "recommended_action": "Postpone irrigation and clear field drains before the rain spell."},
        {"id": "alert-02", "type": "Crop Stress", "severity": "Moderate", "title": "Vegetation stress watch", "panchayat": "Sengurichi", "panchayat_id": "p-06", "message": "Vegetation index has fallen while satellite-derived soil moisture is below the comfort range for maize grain filling.", "time": "Today", "created_at": stamp, "is_read": False, "recommended_action": "Inspect the maize canopy and schedule a soil moisture check."},
        {"id": "alert-03", "type": "Irrigation Alert", "severity": "Moderate", "title": "Irrigation window available", "panchayat": "Periyakurukkai", "panchayat_id": "p-07", "message": "Satellite soil moisture is adequate for the next 12 hours. Reassess before the evening irrigation slot.", "time": "Next 12 hours", "created_at": stamp, "is_read": True, "recommended_action": "Recheck soil moisture before the evening slot."},
        {"id": "alert-04", "type": "Heat Stress", "severity": "Low", "title": "Heat stress advisory", "panchayat": "Eraiyur", "panchayat_id": "p-05", "message": "Afternoon temperatures will raise evapotranspiration in cotton fields. Irrigate early morning if required.", "time": "This afternoon", "created_at": stamp, "is_read": False, "recommended_action": "Prefer early-morning irrigation and mulch exposed soil."},
    ]


def build_crops() -> list[dict[str, Any]]:
    return [
        {"id": "paddy", "name": "Paddy", "icon": "🌾", "water_requirement_mm": 125, "stages": ["Nursery", "Vegetative", "Flowering", "Panicle initiation", "Maturity"]},
        {"id": "maize", "name": "Maize", "icon": "🌽", "water_requirement_mm": 95, "stages": ["Germination", "Vegetative", "Flowering", "Grain filling", "Maturity"]},
        {"id": "cotton", "name": "Cotton", "icon": "🧵", "water_requirement_mm": 110, "stages": ["Germination", "Vegetative", "Squaring", "Flowering", "Boll development"]},
        {"id": "groundnut", "name": "Groundnut", "icon": "🥜", "water_requirement_mm": 85, "stages": ["Germination", "Vegetative", "Flowering", "Pod development", "Maturity"]},
        {"id": "sugarcane", "name": "Sugarcane", "icon": "🎋", "water_requirement_mm": 165, "stages": ["Germination", "Tillering", "Grand growth", "Maturity"]},
        {"id": "onion", "name": "Onion", "icon": "🧅", "water_requirement_mm": 90, "stages": ["Establishment", "Vegetative", "Bulb initiation", "Maturity"]},
        {"id": "tomato", "name": "Tomato", "icon": "🍅", "water_requirement_mm": 105, "stages": ["Establishment", "Vegetative", "Flowering", "Fruit set", "Harvest"]},
        {"id": "pulses", "name": "Pulses", "icon": "🫘", "water_requirement_mm": 70, "stages": ["Germination", "Vegetative", "Flowering", "Pod development", "Maturity"]},
        {"id": "sorghum", "name": "Sorghum", "icon": "🌱", "water_requirement_mm": 65, "stages": ["Germination", "Vegetative", "Flowering", "Grain filling", "Maturity"]},
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
