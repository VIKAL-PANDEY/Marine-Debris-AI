export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type DebrisPriority = 'high' | 'medium' | 'low';

export interface DetectionItem {
  id: string;
  class_name: string;
  confidence: number;
  bbox: BoundingBox;
  latitude: number;
  longitude: number;
  priority: DebrisPriority;
}

export interface MissionStatistics {
  total_detections: number;
  ghost_nets: number;
  other_debris: number;
  high_priority: number;
}

export interface ImageMetadata {
  filename: string;
  original_format: string;
  width: number;
  height: number;
  channels: number;
  processed_at: string;
  estimated_ground_coverage_m2?: number;
  survey_transect?: string;
}

export interface DetectionResult {
  result_id: string;
  status: string;
  created_at: string;
  metadata: ImageMetadata;
  statistics: MissionStatistics;
  detections: DetectionItem[];
  original_image_url: string;
  preprocessed_image_url: string;
  annotated_image_url: string;
  notes?: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  detector_mode: string;
}
