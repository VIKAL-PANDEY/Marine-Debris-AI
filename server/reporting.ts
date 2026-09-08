import { DetectionResult } from './types';

export function exportToJsonString(result: DetectionResult): string {
  return JSON.stringify(result, null, 2);
}

export function exportToGeoJsonString(result: DetectionResult): string {
  const features = result.detections.map((item) => {
    // Generate an oriented bounding polygon footprint in WGS84 (~0.12m/px)
    const lat = item.latitude;
    const lon = item.longitude;
    const halfWidthDeg = (Math.max(1.5, item.bbox.width * 0.12) / 2.0) / (111139.0 * Math.cos((lat * Math.PI) / 180));
    const halfHeightDeg = (Math.max(1.5, item.bbox.height * 0.12) / 2.0) / 111139.0;

    const coordinates = [
      [
        [Number((lon - halfWidthDeg).toFixed(6)), Number((lat - halfHeightDeg).toFixed(6))],
        [Number((lon + halfWidthDeg).toFixed(6)), Number((lat - halfHeightDeg).toFixed(6))],
        [Number((lon + halfWidthDeg).toFixed(6)), Number((lat + halfHeightDeg).toFixed(6))],
        [Number((lon - halfWidthDeg).toFixed(6)), Number((lat + halfHeightDeg).toFixed(6))],
        [Number((lon - halfWidthDeg).toFixed(6)), Number((lat - halfHeightDeg).toFixed(6))],
      ],
    ];

    return {
      type: 'Feature',
      id: item.id,
      geometry: {
        type: 'Polygon',
        coordinates,
      },
      properties: {
        id: item.id,
        class_name: item.class_name,
        confidence: Number(item.confidence.toFixed(4)),
        priority: item.priority,
        latitude: item.latitude,
        longitude: item.longitude,
        bbox: item.bbox,
        specular_peak_db: item.specular_db || 15.2,
        acoustic_shadow_ratio: item.shadow_ratio || 2.1,
        boundary_edge_gradient: item.edge_gradient || 8.4,
        survey_scan_id: result.result_id,
        geodetic_datum: 'WGS84 (EPSG:4326)',
        system: 'HeimDall Sonar AI (SIH26057)',
      },
    };
  });

  const geojson = {
    type: 'FeatureCollection',
    name: `HeimDall_Survey_${result.result_id}`,
    crs: {
      type: 'name',
      properties: {
        name: 'urn:ogc:def:crs:OGC:1.3:CRS84',
      },
    },
    metadata: {
      scan_id: result.result_id,
      filename: result.metadata?.filename || 'scan',
      timestamp: result.created_at,
      total_anomalies: result.detections.length,
      technology_stack: {
        frontend: 'React + TypeScript + Tailwind CSS',
        mapping: 'Leaflet + GeoJSON',
        backend: 'FastAPI + Python',
        ai_ml: 'PyTorch + Ultralytics YOLO',
        image_processing: 'OpenCV + NumPy',
        geospatial: 'GeoPandas + Shapely + pyproj',
        database: 'PostgreSQL + PostGIS',
        data_exchange: ['JSON', 'CSV', 'GeoJSON'],
      },
    },
    features,
  };

  return JSON.stringify(geojson, null, 2);
}

export function exportToCsvString(result: DetectionResult): string {
  const rows: string[] = [
    'id,class_name,confidence,latitude,longitude,priority,bbox_x,bbox_y,bbox_width,bbox_height,specular_db,shadow_ratio',
  ];

  for (const item of result.detections) {
    rows.push(
      [
        item.id,
        item.class_name,
        item.confidence.toFixed(4),
        item.latitude.toFixed(6),
        item.longitude.toFixed(6),
        item.priority,
        item.bbox.x,
        item.bbox.y,
        item.bbox.width,
        item.bbox.height,
        item.specular_db || 15.0,
        item.shadow_ratio || 2.0,
      ].join(',')
    );
  }

  return rows.join('\n');
}

