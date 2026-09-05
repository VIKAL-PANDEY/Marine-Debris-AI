"""
Sonar Image Preprocessing Service
----------------------------------
Modular OpenCV pipeline for acoustic side-scan sonar imagery:
1. Dynamic format handling (PNG, JPG, JPEG, TIFF, 8-bit/16-bit).
2. Grayscale conversion.
3. Intensity normalization (0-255 dynamic range expansion).
4. CLAHE (Contrast Limited Adaptive Histogram Equalization) to balance acoustic shadows and bright reflections.
5. Mild acoustic speckle/noise reduction (bilateral filter to preserve sharp edges).

Architecture note:
This module is structured with discrete step functions so that sonar-specific transforms
(e.g., Slant-Range Correction, Towfish Altitude Compensation, Beam Pattern Equalization)
can be cleanly inserted into the pipeline.
"""

from typing import Tuple, Dict, Any
import cv2
import numpy as np


def read_image_from_bytes(image_bytes: bytes) -> np.ndarray:
    """Decodes raw image bytes into a numpy array using OpenCV."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
    if image is None:
        raise ValueError("Could not decode image from provided byte stream. Supported formats: PNG, JPG, JPEG, TIFF.")
    return image


def convert_to_grayscale(image: np.ndarray) -> np.ndarray:
    """Converts 3-channel BGR/RGB or 4-channel BGRA to single-channel 8-bit grayscale."""
    if len(image.shape) == 2:
        gray = image
    elif image.shape[2] == 4:
        gray = cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY)
    else:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # If 16-bit, normalize to 8-bit for standard display & inference
    if gray.dtype != np.uint8:
        gray = cv2.normalize(gray, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)
    return gray


def normalize_intensity(gray_image: np.ndarray) -> np.ndarray:
    """Stretches pixel intensities across the full 0-255 dynamic range."""
    return cv2.normalize(gray_image, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX)


def apply_clahe(gray_image: np.ndarray, clip_limit: float = 2.5, tile_grid_size: Tuple[int, int] = (8, 8)) -> np.ndarray:
    """
    Applies Contrast Limited Adaptive Histogram Equalization (CLAHE).
    Acoustic sonar data exhibits high attenuation at long range and intense backscatter
    near the nadir; CLAHE dynamically balances local contrast without blowing out noise.
    """
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    return clahe.apply(gray_image)


def denoise_sonar(gray_image: np.ndarray) -> np.ndarray:
    """
    Applies light bilateral filtering to reduce high-frequency acoustic speckle
    while preserving hard acoustic reflection boundaries and acoustic shadow edges.
    """
    return cv2.bilateralFilter(gray_image, d=5, sigmaColor=35, sigmaSpace=35)


def apply_sonar_colormap(gray_image: np.ndarray) -> np.ndarray:
    """
    Applies an amber/copper side-scan sonar acoustic palette (or COLORMAP_BONE / COLORMAP_OCEAN)
    for high visual interpretability of acoustic backscatter.
    """
    # COLORMAP_BONE or COLORMAP_HOT or standard side-scan amber/bronze
    # Using COLORMAP_BONE for high-precision technical sonar visualization
    return cv2.applyColorMap(gray_image, cv2.COLORMAP_BONE)


def preprocess_sonar_image(image_bytes: bytes) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
    """
    Full modular preprocessing pipeline:
    Returns:
      - raw_image: original decoded image (BGR format)
      - preprocessed_image: enhanced acoustic image (BGR format for UI rendering)
      - metadata: image dimension and channel metadata
    """
    raw_image = read_image_from_bytes(image_bytes)

    # Standardize raw_image to 3-channel BGR for display
    if len(raw_image.shape) == 2:
        raw_bgr = cv2.cvtColor(raw_image, cv2.COLOR_GRAY2BGR)
    elif raw_image.shape[2] == 4:
        raw_bgr = cv2.cvtColor(raw_image, cv2.COLOR_BGRA2BGR)
    else:
        raw_bgr = raw_image.copy()

    height, width = raw_image.shape[:2]
    channels = 1 if len(raw_image.shape) == 2 else raw_image.shape[2]

    # Pipeline execution
    gray = convert_to_grayscale(raw_image)
    normalized = normalize_intensity(gray)
    equalized = apply_clahe(normalized, clip_limit=2.5, tile_grid_size=(8, 8))
    denoised = denoise_sonar(equalized)

    # Preprocessed output rendered in 3-channel for browser viewing
    preprocessed_bgr = cv2.cvtColor(denoised, cv2.COLOR_GRAY2BGR)

    metadata = {
        "width": int(width),
        "height": int(height),
        "channels": int(channels),
        "dtype": str(raw_image.dtype),
        "pipeline_steps": [
            "Grayscale conversion",
            "Min-Max intensity dynamic range stretch (0-255)",
            "Contrast Limited Adaptive Histogram Equalization (CLAHE, clip=2.5)",
            "Bilateral speckle attenuation (d=5, sC=35, sS=35)",
        ]
    }

    return raw_bgr, preprocessed_bgr, metadata
