from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.v1.api import api_router
from core.config import settings

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/", tags=["root"])
def root() -> dict[str, str]:
    return {
        "message": f"{settings.app_name} is running"
    }