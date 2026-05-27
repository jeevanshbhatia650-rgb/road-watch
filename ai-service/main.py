# ai-service/main.py — RoadWatch AI Microservice
# Structured for future YOLO/OpenCV integration

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from models.predictor import PotholePredictor
from utils.image_processor import preprocess_image

app = FastAPI(
    title="RoadWatch AI Service",
    description="Pothole & road damage detection microservice",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize model at startup
predictor = PotholePredictor()

@app.on_event("startup")
async def startup_event():
    """Load model weights on startup."""
    predictor.load_model()
    print("✅ AI model loaded successfully")


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "RoadWatch AI", "model_loaded": predictor.is_loaded}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Analyze road image and return damage prediction.
    
    Returns:
        issue_type: Type of road damage detected
        severity:   Severity level (Low / Medium / High / Critical)
        confidence: Model confidence score 0-1
    """
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Read and preprocess image
    contents = await file.read()
    image = preprocess_image(contents)

    if image is None:
        raise HTTPException(status_code=400, detail="Could not process image")

    # Run prediction
    result = predictor.predict(image)
    return result


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
