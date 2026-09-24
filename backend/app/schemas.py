from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=1)
    role: Literal["farmer", "officer", "administrator"] | None = None


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    organization: str
    token: str
    demo: bool = True


class DownscaleRequest(BaseModel):
    block_id: str = "demo-block"
    model: Literal["random_forest", "xgboost", "baseline"] = "random_forest"
    include_baseline: bool = True


class AdvisoryRequest(BaseModel):
    panchayat_id: str = "p-01"
    crop: str = "Paddy"
    variety: str = "Conventional"
    growth_stage: str = "Vegetative"
    soil_type: str = "Red loamy"
    irrigation_type: str = "Canal"
    farm_area: float = Field(default=1.0, gt=0, le=10000)
    sowing_date: date | None = None
    language: Literal["en", "ta"] = "en"


class IrrigationRequest(BaseModel):
    panchayat_id: str = "p-01"
    crop: str = "Paddy"
    growth_stage: str = "Vegetative"
    irrigation_type: str = "Canal"
    soil_moisture: float | None = Field(default=None, ge=0, le=100)
    rainfall_forecast: float | None = Field(default=None, ge=0, le=1000)
    temperature: float | None = Field(default=None, ge=-20, le=60)
    humidity: float | None = Field(default=None, ge=0, le=100)


class SimulationRequest(BaseModel):
    panchayat_id: str = "p-01"
    rainfall_change_percent: float = Field(default=0, ge=-100, le=300)
    temperature_change_c: float = Field(default=0, ge=-20, le=20)
    humidity_change_percent: float = Field(default=0, ge=-100, le=100)
    soil_moisture_change_percent: float = Field(default=0, ge=-100, le=100)


class AlertReadRequest(BaseModel):
    is_read: bool = True
