"""Seed the SQLAlchemy schema with clearly labelled prototype records.

Run from the backend directory with: python scripts/seed_data.py
"""

from __future__ import annotations

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Make ``app`` importable when this script is invoked directly.
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.data.demo_data import build_alerts, build_crops, build_panchayats  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models import (  # noqa: E402
    Alert,
    Block,
    Crop,
    District,
    DownscaledForecast,
    Panchayat,
    User,
    WeatherForecast,
    WeatherObservation,
)


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        if db.query(User).count() > 0:
            print("Seed skipped: users already exist.")
            return
        district = District(name="Madurai", state="Tamil Nadu", code="TN-MADURAI")
        db.add(district)
        db.flush()
        block = Block(name="Demo Block", district_id=district.id)
        db.add(block)
        db.flush()
        for panchayat in build_panchayats():
            db.add(Panchayat(name=panchayat["name"], block_id=block.id, latitude=panchayat["latitude"], longitude=panchayat["longitude"], elevation=panchayat["elevation"], geometry_json=None, land_use=panchayat["land_use"], vegetation_index=panchayat["vegetation_index"], soil_type=panchayat["soil_type"], distance_to_water=panchayat["distance_to_water"]))
        db.flush()
        for name in [item["name"] for item in build_crops()]:
            db.add(Crop(name=name, code=name.lower().replace(" ", "-"), water_requirement_mm=100))
        db.flush()
        for email, name, role in [("farmer@agronova.demo", "Kavitha R", "farmer"), ("officer@agronova.demo", "Murugan S", "officer"), ("admin@agronova.demo", "AgroNova Admin", "administrator")]:
            db.add(User(name=name, email=email, role=role, password_hash="demo-only-no-real-auth"))
        db.flush()
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        for index, panchayat in enumerate(build_panchayats()):
            db.add(WeatherObservation(location_type="panchayat", location_id=index + 1, observed_at=now, temperature=panchayat["temperature"], rainfall=panchayat["rainfall"], humidity=panchayat["humidity"], wind_speed=panchayat["wind_speed"], pressure=panchayat["pressure"], cloud_cover=panchayat["cloud_cover"]))
        for offset in range(7):
            db.add(WeatherForecast(location_type="block", location_id=1, forecast_at=now + timedelta(days=offset), temperature=31, rainfall=18, humidity=74, wind_speed=12, rain_probability=40))
        for index, alert in enumerate(build_alerts()):
            db.add(Alert(panchayat_id=None, alert_type=alert["type"], severity=alert["severity"], title=alert["title"], message=alert["message"], is_read=alert["is_read"], valid_until=now + timedelta(hours=24)))
        db.add(DownscaledForecast(panchayat_id=1, forecast_at=now, temperature=30.8, rainfall=34.2, humidity=82, wind_speed=14, soil_moisture=51, confidence=86, model_version="prototype-rf-v1"))
        db.commit()
    print("AgroNova prototype schema seeded.")


if __name__ == "__main__":
    seed()
