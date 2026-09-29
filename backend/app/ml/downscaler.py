"""Spatially aware downscaling model for Panchayat-level weather estimates."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd

from .feature_engineering import FEATURE_COLUMNS, engineer_features, make_training_frame

TARGETS = {
    "temperature": "target_temperature",
    "rainfall": "target_rainfall",
    "humidity": "target_humidity",
    "wind": "target_wind",
    "soil_moisture": "target_soil_moisture",
}

try:  # Optional at import time keeps the health endpoints useful in minimal installs.
    from sklearn.ensemble import RandomForestRegressor
except Exception:  # pragma: no cover - exercised only in a minimal environment
    RandomForestRegressor = None  # type: ignore[assignment,misc]

try:  # XGBoost is optional; the response reports the fallback when it is absent.
    from xgboost import XGBRegressor
except Exception:  # pragma: no cover
    XGBRegressor = None  # type: ignore[assignment,misc]


@dataclass
class DownscalingPrediction:
    temperature: float
    rainfall: float
    humidity: float
    wind: float
    soil_moisture: float
    confidence: float
    baseline: dict[str, float]
    explanation: list[str]
    model_version: str


class SpatialDownscaler:
    """Small, replaceable model service.

    A deployment can inject a persisted XGBoost/Random Forest artifact here. The
    bundled estimator is fitted on a generated training frame that reproduces the
    Ulundurpettai block feature space; retrain it against station observations
    before operational use.
    """

    def __init__(self, model_name: str = "random_forest", seed: int = 42) -> None:
        self.model_name = model_name
        self.seed = seed
        self.models: dict[str, Any] = {}
        self.feature_importances: dict[str, list[dict[str, float]]] = {}
        self.estimator_kind = "heuristic"
        self.model_version = "agronova-heuristic-v1"
        self.is_fitted = False
        self._fit()

    def _fit(self) -> None:
        if self.model_name == "baseline":
            self.estimator_kind = "idw"
            self.model_version = "agronova-idw-v1"
            self.is_fitted = True
            return
        frame = make_training_frame(seed=self.seed)
        features = frame[FEATURE_COLUMNS]
        if self.model_name == "xgboost" and XGBRegressor is not None:
            self.estimator_kind = "xgboost"
            self.model_version = "agronova-xgb-v1"
            estimator_factory = lambda: XGBRegressor(  # noqa: E731
                n_estimators=72,
                max_depth=5,
                learning_rate=0.08,
                subsample=0.9,
                colsample_bytree=0.9,
                random_state=self.seed,
                objective="reg:squarederror",
                n_jobs=1,
                verbosity=0,
            )
        elif self.model_name == "random_forest" and RandomForestRegressor is not None:
            self.estimator_kind = "random_forest"
            self.model_version = "agronova-rf-v1"
            estimator_factory = lambda: RandomForestRegressor(  # noqa: E731
                n_estimators=72,
                max_depth=10,
                min_samples_leaf=3,
                random_state=self.seed,
                n_jobs=1,
            )
        else:
            self.estimator_kind = "heuristic"
            self.model_version = "agronova-heuristic-v1"
            self.is_fitted = True
            return
        for output, target in TARGETS.items():
            model = estimator_factory()
            model.fit(features, frame[target])
            self.models[output] = model
            importance = sorted(
                zip(FEATURE_COLUMNS, model.feature_importances_.tolist()),
                key=lambda pair: pair[1],
                reverse=True,
            )
            self.feature_importances[output] = [{"feature": name, "importance": float(value)} for name, value in importance[:5]]
        self.is_fitted = True

    def _fallback_predict(self, row: pd.DataFrame | pd.Series) -> dict[str, float]:
        # Coefficients belong to the transparent rule-based fallback, not a trained model.
        if isinstance(row, pd.DataFrame):
            row = row.iloc[0]
        block_temp = float(row.iloc[0])
        block_rain = float(row.iloc[1])
        block_humidity = float(row.iloc[2])
        block_wind = float(row.iloc[3])
        elevation = float(row.iloc[9])
        vegetation = float(row.iloc[11])
        water = float(row.iloc[13])
        return {
            "temperature": block_temp - elevation / 1000 + vegetation * 1.4,
            "rainfall": max(0.0, block_rain * 0.88 + water * 0.5),
            "humidity": min(100.0, max(20.0, block_humidity + water * 0.7 + vegetation * 3)),
            "wind": max(0.0, block_wind + elevation / 240),
            "soil_moisture": min(92.0, max(15.0, 46 + block_rain * 0.18 - block_temp * 0.12 + water)),
        }

    def predict(self, records: list[dict[str, Any]]) -> list[dict[str, float]]:
        if not records:
            return []
        frame = engineer_features(records)
        if not self.models:
            return [self._fallback_predict(frame.iloc[[index]]) for index in range(len(frame))]
        predictions: list[dict[str, float]] = []
        for _, row in frame.iterrows():
            values: dict[str, float] = {}
            for output in TARGETS:
                values[output] = float(self.models[output].predict(row.to_frame().T)[0])
            # Keep the output physically sensible for an agricultural UI.
            values["rainfall"] = max(0.0, values["rainfall"])
            values["humidity"] = min(100.0, max(15.0, values["humidity"]))
            values["wind"] = max(0.0, values["wind"])
            values["soil_moisture"] = min(95.0, max(10.0, values["soil_moisture"]))
            predictions.append(values)
        return predictions

    def importance(self, output: str = "temperature") -> list[dict[str, float]]:
        return self.feature_importances.get(output, [])
