"""
Reporting Service for Marine Debris Analysis
---------------------------------------------
Generates standardized export formats (JSON and CSV) for hydrographic survey logs,
salvage mission planning, and maritime environmental compliance reporting.
"""

import io
import csv
import json
from typing import Dict, Any
from app.schemas.detection import DetectionResult


def export_to_json_bytes(result: DetectionResult) -> bytes:
    """Serializes DetectionResult model into formatted JSON bytes."""
    data = result.model_dump()
    json_str = json.dumps(data, indent=2, ensure_ascii=False)
    return json_str.encode("utf-8")


def export_to_csv_string(result: DetectionResult) -> str:
    """
    Serializes detections into CSV format conforming to hydrographic survey standard columns:
    id,class_name,confidence,latitude,longitude,priority,bbox_x,bbox_y,bbox_width,bbox_height
    """
    output = io.StringIO()
    writer = csv.writer(output)

    # Required CSV Header
    writer.writerow([
        "id",
        "class_name",
        "confidence",
        "latitude",
        "longitude",
        "priority",
        "bbox_x",
        "bbox_y",
        "bbox_width",
        "bbox_height"
    ])

    # Write rows
    for item in result.detections:
        writer.writerow([
            item.id,
            item.class_name,
            f"{item.confidence:.4f}",
            f"{item.latitude:.6f}",
            f"{item.longitude:.6f}",
            item.priority,
            item.bbox.x,
            item.bbox.y,
            item.bbox.width,
            item.bbox.height
        ])

    return output.getvalue()
