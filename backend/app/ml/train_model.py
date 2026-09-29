"""Train and persist the AgroNova model artifact."""

from __future__ import annotations

import argparse
from pathlib import Path

import joblib

from .downscaler import SpatialDownscaler


def train_spatial_model(output_path: str | Path | None = None) -> SpatialDownscaler:
    model = SpatialDownscaler(model_name="random_forest")
    if output_path:
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, path)
    return model


if __name__ == "__main__":  # pragma: no cover
    parser = argparse.ArgumentParser(description="Train the AgroNova spatial downscaler")
    parser.add_argument("--output", default="app/ml/artifacts/agronova_downscaler.joblib")
    args = parser.parse_args()
    train_spatial_model(args.output)
    print("AgroNova spatial model trained on the Viluppuram feature space. Recalibrate against station observations before operational use.")
