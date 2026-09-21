from fastapi import FastAPI
from app.api.routes import (
    health,
    detection,
    verification,
)


app = FastAPI(
    title="Civic Issue AI Service",
    description=(
        "YOLO-based AI service for "
        "civic issue detection."
    ),
    version="1.0.0",
)


# ============================================================
# ROUTES
# ============================================================
app.include_router(
    detection.router,
    prefix="/api/v1",
    tags=["AI Detection"]
)

app.include_router(
    verification.router,
    prefix="/api/v1",
    tags=["AI Verification"]
)

app.include_router(
    health.router,
    prefix="/health",
    tags=["Health"]
)



# ============================================================
# ROOT
# ============================================================

@app.get("/")
async def root():

    return {

        "success": True,

        "service":
            "Civic Issue AI Service",

        "version":
            "1.0.0",

    }