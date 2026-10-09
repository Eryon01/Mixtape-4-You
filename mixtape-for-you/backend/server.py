import logging
import os
import secrets
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware
from supabase import create_client, Client


# ============================================================
# ENVIRONMENT
# ============================================================

ROOT_DIR = Path(__file__).resolve().parent

load_dotenv(
    ROOT_DIR / ".env",
    override=True
)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL:
    raise RuntimeError(
        "SUPABASE_URL is missing from backend/.env"
    )

if not SUPABASE_KEY:
    raise RuntimeError(
        "SUPABASE_KEY is missing from backend/.env"
    )


# ============================================================
# SUPABASE
# ============================================================

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)

print("========================================")
print("SUPABASE CONFIGURATION")
print("========================================")
print("Supabase URL loaded:", bool(SUPABASE_URL))
print("Supabase key loaded:", bool(SUPABASE_KEY))
print("Supabase host:", SUPABASE_URL)
print("========================================")


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="Mixtape For You API",
    version="1.0.0",
)

api_router = APIRouter(
    prefix="/api"
)


# ============================================================
# MODELS
# ============================================================

class Sticker(BaseModel):
    id: str
    type: str
    x: float
    y: float
    rot: float
    scale: float


class Song(BaseModel):
    platform: str
    trackId: str
    url: str
    title: str = "Untitled track"
    author: str = ""
    thumb: Optional[str] = None


class MixtapePayload(BaseModel):
    color: str = "green"

    stickers: List[Sticker] = Field(
        default_factory=list
    )

    songs: List[Song] = Field(
        default_factory=list
    )

    note: str = ""

    photo: Optional[str] = None

    photoCaption: str = ""

    recipient: str = "You"

    sender: str = "Me"


# ============================================================
# ROOT / HEALTH CHECK
# ============================================================

@api_router.get("/")
async def root():

    return {
        "message": "Mixtape For You API",
        "status": "online",
        "database": "Supabase",
    }


# ============================================================
# SUPABASE CONNECTION TEST
# ============================================================

@api_router.get("/db-test")
async def db_test():

    try:

        response = (
            supabase
            .table("mixtapes")
            .select("id")
            .limit(1)
            .execute()
        )

        return {
            "status": "connected",
            "database": "Supabase",
            "table": "mixtapes",
            "rows_checked": len(response.data),
        }

    except Exception as e:

        logging.exception(
            "Supabase connection failed"
        )

        raise HTTPException(
            status_code=500,
            detail=f"Supabase connection failed: {str(e)}",
        )


# ============================================================
# CREATE MIXTAPE
# ============================================================

@api_router.post("/mixtapes")
async def create_mixtape(
    payload: MixtapePayload,
):

    try:

        # Generate a short share code
        code = secrets.token_urlsafe(6)

        document = {
            "code": code,
            "mixtape": payload.model_dump(),
            "created_at": datetime.now(
                timezone.utc
            ).isoformat(),
        }

        response = (
            supabase
            .table("mixtapes")
            .insert(document)
            .execute()
        )

        if not response.data:

            raise Exception(
                "Supabase returned no inserted record."
            )

        return {
            "code": code
        }

    except Exception as e:

        logging.exception(
            "Failed to create mixtape"
        )

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}",
        )


# ============================================================
# GET SHARED MIXTAPE
# ============================================================

@api_router.get("/mixtapes/{code}")
async def get_mixtape(
    code: str,
):

    try:

        response = (
            supabase
            .table("mixtapes")
            .select("*")
            .eq("code", code)
            .limit(1)
            .execute()
        )

        if not response.data:

            raise HTTPException(
                status_code=404,
                detail="Mixtape not found",
            )

        document = response.data[0]

        return {
            "code": document["code"],
            "mixtape": document["mixtape"],
            "created_at": document["created_at"],
        }

    except HTTPException:
        raise

    except Exception as e:

        logging.exception(
            "Failed to retrieve mixtape"
        )

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}",
        )


# ============================================================
# REGISTER API ROUTER
# ============================================================

app.include_router(
    api_router
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:3000",
        "https://mixtape-4-you-frontend.vercel.app",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# LOGGING
# ============================================================

logging.basicConfig(
    level=logging.INFO,

    format=(
        "%(asctime)s - "
        "%(name)s - "
        "%(levelname)s - "
        "%(message)s"
    ),
)

logger = logging.getLogger(__name__)


# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
async def startup_event():

    logger.info(
        "Mixtape For You API started successfully."
    )

    logger.info(
        "Database: Supabase"
    )


# ============================================================
# SHUTDOWN
# ============================================================

@app.on_event("shutdown")
async def shutdown_event():

    logger.info(
        "Mixtape For You API shutting down."
    )