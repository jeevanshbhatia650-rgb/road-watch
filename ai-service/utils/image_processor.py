# utils/image_processor.py — OpenCV image preprocessing pipeline

import numpy as np
import cv2
from PIL import Image
import io
from typing import Optional


def preprocess_image(raw_bytes: bytes, target_size: tuple = (640, 640)) -> Optional[np.ndarray]:
    """
    Convert raw image bytes → OpenCV numpy array ready for inference.
    
    Steps:
    1. Decode bytes → PIL → numpy array
    2. Convert to BGR (OpenCV format)
    3. Resize to target_size
    4. Apply CLAHE for contrast enhancement (improves detection in low light)
    
    Args:
        raw_bytes: Raw image file bytes
        target_size: (width, height) tuple for resizing
    
    Returns:
        Preprocessed numpy array or None on failure
    """
    try:
        # Decode image from bytes
        pil_image = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
        image = np.array(pil_image)

        # Convert RGB → BGR for OpenCV
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

        # Resize
        image = cv2.resize(image, target_size, interpolation=cv2.INTER_LINEAR)

        # CLAHE enhancement — improves detection in dark or overexposed images
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l_channel, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l_channel = clahe.apply(l_channel)
        enhanced = cv2.merge([l_channel, a, b])
        image = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

        return image

    except Exception as e:
        print(f"[ImageProcessor] Error preprocessing image: {e}")
        return None


def draw_detections(image: np.ndarray, detections: list) -> np.ndarray:
    """
    Draw bounding boxes and labels on detected road damage.
    
    TODO Phase 2: use YOLO detection boxes
    
    Args:
        image: OpenCV image array
        detections: list of {label, confidence, bbox: [x1,y1,x2,y2]}
    
    Returns:
        Annotated image
    """
    colors = {
        "Pothole":        (0, 0, 255),    # red
        "Road Crack":     (0, 165, 255),  # orange
        "Waterlogging":   (255, 0, 0),    # blue
        "Broken Divider": (0, 255, 255),  # yellow
        "Missing Sign":   (255, 0, 255),  # magenta
    }

    for det in detections:
        x1, y1, x2, y2 = det.get("bbox", [0, 0, 100, 100])
        label = det.get("label", "Unknown")
        conf  = det.get("confidence", 0.0)
        color = colors.get(label, (128, 128, 128))

        cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
        cv2.putText(
            image, f"{label} {conf:.0%}",
            (x1, y1 - 8), cv2.FONT_HERSHEY_SIMPLEX,
            0.55, color, 2
        )

    return image
