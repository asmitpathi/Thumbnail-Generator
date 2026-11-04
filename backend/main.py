from contextlib import asynccontextmanager
from fastapi import FastAPI
from database import create_tables
from fastapi.middleware.cors import CORSMiddleware
from routes import router
from config import FRONTEND_URL

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield

app= FastAPI(
    title= "YouTube Thumbnail Generator API",
    lifespan= lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"],
)

app.include_router(router)


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok"}
