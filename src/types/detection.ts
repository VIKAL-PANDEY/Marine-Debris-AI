/**
 * TypeScript definitions for Marine Debris AI Sonar Detection system.
 */

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
  specular_db?: number;
  shadow_ratio?: number;
  edge_gradient?: number;
}

export interface MissionStatistics {
  total_detections: number;
  ghost_nets: number;
  other_debris: number;
  high_priority: number;
  inference_time_ms?: number;
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
  inference_time_ms?: number;
  inference_engine?: string;
  model_name?: string;
  input_shape?: number[];
  output_shape?: number[];
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

export type ProcessingStage = 'idle' | 'uploading' | 'preprocessing' | 'detecting' | 'completed' | 'error';

export interface QueuedSonarFile {
  id: string;
  file: File;
  previewUrl: string;
  status: 'queued' | 'analyzing' | 'completed' | 'error';
  result?: DetectionResult | null;
  error?: string | null;
  detectionCount?: number;
  engineUsed?: 'yolo' | 'server';
}

export interface BatchProgress {
  current: number;
  total: number;
  currentFilename?: string;
  completedCount: number;
  failedCount: number;
}

export interface ThreatAssessmentResult {
  hazard_score: number;
  threat_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  executive_summary: string;
  ecological_impact: {
    entanglement_risk: string;
    benthic_smothering: string;
    degradation_timeline: string;
    wildlife_hazards: string[];
  };
  navigational_threats: {
    towfish_safety: string;
    surface_vessel_hazard: string;
    anchor_fouling_risk: string;
  };
  salvage_recommendations: {
    priority_action: string;
    suggested_equipment: string[];
    recovery_difficulty: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    estimated_operation_hours: string;
  };
  regulatory_notes: string;
}

export interface TargetAnalysisResult {
  target_id: string;
  target_name: string;
  material_classification: string;
  acoustic_shadow_analysis: string;
  submerged_density_and_mass: string;
  biofouling_estimate: string;
  degradation_risk: string;
  recommended_recovery_method: string;
  safety_warnings: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
