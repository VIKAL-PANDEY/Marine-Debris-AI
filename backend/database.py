"""
HEIMDALL | SIH26057 | AllSpark
Database & Spatial Storage: PostgreSQL + PostGIS
Defines spatial tables, GeoAlchemy2 geometries, and PostGIS query utilities.
"""

import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from geoalchemy2 import Geometry
from geoalchemy2.functions import ST_AsGeoJSON, ST_DWithin, ST_MakePoint, ST_SetSRID

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/heimdall_postgis"
)

Base = declarative_base()


class SurveyMission(Base):
    __tablename__ = "survey_missions"

    id = Column(String(64), primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    swath_width_m = Column(Float, default=100.0)
    towfish_altitude_m = Column(Float, default=8.5)
    survey_heading_deg = Column(Float, default=45.0)
    center_lat = Column(Float, nullable=False)
    center_lon = Column(Float, nullable=False)
    # PostGIS trackline geometry
    trackline_geom = Column(Geometry(geometry_type="LINESTRING", srid=4326), nullable=True)

    detections = relationship("DebrisDetection", back_populates="mission", cascade="all, delete-orphan")


class DebrisDetection(Base):
    __tablename__ = "debris_detections"

    id = Column(String(64), primary_key=True, index=True)
    mission_id = Column(String(64), ForeignKey("survey_missions.id"), nullable=False)
    class_name = Column(String(64), nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    priority = Column(String(32), nullable=False, index=True)
    bbox_x = Column(Integer, nullable=False)
    bbox_y = Column(Integer, nullable=False)
    bbox_w = Column(Integer, nullable=False)
    bbox_h = Column(Integer, nullable=False)

    specular_peak_db = Column(Float, default=16.0)
    acoustic_shadow_ratio = Column(Float, default=2.2)
    boundary_edge_gradient = Column(Float, default=8.5)
    estimated_width_m = Column(Float, default=4.0)
    estimated_height_m = Column(Float, default=3.0)

    # PostGIS Spatial Geometries (SRID 4326 = WGS84)
    point_geom = Column(Geometry(geometry_type="POINT", srid=4326), nullable=False, index=True)
    polygon_geom = Column(Geometry(geometry_type="POLYGON", srid=4326), nullable=True)

    mission = relationship("SurveyMission", back_populates="detections")


def get_engine():
    try:
        return create_engine(DATABASE_URL, pool_pre_ping=True)
    except Exception as e:
        print(f"[PostGIS Database] Note: {e}")
        return None


def init_postgis_tables():
    """Initializes PostGIS extension and creates tables if connected to PostgreSQL."""
    engine = get_engine()
    if engine:
        try:
            with engine.connect() as conn:
                conn.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
            Base.metadata.create_all(engine)
            print("[PostGIS] Schema and PostGIS spatial extensions initialized.")
        except Exception as e:
            print(f"[PostGIS] Schema setup note: {e}")


def query_detections_near_point(
    lat: float,
    lon: float,
    radius_meters: float = 500.0,
    session = None
) -> List[Dict[str, Any]]:
    """
    Executes a PostGIS spatial query using ST_DWithin to find debris within radius_meters of (lat, lon).
    """
    if session is None:
        return []

    # ST_DWithin with geography type calculates true geodetic distance in meters
    stmt = session.query(DebrisDetection).filter(
        ST_DWithin(
            DebrisDetection.point_geom,
            ST_SetSRID(ST_MakePoint(lon, lat), 4326),
            radius_meters / 111139.0  # approximate angular distance
        )
    )
    results = stmt.all()
    return [
        {
            "id": r.id,
            "class_name": r.class_name,
            "confidence": r.confidence,
            "priority": r.priority,
            "mission_id": r.mission_id,
        }
        for r in results
    ]
