/**
 * API Service Client & YOLO Integration for Marine Debris AI.
 */

import { DetectionResult, HealthResponse, DetectionItem, DebrisPriority } from '../types/detection';
import { runYOLOInference, checkModelAvailability, MODEL_CONFIG } from './yoloInference';
import { calculateGeoCoordinates } from '../utils/geolocation';
import { loadImage } from '../utils/imagePreprocessing';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function checkBackendHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Backend health check failed: HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Executes browser-side YOLO ONNX detection pipeline.
 * If custom ONNX weights are not yet uploaded, gracefully processes using the Acoustic Engine.
 */
export async function analyzeSonarWithYOLO(
  file: File,
  onProgress?: (stage: 'uploading' | 'preprocessing' | 'detecting') => void,
  customConfidenceThreshold?: number
): Promise<DetectionResult> {
  // Step 1: Pre-flight check for ONNX model presence
  const modelCheck = await checkModelAvailability();

  if (!modelCheck.available) {
    console.info(
      '[YOLO Pipeline] ONNX model not present in /public/models/marine-debris.onnx. Routing to Acoustic Anomaly Detector.'
    );
    const result = await analyzeSonarImage(file, onProgress);
    result.notes = `${result.notes} • (YOLO Mode: Place your trained weights in /public/models/marine-debris.onnx for in-browser WASM execution)`;
    return result;
  }

  if (onProgress) onProgress('preprocessing');

  const img = await loadImage(file);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  if (onProgress) onProgress('detecting');

  let yoloResult;
  try {
    yoloResult = await runYOLOInference(img, {
      confidenceThreshold: customConfidenceThreshold ?? MODEL_CONFIG.confidenceThreshold,
    });
  } catch (err: any) {
    console.warn('[YOLO Inference] ONNX Execution fallback:', err);
    // If ONNX execution fails (e.g. invalid protobuf weights), fall back gracefully
    const fallbackRes = await analyzeSonarImage(file, onProgress);
    fallbackRes.notes = `${fallbackRes.notes} • (ONNX session notice: ${err.message || 'Check weights format'})`;
    return fallbackRes;
  }

  // Map YOLO detections to hydrographic DetectionItems with WGS84 GPS coords
  const detections: DetectionItem[] = yoloResult.detections.map((d, index) => {
    const [lat, lon] = calculateGeoCoordinates(
      d.bbox.x,
      d.bbox.y,
      d.bbox.width,
      d.bbox.height,
      width,
      height
    );

    let priority: DebrisPriority = 'low';
    const cName = d.className.toLowerCase();
    if (cName.includes('net') || cName.includes('synthetic') || cName.includes('high')) {
      priority = 'high';
    } else if (cName.includes('metal') || cName.includes('container') || cName.includes('medium')) {
      priority = 'medium';
    }

    return {
      id: `YOLO-${String(index + 1).padStart(3, '0')}`,
      class_name: d.className,
      confidence: d.confidence,
      bbox: d.bbox,
      latitude: lat,
      longitude: lon,
      priority,
    };
  });

  // Render annotated canvas to create local preview URL
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  let annotatedImageUrl = URL.createObjectURL(file);
  if (ctx) {
    ctx.drawImage(img, 0, 0);

    for (const det of detections) {
      const color = det.priority === 'high' ? '#FB8159' : det.priority === 'medium' ? '#FCBF93' : '#415111';
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(det.bbox.x, det.bbox.y, det.bbox.width, det.bbox.height);

      const label = `${det.id}: ${det.class_name.replace(/_/g, ' ').toUpperCase()} (${Math.round(det.confidence * 100)}%)`;
      ctx.font = 'bold 12px monospace';
      const textWidth = ctx.measureText(label).width;

      ctx.fillStyle = '#FEFEFE';
      ctx.fillRect(det.bbox.x, Math.max(0, det.bbox.y - 18), textWidth + 8, 18);

      ctx.fillStyle = color;
      ctx.fillText(label, det.bbox.x + 4, Math.max(14, det.bbox.y - 4));
    }

    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        annotatedImageUrl = URL.createObjectURL(blob);
      }
    } catch (e) {
      console.warn('Could not generate annotated canvas blob:', e);
    }
  }

  const origUrl = URL.createObjectURL(file);
  const resultId = `YOLO-${Math.random().toString(16).substring(2, 8).toUpperCase()}`;

  const ghostNets = detections.filter((d) => d.class_name.toLowerCase().includes('net')).length;
  const highPriority = detections.filter((d) => d.priority === 'high').length;

  return {
    result_id: resultId,
    status: 'completed',
    created_at: new Date().toISOString(),
    metadata: {
      filename: file.name,
      original_format: file.name.split('.').pop()?.toUpperCase() || 'PNG',
      width,
      height,
      channels: 3,
      processed_at: new Date().toISOString(),
      estimated_ground_coverage_m2: Number(((width * 0.1) * (height * 0.1)).toFixed(2)),
      survey_transect: 'WGS84 Sonar Transect (Browser ONNX Inference)',
      inference_time_ms: yoloResult.inferenceTimeMs,
      inference_engine: 'ONNX Runtime Web (WASM)',
      model_name: 'marine-debris.onnx',
      input_shape: yoloResult.modelInputShape,
      output_shape: yoloResult.modelOutputShape,
    },
    statistics: {
      total_detections: detections.length,
      ghost_nets: ghostNets,
      other_debris: detections.length - ghostNets,
      high_priority: highPriority,
      inference_time_ms: yoloResult.inferenceTimeMs,
    },
    detections,
    original_image_url: origUrl,
    preprocessed_image_url: origUrl,
    annotated_image_url: annotatedImageUrl,
    notes: `Processed via Custom YOLO Model (${yoloResult.inferenceTimeMs.toFixed(1)}ms browser WASM inference).`,
  };
}

/**
 * Standard server analysis endpoint (Fallback / Server Pipeline).
 */
export async function analyzeSonarImage(
  file: File,
  onProgress?: (stage: 'uploading' | 'preprocessing' | 'detecting') => void
): Promise<DetectionResult> {
  const formData = new FormData();
  formData.append('file', file);

  if (onProgress) onProgress('uploading');

  const progressTimer1 = setTimeout(() => {
    if (onProgress) onProgress('preprocessing');
  }, 350);

  const progressTimer2 = setTimeout(() => {
    if (onProgress) onProgress('detecting');
  }, 900);

  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      body: formData,
    });

    clearTimeout(progressTimer1);
    clearTimeout(progressTimer2);

    if (!response.ok) {
      let errorMessage = `Analysis request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch {
        // use default message
      }
      throw new Error(errorMessage);
    }

    const data: DetectionResult = await response.json();
    return data;
  } catch (err: any) {
    clearTimeout(progressTimer1);
    clearTimeout(progressTimer2);
    throw err;
  }
}

export async function fetchResult(resultId: string): Promise<DetectionResult> {
  const response = await fetch(`${API_BASE_URL}/api/results/${resultId}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch result ${resultId}: HTTP ${response.status}`);
  }

  return response.json();
}

export function getDownloadUrl(resultId: string, format: 'json' | 'csv'): string {
  return `${API_BASE_URL}/api/results/${resultId}/${format}`;
}

/**
 * AI Intelligence: Comprehensive Threat & Ecological Assessment for the current scan.
 */
export async function fetchScanThreatAssessment(
  result: DetectionResult
): Promise<import('../types/detection').ThreatAssessmentResult> {
  const response = await fetch(`${API_BASE_URL}/api/ai/assess-scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ result }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `AI Assessment failed (${response.status})`);
  }

  return response.json();
}

/**
 * AI Intelligence: Deep Acoustic & Salvage Diagnostics for a Single Target.
 */
export async function fetchTargetDiagnostics(
  target: any,
  scanMetadata: any
): Promise<import('../types/detection').TargetAnalysisResult> {
  const response = await fetch(`${API_BASE_URL}/api/ai/analyze-target`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, scanMetadata }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Target Diagnostics failed (${response.status})`);
  }

  return response.json();
}

/**
 * AI Intelligence: Hydrographic AI Co-Pilot Conversation.
 */
export async function sendHydrographicAIChat(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  currentScanContext: DetectionResult | null,
  activeTarget: any | null
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, currentScanContext, activeTarget }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `AI Chat failed (${response.status})`);
  }

  const data = await response.json();
  return data.reply;
}

