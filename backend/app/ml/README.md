# Downscaling model boundary

`backend/app/ml/` owns the block-to-panchayat spatial estimation pipeline for AgroNova. Each module has a single responsibility so the estimator can be replaced without changing the API contract.

## Modules

| Module | Responsibility |
| --- | --- |
| `feature_engineering.py` | Owns the tabular feature contract (`FEATURE_COLUMNS`), the encodings for land use and soil type, and the inverse-distance-weighted helper used as the spatial baseline. |
| `downscaler.py` | Owns the model lifecycle. `SpatialDownscaler` fits one estimator per target variable (temperature, rainfall, humidity, wind, soil moisture), holds the resolved `model_version`, and exposes feature-importance rankings. |
| `predict.py` | Combines model output with the IDW baseline, derives the confidence score, and builds the plain-language `explanation` list returned to the API. |
| `model_metrics.py` | Evaluates the estimator on a held-out split of the internal reference set and returns per-variable MAE, RMSE and R². |
| `xgboost_model.py` | Optional adapter boundary for a calibrated gradient-boosted estimator. Subclasses `SpatialDownscaler`, so the estimator can be swapped without API changes. |
| `train_model.py` | Training entry point. `train_spatial_model()` fits the estimator and can persist it with joblib to `app/ml/artifacts/`. |
| `geospatial.py` | Optional GeoPandas boundary adapter. `load_boundary_records()` reads a GeoPackage, shapefile or GeoJSON boundary layer and returns plain records. Falls back to a JSON reader when GeoPandas is not installed. |

## Model versions

| Selection | Estimator | Model version |
| --- | --- | --- |
| `random_forest` (default) | scikit-learn `RandomForestRegressor` | `agronova-rf-v1` |
| `xgboost` | `XGBRegressor` (optional package) | `agronova-xgb-v1` |
| `baseline` | Inverse-distance weighting | `agronova-idw-v1` |
| fallback | Bounded environmental rule set | `agronova-heuristic-v1` |

If the optional XGBoost package is not installed, selecting `xgboost` reports `agronova-heuristic-v1` rather than claiming a gradient-boosted result. Every response carries the resolved `model_version` and `model_used` fields, so an unavailable optional estimator is never presented as XGBoost output.

## Validation status

The bundled estimator is a compact, reproducible Random Forest trained on an internally generated reference set. **It has not been externally validated against station observations.** The metrics endpoint reports performance on a held-out split of that internal reference set and must not be interpreted as real-world forecast skill.

## Adopting approved observations

1. Replace the internal reference-set builder with a query or join against approved observations.
2. Preserve `FEATURE_COLUMNS`, or version the feature contract when it changes.
3. Fit and validate a calibrated model by agro-climatic zone and season.
4. Persist the artifact and update `model_version` so the API reports the version in use.
5. Add confidence intervals, spatial cross-validation and drift checks.
