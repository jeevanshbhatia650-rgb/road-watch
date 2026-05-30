import numpy as np
import cv2
import os

SEVERITY_MAP = {
    "pothole":            "high",
    "rutting":            "high",
    "alligator":          "high",
    "ravelling":          "medium",
    "edge_cracking":      "medium",
    "lateral_crack":      "medium",
    "longitudinal_crack": "low",
    "striping":           "low"
}

class PotholePredictor:
    def __init__(self):
        self.model      = None
        self.is_loaded  = False
        self.model_path = os.path.join(
            os.path.dirname(__file__),
            '../weights/best.pt'
        )

    def load_model(self):
        from ultralytics import YOLO
        print(f"[Predictor] Loading from {self.model_path} ...")
        self.model     = YOLO(self.model_path)
        self.is_loaded = True
        print(f"[Predictor] Ready. Classes: {list(self.model.names.values())}")

    def _parse_results(self, results) -> dict:
        detections = []
        for box in results[0].boxes:
            raw_class  = self.model.names[int(box.cls)]
            normalized = raw_class.lower().replace("-","_").replace(" ","_")
            detections.append({
                "class":      raw_class,
                "class_key":  normalized,
                "confidence": round(float(box.conf), 3),
                "bbox":       [round(x,1) for x in box.xyxy[0].tolist()]
            })
        detections.sort(key=lambda x: x["confidence"], reverse=True)
        primary  = detections[0]["class"] if detections else None
        severity = self._get_severity(detections)
        return {
            "detections":    detections,
            "total_found":   len(detections),
            "primary_issue": primary,
            "severity":      severity,
            "model_version": "yolov8s-roadwatch-v1"
        }

    def predict(self, image_path: str) -> dict:
        """Single image file → detections"""
        if not self.is_loaded:
            self.load_model()
        results = self.model(image_path, conf=0.35, iou=0.45)
        return self._parse_results(results)

    def predict_frame(self, frame: np.ndarray) -> dict:
        """Single numpy frame → detections"""
        if not self.is_loaded:
            self.load_model()
        results = self.model(frame, conf=0.35, iou=0.45)
        return self._parse_results(results)

    def predict_video(self, video_path: str,
                      lat: float, lng: float,
                      sample_every_n_frames: int = 30) -> dict:
        """
        Process a dashcam video file.

        - Reads video from video_path
        - Samples 1 frame every N frames (default every 30 = 1/sec at 30fps)
        - Runs YOLO on each sampled frame
        - Deduplicates: same class within 10 consecutive frames = one detection
        - Returns aggregated unique detections across entire video
        """
        if not self.is_loaded:
            self.load_model()

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")

        fps          = cap.get(cv2.CAP_PROP_FPS) or 30
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration_sec = round(total_frames / fps, 1)

        print(f"[Video] {video_path} | {total_frames} frames | {fps}fps | {duration_sec}s")

        frame_idx          = 0
        all_detections     = []
        last_seen          = {}   # class_key → frame_idx last detected
        dedup_window       = sample_every_n_frames * 10  # 10 seconds window

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Sample every N frames only
            if frame_idx % sample_every_n_frames == 0:
                result = self._parse_results(
                    self.model(frame, conf=0.35, iou=0.45)
                )

                for det in result["detections"]:
                    ck         = det["class_key"]
                    last_frame = last_seen.get(ck, -dedup_window)

                    # Only add if not seen in last dedup_window frames
                    if (frame_idx - last_frame) >= dedup_window:
                        det["frame_idx"]    = frame_idx
                        det["timestamp_sec"] = round(frame_idx / fps, 1)
                        all_detections.append(det)
                        last_seen[ck] = frame_idx
                        print(f"  [{det['timestamp_sec']}s] {det['class']} ({det['confidence']})")

            frame_idx += 1

        cap.release()

        # Sort by confidence
        all_detections.sort(key=lambda x: x["confidence"], reverse=True)
        primary  = all_detections[0]["class"] if all_detections else None
        severity = self._get_severity(all_detections)

        return {
            "detections":    all_detections,
            "total_found":   len(all_detections),
            "primary_issue": primary,
            "severity":      severity,
            "video_meta": {
                "path":         video_path,
                "duration_sec": duration_sec,
                "total_frames": total_frames,
                "fps":          fps,
                "sampled_every": sample_every_n_frames
            },
            "model_version": "yolov8s-roadwatch-v1"
        }

    def _get_severity(self, detections: list) -> str:
        if not detections:
            return "none"
        for level in ["high", "medium", "low"]:
            for d in detections:
                if SEVERITY_MAP.get(d["class_key"]) == level:
                    return level
        return "low"