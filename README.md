# AgroNova

**From Block-Level Weather to Panchayat-Level Agricultural Intelligence — Viluppuram District, Tamil Nadu**

Version `v1.0.0`

AgroNova is a working agro-meteorological decision-support system for **Viluppuram District, Tamil Nadu** (district id `tn-viluppuram`). It carries a complete block-to-panchayat advisory workflow:

`Block weather → spatial features → ML downscaling → Panchayat weather → crop/risk intelligence → farmer advisory`

The primary operational area is the **Ulundurpettai Block** (block id `ulundurpettai-block`) and its eight mapped revenue panchayats: Ulundurpettai, Pidagam, Sendamangalam, Tirunavalur, Eraiyur, Sengurichi, Periyakurukkai and Vellaiyur. Boundaries ship in `data/geojson/viluppuram_panchayats.geojson`.

The repository contains a React/TypeScript dashboard and a FastAPI backend. Weather, satellite, crop and risk values are **AgroNova model estimates** produced from a block-level weather feed and Panchayat spatial features. See [Data sources and validation status](#data-sources-and-validation-status) for exactly what is estimated and what still needs to be validated.

## What is implemented

- **Role-based access** for Farmer, Agriculture Officer and Administrator, with a single sign-on style role selector
- **Panchayat GIS map** rendered with Leaflet over the Viluppuram panchayat boundary layer
- **AI downscaling engine** that converts block-level observations into Panchayat-level estimates, with an inverse-distance-weighted baseline for comparison
- **Crop advisory** for crop, variety, growth stage, soil type and irrigation source
- **Irrigation advisory** with water requirement, schedule and canal/tank/well context
- **Crop risk** scoring across drought, flood, heat, wind and humidity stress
- **Satellite and vegetation insights** — NDVI, NDWI, previous-cycle NDVI and land surface temperature
- **Alerts** with read state, an officer monitoring table and dashboard summaries
- **Historical analysis** with seasonal trend charts and model-performance reporting
- **What-if simulation** for temperature, rainfall and irrigation-source scenarios
- **English and Tamil interface** with browser Web Speech API voice advisory playback
- **Admin console** for user roles, configuration, feature flags and data health
- **Offline fallback** that keeps the interface usable when the API is unreachable

## Branding asset

The `logo.png` supplied with the project is preserved at the repository root and copied to `frontend/public/logo.png` for the sign-in experience. The product interface uses the AgroNova name while retaining the supplied artwork as a replaceable brand asset.

## Architecture

| Layer | Location | Responsibility |
| --- | --- | --- |
| Frontend | `frontend/` | React + TypeScript SPA, Vite build, Leaflet map, Recharts visualisations, React Router views |
| Backend | `backend/` | FastAPI application, Pydantic request/response contracts, SQLAlchemy models and services |
| Data | `data/geojson/viluppuram_panchayats.geojson` | Viluppuram block and panchayat boundary layer used by the GIS map and spatial features |
| Machine learning | `backend/app/ml/` | Feature engineering, downscaler, prediction orchestration, metrics, optional XGBoost and GeoPandas adapters |

- **API framework** — FastAPI with Pydantic v2 validation on every request body and CORS configured from environment variables.
- **Persistence** — SQLAlchemy 2.x. SQLite is used locally; the schema is PostgreSQL/PostGIS-ready and `geometry_json` is kept as a portable fallback that a PostGIS migration can replace with a geography/geometry column plus a spatial index.
- **ML pipeline** — Python with NumPy, Pandas and scikit-learn, plus optional XGBoost, GeoPandas and a PostgreSQL driver from `backend/requirements-optional.txt`.
- **Modular layering** — `routers` (transport), `schemas` (contracts), `services` (business logic and orchestration), `models` (ORM), `ml` (spatial estimation), `data` (boundary and reference layers).

## Machine learning

The downscaling engine is a **Random Forest ensemble by default** (`agronova-rf-v1`), fitted per target variable: temperature, rainfall, humidity, wind speed and soil moisture.

| Selection | Estimator | Model version | Role |
| --- | --- | --- | --- |
| `random_forest` (default) | scikit-learn `RandomForestRegressor` | `agronova-rf-v1` | Default production-facing estimator |
| `xgboost` | `XGBRegressor` (optional package) | `agronova-xgb-v1` | Gradient-boosted alternative for comparison |
| `baseline` | Inverse-distance weighting | `agronova-idw-v1` | Transparent spatial baseline |
| fallback | Bounded environmental rule set | `agronova-heuristic-v1` | Transparent estimator used when the optional XGBoost package is unavailable |

**Feature engineering.** `backend/app/ml/feature_engineering.py` builds the tabular feature matrix from block observations plus Panchayat spatial attributes: elevation, land use class, vegetation index, soil type, distance to water, latitude/longitude, and historical temperature and rainfall summaries. Block temperature, rainfall, humidity and wind, pressure, cloud cover and solar radiation are carried through from the block feed.

**Explainability and confidence.** Every response reports the actual estimator and `model_version`, so an unavailable optional package is never presented as XGBoost output. Each result carries feature-importance rankings, a plain-language `explanation` list, an IDW `baseline` block for side-by-side comparison, and `confidence` / `confidence_label` fields that the interface renders as "Why?" panels.

Install the optional packages to enable the XGBoost and GeoPandas paths:

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

Load the reference data set before the first run:

```powershell
cd backend
python scripts/seed_data.py
```

The API is available at `http://127.0.0.1:8000`, with OpenAPI documentation at `http://127.0.0.1:8000/docs`.

If PowerShell execution policy blocks activation, run the venv Python directly:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

## Run the frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

Set `VITE_API_URL=http://127.0.0.1:8000/api` when the API is running. When the API is not reachable, the frontend falls back to its bundled reference workspace; control that behaviour with `VITE_OFFLINE_FALLBACK`.

Build the frontend for deployment:

```powershell
cd frontend
npm run build
```

## Standalone launcher

After cloning or downloading the repository, install Python 3.10+ and Node.js 18+, then run this from the project root:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\run_agronova.ps1
```

The script creates the backend virtual environment, installs dependencies, starts FastAPI and Vite, and opens `http://127.0.0.1:5173` in the default browser. Keep the PowerShell window open while using AgroNova; press `Ctrl+C` to stop both services.

## Sign-in

AgroNova uses a single sign-on style role selector. The sign-in screen offers one-click access for each operating role; no password prompt or external identity provider is required for local use.

| Role | Service account | Access |
| --- | --- | --- |
| Farmer | `farmer@agronova.tn.in` | Advisory, irrigation, risk, satellite and what-if views for their own panchayat |
| Agriculture Officer | `officer@agronova.tn.in` | All farmer views plus block-wide monitoring, alerts and officer reporting |
| Administrator | `admin@agronova.tn.in` | Full access including user roles, configuration and data health |

The selected role changes navigation emphasis and enables the officer and administrator monitoring views. Service accounts above are identity labels for the role selector and must be replaced by your organisation's identity provider before deployment.

The default working context is:

`Tamil Nadu → Viluppuram → Ulundurpettai Block → selected Panchayat`

## Application walkthrough

1. Sign in with **Continue as Agriculture Officer** to see the full navigation set.
2. Confirm the location context reads Tamil Nadu / Viluppuram / Ulundurpettai Block.
3. Open **Block Weather** and review the current block-level observations that feed the model.
4. Open **AI Downscaling**, choose the estimator (`random_forest`, `xgboost` or `baseline`) and run the job for the block.
5. Open **Panchayat Weather** (or click a polygon on the **Panchayat GIS Map**) to review the eight panchayat-level estimates.
6. Open **Crop Risk**, then **Crop Advisory** — select Paddy, ADT 47, Vegetative, Red loamy, Canal — and generate the advisory.
7. Open **Irrigation** for the water requirement and schedule recommendation.
8. Open **What-If Simulation**, raise temperature by `+2 °C`, and run the scenario.
9. Review the "Why?" panels, confidence labels and alert entries to discuss explainability and operational limits.

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

All request bodies are validated with Pydantic. CORS is configured from environment variables. The main decision endpoints return both an estimate and a `why`/evidence structure, plus `confidence`, `confidence_label` and `data_label` fields. The `data_label` returned by the downscaling service is `AgroNova model estimate`.

Example downscale request:

```json
{
  "block_id": "ulundurpettai-block",
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

The SQLAlchemy schema covers the operational entities:

- Identity: `users`, `farmers`, `officers`
- Geography: `districts`, `blocks`, `panchayats`, `villages`
- Farm and crop: `farms`, `crops`, `crop_profiles`, `soil_data`
- Weather and model output: `weather_observations`, `weather_forecasts`, `downscaled_forecasts`
- Earth observation and decisions: `satellite_data`, `risk_predictions`, `advisories`, `alerts`, `model_metrics`

The schema and seed script are ready for SQLite/PostgreSQL migration. The bundled panchayat geometry is an operational envelope; the boundary layer is in `data/geojson/viluppuram_panchayats.geojson`.

```powershell
cd backend
python scripts/seed_data.py
```

To use SQLite with SQLAlchemy, set `DATABASE_URL=sqlite:///./agronova.db`. PostgreSQL/PostGIS can be supplied through the same environment variable when the optional driver is installed. The schema keeps `geometry_json` as a portable fallback; a PostGIS migration can replace it with a geography/geometry column and spatial index.

Run the backend tests from the repository root with:

```powershell
.\backend\.venv\Scripts\python.exe -m pytest -q backend\tests
```

### Database design notes

- Location foreign keys flow from district → block → panchayat → village/farm.
- Weather and downscaled records are time-stamped and location-scoped.
- Risk, advisory, alert and model metric records retain confidence and model version fields.
- The seed script loads reference values only and does not create credentials for production use.

## Data sources and validation status

This section states plainly what the numbers in the system are.

- **Estimates, not observations.** Weather, satellite, crop and risk values are AgroNova model estimates for Ulundurpettai Block, derived from a block-level weather feed and Panchayat spatial features. They are not government observations or published forecasts.
- **Configurable weather provider.** The weather provider is a configurable interface. `WEATHER_PROVIDER=reference` selects the built-in reference feed; replace it with IMD, state department or other approved feeds for operational use and supply `WEATHER_API_KEY`.
- **Soil moisture is remote-sensing derived.** Soil moisture values come from satellite vegetation and surface-water indices (NDVI/NDWI) fused with rainfall, temperature and soil-type features. **No in-situ soil moisture sensors are read by this system.** Treat these values as a screening indicator at Panchayat scale and confirm with a field check before making an irrigation decision.
- **Provisional geometry.** The panchayat polygons in `data/geojson/viluppuram_panchayats.geojson` are an operational envelope to be replaced by the official Local Government Directory (LGD) / Survey of India village boundary layer before cadastral or revenue use.
- **Validation status.** The bundled estimator has not yet been externally validated against station observations. The metrics endpoint reports in-sample and held-out performance against the internal reference split only and must not be read as real-world forecast skill.

## Deployment

### Docker Compose

```powershell
docker compose up --build
```

The compose file starts the API and a development Vite server. Copy `.env.example` to `.env` before configuring a weather provider or PostgreSQL.

### PostgreSQL and PostGIS

Install the optional driver, then point the schema at a spatial database:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pip install -r requirements-optional.txt
```

```powershell
$env:DATABASE_URL = "postgresql+psycopg://agronova:password@localhost:5432/agronova"
python scripts/seed_data.py
uvicorn app.main:app --reload --port 8000
```

### Environment variables

| Variable | Example | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite:///./agronova.db` | SQLAlchemy connection string. Accepts PostgreSQL/PostGIS. |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Allowed browser origins for the API. |
| `OFFLINE_FALLBACK` | `true` | Keeps responses available from the reference workspace when an upstream provider is unavailable. |
| `WEATHER_PROVIDER` | `reference` | Weather feed selection. `reference` is the built-in feed; point this at IMD or state feeds for operations. |
| `WEATHER_API_KEY` | *(empty)* | Credential for the configured weather provider. |
| `APP_ENV` | `development` | Runtime environment label. |
| `VITE_API_URL` | `http://127.0.0.1:8000/api` | Base URL the browser uses for API calls. |
| `VITE_OFFLINE_FALLBACK` | `false` | Controls the browser-side fallback workspace when the API cannot be reached. |

## Known limitations

- Weather, satellite, crop and risk values are AgroNova model estimates derived from a block-level feed and Panchayat spatial features; they are not station observations.
- The weather provider currently resolves to the built-in reference feed; an approved IMD or state feed is required for operational claims.
- The bundled boundary geometry is an operational envelope, not the official Local Government Directory / Survey of India Panchayat boundary layer.
- The estimator has not been externally validated against station observations, and the reported metrics describe performance on an internal reference split only.
- Browser speech voices and map tiles depend on the device and network.
- The first version uses an in-process reference store for fast evaluation; operational deployment should adopt PostgreSQL/PostGIS, an organisational identity provider, job queues, a model registry and monitoring.

## Future improvements

- Ingest IMD, ISRO, state agriculture and ground-station observations.
- Replace the operational envelopes with official boundary and elevation/land-cover layers, with CRS validation.
- Calibrate separate models by agro-climatic zone, season and crop.
- Add uncertainty intervals, drift monitoring, explainability reports and model governance.
- Add offline-first PWA support, multilingual voice content and SMS/IVR delivery.
- Validate advisories with agricultural extension officers and measure field outcomes.

## Connect to GitHub

The project is connected to the public GitHub repository:

`https://github.com/rohithsih2026/AgroNova`

The `main` branch is configured as the upstream branch. For a fresh clone:

```powershell
git clone https://github.com/rohithsih2026/AgroNova.git
cd AgroNova
```

Do not commit `.env`, API keys, `.venv`, `node_modules`, SQLite files or model artifacts; they are excluded by `.gitignore`.
