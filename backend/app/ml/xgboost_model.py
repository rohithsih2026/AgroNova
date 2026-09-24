"""Optional XGBoost adapter boundary.

Install `backend/requirements-optional.txt` to use this adapter in a later model
iteration. The default demo remains Random Forest because it is smaller and easier
to reproduce on a laptop.
"""

from __future__ import annotations

from typing import Any

from .downscaler import SpatialDownscaler


class XGBoostDownscaler(SpatialDownscaler):
    """Drop-in model boundary for a calibrated XGBoost implementation."""

    def __init__(self, **kwargs: Any) -> None:
        # When xgboost is installed, SpatialDownscaler uses XGBRegressor. Minimal
        # installations transparently use its bounded heuristic fallback.
        super().__init__(model_name="xgboost", **kwargs)
