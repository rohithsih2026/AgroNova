"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import router
from .config import get_settings

settings = get_settings()
app = FastAPI(
    title="AgroNova API",
    version="0.1.0",
    description="Prototype block-to-Panchayat agro-meteorological intelligence API. All bundled observations are synthetic demonstration data.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)


@app.get("/health")
def root_health() -> dict[str, str]:
    return {"status": "ok", "service": "agronova", "mode": "demo", "data_label": "Prototype Demonstration Dataset"}


@app.get("/")
def root() -> dict[str, str]:
    return {"name": "AgroNova", "status": "ready", "docs": "/docs", "data_label": "Prototype Demonstration Dataset"}
