"""
Pydantic schemas for Marine Debris detection API.
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    x: int = Field(..., description="Top-left X pixel coordinate")
    y: int = Field(..., description="Top-left Y pixel coordinate")
    width: int = Field(..., description="Width in pixels")
    height: int = Field(..., description="Height in pixels")


class DetectionItem(BaseModel):
    id: str = Field(..., description="Unique anomaly identifier, e.g. ANM-001")
    class_name: str = Field(..., description="Detected debris class (e.g., ghost_net, plastic_debris)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence score")
    bbox: BoundingBox = Field(..., description="Bounding box on sonar image")
    latitude: float = Field(..., description="Calculated geographic latitude (WGS84)")
    longitude: float = Field(..., description="Calculated geographic longitude (WGS84)")
    priority: str = Field(..., description="Operational triage priority: high, medium, low")


class MissionStatistics(BaseModel):
    total_detections: int
    ghost_nets: int
    other_debris: int
    high_priority: int


class ImageMetadata(BaseModel):
    filename: str
    original_format: str
    width: int
    height: int
    channels: int
    processed_at: str
    estimated_ground_coverage_m2: Optional[float] = None
    survey_transect: Optional[str] = "Sector 7-B Sub-surface Transect"


class DetectionResult(BaseModel):
    result_id: str
    status: str
    created_at: str
    metadata: ImageMetadata
    statistics: MissionStatistics
    detections: List[DetectionItem]
    original_image_url: str
    preprocessed_image_url: str
    annotated_image_url: str
    notes: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    detector_mode: str
