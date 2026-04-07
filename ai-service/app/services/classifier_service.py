"""
Parts Classifier Service - classifies car parts using Arabic NLP and AI.
"""

from loguru import logger
from typing import Optional

from app.models.schemas import (
    ClassificationRequest,
    ClassificationResult,
    CarMatch,
    PartCategory,
)
from app.utils.arabic_nlp import (
    normalize_arabic,
    detect_category,
    detect_car_brand,
    extract_oem_number,
    expand_synonyms,
    get_english_equivalents,
    CATEGORY_KEYWORDS,
    CAR_BRAND_MAPPINGS,
)
from app.core.config import get_settings


class ClassifierService:
    """Service for classifying car parts from product names, descriptions, and images."""

    def __init__(self, model_loader=None):
        self.settings = get_settings()
        self.model_loader = model_loader

    async def classify(self, request: ClassificationRequest) -> ClassificationResult:
        """
        Classify a car part product.

        Steps:
        1. Extract text features using Arabic NLP
        2. Classify into category
        3. Identify compatible car makes/models
        4. Extract or validate OEM number
        5. Calculate confidence scores
        6. Auto-reject if confidence < 0.4
        """
        combined_text = f"{request.name} {request.description or ''}"
        normalized_text = normalize_arabic(combined_text)

        # Step 1: Detect category
        category_result = detect_category(combined_text)
        if category_result:
            category, confidence = category_result
        else:
            category = "other"
            confidence = 0.3

        # Step 2: Use AI model for better classification if available
        if self.model_loader and self.model_loader.bert_model is not None:
            ai_confidence = await self._classify_with_bert(combined_text, category)
            if ai_confidence is not None:
                # Blend rule-based and AI confidence
                confidence = 0.4 * confidence + 0.6 * ai_confidence

        # Step 3: Detect compatible cars
        compatible_cars = self._detect_compatible_cars(combined_text)

        # Step 4: Handle OEM number
        detected_oem = None
        oem_valid = False
        if request.oem_number:
            oem_valid = self._validate_oem(request.oem_number)
            detected_oem = request.oem_number
        else:
            oem_result = extract_oem_number(combined_text)
            if oem_result:
                detected_oem, _ = oem_result
                oem_valid = True

        # Step 5: Generate tags
        tags_en = get_english_equivalents(combined_text)
        synonyms = expand_synonyms(request.name)
        tags_ar = [s for s in synonyms if any('\u0600' <= c <= '\u06FF' for c in s)]
        tags_en.extend([s for s in synonyms if not any('\u0600' <= c <= '\u06FF' for c in s)])

        # Step 6: Determine auto-approval
        needs_review = confidence < self.settings.CONFIDENCE_THRESHOLD
        review_reason = None
        if needs_review:
            review_reason = f"Low classification confidence: {confidence:.2f}. Manual review required."

        try:
            part_category = PartCategory(category)
        except ValueError:
            part_category = PartCategory.OTHER

        return ClassificationResult(
            category=part_category,
            category_confidence=round(confidence, 2),
            subcategory=self._detect_subcategory(normalized_text, category),
            detected_oem_number=detected_oem,
            oem_valid=oem_valid,
            compatible_cars=compatible_cars,
            auto_approved=not needs_review,
            needs_review=needs_review,
            review_reason=review_reason,
            tags=list(set(tags_en)),
            tags_ar=list(set(tags_ar)),
        )

    async def _classify_with_bert(self, text: str, fallback_category: str) -> Optional[float]:
        """Use AraBERT to improve classification confidence."""
        if not self.model_loader:
            return None

        try:
            embedding = self.model_loader.get_text_embedding(text)
            if embedding is None:
                return None

            # Compare text embedding against category keyword embeddings
            best_score = 0.0
            for cat, keywords in CATEGORY_KEYWORDS.items():
                for keyword in keywords[:3]:  # Use top 3 keywords per category
                    kw_embedding = self.model_loader.get_text_embedding(keyword)
                    if kw_embedding is not None:
                        score = self.model_loader.compute_cosine_similarity(embedding, kw_embedding)
                        if cat == fallback_category:
                            best_score = max(best_score, score)

            return min(max(best_score, 0.0), 1.0)
        except Exception as e:
            logger.error(f"BERT classification error: {e}")
            return None

    def _detect_compatible_cars(self, text: str) -> list[CarMatch]:
        """Detect compatible car brands and models from text."""
        cars = []
        brand = detect_car_brand(text)
        if brand:
            # Try to detect model
            model = self._detect_car_model(text, brand)
            cars.append(CarMatch(
                make=brand,
                model=model or "All Models",
                confidence=0.8 if model else 0.5,
            ))
        return cars

    def _detect_car_model(self, text: str, brand: str) -> Optional[str]:
        """Detect specific car model from text."""
        model_mappings = {
            "Toyota": {
                "كورولا": "Corolla", "كامري": "Camry", "ياريس": "Yaris",
                "فورتشنر": "Fortuner", "هايلكس": "Hilux", "لاندكروزر": "Land Cruiser",
                "برادو": "Prado", "راف فور": "RAV4", "افانزا": "Avanza",
            },
            "Hyundai": {
                "النترا": "Elantra", "توسان": "Tucson", "سنتافي": "Santa Fe",
                "اكسنت": "Accent", "فيرنا": "Verna", "كريتا": "Creta",
                "ماتريكس": "Matrix", "جيتز": "Getz",
            },
            "Chevrolet": {
                "لانوس": "Lanos", "اوبترا": "Optra", "افيو": "Aveo",
                "كروز": "Cruze", "ماليبو": "Malibu", "كابتيفا": "Captiva",
            },
            "Nissan": {
                "صني": "Sunny", "سنترا": "Sentra", "تيدا": "Tiida",
                "قشقاي": "Qashqai", "جوك": "Juke", "باترول": "Patrol",
            },
            "Kia": {
                "سيراتو": "Cerato", "سبورتاج": "Sportage", "بيكانتو": "Picanto",
                "ريو": "Rio", "كارنفال": "Carnival", "سورينتو": "Sorento",
            },
        }

        if brand in model_mappings:
            normalized = normalize_arabic(text)
            for ar_model, en_model in model_mappings[brand].items():
                if normalize_arabic(ar_model) in normalized or en_model.lower() in text.lower():
                    return en_model

        return None

    def _validate_oem(self, oem: str) -> bool:
        """Validate OEM number format."""
        result = extract_oem_number(oem)
        return result is not None

    def _detect_subcategory(self, text: str, category: str) -> Optional[str]:
        """Detect subcategory within the main category."""
        subcategories = {
            "filters": {
                "زيت": "oil_filter",
                "هواء": "air_filter",
                "بنزين": "fuel_filter",
                "وقود": "fuel_filter",
                "مكيف": "cabin_filter",
                "ديزل": "diesel_filter",
            },
            "brake_system": {
                "تيل": "brake_pads",
                "ديسك": "brake_disc",
                "كوالين": "brake_shoes",
                "هوب": "brake_drum",
                "ماستر": "master_cylinder",
                "خرطوش": "brake_hose",
            },
            "electrical": {
                "دينامو": "alternator",
                "مارش": "starter",
                "بطاري": "battery",
                "حساس": "sensor",
                "كويل": "ignition_coil",
                "بوجي": "spark_plug",
            },
        }

        if category in subcategories:
            for keyword, subcat in subcategories[category].items():
                if keyword in text:
                    return subcat

        return None
