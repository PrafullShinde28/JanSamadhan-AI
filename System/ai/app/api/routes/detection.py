from io import BytesIO

from fastapi import (
    APIRouter,
    File,
    HTTPException,
    UploadFile,
)

from PIL import Image

from app.services.yolo_service import yolo_service
from app.schemas.detection import DetectionResponse


router = APIRouter()


ALLOWED_CONTENT_TYPES = {

    "image/jpeg",

    "image/png",

    "image/webp",

}


@router.post(
    "/detect",
    response_model=DetectionResponse
)
async def detect_issue(
    image: UploadFile = File(...)
):

    # ========================================================
    # VALIDATE FILE
    # ========================================================

    if image.content_type not in ALLOWED_CONTENT_TYPES:

        raise HTTPException(

            status_code=400,

            detail=(
                "Only JPEG, PNG and WEBP "
                "images are supported."
            )

        )

    # ========================================================
    # READ IMAGE
    # ========================================================

    contents = await image.read()

    if not contents:

        raise HTTPException(

            status_code=400,

            detail="Empty image uploaded."

        )

    # ========================================================
    # CONVERT TO PIL
    # ========================================================

    try:

        pil_image = Image.open(
            BytesIO(contents)
        ).convert("RGB")

    except Exception:

        raise HTTPException(

            status_code=400,

            detail="Invalid image file."

        )

    # ========================================================
    # YOLO
    # ========================================================

    try:

        result = yolo_service.detect(
            pil_image
        )

        return result

    except Exception as error:

        print(
            f"YOLO detection error: {error}"
        )

        raise HTTPException(

            status_code=500,

            detail="AI detection failed."

        )