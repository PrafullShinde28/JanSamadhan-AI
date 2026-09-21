import os
import time
import requests
import logging
from io import BytesIO
from pathlib import Path
from typing import List, Optional

from PIL import Image
from ultralytics import YOLO
from fastapi import FastAPI, APIRouter, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import gradio as gr

# ============================================================
# LOGGING & CONFIG
# ============================================================
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("CivicAI")

BASE_DIR = Path(__file__).resolve().parent

# Flexible model path resolution
custom_path = os.getenv("MODEL_PATH")
if custom_path and (BASE_DIR / custom_path).exists():
    MODEL_PATH = BASE_DIR / custom_path
elif custom_path and Path(custom_path).exists():
    MODEL_PATH = Path(custom_path)
elif (BASE_DIR / "best.pt").exists():
    MODEL_PATH = BASE_DIR / "best.pt"
elif (BASE_DIR / "weights" / "best.pt").exists():
    MODEL_PATH = BASE_DIR / "weights" / "best.pt"
else:
    MODEL_PATH = BASE_DIR / "best.pt"

YOLO_CONFIDENCE = float(os.getenv("YOLO_CONFIDENCE", "0.25"))
YOLO_IOU = float(os.getenv("YOLO_IOU", "0.45"))
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}

# ============================================================
# SCHEMAS
# ============================================================
class Detection(BaseModel):
    class_name: str
    class_id: int
    confidence: float
    x1: float
    y1: float
    x2: float
    y2: float

class DetectionResponse(BaseModel):
    success: bool
    model: str
    detections: List[Detection]
    primary_detection: Optional[Detection] = None
    image_width: int
    image_height: int
    processing_time_ms: float

class VerificationRequest(BaseModel):
    beforeImage: HttpUrl
    afterImage: HttpUrl

# Model is run on Hugging Face Spaces free CPU Basic (2 vCPU, 16 GB RAM) with unlimited requests


class YOLOService:

    def __init__(self):
        if not MODEL_PATH.exists():
            logger.warning(f"Model file not found at {MODEL_PATH}. Waiting for upload.")
            self.model = None
            return

        logger.info(f"Loading YOLO model from: {MODEL_PATH}")
        self.model = YOLO(str(MODEL_PATH))
        logger.info("YOLO model loaded successfully.")

    def detect(self, image: Image.Image):
        if self.model is None:
            if MODEL_PATH.exists():
                self.model = YOLO(str(MODEL_PATH))
            else:
                raise FileNotFoundError(f"Model file missing at {MODEL_PATH}")

        start_time = time.perf_counter()
        results = self.model.predict(source=image, conf=YOLO_CONFIDENCE, iou=YOLO_IOU, verbose=False)
        result = results[0]
        names = result.names
        detections = []

        if result.boxes is not None:
            for box in result.boxes:
                class_id = int(box.cls[0].item())
                confidence = float(box.conf[0].item())
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                class_name = names[class_id]

                detections.append({
                    "class_name": class_name,
                    "class_id": class_id,
                    "confidence": round(confidence, 4),
                    "x1": round(x1, 2),
                    "y1": round(y1, 2),
                    "x2": round(x2, 2),
                    "y2": round(y2, 2),
                })

        primary_detection = max(detections, key=lambda x: x["confidence"]) if detections else None
        processing_time = (time.perf_counter() - start_time) * 1000
        width, height = image.size

        return {
            "success": True,
            "model": MODEL_PATH.name,
            "detections": detections,
            "primary_detection": primary_detection,
            "image_width": width,
            "image_height": height,
            "processing_time_ms": round(processing_time, 2),
        }

yolo_service = YOLOService()

def run_yolo_detection(image: Image.Image):
    return yolo_service.detect(image)


# ============================================================
# API ROUTER (MOUNTED INTO GRADIO)
# ============================================================


api_router = APIRouter(prefix="/api/v1")

# Helper to download image
def download_image(url: str) -> Image.Image:
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return Image.open(BytesIO(response.content)).convert("RGB")
    except Exception as error:
        logger.error(f"Image download error: {error}")
        raise HTTPException(status_code=400, detail="Unable to download image from provided URL.")

def get_detection_summary(result):
    detections = result.get("detections", [])
    summary = {}
    for d in detections:
        cname = d.get("class_name")
        conf = float(d.get("confidence", 0))
        if not cname:
            continue
        if cname not in summary:
            summary[cname] = {"count": 0, "max_confidence": 0}
        summary[cname]["count"] += 1
        summary[cname]["max_confidence"] = max(summary[cname]["max_confidence"], conf)
    return summary

# 1. Detection Endpoint
@api_router.post("/detect", response_model=DetectionResponse)
async def detect_issue(image: UploadFile = File(...)):
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG and WEBP images are supported.")

    contents = await image.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty image uploaded.")

    try:
        pil_image = Image.open(BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file.")

    try:
        return run_yolo_detection(pil_image)
    except Exception as error:
        logger.error(f"YOLO detection error: {error}")
        raise HTTPException(status_code=500, detail="AI detection failed.")

def do_verify(before_url: str, after_url: str):
    before_image = download_image(before_url)
    after_image = download_image(after_url)

    try:
        before_result = run_yolo_detection(before_image)
        after_result = run_yolo_detection(after_image)
    except Exception as error:
        logger.error(f"Verification error: {error}")
        raise HTTPException(status_code=500, detail="AI resolution verification failed.")

    before_summary = get_detection_summary(before_result)
    after_summary = get_detection_summary(after_result)

    if not before_summary:
        return {
            "success": True,
            "verified": False,
            "isResolved": False,
            "verificationScore": 0,
            "recommendation": "MANUAL_REVIEW",
            "reason": "No issue was detected in the original before image.",
            "before": before_result,
            "after": after_result,
        }

    issue_results = []
    for category, before_data in before_summary.items():
        before_count = before_data["count"]
        before_conf = before_data["max_confidence"]
        after_data = after_summary.get(category)

        if not after_data:
            issue_results.append({
                "category": category,
                "beforeCount": before_count,
                "afterCount": 0,
                "beforeConfidence": before_conf,
                "afterConfidence": 0,
                "resolved": True,
                "improvement": 1.0,
            })
            continue

        after_count = after_data["count"]
        after_conf = after_data["max_confidence"]

        count_imp = max(0, (before_count - after_count) / max(before_count, 1))
        conf_imp = max(0, (before_conf - after_conf) / max(before_conf, 0.01))
        improvement = (0.6 * count_imp) + (0.4 * conf_imp)
        resolved = improvement >= 0.70

        issue_results.append({
            "category": category,
            "beforeCount": before_count,
            "afterCount": after_count,
            "beforeConfidence": before_conf,
            "afterConfidence": after_conf,
            "resolved": resolved,
            "improvement": round(improvement, 4),
        })

    resolved_count = sum(1 for r in issue_results if r["resolved"])
    total_issues = len(issue_results)
    verification_score = (resolved_count / total_issues * 100) if total_issues else 0
    is_resolved = total_issues > 0 and resolved_count == total_issues

    return {
        "success": True,
        "verified": True,
        "isResolved": is_resolved,
        "verificationScore": round(verification_score, 2),
        "recommendation": "RESOLVED" if is_resolved else "NOT_RESOLVED",
        "reason": "AI verified the issue is resolved." if is_resolved else "AI detected the issue is still present.",
        "issues": issue_results,
        "before": {"detections": before_result.get("detections", [])},
        "after": {"detections": after_result.get("detections", [])},
    }

# 2. Verification Endpoint
@api_router.post("/verify")
async def verify_resolution(request: VerificationRequest):
    return do_verify(str(request.beforeImage), str(request.afterImage))

# ============================================================
# GRADIO INTERFACE & APIS
# ============================================================
def api_detect(image):
    if image is None:
        return {"success": False, "error": "No image provided", "detections": []}
    return run_yolo_detection(image)

def api_verify(before_url: str, after_url: str):
    if not before_url or not after_url:
        return {"success": False, "error": "Both before and after image URLs are required"}
    return do_verify(str(before_url).strip(), str(after_url).strip())

with gr.Blocks(title="JanSamadhan AI Service") as demo:
    gr.Markdown("# 🏛️ JanSamadhan AI — Computer Vision Service")
    gr.Markdown("🟢 **Live High-Performance AI Microservice on Hugging Face Spaces (CPU Basic 16GB).**")

    with gr.Tab("Issue Detection"):
        img_in = gr.Image(type="pil", label="Upload Issue Photo")
        out_json = gr.JSON(label="Detection Results (JSON)")
        btn_detect = gr.Button("Detect Civic Issues", variant="primary")
        btn_detect.click(fn=api_detect, inputs=img_in, outputs=out_json, api_name="detect")

    with gr.Tab("Resolution Verification"):
        before_in = gr.Textbox(label="Before Image URL", placeholder="https://...")
        after_in = gr.Textbox(label="After Image URL", placeholder="https://...")
        out_verify = gr.JSON(label="Verification Result (JSON)")
        btn_verify = gr.Button("Verify Resolution", variant="primary")
        btn_verify.click(fn=api_verify, inputs=[before_in, after_in], outputs=out_verify, api_name="verify")

app = FastAPI(
    title="JanSamadhan AI Service",
    description="High-performance YOLO civic issue detection and verification microservice"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "JanSamadhan AI Computer Vision Service",
        "endpoints": {
            "detect": "/api/v1/detect (POST)",
            "verify": "/api/v1/verify (POST)",
            "health": "/health (GET)",
            "ui": "/gradio"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "JanSamadhan AI", "model": MODEL_PATH.name}

app.include_router(api_router)

# Mount Gradio interactive demo at /gradio
app = gr.mount_gradio_app(app, demo, path="/gradio")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 7860))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
