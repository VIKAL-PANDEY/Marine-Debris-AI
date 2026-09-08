"""
HEIMDALL | SIH26057 | AllSpark
Image Processing Pipeline: OpenCV + NumPy
Preprocessing, acoustic enhancement, tiling, and shadow/highlight segmentation.
"""

from typing import List, Tuple, Dict, Any
import numpy as np
import cv2

# Target tile dimensions for YOLOv8/v9/v11 acoustic inference
YOLO_INPUT_SIZE = 640


def enhance_sonar_backscatter(image_np: np.ndarray) -> np.ndarray:
    """
    Applies hydrographic acoustic enhancement:
    1. Grayscale conversion if multi-channel.
    2. CLAHE (Contrast Limited Adaptive Histogram Equalization) to balance acoustic attenuation.
    3. Bilateral filter to suppress high-frequency speckle noise while preserving sharp shadow boundaries.
    """
    if len(image_np.shape) == 3:
        gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY)
    else:
        gray = image_np.copy()

    # Contrast Limited Adaptive Histogram Equalization
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)

    # Bilateral filter for speckle reduction
    filtered = cv2.bilateralFilter(enhanced, d=5, sigmaColor=35, sigmaSpace=35)

    return filtered


def tile_sonar_strip(
    image_np: np.ndarray,
    tile_size: int = YOLO_INPUT_SIZE,
    overlap: float = 0.2
) -> List[Dict[str, Any]]:
    """
    Slices large side-scan sonar waterfall strips into overlapping tiles for high-resolution YOLO inference.
    Prevents truncation of targets spanning tile boundaries.
    """
    h, w = image_np.shape[:2]
    step = int(tile_size * (1.0 - overlap))
    tiles = []

    y_indices = list(range(0, max(1, h - tile_size + 1), step))
    if len(y_indices) == 0 or y_indices[-1] + tile_size < h:
        y_indices.append(max(0, h - tile_size))

    x_indices = list(range(0, max(1, w - tile_size + 1), step))
    if len(x_indices) == 0 or x_indices[-1] + tile_size < w:
        x_indices.append(max(0, w - tile_size))

    for y in y_indices:
        for x in x_indices:
            crop = image_np[y:y + tile_size, x:x + tile_size]
            # If at the boundary and smaller than tile_size, letterbox with 114 gray
            actual_h, actual_w = crop.shape[:2]
            if actual_h < tile_size or actual_w < tile_size:
                padded = np.full((tile_size, tile_size, 3) if len(crop.shape) == 3 else (tile_size, tile_size), 114, dtype=crop.dtype)
                padded[0:actual_h, 0:actual_w] = crop
                crop = padded

            tiles.append({
                "x_offset": x,
                "y_offset": y,
                "image": crop
            })

    return tiles


def extract_acoustic_shadow_metrics(
    image_crop: np.ndarray
) -> Dict[str, float]:
    """
    Computes hydrographic acoustic metrics:
    - Specular Highlight Peak (intensity in dB)
    - Acoustic Shadow Ratio (down-range shadow length / highlight length)
    - Boundary Edge Gradient (dB/px)
    """
    if len(image_crop.shape) == 3:
        gray = cv2.cvtColor(image_crop, cv2.COLOR_BGR2GRAY)
    else:
        gray = image_crop

    # Calculate specular peak (normalized 0-100 dB acoustic scale)
    max_val = np.max(gray)
    specular_db = round(float((max_val / 255.0) * 24.0), 1)

    # Threshold for acoustic shadow (dark acoustic absence behind target)
    shadow_mask = gray < 35
    shadow_pixels = np.count_nonzero(shadow_mask)
    highlight_mask = gray > 180
    highlight_pixels = np.count_nonzero(highlight_mask)

    shadow_ratio = round(float(shadow_pixels / max(highlight_pixels, 1)), 2)
    shadow_ratio = max(0.8, min(shadow_ratio, 4.5))

    # Edge gradient via Sobel operator
    sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    gradient_mag = np.mean(np.sqrt(sobelx**2 + sobely**2))
    edge_gradient = round(float(gradient_mag / 10.0), 1)

    return {
        "specular_db": specular_db,
        "shadow_ratio": shadow_ratio,
        "edge_gradient": edge_gradient
    }


def letterbox_for_yolo(
    image: np.ndarray,
    target_shape: Tuple[int, int] = (640, 640),
    color: Tuple[int, int, int] = (114, 114, 114)
) -> Tuple[np.ndarray, float, Tuple[float, float]]:
    """
    Letterbox resize image with border padding for YOLOv8/v9/v11 inference.
    Returns: (padded_image, scale_ratio, (pad_width, pad_height))
    """
    shape = image.shape[:2]
    r = min(target_shape[0] / shape[0], target_shape[1] / shape[1])

    new_unpad = (int(round(shape[1] * r)), int(round(shape[0] * r)))
    dw, dh = target_shape[1] - new_unpad[0], target_shape[0] - new_unpad[1]
    dw /= 2
    dh /= 2

    if shape[::-1] != new_unpad:
        image = cv2.resize(image, new_unpad, interpolation=cv2.INTER_LINEAR)

    top, bottom = int(round(dh - 0.1)), int(round(dh + 0.1))
    left, right = int(round(dw - 0.1)), int(round(dw + 0.1))
    image = cv2.copyMakeBorder(image, top, bottom, left, right, cv2.BORDER_CONSTANT, value=color)

    return image, r, (dw, dh)
