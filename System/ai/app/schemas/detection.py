from typing import List

from pydantic import BaseModel


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

    primary_detection: Detection | None

    image_width: int

    image_height: int

    processing_time_ms: float