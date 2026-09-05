"""
Analysis API Router
-------------------
Endpoints:
- POST /api/analyze: Ingests side-scan sonar image, executes preprocessing and detection
- GET /api/results/{result_id}: Fetches analysis result object
- GET /api/results/{result_id}/json: Downloads JSON report
- GET /api/results/{result_id}/csv: Downloads CSV report
"""

import os
import uuid
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

from fastapi import APIRouter, UploadFile, File, HTTPException, Response, status
from fastapi.responses import JSONResponse, Response

import cv2

from app.schemas.detection import DetectionResult, ImageMetadata
from app.services.preprocessing import preprocess_sonar_image
from app.services.detector import detect_marine_debris
from app.services.reporting import export_to_json_bytes, export_to_csv_string

router = APIRouter(tags=["Analysis"])

# Storage Directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOADS_DIR = BASE_DIR / "data" / "uploads"
RESULTS_DIR = BASE_DIR / "data" / "results"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

# In-memory quick lookup cache (synced with file persistence)
RESULTS_STORE: Dict[str, DetectionResult] = {}

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tif", ".tiff"}
ALLOWED_MIME_TYPES = {
    "image/png",
    "image/jpeg",
    "image/tiff",
    "image/x-tiff",
    "application/octet-stream"
}


@router.post("/analyze", response_model=DetectionResult, status_code=status.HTTP_200_OK)
async def analyze_sonar_image(file: UploadFile = File(...)):
    """
    Ingests an uploaded side-scan sonar image file, executes the OpenCV preprocessing pipeline,
    runs the modular anomaly detector, calculates geographic WGS84 coordinates,
    and returns detection metrics with download links.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided in upload payload.")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Supported formats: PNG, JPG, JPEG, TIFF (.tif/.tiff)."
        )

    try:
        image_bytes = await file.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")

        # 1. Preprocess Sonar Image via OpenCV pipeline
        raw_bgr, preprocessed_bgr, meta = preprocess_sonar_image(image_bytes)
        
        # Unique Result ID
        result_id = f"SCAN-{uuid.uuid4().hex[:8].upper()}"
        timestamp = datetime.utcnow().isoformat() + "Z"

        # 2. Save image artifacts to disk
        orig_filename = f"{result_id}_orig.png"
        prep_filename = f"{result_id}_preprocessed.png"
        annot_filename = f"{result_id}_annotated.png"

        orig_path = UPLOADS_DIR / orig_filename
        prep_path = UPLOADS_DIR / prep_filename
        annot_path = UPLOADS_DIR / annot_filename

        cv2.imwrite(str(orig_path), raw_bgr)
        cv2.imwrite(str(prep_path), preprocessed_bgr)

        # 3. Execute Detection Service
        detections, statistics, annotated_bgr = detect_marine_debris(
            preprocessed_bgr=preprocessed_bgr,
            original_filename=file.filename
        )

        cv2.imwrite(str(annot_path), annotated_bgr)

        # 4. Build Metadata & Result Model
        coverage_m2 = round((meta["width"] * 0.1) * (meta["height"] * 0.1), 2)
        
        image_metadata = ImageMetadata(
            filename=file.filename,
            original_format=ext.replace(".", "").upper(),
            width=meta["width"],
            height=meta["height"],
            channels=meta["channels"],
            processed_at=timestamp,
            estimated_ground_coverage_m2=coverage_m2,
            survey_transect="Sector 7-B Sub-surface Transect"
        )

        result = DetectionResult(
            result_id=result_id,
            status="completed",
            created_at=timestamp,
            metadata=image_metadata,
            statistics=statistics,
            detections=detections,
            original_image_url=f"/api/media/uploads/{orig_filename}",
            preprocessed_image_url=f"/api/media/uploads/{prep_filename}",
            annotated_image_url=f"/api/media/uploads/{annot_filename}",
            notes="Processed via OpenCV CLAHE & Bilateral filtering + Side-Scan Acoustic Anomaly Detector (Demo Mode)."
        )

        # Persist JSON report to disk
        result_file = RESULTS_DIR / f"{result_id}.json"
        with open(result_file, "w", encoding="utf-8") as f:
            f.write(json.dumps(result.model_dump(), indent=2))

        # Store in-memory
        RESULTS_STORE[result_id] = result

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Sonar analysis pipeline error: {str(e)}"
        )


@router.get("/results/{result_id}", response_model=DetectionResult)
async def get_result(result_id: str):
    """Retrieves an existing analysis result by result_id."""
    if result_id in RESULTS_STORE:
        return RESULTS_STORE[result_id]

    result_file = RESULTS_DIR / f"{result_id}.json"
    if result_file.exists():
        with open(result_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            result = DetectionResult(**data)
            RESULTS_STORE[result_id] = result
            return result

    raise HTTPException(status_code=404, detail=f"Result ID '{result_id}' not found.")


@router.get("/results/{result_id}/json")
async def download_result_json(result_id: str):
    """Exports and downloads the complete detection analysis result as JSON."""
    result = await get_result(result_id)
    json_bytes = export_to_json_bytes(result)
    
    return Response(
        content=json_bytes,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="marine_debris_analysis_{result_id}.json"'
        }
    )


@router.get("/results/{result_id}/csv")
async def download_result_csv(result_id: str):
    """Exports and downloads detection anomalies as standard survey CSV."""
    result = await get_result(result_id)
    csv_string = export_to_csv_string(result)
    
    return Response(
        content=csv_string.encode("utf-8"),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="marine_debris_detections_{result_id}.csv"'
        }
    )
