from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger

from app.core.config import get_settings
from app.api import classifier, counterfeit, search
from app.services.model_loader import ModelLoader


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    # Load AI models on startup
    model_loader = ModelLoader()
    await model_loader.load_models()
    app.state.model_loader = model_loader
    logger.info("AI models loaded successfully")

    yield

    logger.info("Shutting down AI service")


app = FastAPI(
    title="VeeParts AI Service",
    description="AI-powered car parts classification, counterfeit detection, and Arabic search enhancement",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(classifier.router, prefix="/api/v1/classify", tags=["Parts Classifier"])
app.include_router(counterfeit.router, prefix="/api/v1/counterfeit", tags=["Counterfeit Detection"])
app.include_router(search.router, prefix="/api/v1/search", tags=["Arabic Search"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "veeparts-ai"}
