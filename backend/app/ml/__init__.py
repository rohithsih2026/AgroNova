"""Prototype machine-learning modules."""

from .downscaler import DownscalingPrediction, SpatialDownscaler
from .predict import predict_downscaled_bundle

__all__ = ["DownscalingPrediction", "SpatialDownscaler", "predict_downscaled_bundle"]
