"""
Geolocation Service for Side-Scan Sonar Imagery
-----------------------------------------------
Converts pixel-space image detections to geographic coordinates (WGS84 Latitude/Longitude).

IMPORTANT ARCHITECTURAL DISCLAIMER:
In real hydrographic and side-scan sonar operations, arbitrary image pixels do NOT
directly map to GPS coordinates without external navigation telemetry or spatial georeferencing.
Mapping requires:
1. Sonar Towfish Navigation Telemetry (USBL acoustic positioning or vessel GPS + layback model).
2. Gyro Compass Heading and Ping Timestamps.
3. Slant-range to ground-range projection (towfish altitude above seafloor).
4. GeoTIFF / XTDF / JSF metadata tags.

For this prototype, this module provides a modular metadata-driven geographic projection engine.
When real sonar navigation feeds (GeoTIFF tags or NMEA telemetry logs) are integrated,
the `calculate_geo_coordinates` function will ingest the geotransform matrix directly.
"""

import math
from typing import Tuple


# Survey Sector Origin (e.g. coastal survey sector in the Arabian Sea / Gulf of Khambhat marine zone)
DEFAULT_TRANSECT_ORIGIN_LAT = 21.1428
DEFAULT_TRANSECT_ORIGIN_LON = 72.5842
DEFAULT_HEADING_DEG = 45.0  # Survey track heading in degrees true north
DEFAULT_ACROSS_TRACK_RANGE_M = 100.0  # Total swath width across port/starboard in meters
DEFAULT_ALONG_TRACK_LENGTH_M = 200.0  # Survey line segment length in meters


def map_pixel_to_coordinates(
    pixel_x: float,
    pixel_y: float,
    image_width: int,
    image_height: int,
    origin_lat: float = DEFAULT_TRANSECT_ORIGIN_LAT,
    origin_lon: float = DEFAULT_TRANSECT_ORIGIN_LON,
    heading_deg: float = DEFAULT_HEADING_DEG,
    swath_width_m: float = DEFAULT_ACROSS_TRACK_RANGE_M,
    track_length_m: float = DEFAULT_ALONG_TRACK_LENGTH_M,
) -> Tuple[float, float]:
    """
    Projects pixel coordinate (x, y) relative to a sonar survey transect.
    - pixel_x represents across-track distance (port to starboard, centered at nadir).
    - pixel_y represents along-track distance (sonar ping line progression).

    Returns:
        (latitude, longitude) rounded to 6 decimal places (approx. 0.1m precision).
    """
    if image_width <= 0 or image_height <= 0:
        return (origin_lat, origin_lon)

    # Normalized coordinates [0, 1]
    norm_x = pixel_x / float(image_width)
    norm_y = pixel_y / float(image_height)

    # Across-track offset in meters from track centerline: [-swath_width/2, +swath_width/2]
    across_track_m = (norm_x - 0.5) * swath_width_m

    # Along-track offset in meters from start of segment: [0, track_length]
    along_track_m = norm_y * track_length_m

    # Convert heading to radians
    heading_rad = math.radians(heading_deg)

    # Rotate across-track (perpendicular, heading + 90 deg) and along-track (parallel, heading)
    # Northing (delta Y in meters) and Easting (delta X in meters)
    delta_north = along_track_m * math.cos(heading_rad) - across_track_m * math.sin(heading_rad)
    delta_east = along_track_m * math.sin(heading_rad) + across_track_m * math.cos(heading_rad)

    # Convert meter offsets to degree delta on WGS84 ellipsoid
    # Approx: 1 deg latitude = 111,139 meters
    # 1 deg longitude = 111,139 * cos(lat) meters
    meters_per_lat_deg = 111139.0
    meters_per_lon_deg = 111139.0 * math.cos(math.radians(origin_lat))

    if meters_per_lon_deg == 0:
        meters_per_lon_deg = 111139.0

    target_lat = origin_lat + (delta_north / meters_per_lat_deg)
    target_lon = origin_lon + (delta_east / meters_per_lon_deg)

    return (round(target_lat, 6), round(target_lon, 6))


def calculate_geo_coordinates(
    bbox_x: int,
    bbox_y: int,
    bbox_w: int,
    bbox_h: int,
    img_width: int,
    img_height: int,
    base_lat: float = DEFAULT_TRANSECT_ORIGIN_LAT,
    base_lon: float = DEFAULT_TRANSECT_ORIGIN_LON,
) -> Tuple[float, float]:
    """
    Calculates the center GPS coordinate of a bounding box.
    """
    center_x = bbox_x + (bbox_w / 2.0)
    center_y = bbox_y + (bbox_h / 2.0)
    return map_pixel_to_coordinates(
        pixel_x=center_x,
        pixel_y=center_y,
        image_width=img_width,
        image_height=img_height,
        origin_lat=base_lat,
        origin_lon=base_lon,
    )
