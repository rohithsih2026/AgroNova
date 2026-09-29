"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import router
from .config import get_settings

settings = get_settings()
app = FastAPI(
    title="AgroNova API",
    version="1.0.0",
    description="Block-to-Panchayat agro-meteorological intelligence API for Ulundurpettai Block, Viluppuram District, Tamil Nadu. Responses carry AgroNova model estimates derived from the block weather feed and Panchayat spatial features.",
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
    return {"status": "ok", "service": "agronova", "mode": "reference", "district": "Viluppuram", "block": "Ulundurpettai", "data_label": "AgroNova model estimate"}


@app.get("/")
def root() -> dict[str, str]:
    return {"name": "AgroNova", "status": "ready", "district": "Viluppuram", "block": "Ulundurpettai", "docs": "/docs", "data_label": "AgroNova model estimate"}
