"""
Marine Debris AI - Side-Scan Sonar Anomaly Detection Backend
FastAPI Main Application
"""

from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.analysis import router as analysis_router
from app.schemas.detection import HealthResponse

# Application Setup
app = FastAPI(
    title="Marine Debris AI - Backend API",
    description="Side-Scan Sonar Acoustic Anomaly Detection for Artificial Marine Debris",
    version="1.0.0",
)

# CORS Configuration for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure data directories exist
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = BASE_DIR / "data" / "uploads"
RESULTS_DIR = BASE_DIR / "data" / "results"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

# Mount media directory for processed sonar imagery
app.mount("/api/media/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint verifying backend operational readiness.
    """
    return HealthResponse(
        status="healthy",
        service="Marine Debris AI Sonar Backend",
        version="1.0.0",
        detector_mode="Demonstration Saliency & Acoustic Anomaly Extractor (YOLO-Ready)",
    )


# Include Analysis API Router under /api
app.include_router(analysis_router, prefix="/api")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
