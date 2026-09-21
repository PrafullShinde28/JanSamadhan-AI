from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def health():

    return {
        "success": True,
        "service": "AI Service",
        "status": "healthy"
    }


@router.get("/model")
async def model_health():

    return {
        "success": True,
        "model_loaded": True
    }