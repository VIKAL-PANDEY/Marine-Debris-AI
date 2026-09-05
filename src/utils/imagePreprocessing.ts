/**
 * Image Preprocessing Utilities for YOLO Object Detection Models
 * Handles image loading, aspect-ratio-preserving letterboxing, CHW normalization,
 * Float32Array tensor creation, and coordinate back-projection.
 */

export interface LetterboxResult {
  tensorData: Float32Array;
  scale: number;
  padX: number;
  padY: number;
  newWidth: number;
  newHeight: number;
  origWidth: number;
  origHeight: number;
  inputWidth: number;
  inputHeight: number;
  canvas: HTMLCanvasElement;
}

export interface BoundingBoxXYWH {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Load an image from a File, Blob, or URL string into an HTMLImageElement.
 */
export function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrl: string | null = null;

    img.onload = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        reject(new Error('Invalid image: Image dimensions are 0x0.'));
        return;
      }
      resolve(img);
    };

    img.onerror = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      reject(new Error('Failed to load image source into browser canvas.'));
    };

    if (typeof source === 'string') {
      img.src = source;
    } else if (source && typeof source === 'object') {
      try {
        objectUrl = URL.createObjectURL(source);
        img.src = objectUrl;
      } catch (err) {
        reject(new Error(`Failed to create object URL for image file: ${err}`));
      }
    } else {
      reject(new Error('Unsupported image source type. Expected File, Blob, or URL string.'));
    }
  });
}

/**
 * Resize and letterbox image onto a fixed input canvas (e.g., 640x640)
 * preserving aspect ratio with constant gray padding (114 for YOLO models).
 * Converts RGB pixels into a normalized [0.0, 1.0] Float32Array in CHW order (Channels x Height x Width).
 */
export async function preprocessImageForYOLO(
  imageSource: HTMLImageElement | File | Blob | string,
  inputWidth = 640,
  inputHeight = 640
): Promise<LetterboxResult> {
  let img: HTMLImageElement;

  if (imageSource instanceof HTMLImageElement) {
    if (imageSource.naturalWidth === 0 || imageSource.naturalHeight === 0) {
      throw new Error('Invalid image: Image has zero width or height.');
    }
    img = imageSource;
  } else {
    img = await loadImage(imageSource);
  }

  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;

  if (origWidth <= 0 || origHeight <= 0) {
    throw new Error(`Invalid image dimensions: ${origWidth}x${origHeight}`);
  }

  // Calculate letterbox scaling ratio and padding offsets
  const scale = Math.min(inputWidth / origWidth, inputHeight / origHeight);
  const newWidth = Math.round(origWidth * scale);
  const newHeight = Math.round(origHeight * scale);
  const padX = Math.round((inputWidth - newWidth) / 2);
  const padY = Math.round((inputHeight - newHeight) / 2);

  // Render letterboxed image onto an offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = inputWidth;
  canvas.height = inputHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Canvas 2D context creation failed: Browser may be out of memory.');
  }

  // YOLO standard background fill: RGB(114, 114, 114)
  ctx.fillStyle = 'rgb(114, 114, 114)';
  ctx.fillRect(0, 0, inputWidth, inputHeight);

  // Draw scaled image centered inside letterbox
  ctx.drawImage(img, 0, 0, origWidth, origHeight, padX, padY, newWidth, newHeight);

  // Extract pixel data
  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, inputWidth, inputHeight);
  } catch (err) {
    throw new Error(`Tensor creation failure: Unable to read image pixel buffer (${err})`);
  }

  const { data } = imageData; // RGBA uint8 array of length 4 * inputWidth * inputHeight
  const pixelCount = inputWidth * inputHeight;
  const tensorData = new Float32Array(3 * pixelCount); // CHW format: [R, G, B]

  const rOffset = 0 * pixelCount;
  const gOffset = 1 * pixelCount;
  const bOffset = 2 * pixelCount;

  for (let i = 0; i < pixelCount; i++) {
    const dataIdx = i * 4;
    // Normalize [0..255] -> [0.0..1.0]
    tensorData[rOffset + i] = data[dataIdx] / 255.0;
    tensorData[gOffset + i] = data[dataIdx + 1] / 255.0;
    tensorData[bOffset + i] = data[dataIdx + 2] / 255.0;
  }

  return {
    tensorData,
    scale,
    padX,
    padY,
    newWidth,
    newHeight,
    origWidth,
    origHeight,
    inputWidth,
    inputHeight,
    canvas,
  };
}

/**
 * Un-letterbox a bounding box from model input space (e.g. 640x640)
 * back to the original full-resolution sonar image pixel coordinates.
 */
export function unletterboxBoundingBox(
  box: BoundingBoxXYWH,
  scale: number,
  padX: number,
  padY: number,
  origWidth: number,
  origHeight: number
): BoundingBoxXYWH {
  if (scale <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  // Remove letterbox padding and scale back to original dimensions
  const x = (box.x - padX) / scale;
  const y = (box.y - padY) / scale;
  const w = box.width / scale;
  const h = box.height / scale;

  // Clamp bounding box inside original image boundary
  const clampedX = Math.max(0, Math.min(origWidth - 1, Math.round(x)));
  const clampedY = Math.max(0, Math.min(origHeight - 1, Math.round(y)));
  const clampedW = Math.max(1, Math.min(origWidth - clampedX, Math.round(w)));
  const clampedH = Math.max(1, Math.min(origHeight - clampedY, Math.round(h)));

  return {
    x: clampedX,
    y: clampedY,
    width: clampedW,
    height: clampedH,
  };
}

/**
 * Calculates Intersection-over-Union (IoU) between two bounding boxes in XYWH format.
 */
export function calculateIoU(boxA: BoundingBoxXYWH, boxB: BoundingBoxXYWH): number {
  const xA1 = boxA.x;
  const yA1 = boxA.y;
  const xA2 = boxA.x + boxA.width;
  const yA2 = boxA.y + boxA.height;

  const xB1 = boxB.x;
  const yB1 = boxB.y;
  const xB2 = boxB.x + boxB.width;
  const yB2 = boxB.y + boxB.height;

  const interX1 = Math.max(xA1, xB1);
  const interY1 = Math.max(yA1, yB1);
  const interX2 = Math.min(xA2, xB2);
  const interY2 = Math.min(yA2, yB2);

  const interWidth = Math.max(0, interX2 - interX1);
  const interHeight = Math.max(0, interY2 - interY1);
  const interArea = interWidth * interHeight;

  const areaA = boxA.width * boxA.height;
  const areaB = boxB.width * boxB.height;
  const unionArea = areaA + areaB - interArea;

  if (unionArea <= 0) return 0;
  return interArea / unionArea;
}

export interface RawDetectionCandidate {
  bbox: BoundingBoxXYWH;
  classId: number;
  confidence: number;
}

/**
 * Applies Non-Maximum Suppression (NMS) on raw YOLO candidates.
 */
export function applyNonMaximumSuppression(
  candidates: RawDetectionCandidate[],
  iouThreshold = 0.45
): RawDetectionCandidate[] {
  // Sort descending by confidence
  const sorted = [...candidates].sort((a, b) => b.confidence - a.confidence);
  const selected: RawDetectionCandidate[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    let keep = true;

    for (let j = 0; j < selected.length; j++) {
      const prev = selected[j];
      const iou = calculateIoU(current.bbox, prev.bbox);
      if (iou > iouThreshold) {
        keep = false;
        break;
      }
    }

    if (keep) {
      selected.push(current);
    }
  }

  return selected;
}
