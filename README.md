# AgroNova

**From Block-Level Weather to Panchayat-Level Agricultural Intelligence**

AgroNova is a working SIH prototype that demonstrates a complete agro-meteorological decision-support workflow:

`Block weather → spatial features → ML downscaling → Panchayat weather → crop/risk intelligence → farmer advisory`

The repository includes a React/TypeScript dashboard and a FastAPI backend with a deterministic synthetic demonstration dataset. It is intentionally usable without API keys or external weather services.

> **Prototype Demonstration Dataset:** Weather, satellite, crop and risk values in this repository are synthetic demonstration data. They are not government observations, forecasts, or scientifically validated results. Replace the demo provider and seed data with official observations before making operational claims.

## What is implemented

- Role-based demo login for Farmer, Agriculture Officer and Administrator
- Responsive application shell with 16 routed views and a common sidebar
- Block → Panchayat AI downscaling pipeline with baseline interpolation comparison
- Random Forest model interface with a deterministic fallback when scikit-learn is unavailable
- Panchayat risk map using demo GeoJSON-style polygons and Leaflet
- Weather, historical, model-performance, satellite, risk and what-if charts
- Crop advisory, irrigation recommendation, explainable “Why?” panels and confidence labels
- Alerts with read state, officer monitoring table and dashboard summaries
- English/Tamil UI labels and browser Web Speech API advisory playback
- FastAPI endpoints, Pydantic validation, SQLite/SQLAlchemy schema and seed script
- Demo Mode that keeps the frontend usable even when the API is offline

## Branding asset

The supplied `logo.png` is preserved at the repository root and copied to `frontend/public/logo.png` for the login experience. The product UI uses the AgroNova name while retaining the supplied artwork as a replaceable brand asset.

### ML approach

The prototype creates a deterministic spatial dataset for each demo Panchayat. Features include block observations, latitude, longitude, elevation, land use, vegetation index, soil type, distance to water and historical weather summaries. `backend/app/ml/feature_engineering.py` builds the feature matrix, `downscaler.py` exposes a replaceable model interface, and `predict.py` returns both an interpolation baseline and an ML-style prediction. A Random Forest is used when scikit-learn is installed; a transparent, bounded heuristic is used as a safe fallback so the demo still starts.

The model endpoint supports `random_forest`, an optional `xgboost` estimator and an explicit `baseline` interpolation mode. Each response reports the actual model/fallback version, so an unavailable optional estimator is never presented as XGBoost output. The metrics endpoint is calculated from held-out synthetic rows and is labelled as prototype/demo output. It must not be interpreted as real-world forecast skill.

For optional XGBoost, GeoPandas and PostgreSQL driver support:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pip install -r requirements-optional.txt
```

## Requirements

- Python 3.10+
- Node.js 18+ and npm

## Run the backend

From the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API is available at `http://localhost:8000`, with OpenAPI documentation at `http://localhost:8000/docs`.

If PowerShell execution policy blocks activation, run the venv Python directly:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

## Run without OpenCode

After cloning or downloading the repository, install Python 3.10+ and Node.js 18+, then run this from the project root:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\run_agronova.ps1
```

The script creates the backend virtual environment, installs dependencies, starts FastAPI and Vite, and opens `http://127.0.0.1:5173` in the default browser. Keep the PowerShell window open while using AgroNova; press `Ctrl+C` to stop both services.

## Run the frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

The frontend automatically uses its local synthetic fallback if the backend is unavailable. Set `VITE_API_URL=http://localhost:8000/api` when the API is running.

## Demo login

The login screen provides one-click demo sessions. No password or external identity provider is used.

| Role | Email | Password |
| --- | --- | --- |
| Farmer | farmer@agronova.demo | demo123 |
| Agriculture Officer | officer@agronova.demo | demo123 |
| Administrator | admin@agronova.demo | demo123 |

The selected role changes navigation emphasis and the officer/admin monitoring views. The default demo context is:

`Tamil Nadu → Madurai → Demo Block → Demo Panchayat`

## SIH demonstration path

1. Choose **Continue as Agriculture Officer**.
2. Use the location selector to confirm Tamil Nadu / Madurai / Demo Block.
3. Open **AI Downscaling** and choose **Run AI Downscaling**.
4. Open **Panchayat GIS Map** and click a polygon.
5. Open **Crop Advisory**, select Paddy and Vegetative, then generate the advisory.
6. Review irrigation, risk and alert details.
7. Open **What-If Simulation**, increase temperature by `+2 °C`, and run the scenario.
8. Use the “Why?” panels and confidence labels to discuss explainability and limitations.

## API overview

- `POST /api/auth/login`
- `GET /api/locations/context`
- `GET /api/districts`
- `GET /api/blocks/{district_id}`
- `GET /api/panchayats/{block_id}`
- `GET /api/weather/current`
- `GET /api/weather/forecast`
- `GET /api/weather/panchayat/{id}`
- `POST /api/downscaling/predict`
- `GET /api/downscaling/status`
- `GET /api/downscaling/results/{panchayat_id}`
- `GET /api/downscaling/metrics`
- `GET /api/crops`
- `POST /api/advisory/generate`
- `POST /api/irrigation/recommend`
- `GET /api/risk/{panchayat_id}`
- `GET /api/satellite/{panchayat_id}`
- `GET /api/alerts`
- `POST /api/alerts/{id}/read`
- `GET /api/history/{panchayat_id}`
- `POST /api/simulation`
- `GET /api/officer/monitoring`
- `GET /api/profile`

All request bodies are validated with Pydantic. CORS is configured from environment variables. The main decision endpoints return both an estimate and a `why`/evidence structure, plus `confidence`, `confidence_label` and `data_label` fields.

Example downscale request:

```json
{
  "block_id": "demo-block",
  "model": "random_forest",
  "include_baseline": true
}
```

Example advisory request:

```json
{
  "panchayat_id": "p-01",
  "crop": "Paddy",
  "variety": "ADT 47",
  "growth_stage": "Vegetative",
  "soil_type": "Red loamy",
  "irrigation_type": "Canal",
  "farm_area": 1.8,
  "language": "en"
}
```


## Database and seeding

The SQLAlchemy schema covers the requested entities:

- Identity: `users`, `farmers`, `officers`
- Geography: `districts`, `blocks`, `panchayats`, `villages`
- Farm and crop: `farms`, `crops`, `crop_profiles`, `soil_data`
- Weather and model output: `weather_observations`, `weather_forecasts`, `downscaled_forecasts`
- Earth observation and decisions: `satellite_data`, `risk_predictions`, `advisories`, `alerts`, `model_metrics`

The API demo store is deterministic and does not require a database server, while the schema and seed script are ready for SQLite/PostgreSQL migration. The demo Panchayats are illustrative geometry; the included GeoJSON is in `data/geojson/demo_panchayats.geojson`.

```powershell
cd backend
python scripts/seed_data.py
```

To use SQLite with SQLAlchemy, set `DATABASE_URL=sqlite:///./agronova.db`. PostgreSQL/PostGIS can be supplied through the same environment variable when available. The schema keeps `geometry_json` as a portable fallback; a PostGIS migration can replace it with a geography/geometry column and spatial index.

Run the backend smoke tests from the repository root with:

```powershell
.\backend\.venv\Scripts\python.exe -m pytest -q backend\tests
```

### Database design notes

- Location foreign keys flow from district → block → panchayat → village/farm.
- Weather and downscaled records are time-stamped and location-scoped.
- Risk, advisory, alert and model metric records retain confidence and model version fields.
- The seed script uses only synthetic demonstration values and does not create credentials for production use.


## Docker Compose

```powershell
docker compose up --build
```

The compose file starts the API and a development Vite server. Copy `.env.example` to `.env` before configuring external providers or PostgreSQL.

## Connect to GitHub

The prototype is connected to the public GitHub repository:

`https://github.com/rohithsih2026/AgroNova`

The `main` branch is configured as the upstream branch. For a fresh clone:

```powershell
git clone https://github.com/rohithsih2026/AgroNova.git
cd AgroNova
```

Do not commit `.env`, API keys, `.venv`, `node_modules`, SQLite files or model artifacts; they are excluded by `.gitignore`.

## Known limitations

- All included observations and labels are synthetic demonstration data.
- The demo boundary geometry is illustrative, not an official Panchayat boundary layer.
- The model is a replaceable prototype and has not been externally validated.
- Browser speech voices and map tiles depend on the device/network.
- The first version uses a deterministic in-process demo store for fast offline evaluation; production deployment should use PostgreSQL/PostGIS, authentication, job queues, model registry and monitoring.

## Future improvements

- Ingest IMD, ISRO, state agriculture and ground-station observations.
- Add real boundary and elevation/land-cover layers with CRS validation.
- Calibrate separate models by agro-climatic zone, season and crop.
- Add uncertainty intervals, drift monitoring, explainability reports and model governance.
- Add offline-first PWA support, multilingual voice content and SMS/IVR delivery.
- Validate advisories with agricultural extension officers and measure field outcomes.
