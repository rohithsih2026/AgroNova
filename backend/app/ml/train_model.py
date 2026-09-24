"""Train and persist the local prototype model artifact."""

from __future__ import annotations

import argparse
from pathlib import Path

import joblib

from .downscaler import SpatialDownscaler


def train_prototype_model(output_path: str | Path | None = None) -> SpatialDownscaler:
    model = SpatialDownscaler(model_name="random_forest")
    if output_path:
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, path)
    return model


if __name__ == "__main__":  # pragma: no cover
    parser = argparse.ArgumentParser(description="Train AgroNova demonstration model")
    parser.add_argument("--output", default="app/ml/artifacts/prototype_downscaler.joblib")
    args = parser.parse_args()
    train_prototype_model(args.output)
    print("Prototype model trained. Dataset is synthetic demonstration data.")
