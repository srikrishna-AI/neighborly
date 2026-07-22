import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.dependencies import get_db
from app.models.category import Category
from app.schemas.category import CategoryResponse
from app.routers import auth, listings, requests, reviews, users, favorites, messages, upload

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed categories if they don't exist
    db = SessionLocal()
    try:
        if db.query(Category).count() == 0:
            default_categories = ["Tools", "Skills", "Outdoors", "Electronics", "Home"]
            for name in default_categories:
                db.add(Category(name=name))
            db.commit()
    except Exception as e:
        print(f"Error seeding categories: {e}")
    finally:
        db.close()
    yield

app = FastAPI(
    title="Neighborly API",
    description="Community platform for lending/borrowing items and skills",
    version="1.0.0",
    lifespan=lifespan
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads directory
UPLOAD_DIR = os.path.join(os.getcwd(), "public", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(auth.router)
app.include_router(listings.router)
app.include_router(requests.router)
app.include_router(reviews.router)
app.include_router(users.router)
app.include_router(favorites.router)
app.include_router(messages.router)
app.include_router(upload.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Neighborly API! Visit /docs for Swagger documentation."}

@app.get("/categories", response_model=list[CategoryResponse], tags=["categories"])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()
