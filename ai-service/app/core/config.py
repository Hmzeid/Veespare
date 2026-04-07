from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "VeeParts AI Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # MongoDB
    MONGODB_URI: str = "mongodb://localhost:27017/veeparts_catalog"

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""

    # AI Models
    CLASSIFIER_MODEL: str = "aubmindlab/bert-base-arabertv02"
    IMAGE_MODEL: str = "resnet50"
    CONFIDENCE_THRESHOLD: float = 0.4
    SIMILARITY_THRESHOLD: float = 0.7
    PRICE_ANOMALY_THRESHOLD: float = 0.6

    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_IMAGE_SIZE: int = 10 * 1024 * 1024  # 10MB

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
