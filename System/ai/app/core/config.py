import os
from pathlib import Path

from dotenv import load_dotenv


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent.parent

load_dotenv(BASE_DIR / ".env")


# ============================================================
# SERVER
# ============================================================

AI_HOST = os.getenv("AI_HOST", "0.0.0.0")

AI_PORT = int(
    os.getenv("AI_PORT", "8000")
)


# ============================================================
# MODEL
# ============================================================

MODEL_PATH = BASE_DIR / os.getenv(
    "MODEL_PATH",
    "weights/best.pt"
)

YOLO_CONFIDENCE = float(
    os.getenv("YOLO_CONFIDENCE", "0.25")
)

YOLO_IOU = float(
    os.getenv("YOLO_IOU", "0.45")
)


# ============================================================
# IMAGE
# ============================================================

MAX_IMAGE_SIZE_MB = int(
    os.getenv("MAX_IMAGE_SIZE_MB", "10")
)