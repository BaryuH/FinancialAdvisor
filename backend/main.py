from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from api.v1.api import api_router
from core.config import settings

FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed admin user
    try:
        from sqlalchemy.orm import Session
        from db.session import SessionLocal
        from core.security import hash_password
        
        # Import all models to ensure SQLAlchemy mapper knows them
        import models.category
        import models.budget
        import models.goal
        import models.smart_input_draft
        import models.transaction
        from models.user import User
        from repositories.user_repository import UserRepository

        db: Session = SessionLocal()
        try:
            email = "admin1234@gmail.com"
            password = "admin"
            
            # Use UserRepository for consistent email lookup
            user = UserRepository.get_by_email(db, email)
            
            if not user:
                # Create if not exists
                UserRepository.create(
                    db,
                    email=email,
                    password_hash=hash_password(password),
                    display_name="Administrator"
                )
                print(f"Auto-seeded admin user: {email}")
            else:
                # Always ensure the password is 'admin' for test convenience
                user.password_hash = hash_password(password)
                user.is_active = True
                db.add(user)
                db.commit()
                print(f"Admin password synchronized for: {email}")
        finally:
            db.close()
    except Exception as e:
        print(f"Error auto-seeding admin: {e}")
    
    yield
    # Shutdown: Clean up if needed

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    openapi_url="/openapi.json" if settings.debug else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)


def _configure_frontend_static() -> None:
    if not FRONTEND_DIST.is_dir():
        return
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")


_configure_frontend_static()


@app.get("/", tags=["root"], response_model=None)
def root():
    index = FRONTEND_DIST / "index.html"
    if index.is_file():
        return FileResponse(index)
    return {"message": f"{settings.app_name} is running"}


@app.get("/{full_path:path}", tags=["root"], response_model=None)
def spa_fallback(full_path: str):
    """Serve built Vite assets or index.html for client-side routes."""
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not found")

    if not FRONTEND_DIST.is_dir():
        raise HTTPException(status_code=404, detail="Frontend build not found")

    candidate = FRONTEND_DIST / full_path
    if candidate.is_file():
        return FileResponse(candidate)

    index = FRONTEND_DIST / "index.html"
    if index.is_file():
        return FileResponse(index)

    raise HTTPException(status_code=404, detail="Not found")