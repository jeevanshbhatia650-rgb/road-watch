from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from models.predictor import PotholePredictor
from utils.llm_reporter import generate_report
import shutil, os, uuid
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="RoadWatch AI Service",
    description="Road damage detection from images and dashcam video",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

predictor = PotholePredictor()
predictor.load_model()


@app.get("/health")
def health():
    return {
        "status":       "ok",
        "model_loaded": predictor.is_loaded,
        "classes":      list(predictor.model.names.values())
    }


@app.post("/predict")
async def predict_image(
    image: UploadFile = File(...),
    lat:   float      = Form(...),
    lng:   float      = Form(...)
):
    """Single image → detection + report"""
    temp_path = f"/tmp/{uuid.uuid4()}.jpg"
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(image.file, f)

    try:
        detection_result = predictor.predict(temp_path)
        report = await generate_report(
            detection_result=detection_result,
            location={"lat": lat, "lng": lng}
        )
        return {
            "success":    True,
            "mode":       "image",
            "detections": detection_result,
            "report":     report,
            "ministry":   report["assigned_ministry"],
            "priority":   report["priority_code"],
            "severity":   detection_result["severity"]
        }
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/predict-video")
async def predict_video(
    video:              UploadFile = File(...),
    lat:                float      = Form(...),
    lng:                float      = Form(...),
    sample_every_frames: int       = Form(30)
):
    """
    Dashcam video file → detections + single consolidated report.

    - Samples 1 frame every `sample_every_frames` frames
    - Deduplicates repeated detections of same damage
    - Generates one government report summarising entire journey
    - lat/lng = starting GPS coords of the video recording
    """
    # Save uploaded video to temp file
    ext       = os.path.splitext(video.filename)[1] or ".mp4"
    temp_path = f"/tmp/{uuid.uuid4()}{ext}"

    with open(temp_path, "wb") as f:
        shutil.copyfileobj(video.file, f)

    try:
        print(f"[/predict-video] Processing {video.filename} ...")

        detection_result = predictor.predict_video(
            video_path=temp_path,
            lat=lat,
            lng=lng,
            sample_every_n_frames=sample_every_frames
        )

        if detection_result["total_found"] == 0:
            return {
                "success":    True,
                "mode":       "video",
                "message":    "No road damage detected in video",
                "detections": detection_result
            }

        # One consolidated report for the whole video
        report = await generate_report(
            detection_result=detection_result,
            location={"lat": lat, "lng": lng}
        )

        return {
            "success":    True,
            "mode":       "video",
            "video_meta": detection_result["video_meta"],
            "detections": detection_result,
            "report":     report,
            "ministry":   report["assigned_ministry"],
            "priority":   report["priority_code"],
            "severity":   detection_result["severity"]
        }

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)