from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_and_demo_login():
    health = client.get("/api/health")
    assert health.status_code == 200
    assert health.json()["data_label"] == "Prototype Demonstration Dataset"
    login = client.post("/api/auth/login", json={"email": "officer@agronova.demo", "password": "demo123", "role": "officer"})
    assert login.status_code == 200
    assert login.json()["role"] == "officer"
    admin_login = client.post("/api/auth/login", json={"email": "admin@agronova.demo", "password": "demo123"})
    assert admin_login.status_code == 200
    assert admin_login.json()["role"] == "administrator"


def test_downscaling_workflow():
    response = client.post("/api/downscaling/predict", json={"block_id": "demo-block", "model": "random_forest"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "completed"
    assert payload["model_version"] == "prototype-rf-v1"
    assert len(payload["panchayats"]) == 8
    detail = client.get("/api/downscaling/results/p-01")
    assert detail.status_code == 200
    assert detail.json()["panchayat_id"] == "p-01"
    panchayats = client.get("/api/panchayats/demo-block")
    assert panchayats.status_code == 200
    assert panchayats.json()["items"][0]["source"] == "AI-downscaled prototype"
    baseline = client.post("/api/downscaling/predict", json={"block_id": "demo-block", "model": "baseline"})
    assert baseline.status_code == 200
    assert baseline.json()["model_version"] == "prototype-idw-v1"
    xgboost = client.post("/api/downscaling/predict", json={"block_id": "demo-block", "model": "xgboost"})
    assert xgboost.status_code == 200
    assert xgboost.json()["model_used"] in {"xgboost", "heuristic"}


def test_decision_endpoints():
    advisory = client.post("/api/advisory/generate", json={"panchayat_id": "p-01", "crop": "Paddy", "growth_stage": "Vegetative"})
    assert advisory.status_code == 200
    assert advisory.json()["actions"]
    irrigation = client.post("/api/irrigation/recommend", json={"panchayat_id": "p-01", "crop": "Paddy", "growth_stage": "Vegetative"})
    assert irrigation.status_code == 200
    assert irrigation.json()["recommendation"]
    risk = client.get("/api/risk/p-01")
    assert risk.status_code == 200
    assert "weather-based" in risk.json()["disclaimer"].lower()
    first_forecast = client.get("/api/weather/forecast?panchayat_id=p-01").json()["forecast"][0]
    second_forecast = client.get("/api/weather/forecast?panchayat_id=p-08").json()["forecast"][0]
    assert first_forecast["panchayat_temperature"] != second_forecast["panchayat_temperature"]
