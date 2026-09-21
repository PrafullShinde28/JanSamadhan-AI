import time
from pathlib import Path

from PIL import Image
from ultralytics import YOLO

from app.core.config import (
    MODEL_PATH,
    YOLO_CONFIDENCE,
    YOLO_IOU,
)


class YOLOService:

    def __init__(self):

        if not Path(MODEL_PATH).exists():

            raise FileNotFoundError(
                f"YOLO model not found: {MODEL_PATH}"
            )

        print(
            f"Loading YOLO model: {MODEL_PATH}"
        )

        self.model = YOLO(
            str(MODEL_PATH)
        )

        print("YOLO model loaded successfully.")

    # ========================================================
    # DETECTION
    # ========================================================

    def detect(self, image):

        start_time = time.perf_counter()

        results = self.model.predict(
            source=image,
            conf=YOLO_CONFIDENCE,
            iou=YOLO_IOU,
            verbose=False
        )

        result = results[0]

        detections = []

        names = result.names

        if result.boxes is not None:

            for box in result.boxes:

                class_id = int(
                    box.cls[0].item()
                )

                confidence = float(
                    box.conf[0].item()
                )

                coordinates = box.xyxy[0].tolist()

                x1, y1, x2, y2 = coordinates

                class_name = names[class_id]

                detections.append({

                    "class_name": class_name,

                    "class_id": class_id,

                    "confidence": round(
                        confidence,
                        4
                    ),

                    "x1": round(x1, 2),

                    "y1": round(y1, 2),

                    "x2": round(x2, 2),

                    "y2": round(y2, 2),

                })

        # Highest confidence detection
        primary_detection = None

        if detections:

            primary_detection = max(
                detections,
                key=lambda x: x["confidence"]
            )

        processing_time = (
            time.perf_counter() - start_time
        ) * 1000

        width, height = image.size

        return {

            "success": True,

            "model": Path(
                MODEL_PATH
            ).name,

            "detections": detections,

            "primary_detection":
                primary_detection,

            "image_width": width,

            "image_height": height,

            "processing_time_ms":
                round(
                    processing_time,
                    2
                ),

        }


# Singleton model
yolo_service = YOLOService()