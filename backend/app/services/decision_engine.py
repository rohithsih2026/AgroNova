"""Transparent crop, irrigation, risk and what-if decision services."""

from __future__ import annotations

from typing import Any

from ..data.demo_data import build_forecast

CROP_WATER = {"Paddy": 125, "Maize": 95, "Cotton": 110, "Groundnut": 85, "Sugarcane": 165, "Banana": 180, "Tomato": 105, "Onion": 90, "Pulses": 70}


def _round(value: float, digits: int = 1) -> float:
    return round(float(value), digits)


def generate_advisory(payload: dict[str, Any], panchayat: dict[str, Any], forecast: dict[str, Any] | None = None) -> dict[str, Any]:
    forecast = forecast or build_forecast()
    next_rain = float(forecast["forecast"][1]["panchayat_rainfall"])
    temperature = float(panchayat["temperature"])
    humidity = float(panchayat["humidity"])
    moisture = float(panchayat["soil_moisture"])
    crop = payload.get("crop", "Paddy")
    stage = payload.get("growth_stage", "Vegetative")
    actions: list[dict[str, str]] = []
    if next_rain >= 15:
        actions.append({"priority": "high", "title": "Avoid irrigation today", "detail": f"Rainfall of about {next_rain:.0f} mm is expected in the next 24 hours."})
        actions.append({"priority": "high", "title": "Keep drainage clear", "detail": "Inspect field channels and remove standing water before the rain spell."})
    else:
        actions.append({"priority": "medium", "title": "Plan irrigation early morning", "detail": "Low rainfall is expected; prioritize the most moisture-sensitive growth stage."})
    if temperature >= 32:
        actions.append({"priority": "medium", "title": "Reduce midday field work", "detail": "High temperature can increase heat and water stress."})
    if humidity >= 78:
        actions.append({"priority": "medium", "title": "Monitor weather-based disease risk", "detail": "High humidity may favour fungal pressure; inspect canopy symptoms. This is not a disease diagnosis."})
    if moisture < 38:
        actions.append({"priority": "high", "title": "Check root-zone moisture", "detail": "Current soil moisture is below the comfort range for this crop stage."})
    actions.append({"priority": "low", "title": "Recheck after 24 hours", "detail": "Weather and soil conditions can change quickly; use the next forecast cycle for the next decision."})
    water_need = CROP_WATER.get(crop, 100) * (1.1 if stage.lower() in {"flowering", "fruit development", "panicle initiation"} else 1.0)
    confidence = round(min(94, max(68, float(panchayat.get("confidence", 86)) - (4 if next_rain > 40 else 0))), 1)
    title = "Rainfall window: hold irrigation and protect drainage" if next_rain >= 15 else "Maintain a measured irrigation and crop-monitoring plan"
    if payload.get("language") == "ta":
        title = "மழை எதிர்பார்ப்பு: பாசனம் தவிர்த்து வடிகால் பாதுகாக்கவும்" if next_rain >= 15 else "நீர் பாசனம் மற்றும் பயிர் கண்காணிப்பு தொடரவும்"
        actions = [
            {"priority": action["priority"], "title": "இன்று பாசனம் செய்வதைத் தவிர்க்கவும்" if next_rain >= 15 else "காலையில் பாசனம் திட்டமிடவும்", "detail": "எதிர்பார்க்கப்படும் மழையின் அளவைப் பொறுத்து நடவு மேற்கொள்ளவும்."}
            for action in actions[:2]
        ] + actions[2:]
    return {
        "crop": crop,
        "variety": payload.get("variety", "Conventional"),
        "growth_stage": stage,
        "title": title,
        "summary": f"{next_rain:.0f} mm rainfall is expected in the next 24 hours. Current soil moisture is {moisture:.0f}%.",
        "actions": actions,
        "weather": {"temperature": temperature, "rainfall": next_rain, "humidity": humidity, "soil_moisture": moisture},
        "water_requirement_mm": round(water_need * (payload.get("farm_area", 1.0) / 1.0), 1),
        "confidence": confidence,
        "confidence_label": "High" if confidence >= 80 else "Medium" if confidence >= 70 else "Low",
        "why": [
            f"Rainfall forecast is {next_rain:.1f} mm for the next 24 hours.",
            f"Soil moisture is {moisture:.0f}% and temperature is {temperature:.1f}°C.",
            f"{crop} at {stage.lower()} has an estimated seasonal water requirement of {water_need:.0f} mm.",
        ],
        "data_label": "Prototype Demonstration Dataset",
    }


def irrigation_recommendation(payload: dict[str, Any], panchayat: dict[str, Any], forecast: dict[str, Any] | None = None) -> dict[str, Any]:
    forecast = forecast or build_forecast()
    moisture = float(payload.get("soil_moisture") if payload.get("soil_moisture") is not None else panchayat["soil_moisture"])
    rain = float(payload.get("rainfall_forecast") if payload.get("rainfall_forecast") is not None else forecast["forecast"][0]["panchayat_rainfall"])
    temperature = float(payload.get("temperature") if payload.get("temperature") is not None else panchayat["temperature"])
    humidity = float(payload.get("humidity") if payload.get("humidity") is not None else panchayat["humidity"])
    crop = payload.get("crop", "Paddy")
    stage = payload.get("growth_stage", "Vegetative")
    base = CROP_WATER.get(crop, 100)
    if rain >= 18 or moisture >= 62:
        recommendation = "NO IRRIGATION REQUIRED"
        reason = "Expected rainfall is sufficient and current soil moisture is adequate."
        timing = "Reassess in 12–24 hours"
        amount = 0.0
    elif moisture < 34 or (temperature >= 33 and moisture < 43):
        recommendation = "IRRIGATE NOW"
        reason = "Low root-zone moisture and evapotranspiration indicate near-term water stress."
        timing = "Irrigate in the next available early-morning window"
        amount = round(max(8, base * 0.16 * (1.25 if stage.lower() in {"flowering", "fruit development"} else 1.0)), 1)
    else:
        recommendation = "IRRIGATE LATER"
        reason = "Soil moisture is workable, but the crop will need water before the next dry period."
        timing = "Schedule within 24 hours and recheck moisture"
        amount = round(max(5, base * 0.1), 1)
    if humidity >= 82 and recommendation == "IRRIGATE NOW":
        recommendation = "IRRIGATE LATER"
        reason = "High humidity and recent rainfall increase drainage loss; defer briefly and monitor."
        timing = "Reassess after the next forecast update"
    return {
        "recommendation": recommendation,
        "reason": reason,
        "timing": timing,
        "current_soil_moisture": round(moisture, 1),
        "expected_rainfall": round(rain, 1),
        "temperature": round(temperature, 1),
        "humidity": round(humidity, 1),
        "estimated_water_requirement_mm": amount,
        "confidence": 84,
        "confidence_label": "High",
        "why": [
            f"Soil moisture reading: {moisture:.0f}%.",
            f"Rainfall in the forecast window: {rain:.0f} mm.",
            f"Crop-stage water reference for {crop}: {base} mm.",
        ],
        "data_label": "Prototype Demonstration Dataset",
    }


def risk_assessment(panchayat: dict[str, Any]) -> dict[str, Any]:
    rain = float(panchayat["rainfall"])
    moisture = float(panchayat["soil_moisture"])
    temperature = float(panchayat["temperature"])
    humidity = float(panchayat["humidity"])
    risks = [
        {"type": "Heavy Rain", "level": "High" if rain >= 40 else "Moderate" if rain >= 25 else "Low", "probability": min(96, round(18 + rain * 1.65, 1)), "reasons": [f"Rainfall forecast is {rain:.1f} mm", "Block and local forecast comparison completed"], "action": "Ensure drainage channels are clear and postpone irrigation."},
        {"type": "Flood", "level": "High" if panchayat["flood_risk"] >= 65 else "Moderate" if panchayat["flood_risk"] >= 35 else "Low", "probability": panchayat["flood_risk"], "reasons": [f"Distance to water body: {panchayat['distance_to_water']} km", f"Soil moisture: {moisture:.0f}%"], "action": "Inspect low-lying field sections and clear outlet paths."},
        {"type": "Drought", "level": "High" if panchayat["drought_risk"] >= 65 else "Moderate" if panchayat["drought_risk"] >= 35 else "Low", "probability": panchayat["drought_risk"], "reasons": [f"Soil moisture deficit indicator: {max(0, 45 - moisture):.0f} points", f"Rainfall forecast: {rain:.1f} mm"], "action": "Review irrigation supply and prioritize critical growth stages."},
        {"type": "Heat Stress", "level": "High" if panchayat["heat_risk"] >= 65 else "Moderate" if panchayat["heat_risk"] >= 35 else "Low", "probability": panchayat["heat_risk"], "reasons": [f"Temperature: {temperature:.1f}°C", f"Relative humidity: {humidity:.0f}%"], "action": "Irrigate early morning and provide temporary shade where possible."},
        {"type": "High Humidity", "level": "High" if humidity >= 82 else "Moderate" if humidity >= 72 else "Low", "probability": panchayat["humidity_risk"], "reasons": [f"Forecast humidity: {humidity:.0f}%", "Weather-based disease pressure indicator only"], "action": "Inspect canopy symptoms and improve field ventilation; this is not a diagnosis."},
        {"type": "Wind Damage", "level": "High" if panchayat["wind_speed"] >= 25 else "Moderate" if panchayat["wind_speed"] >= 17 else "Low", "probability": panchayat["wind_risk"], "reasons": [f"Wind speed: {panchayat['wind_speed']:.1f} km/h"], "action": "Stake tall crops and secure lightweight field equipment."},
    ]
    levels = ["Critical", "High", "Moderate", "Low"]
    overall = max(risks, key=lambda risk: risk["probability"])
    return {"panchayat": panchayat["name"], "overall_risk": overall["level"], "risk_score": round(overall["probability"], 1), "risks": risks, "confidence": panchayat["confidence"], "data_label": "Prototype Demonstration Dataset", "disclaimer": "Disease-related outputs are weather-based risk signals, not definitive diagnoses."}


def simulate(panchayat: dict[str, Any], request: dict[str, Any]) -> dict[str, Any]:
    rain_factor = 1 + float(request.get("rainfall_change_percent", 0)) / 100
    rain = max(0, panchayat["rainfall"] * rain_factor)
    temperature = panchayat["temperature"] + float(request.get("temperature_change_c", 0))
    humidity = min(100, max(0, panchayat["humidity"] * (1 + float(request.get("humidity_change_percent", 0)) / 100)))
    moisture = min(100, max(0, panchayat["soil_moisture"] * (1 + float(request.get("soil_moisture_change_percent", 0)) / 100)))
    stress_delta = round((temperature - panchayat["temperature"]) * 4.2 + (panchayat["rainfall"] - rain) * 0.34 + (panchayat["humidity"] - humidity) * 0.08 + (panchayat["soil_moisture"] - moisture) * 0.42, 1)
    baseline_stress = panchayat["crop_stress"]
    scenario_stress = min(98, max(8, baseline_stress + stress_delta))
    water_delta = round(max(-100, (temperature - panchayat["temperature"]) * 3.8 - (rain - panchayat["rainfall"]) * 0.22), 1)
    return {
        "baseline": {"rainfall": panchayat["rainfall"], "temperature": panchayat["temperature"], "humidity": panchayat["humidity"], "soil_moisture": panchayat["soil_moisture"], "crop_stress": baseline_stress, "water_requirement": 42.0, "irrigation": "Review today"},
        "scenario": {"rainfall": round(rain, 1), "temperature": round(temperature, 1), "humidity": round(humidity, 1), "soil_moisture": round(moisture, 1), "crop_stress": round(scenario_stress, 1), "water_requirement": round(max(5, 42 + water_delta), 1), "irrigation": "Irrigate now" if scenario_stress >= 70 or moisture < 35 else "Irrigate later" if scenario_stress >= 45 else "No irrigation required"},
        "changes": {"crop_stress": round(scenario_stress - baseline_stress, 1), "water_requirement": water_delta, "heat_risk": round(max(0, (temperature - 29) * 8), 1), "drought_risk": round(min(100, max(0, 65 - moisture + max(0, 28 - rain))), 1)},
        "label": "Simulated estimate — not a forecast",
        "data_label": "Prototype Demonstration Dataset",
    }
