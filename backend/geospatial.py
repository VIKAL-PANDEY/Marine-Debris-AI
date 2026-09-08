"""
HEIMDALL | SIH26057 | AllSpark
Geospatial Pipeline: GeoPandas + Shapely + pyproj
Calculates geodetic coordinates, slant-range corrections, and RFC 7946 GeoJSON overlays.
"""

from typing import List, Dict, Any, Tuple
import math
import numpy as np
import pyproj
from shapely.geometry import Point, Polygon, mapping
import geopandas as gpd

# WGS84 Geodetic datum (EPSG:4326) and default UTM projection
CRS_WGS84 = "EPSG:4326"
CRS_DEFAULT_UTM = "EPSG:32630"  # UTM Zone 30N (common hydrographic test zone)

# PyProj Transformer for high-precision forward/inverse projections
transformer_utm_to_wgs84 = pyproj.Transformer.from_crs(CRS_DEFAULT_UTM, CRS_WGS84, always_xy=True)
transformer_wgs84_to_utm = pyproj.Transformer.from_crs(CRS_WGS84, CRS_DEFAULT_UTM, always_xy=True)


def slant_range_to_ground_range(slant_range_m: float, altitude_m: float) -> float:
    """
    Corrects acoustic slant range to true horizontal ground range across the seabed.
    Ground Range = sqrt(Slant Range^2 - Altitude^2)
    """
    if slant_range_m <= altitude_m:
        return 0.0
    return math.sqrt(slant_range_m**2 - altitude_m**2)


def pixel_to_geodetic(
    pixel_x: float,
    pixel_y: float,
    image_width: int,
    image_height: int,
    center_lat: float = 36.142083,
    center_lon: float = -5.352458,
    swath_width_meters: float = 100.0,
    heading_deg: float = 45.0,
    towfish_altitude_m: float = 8.5
) -> Tuple[float, float]:
    """
    Maps sonar waterfall image pixels (cross-track x, along-track y) into WGS84 coordinates.
    Cross-track axis: port (left) to starboard (right) with nadir at center.
    Along-track axis: survey trackline distance driven by survey vessel/towfish.
    """
    # Offset from nadir center line in meters (-50m to +50m)
    norm_x = (pixel_x - (image_width / 2.0)) / (image_width / 2.0)
    slant_dist_m = abs(norm_x) * (swath_width_meters / 2.0)
    ground_dist_m = slant_range_to_ground_range(slant_dist_m, towfish_altitude_m)
    cross_track_m = math.copysign(ground_dist_m, norm_x)

    # Along-track displacement in meters
    pixels_per_meter = image_height / 120.0
    along_track_m = (pixel_y - (image_height / 2.0)) / max(pixels_per_meter, 1.0)

    # Rotate by survey heading
    heading_rad = math.radians(heading_deg)
    # North and East vector displacements
    delta_e = cross_track_m * math.cos(heading_rad) + along_track_m * math.sin(heading_rad)
    delta_n = -cross_track_m * math.sin(heading_rad) + along_track_m * math.cos(heading_rad)

    # 1 deg latitude ~ 111,139 meters; 1 deg longitude ~ 111,139 * cos(lat)
    lat_deg = center_lat + (delta_n / 111139.0)
    lon_deg = center_lon + (delta_e / (111139.0 * math.cos(math.radians(center_lat))))

    return round(lat_deg, 6), round(lon_deg, 6)


def create_debris_polygon(
    lat: float,
    lon: float,
    width_m: float = 6.0,
    height_m: float = 4.0,
    orientation_deg: float = 0.0
) -> Polygon:
    """
    Creates a Shapely Polygon footprint for a detected marine debris anomaly.
    """
    # Compute polygon vertices in meters around center
    half_w = width_m / 2.0
    half_h = height_m / 2.0
    rad = math.radians(orientation_deg)
    cos_a, sin_a = math.cos(rad), math.sin(rad)

    corners_m = [
        (-half_w, -half_h),
        (half_w, -half_h),
        (half_w, half_h),
        (-half_w, half_h),
    ]

    m_per_deg_lat = 111139.0
    m_per_deg_lon = 111139.0 * math.cos(math.radians(lat))

    coords = []
    for dx, dy in corners_m:
        rx = dx * cos_a - dy * sin_a
        ry = dx * sin_a + dy * cos_a
        c_lon = lon + (rx / m_per_deg_lon)
        c_lat = lat + (ry / m_per_deg_lat)
        coords.append((round(c_lon, 6), round(c_lat, 6)))

    coords.append(coords[0])  # Close ring
    return Polygon(coords)


def detections_to_geodataframe(detections: List[Dict[str, Any]]) -> gpd.GeoDataFrame:
    """
    Converts a list of detection objects into a GeoPandas GeoDataFrame with Shapely Point & Polygon geometries.
    """
    records = []
    polygons = []

    for d in detections:
        lat = d.get("latitude", 36.142083)
        lon = d.get("longitude", -5.352458)
        width_px = d.get("bbox", {}).get("width", 40)
        height_px = d.get("bbox", {}).get("height", 30)

        # Scale pixels to estimated physical size in meters (~0.12m/px)
        width_m = max(1.5, width_px * 0.12)
        height_m = max(1.5, height_px * 0.12)

        poly = create_debris_polygon(lat, lon, width_m, height_m)
        polygons.append(poly)

        records.append({
            "id": d.get("id"),
            "class_name": d.get("class_name"),
            "confidence": d.get("confidence"),
            "priority": d.get("priority"),
            "latitude": lat,
            "longitude": lon,
            "width_meters": round(width_m, 2),
            "height_meters": round(height_m, 2),
            "acoustic_shadow_ratio": d.get("shadow_ratio", 2.1),
            "specular_peak_db": d.get("specular_db", 14.8),
        })

    gdf = gpd.GeoDataFrame(records, geometry=polygons, crs=CRS_WGS84)
    return gdf


def export_to_geojson_dict(detections: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Exports detections to a standard RFC 7946 GeoJSON FeatureCollection.
    """
    gdf = detections_to_geodataframe(detections)
    geojson_str = gdf.to_json()
    import json
    return json.loads(geojson_str)
