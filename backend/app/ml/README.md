# Downscaling model boundary

`downscaler.py` owns the model lifecycle and exposes one prediction per target variable. `feature_engineering.py` owns the tabular feature contract. `predict.py` combines model output with an inverse-distance weighted baseline and explanation strings. `model_metrics.py` evaluates a held-out synthetic split for demonstration only.

To use official data:

1. Replace `make_synthetic_training_data()` with a query/join against approved observations.
2. Preserve `FEATURE_COLUMNS` or version the feature contract.
3. Fit and validate a calibrated model by agro-climatic zone and season.
4. Persist the artifact and update `model_version`.
5. Add confidence intervals, spatial cross-validation and drift checks.

The included Random Forest is a compact prototype, not a scientific forecast model. The optional XGBoost adapter demonstrates how the estimator can be replaced without changing the API. If the optional package is not installed, the XGBoost selection reports `prototype-heuristic-fallback-v1` rather than claiming an XGBoost result.
