/**
 * Custom YOLO Object Detection Inference Service using ONNX Runtime Web
 * Browser-side WASM inference for Side-Scan Sonar Marine Debris Detection.
 */

import * as ort from 'onnxruntime-web';
import {
  preprocessImageForYOLO,
  unletterboxBoundingBox,
  applyNonMaximumSuppression,
  RawDetectionCandidate,
  BoundingBoxXYWH,
} from '../utils/imagePreprocessing';

/**
 * Global Model Configuration
 * -------------------------------------------------------------
 * NOTE: The classNames array below contains placeholder categories
 * formatted for marine debris sonar targets. Replace these with
 * the exact class labels matching your custom-trained YOLO weights
 * (e.g. data.yaml class index mapping).
 * -------------------------------------------------------------
 */
export const MODEL_CONFIG = {
  modelPath: '/models/marine-debris.onnx',
  inputWidth: 640,
  inputHeight: 640,
  confidenceThreshold: 0.25,
  iouThreshold: 0.45,
  // PLACEHOLDER CLASS NAMES: Replace with your actual trained model classes
  classNames: [
    'ghost_net',               // Class 0: Abandoned/derelict fishing nets
    'metal_debris',            // Class 1: Submerged metallic objects / wreckage
    'synthetic_line',          // Class 2: Synthetic rope / trawl line cluster
    'submerged_container',     // Class 3: Cargo boxes / storage containers
    'derelict_trap',           // Class 4: Crab / lobster pots & traps
    'plastic_debris',          // Class 5: Heavy plastics & industrial barrels
    'tire',                    // Class 6: Discarded marine/vehicle tires
    'other_debris',            // Class 7: General anthropogenic marine litter
  ],
};

export interface YOLODetection {
  id: string;
  classId: number;
  className: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface YOLOInferenceResult {
  detections: YOLODetection[];
  inferenceTimeMs: number;
  preprocessTimeMs: number;
  totalTimeMs: number;
  modelInputShape: number[];
  modelOutputShape: number[];
  originalDimensions: { width: number; height: number };
}

// Inference session singleton cache
let cachedSession: ort.InferenceSession | null = null;
let sessionLoadingPromise: Promise<ort.InferenceSession> | null = null;
let lastLoadedModelPath: string | null = null;

// Configure ONNX Runtime environment
try {
  // Point to the local /ort/ static route where wasm binaries are hosted
  ort.env.wasm.wasmPaths = '/ort/';
  // Use single thread in browser to prevent Cross-Origin-Isolation (COOP/COEP) header restrictions
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.simd = true;
} catch (e) {
  console.warn('[YOLO] Could not configure ort.env.wasm:', e);
}

/**
 * Verifies if the ONNX model file exists and is accessible over HTTP.
 */
export async function checkModelAvailability(
  modelPath: string = MODEL_CONFIG.modelPath
): Promise<{ available: boolean; status: number; sizeBytes?: number; error?: string }> {
  try {
    const res = await fetch(modelPath, { method: 'GET', headers: { Range: 'bytes=0-31' } });
    if (!res.ok) {
      return {
        available: false,
        status: res.status,
        error: `HTTP ${res.status}: ${res.statusText}. Ensure the ONNX model is placed at /public${modelPath}`,
      };
    }
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      return {
        available: false,
        status: 404,
        error: `Model file not found at ${modelPath} (server returned HTML fallback). Please place your trained YOLO model in /public/models/marine-debris.onnx`,
      };
    }
    const contentLength = res.headers.get('content-length');
    const sizeBytes = contentLength ? parseInt(contentLength, 10) : undefined;
    return { available: true, status: res.status, sizeBytes };
  } catch (err: any) {
    return {
      available: false,
      status: 0,
      error: err.message || 'Failed to connect to model path.',
    };
  }
}

/**
 * Loads the ONNX model once and caches the InferenceSession.
 * Handles WebAssembly execution provider selection and network error diagnostics.
 */
export async function loadYOLOModel(
  modelPath: string = MODEL_CONFIG.modelPath,
  forceReload = false
): Promise<ort.InferenceSession> {
  if (cachedSession && lastLoadedModelPath === modelPath && !forceReload) {
    return cachedSession;
  }

  if (sessionLoadingPromise && lastLoadedModelPath === modelPath && !forceReload) {
    return sessionLoadingPromise;
  }

  sessionLoadingPromise = (async () => {
    const isDev = import.meta.env.DEV;
    if (isDev) {
      console.log(`[YOLO] Loading ONNX model session from: "${modelPath}"...`);
    }

    // Step 1: Pre-flight check if model file exists
    const availability = await checkModelAvailability(modelPath);
    if (!availability.available) {
      const errorMsg =
        `Model loading failure: Cannot locate ONNX model at "${modelPath}". ` +
        `Please ensure your trained YOLO model is saved as "marine-debris.onnx" ` +
        `inside the project's "/public/models/" directory (i.e. "/public/models/marine-debris.onnx"). ` +
        `Server returned: ${availability.error || `HTTP ${availability.status}`}`;
      console.error(`[YOLO] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // Step 2: Create ONNX Runtime Web InferenceSession
    try {
      const session = await ort.InferenceSession.create(modelPath, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });

      cachedSession = session;
      lastLoadedModelPath = modelPath;

      if (isDev) {
        console.log(`[YOLO] ONNX Model Session successfully initialized!`);
        console.log(`[YOLO] Input Names:`, session.inputNames);
        console.log(`[YOLO] Output Names:`, session.outputNames);
      }

      return session;
    } catch (err: any) {
      console.error(`[YOLO] Failed to instantiate ONNX InferenceSession:`, err);
      throw new Error(
        `Model loading failure: Failed to parse ONNX weights at "${modelPath}". ` +
        `Details: ${err.message || err}. Verify the file is a valid ONNX model exported from YOLO (e.g. yolo export format=onnx).`
      );
    } finally {
      sessionLoadingPromise = null;
    }
  })();

  return sessionLoadingPromise;
}

/**
 * Decodes standard YOLO raw output tensors into candidate detections.
 * Supports:
 * - YOLOv8 / YOLOv11 output shape: [1, 4 + C, 8400] (transposed) or [1, 8400, 4 + C]
 * - YOLOv5 / YOLOv7 output shape: [1, 25200, 5 + C] (with objectness score)
 * - End-to-End ONNX output shape: [1, 300, 6] ([x1, y1, x2, y2, score, class_id])
 */
export function decodeYOLOOutput(
  outputTensor: ort.Tensor,
  confidenceThreshold: number = MODEL_CONFIG.confidenceThreshold,
  numClasses: number = MODEL_CONFIG.classNames.length
): RawDetectionCandidate[] {
  const dims = outputTensor.dims;
  const data = outputTensor.data as Float32Array;

  if (!dims || dims.length < 2) {
    throw new Error(
      `Unexpected model output shape: Expected tensor dimensions of length >= 2, received [${dims.join(', ')}]`
    );
  }

  const isDev = import.meta.env.DEV;
  const candidates: RawDetectionCandidate[] = [];

  // Case 1: Standard YOLOv8 / YOLOv11 shape: [1, 4 + num_classes, num_boxes] e.g. [1, 12, 8400] or [1, 84, 8400]
  if (dims.length === 3 && dims[1] < dims[2] && dims[1] >= 5) {
    const numAttributes = dims[1]; // e.g. 4 coords + C classes
    const numBoxes = dims[2];      // e.g. 8400 anchors
    const actualClasses = Math.min(numClasses, numAttributes - 4);

    for (let b = 0; b < numBoxes; b++) {
      // Coordinates: cx, cy, w, h
      const cx = data[0 * numBoxes + b];
      const cy = data[1 * numBoxes + b];
      const w = data[2 * numBoxes + b];
      const h = data[3 * numBoxes + b];

      // Find highest class confidence
      let maxScore = -1;
      let maxClassId = -1;

      for (let c = 0; c < actualClasses; c++) {
        const score = data[(4 + c) * numBoxes + b];
        if (score > maxScore) {
          maxScore = score;
          maxClassId = c;
        }
      }

      if (maxScore >= confidenceThreshold) {
        const x = cx - w / 2;
        const y = cy - h / 2;

        candidates.push({
          bbox: { x, y, width: w, height: h },
          classId: maxClassId,
          confidence: maxScore,
        });
      }
    }
  }
  // Case 2: Transposed YOLOv8 / YOLOv11 or YOLOv5 format: [1, num_boxes, num_attributes] e.g. [1, 8400, 12] or [1, 25200, 85]
  else if (dims.length === 3 && dims[1] >= dims[2]) {
    const numBoxes = dims[1];
    const numAttributes = dims[2];

    const hasObjectness = numAttributes >= 5 + numClasses; // YOLOv5 format with obj_conf at index 4

    for (let b = 0; b < numBoxes; b++) {
      const offset = b * numAttributes;
      const cx = data[offset];
      const cy = data[offset + 1];
      const w = data[offset + 2];
      const h = data[offset + 3];

      let maxScore = -1;
      let maxClassId = -1;

      if (hasObjectness) {
        const objectness = data[offset + 4];
        if (objectness >= confidenceThreshold * 0.5) {
          for (let c = 0; c < numClasses; c++) {
            const classProb = data[offset + 5 + c];
            const finalScore = objectness * classProb;
            if (finalScore > maxScore) {
              maxScore = finalScore;
              maxClassId = c;
            }
          }
        }
      } else {
        const actualClasses = Math.min(numClasses, numAttributes - 4);
        for (let c = 0; c < actualClasses; c++) {
          const score = data[offset + 4 + c];
          if (score > maxScore) {
            maxScore = score;
            maxClassId = c;
          }
        }
      }

      if (maxScore >= confidenceThreshold) {
        const x = cx - w / 2;
        const y = cy - h / 2;

        candidates.push({
          bbox: { x, y, width: w, height: h },
          classId: maxClassId,
          confidence: maxScore,
        });
      }
    }
  }
  // Case 3: Direct End2End Output: [1, num_boxes, 6] where item is [x1, y1, x2, y2, score, class_id]
  else if (dims.length === 3 && dims[2] === 6) {
    const numBoxes = dims[1];
    for (let b = 0; b < numBoxes; b++) {
      const offset = b * 6;
      const x1 = data[offset];
      const y1 = data[offset + 1];
      const x2 = data[offset + 2];
      const y2 = data[offset + 3];
      const score = data[offset + 4];
      const classId = Math.round(data[offset + 5]);

      if (score >= confidenceThreshold) {
        candidates.push({
          bbox: {
            x: x1,
            y: y1,
            width: Math.max(1, x2 - x1),
            height: Math.max(1, y2 - y1),
          },
          classId,
          confidence: score,
        });
      }
    }
  } else {
    throw new Error(
      `Unexpected model output shape: Received [${dims.join(', ')}]. ` +
      `Supported YOLO output shapes: [1, 4+C, N], [1, N, 4+C], [1, N, 5+C], or [1, N, 6].`
    );
  }

  if (isDev) {
    console.log(`[YOLO Decoder] Decoded ${candidates.length} raw candidate boxes above confidence ${confidenceThreshold}`);
  }

  return candidates;
}

/**
 * Runs end-to-end YOLO object detection on an image.
 * 
 * Pipeline:
 * 1. Loads ONNX session (cached)
 * 2. Preprocesses and letterboxes image to input dimensions (640x640)
 * 3. Creates Float32Array tensor [1, 3, 640, 640]
 * 4. Executes model inference via ONNX Runtime Web
 * 5. Decodes bounding boxes and class probabilities
 * 6. Applies Non-Maximum Suppression (NMS)
 * 7. Un-letterboxes coordinates back to original image space
 * 8. Returns clean structured detections list
 */
export async function runYOLOInference(
  imageSource: File | Blob | HTMLImageElement | string,
  customConfig: Partial<typeof MODEL_CONFIG> = {}
): Promise<YOLOInferenceResult> {
  const config = { ...MODEL_CONFIG, ...customConfig };
  const isDev = import.meta.env.DEV;

  const startTime = performance.now();

  // Step 1: Load Cached Model Session
  const session = await loadYOLOModel(config.modelPath);

  // Step 2: Resize & Letterbox Image to Model Input Size
  const prepStartTime = performance.now();
  let preprocessed;
  try {
    preprocessed = await preprocessImageForYOLO(
      imageSource,
      config.inputWidth,
      config.inputHeight
    );
  } catch (err: any) {
    throw new Error(`Invalid image: ${err.message || 'Image preprocessing failed.'}`);
  }
  const prepTimeMs = performance.now() - prepStartTime;

  const { tensorData, scale, padX, padY, origWidth, origHeight } = preprocessed;

  // Step 3: Create ONNX Tensor
  let inputTensor: ort.Tensor;
  try {
    inputTensor = new ort.Tensor('float32', tensorData, [
      1,
      3,
      config.inputHeight,
      config.inputWidth,
    ]);
  } catch (err: any) {
    throw new Error(`Tensor creation failure: ${err.message || 'Could not instantiate ort.Tensor.'}`);
  }

  // Determine input tensor node name
  const inputName = session.inputNames[0] || 'images';
  const feeds: Record<string, ort.Tensor> = { [inputName]: inputTensor };

  if (isDev) {
    console.log(`[YOLO Inference] Running inference with input "${inputName}" and shape:`, inputTensor.dims);
  }

  // Step 4: Run ONNX Runtime Web Inference
  const inferenceStartTime = performance.now();
  let results: ort.InferenceSession.ReturnType;
  try {
    results = await session.run(feeds);
  } catch (err: any) {
    throw new Error(`Inference failure: ONNX Runtime execution error: ${err.message || err}`);
  }
  const inferenceTimeMs = performance.now() - inferenceStartTime;

  // Step 5: Extract Output Tensor
  const outputName = session.outputNames[0] || Object.keys(results)[0];
  const outputTensor = results[outputName];

  if (!outputTensor) {
    throw new Error(`Unexpected model output: Output tensor "${outputName}" is undefined.`);
  }

  if (isDev) {
    console.log(`[YOLO Inference] Output tensor "${outputName}" shape:`, outputTensor.dims);
    console.log(`[YOLO Inference] Raw execution time: ${inferenceTimeMs.toFixed(2)}ms`);
  }

  // Step 6: Decode YOLO Output Boxes & Confidences
  const rawCandidates = decodeYOLOOutput(
    outputTensor,
    config.confidenceThreshold,
    config.classNames.length
  );

  // Step 7: Apply Non-Maximum Suppression (NMS)
  const nmsCandidates = applyNonMaximumSuppression(rawCandidates, config.iouThreshold);

  // Step 8: Convert Detections Back to Original Image Coordinate Space
  const detections: YOLODetection[] = nmsCandidates.map((candidate, idx) => {
    const unletterboxed = unletterboxBoundingBox(
      candidate.bbox,
      scale,
      padX,
      padY,
      origWidth,
      origHeight
    );

    const classId = candidate.classId;
    const className = config.classNames[classId] || `class_${classId}`;

    return {
      id: `YOLO-${String(idx + 1).padStart(3, '0')}`,
      classId,
      className,
      confidence: Number(candidate.confidence.toFixed(4)),
      bbox: unletterboxed,
    };
  });

  const totalTimeMs = performance.now() - startTime;

  if (isDev) {
    console.log(
      `[YOLO Inference Summary] ` +
      `Detections: ${detections.length} | ` +
      `Inference Time: ${inferenceTimeMs.toFixed(1)}ms | ` +
      `Total Pipeline: ${totalTimeMs.toFixed(1)}ms`
    );
  }

  return {
    detections,
    inferenceTimeMs: Number(inferenceTimeMs.toFixed(2)),
    preprocessTimeMs: Number(prepTimeMs.toFixed(2)),
    totalTimeMs: Number(totalTimeMs.toFixed(2)),
    modelInputShape: inputTensor.dims as number[],
    modelOutputShape: outputTensor.dims as number[],
    originalDimensions: { width: origWidth, height: origHeight },
  };
}
