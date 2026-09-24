"""Relational schema for the production migration path.

The prototype API can run without these tables, while the seed script creates the
same schema in SQLite. Spatial columns can be migrated to PostGIS geography types.
"""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class User(Base, TimestampMixin):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    role: Mapped[str] = mapped_column(String(40), default="farmer")
    password_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(default=True)
    farmer: Mapped[Farmer | None] = relationship(back_populates="user", uselist=False)
    officer: Mapped[Officer | None] = relationship(back_populates="user", uselist=False)


class Farmer(Base, TimestampMixin):
    __tablename__ = "farmers"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    village: Mapped[str] = mapped_column(String(120))
    panchayat_id: Mapped[int] = mapped_column(ForeignKey("panchayats.id"))
    farm_area_hectares: Mapped[float] = mapped_column(Float, default=1.0)
    crop: Mapped[str] = mapped_column(String(80), default="Paddy")
    variety: Mapped[str] = mapped_column(String(100), default="Conventional")
    soil_type: Mapped[str] = mapped_column(String(80), default="Red loamy")
    irrigation_type: Mapped[str] = mapped_column(String(80), default="Canal")
    user: Mapped[User] = relationship(back_populates="farmer")
    farms: Mapped[list["Farm"]] = relationship(back_populates="farmer")


class Officer(Base, TimestampMixin):
    __tablename__ = "officers"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    designation: Mapped[str] = mapped_column(String(120), default="Agriculture Officer")
    district_id: Mapped[int] = mapped_column(ForeignKey("districts.id"))
    block_id: Mapped[int | None] = mapped_column(ForeignKey("blocks.id"))
    user: Mapped[User] = relationship(back_populates="officer")


class District(Base, TimestampMixin):
    __tablename__ = "districts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    state: Mapped[str] = mapped_column(String(120))
    code: Mapped[str] = mapped_column(String(30), unique=True)
    blocks: Mapped[list["Block"]] = relationship(back_populates="district")


class Block(Base, TimestampMixin):
    __tablename__ = "blocks"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    district_id: Mapped[int] = mapped_column(ForeignKey("districts.id"))
    district: Mapped[District] = relationship(back_populates="blocks")
    panchayats: Mapped[list["Panchayat"]] = relationship(back_populates="block")


class Panchayat(Base, TimestampMixin):
    __tablename__ = "panchayats"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    block_id: Mapped[int] = mapped_column(ForeignKey("blocks.id"))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    elevation: Mapped[float | None] = mapped_column(Float)
    land_use: Mapped[str | None] = mapped_column(String(80))
    vegetation_index: Mapped[float | None] = mapped_column(Float)
    soil_type: Mapped[str | None] = mapped_column(String(80))
    distance_to_water: Mapped[float | None] = mapped_column(Float)
    geometry_json: Mapped[str | None] = mapped_column(Text)
    block: Mapped[Block] = relationship(back_populates="panchayats")
    villages: Mapped[list["Village"]] = relationship(back_populates="panchayat")


class Village(Base, TimestampMixin):
    __tablename__ = "villages"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    panchayat_id: Mapped[int] = mapped_column(ForeignKey("panchayats.id"))
    panchayat: Mapped[Panchayat] = relationship(back_populates="villages")


class Farm(Base, TimestampMixin):
    __tablename__ = "farms"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    farmer_id: Mapped[int] = mapped_column(ForeignKey("farmers.id"))
    name: Mapped[str] = mapped_column(String(120), default="My Farm")
    area_hectares: Mapped[float] = mapped_column(Float, default=1.0)
    crop: Mapped[str] = mapped_column(String(80), default="Paddy")
    variety: Mapped[str] = mapped_column(String(100), default="Conventional")
    sowing_date: Mapped[date | None] = mapped_column(Date)
    growth_stage: Mapped[str] = mapped_column(String(60), default="Vegetative")
    soil_type: Mapped[str] = mapped_column(String(80), default="Red loamy")
    irrigation_type: Mapped[str] = mapped_column(String(80), default="Canal")
    farmer: Mapped[Farmer] = relationship(back_populates="farms")


class SoilData(Base, TimestampMixin):
    __tablename__ = "soil_data"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    farm_id: Mapped[int] = mapped_column(ForeignKey("farms.id"))
    moisture: Mapped[float] = mapped_column(Float)
    temperature: Mapped[float] = mapped_column(Float)
    texture: Mapped[str] = mapped_column(String(80))


class WeatherObservation(Base, TimestampMixin):
    __tablename__ = "weather_observations"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    location_type: Mapped[str] = mapped_column(String(30))
    location_id: Mapped[int] = mapped_column(Integer)
    observed_at: Mapped[datetime] = mapped_column(DateTime)
    temperature: Mapped[float] = mapped_column(Float)
    rainfall: Mapped[float] = mapped_column(Float)
    humidity: Mapped[float] = mapped_column(Float)
    wind_speed: Mapped[float] = mapped_column(Float)
    pressure: Mapped[float] = mapped_column(Float)
    cloud_cover: Mapped[float] = mapped_column(Float)


class WeatherForecast(Base, TimestampMixin):
    __tablename__ = "weather_forecasts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    location_type: Mapped[str] = mapped_column(String(30))
    location_id: Mapped[int] = mapped_column(Integer)
    forecast_at: Mapped[datetime] = mapped_column(DateTime)
    temperature: Mapped[float] = mapped_column(Float)
    rainfall: Mapped[float] = mapped_column(Float)
    humidity: Mapped[float] = mapped_column(Float)
    wind_speed: Mapped[float] = mapped_column(Float)
    rain_probability: Mapped[float] = mapped_column(Float)


class DownscaledForecast(Base, TimestampMixin):
    __tablename__ = "downscaled_forecasts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    panchayat_id: Mapped[int] = mapped_column(ForeignKey("panchayats.id"))
    forecast_at: Mapped[datetime] = mapped_column(DateTime)
    temperature: Mapped[float] = mapped_column(Float)
    rainfall: Mapped[float] = mapped_column(Float)
    humidity: Mapped[float] = mapped_column(Float)
    wind_speed: Mapped[float] = mapped_column(Float)
    soil_moisture: Mapped[float] = mapped_column(Float)
    confidence: Mapped[float] = mapped_column(Float)
    model_version: Mapped[str] = mapped_column(String(80), default="prototype-rf-v1")


class Crop(Base, TimestampMixin):
    __tablename__ = "crops"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)
    code: Mapped[str] = mapped_column(String(30), unique=True)
    water_requirement_mm: Mapped[float] = mapped_column(Float)


class CropProfile(Base, TimestampMixin):
    __tablename__ = "crop_profiles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    crop_id: Mapped[int] = mapped_column(ForeignKey("crops.id"))
    stage: Mapped[str] = mapped_column(String(60))
    temperature_min: Mapped[float] = mapped_column(Float)
    temperature_max: Mapped[float] = mapped_column(Float)
    moisture_min: Mapped[float] = mapped_column(Float)
    moisture_max: Mapped[float] = mapped_column(Float)


class SatelliteData(Base, TimestampMixin):
    __tablename__ = "satellite_data"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    panchayat_id: Mapped[int] = mapped_column(ForeignKey("panchayats.id"))
    observed_on: Mapped[date] = mapped_column(Date)
    ndvi: Mapped[float] = mapped_column(Float)
    ndwi: Mapped[float] = mapped_column(Float)
    land_surface_temperature: Mapped[float] = mapped_column(Float)


class RiskPrediction(Base, TimestampMixin):
    __tablename__ = "risk_predictions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    panchayat_id: Mapped[int] = mapped_column(ForeignKey("panchayats.id"))
    crop: Mapped[str] = mapped_column(String(80))
    risk_type: Mapped[str] = mapped_column(String(100))
    risk_level: Mapped[str] = mapped_column(String(30))
    probability: Mapped[float] = mapped_column(Float)
    reasons_json: Mapped[str] = mapped_column(Text)
    recommended_action: Mapped[str] = mapped_column(Text)


class Advisory(Base, TimestampMixin):
    __tablename__ = "advisories"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    farm_id: Mapped[int] = mapped_column(ForeignKey("farms.id"))
    crop: Mapped[str] = mapped_column(String(80))
    advisory_text: Mapped[str] = mapped_column(Text)
    confidence: Mapped[float] = mapped_column(Float)
    language: Mapped[str] = mapped_column(String(20), default="en")


class Alert(Base, TimestampMixin):
    __tablename__ = "alerts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    panchayat_id: Mapped[int | None] = mapped_column(ForeignKey("panchayats.id"))
    alert_type: Mapped[str] = mapped_column(String(80))
    severity: Mapped[str] = mapped_column(String(30))
    title: Mapped[str] = mapped_column(String(180))
    message: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(default=False)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime)


class ModelMetric(Base, TimestampMixin):
    __tablename__ = "model_metrics"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    model_version: Mapped[str] = mapped_column(String(80))
    variable: Mapped[str] = mapped_column(String(80))
    mae: Mapped[float] = mapped_column(Float)
    rmse: Mapped[float] = mapped_column(Float)
    r2: Mapped[float] = mapped_column(Float)
    evaluated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
