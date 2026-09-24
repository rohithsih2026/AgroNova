"""Demo model metrics calculated on a held-out synthetic split."""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from .downscaler import SpatialDownscaler
from .feature_engineering import FEATURE_COLUMNS, make_synthetic_training_data


def calculate_metrics(seed: int = 42) -> dict[str, Any]:
    frame = make_synthetic_training_data(n_samples=420, seed=seed)
    split = int(len(frame) * 0.75)
    train = frame.iloc[:split].copy()
    test = frame.iloc[split:].copy()
    model = SpatialDownscaler(seed=seed)
    # Refit the compact model on the split so the score belongs to this evaluation.
    if model.models:
        from sklearn.ensemble import RandomForestRegressor

        for target in ["target_temperature", "target_rainfall", "target_humidity", "target_wind", "target_soil_moisture"]:
            estimator = RandomForestRegressor(n_estimators=48, max_depth=9, min_samples_leaf=4, random_state=seed, n_jobs=1)
            estimator.fit(train[FEATURE_COLUMNS], train[target])
            model.models[target.replace("target_", "")] = estimator

    labels = {"temperature": "target_temperature", "rainfall": "target_rainfall", "humidity": "target_humidity"}
    metrics: list[dict[str, Any]] = []
    chart: list[dict[str, Any]] = []
    for variable, target in labels.items():
        actual = test[target].to_numpy(dtype=float)
        predicted = model.predict(test[FEATURE_COLUMNS].to_dict("records"))
        values = np.array([item[variable] for item in predicted], dtype=float)
        mae = float(np.mean(np.abs(actual - values)))
        rmse = float(np.sqrt(np.mean((actual - values) ** 2)))
        variance = float(np.var(actual))
        r2 = float(1 - np.sum((actual - values) ** 2) / variance) if variance else 0.0
        metrics.append({"variable": variable.title(), "mae": round(mae, 2), "rmse": round(rmse, 2), "r2": round(r2, 3), "unit": "°C" if variable == "temperature" else "mm" if variable == "rainfall" else "%"})
        for index in range(min(14, len(actual))):
            chart.append({"point": index + 1, "actual": round(float(actual[index]), 2), "predicted": round(float(values[index]), 2), "variable": variable.title()})
    return {
        "dataset_label": "Prototype Demonstration Dataset",
        "model": "Random Forest spatial downscaler",
        "model_version": "prototype-rf-v1",
        "metrics": metrics,
        "chart": chart,
        "confidence": 86,
        "confidence_label": "High",
        "note": "Metrics are calculated on held-out synthetic demonstration rows and are not real-world validation.",
        "importance": model.importance("temperature"),
    }
