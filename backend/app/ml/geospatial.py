"""Optional GeoPandas boundary adapter.

The default demo uses plain GeoJSON-shaped dictionaries so the prototype remains
installable without geospatial wheels. Install the optional requirements to use
this adapter with an official GeoPackage/PostGIS export.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

try:  # Optional dependency boundary
    import geopandas as gpd
except Exception:  # pragma: no cover
    gpd = None  # type: ignore[assignment]


def load_boundary_records(path: str | Path) -> list[dict[str, Any]]:
    source = Path(path)
    if gpd is not None and source.suffix.lower() in {".gpkg", ".shp", ".geojson"}:
        frame = gpd.read_file(source)
        return frame.to_dict(orient="records")
    with source.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    return payload.get("features", payload if isinstance(payload, list) else [])
