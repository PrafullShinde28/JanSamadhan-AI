from io import BytesIO

import requests

from fastapi import APIRouter, HTTPException
from PIL import Image
from pydantic import BaseModel, HttpUrl

from app.services.yolo_service import yolo_service


router = APIRouter()


# ============================================================
# REQUEST SCHEMA
# ============================================================

class VerificationRequest(BaseModel):

    beforeImage: HttpUrl
    afterImage: HttpUrl


# ============================================================
# DOWNLOAD IMAGE
# ============================================================

def download_image(url: str):

    try:

        response = requests.get(
            url,
            timeout=30
        )

        response.raise_for_status()

        image = Image.open(
            BytesIO(response.content)
        ).convert("RGB")

        return image

    except Exception as error:

        print(
            f"Image download error: {error}"
        )

        raise HTTPException(
            status_code=400,
            detail="Unable to download image."
        )


# ============================================================
# EXTRACT DETECTIONS
# ============================================================

def get_detection_summary(result):

    detections = result.get(
        "detections",
        []
    )

    summary = {}

    for detection in detections:

        class_name = detection.get(
            "class_name"
        )

        confidence = float(
            detection.get(
                "confidence",
                0
            )
        )

        if not class_name:
            continue

        if class_name not in summary:

            summary[class_name] = {

                "count": 0,

                "max_confidence": 0

            }

        summary[class_name]["count"] += 1

        summary[class_name]["max_confidence"] = max(

            summary[class_name]["max_confidence"],

            confidence

        )

    return summary


# ============================================================
# RESOLUTION VERIFICATION
# ============================================================

@router.post("/verify")
async def verify_resolution(
    request: VerificationRequest
):

    # ========================================================
    # DOWNLOAD BEFORE IMAGE
    # ========================================================

    before_image = download_image(
        str(request.beforeImage)
    )

    # ========================================================
    # DOWNLOAD AFTER IMAGE
    # ========================================================

    after_image = download_image(
        str(request.afterImage)
    )

    # ========================================================
    # RUN YOLO ON BEFORE IMAGE
    # ========================================================

    try:

        before_result = yolo_service.detect(
            before_image
        )

        # ====================================================
        # RUN YOLO ON AFTER IMAGE
        # ====================================================

        after_result = yolo_service.detect(
            after_image
        )

    except Exception as error:

        print(
            f"Resolution verification error: {error}"
        )

        raise HTTPException(

            status_code=500,

            detail="AI resolution verification failed."

        )

    # ========================================================
    # SUMMARIZE DETECTIONS
    # ========================================================

    before_summary = get_detection_summary(
        before_result
    )

    after_summary = get_detection_summary(
        after_result
    )

    # ========================================================
    # DETERMINE ORIGINAL ISSUE
    # ========================================================

    if not before_summary:

        return {

            "success": True,

            "verified": False,

            "isResolved": False,

            "verificationScore": 0,

            "recommendation": "MANUAL_REVIEW",

            "reason":
                "No issue was detected in the original image.",

            "before": before_result,

            "after": after_result

        }

    # ========================================================
    # COMPARE BEFORE AND AFTER
    # ========================================================

    issue_results = []

    for category, before_data in before_summary.items():

        before_count = before_data["count"]

        before_confidence = (
            before_data["max_confidence"]
        )

        after_data = after_summary.get(
            category
        )

        # ----------------------------------------------------
        # ISSUE COMPLETELY DISAPPEARED
        # ----------------------------------------------------

        if not after_data:

            issue_results.append({

                "category": category,

                "beforeCount": before_count,

                "afterCount": 0,

                "beforeConfidence":
                    before_confidence,

                "afterConfidence": 0,

                "resolved": True,

                "improvement": 1.0

            })

            continue

        # ----------------------------------------------------
        # ISSUE STILL EXISTS
        # ----------------------------------------------------

        after_count = after_data["count"]

        after_confidence = (
            after_data["max_confidence"]
        )

        # ====================================================
        # IMPROVEMENT SCORE
        # ====================================================

        count_improvement = max(

            0,

            (
                before_count -
                after_count
            ) / max(before_count, 1)

        )

        confidence_improvement = max(

            0,

            (
                before_confidence -
                after_confidence
            ) / max(before_confidence, 0.01)

        )

        improvement = (

            0.6 * count_improvement +

            0.4 * confidence_improvement

        )

        resolved = (

            improvement >= 0.70

        )

        issue_results.append({

            "category": category,

            "beforeCount":
                before_count,

            "afterCount":
                after_count,

            "beforeConfidence":
                before_confidence,

            "afterConfidence":
                after_confidence,

            "resolved":
                resolved,

            "improvement":
                round(
                    improvement,
                    4
                )

        })

    # ========================================================
    # OVERALL RESULT
    # ========================================================

    resolved_count = sum(

        1

        for result in issue_results

        if result["resolved"]

    )

    total_issues = len(
        issue_results
    )

    verification_score = (

        resolved_count /
        total_issues *
        100

    ) if total_issues else 0

    is_resolved = (

        total_issues > 0 and

        resolved_count ==
        total_issues

    )

    # ========================================================
    # RECOMMENDATION
    # ========================================================

    if is_resolved:

        recommendation = "RESOLVED"

        reason = (
            "AI detected that the previously "
            "identified issue is no longer present "
            "in the after image."
        )

    else:

        recommendation = "NOT_RESOLVED"

        reason = (
            "AI detected that the original issue "
            "is still present in the after image."
        )

    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "success": True,

        "verified": True,

        "isResolved":
            is_resolved,

        "verificationScore":
            round(
                verification_score,
                2
            ),

        "recommendation":
            recommendation,

        "reason":
            reason,

        "issues":
            issue_results,

        "before": {

            "detections":
                before_result.get(
                    "detections",
                    []
                )

        },

        "after": {

            "detections":
                after_result.get(
                    "detections",
                    []
                )

        }

    }