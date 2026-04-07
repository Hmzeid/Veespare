from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class PartCategory(str, Enum):
    ENGINE_PARTS = "engine_parts"
    BRAKE_SYSTEM = "brake_system"
    ELECTRICAL = "electrical"
    BODY_PARTS = "body_parts"
    FILTERS = "filters"
    SUSPENSION = "suspension"
    COOLING = "cooling"
    TRANSMISSION = "transmission"
    EXHAUST = "exhaust"
    STEERING = "steering"
    FUEL_SYSTEM = "fuel_system"
    INTERIOR = "interior"
    LIGHTING = "lighting"
    OTHER = "other"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ClassificationRequest(BaseModel):
    name: str = Field(..., description="Product name in Arabic or English")
    description: Optional[str] = Field(None, description="Product description")
    oem_number: Optional[str] = Field(None, description="OEM part number")
    price: Optional[float] = Field(None, description="Product price in EGP")
    image_urls: list[str] = Field(default_factory=list, description="Product image URLs")


class CarMatch(BaseModel):
    make: str
    model: str
    confidence: float = Field(ge=0, le=1)


class ClassificationResult(BaseModel):
    category: PartCategory
    category_confidence: float = Field(ge=0, le=1)
    subcategory: Optional[str] = None
    detected_oem_number: Optional[str] = None
    oem_valid: bool = False
    compatible_cars: list[CarMatch] = []
    auto_approved: bool = True
    needs_review: bool = False
    review_reason: Optional[str] = None
    tags: list[str] = []
    tags_ar: list[str] = []


class CounterfeitCheckRequest(BaseModel):
    product_id: str
    oem_number: Optional[str] = None
    price: float = Field(..., description="Product price in EGP")
    category: Optional[str] = None
    image_urls: list[str] = Field(..., min_length=1, description="Product image URLs")


class CounterfeitCheckResult(BaseModel):
    authenticity_score: float = Field(ge=0, le=1)
    risk_level: RiskLevel
    reasons: list[str] = []
    reasons_ar: list[str] = []
    price_anomaly: bool = False
    price_deviation_pct: Optional[float] = None
    visual_similarity_score: Optional[float] = None
    recommendation: str
    recommendation_ar: str


class SearchEnhanceRequest(BaseModel):
    query: str = Field(..., description="User search query (Egyptian Arabic)")
    category: Optional[str] = None
    car_make: Optional[str] = None
    car_model: Optional[str] = None
    car_year: Optional[int] = None


class SearchEnhanceResult(BaseModel):
    normalized_query: str
    expanded_queries: list[str] = []
    english_equivalents: list[str] = []
    standard_arabic: str
    detected_oem: Optional[str] = None
    detected_category: Optional[PartCategory] = None
    detected_car: Optional[CarMatch] = None
    spelling_corrections: list[dict] = []
    synonyms: list[str] = []
