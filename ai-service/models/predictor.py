# models/predictor.py — Pothole predictor (dummy + YOLO-ready structure)

import random
import numpy as np
from typing import Optional

ISSUE_TYPES = ["Pothole", "Road Crack", "Waterlogging", "Broken Divider", "Missing Sign"]
SEVERITY_LEVELS = ["Low", "Medium", "High", "Critical"]

# Severity weights — simulates a realistic distribution
SEVERITY_WEIGHTS = [0.25, 0.40, 0.25, 0.10]


class PotholePredictor:
    """
    Road damage detection model.
    
    Phase 1: Dummy predictions with realistic distributions.
    Phase 2: Replace predict() internals with YOLOv8 inference.
    
    Usage:
        predictor = PotholePredictor()
        predictor.load_model()
        result = predictor.predict(cv2_image)
    """

    def __init__(self):
        self.model = None
        self.is_loaded = False
        self.model_path = "weights/pothole_yolov8.pt"  # future weight path

    def load_model(self):
        """
        Load model weights.
        
        TODO Phase 2:
            from ultralytics import YOLO
            self.model = YOLO(self.model_path)
        """
        # Dummy: mark as loaded without actual weights
        self.is_loaded = True
        print(f"[Predictor] Model ready (dummy mode). Future: load {self.model_path}")

    def preprocess(self, image: np.ndarray) -> np.ndarray:
        """
        Image preprocessing pipeline.
        
        TODO Phase 2: resize to 640x640, normalize, convert BGR→RGB
        """
        return image

    def predict(self, image: np.ndarray) -> dict:
        """
        Run road damage detection on preprocessed image.
        
        Phase 1: Returns realistic dummy predictions.
        Phase 2: Replace with YOLO inference:
            results = self.model(image)
            boxes = results[0].boxes
            ...
        """
        # Analyze image brightness as a simple heuristic proxy
        mean_brightness = float(np.mean(image)) if image is not None else 128.0

        # Dummy prediction — weighted toward potholes (most common)
        issue_weights = [0.40, 0.25, 0.15, 0.12, 0.08]
        issue_type = random.choices(ISSUE_TYPES, weights=issue_weights, k=1)[0]
        severity   = random.choices(SEVERITY_LEVELS, weights=SEVERITY_WEIGHTS, k=1)[0]

        # Confidence varies slightly with image brightness (heuristic)
        base_confidence = 0.72 + random.uniform(-0.10, 0.15)
        if mean_brightness < 80:   base_confidence -= 0.08  # dark image
        if mean_brightness > 200:  base_confidence -= 0.05  # overexposed
        confidence = round(min(max(base_confidence, 0.50), 0.98), 2)

        return {
            "issue_type": issue_type,
            "severity":   severity,
            "confidence": confidence,
            "model_version": "dummy-v1.0",
            "note": "Dummy prediction — integrate YOLOv8 for production"
        }
