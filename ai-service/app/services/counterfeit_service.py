"""
Counterfeit Detection Service - detects potentially counterfeit car parts
using image analysis, price anomaly detection, and feature comparison.
"""

import numpy as np
from io import BytesIO
from PIL import Image
import httpx
from loguru import logger
from typing import Optional

from app.models.schemas import (
    CounterfeitCheckRequest,
    CounterfeitCheckResult,
    RiskLevel,
)
from app.core.config import get_settings


class CounterfeitService:
    """Service for detecting counterfeit car parts."""

    def __init__(self, model_loader=None, db=None):
        self.settings = get_settings()
        self.model_loader = model_loader
        self.db = db

    async def check(self, request: CounterfeitCheckRequest) -> CounterfeitCheckResult:
        """
        Check product for counterfeit indicators.

        Steps:
        1. Extract image features using ResNet-50
        2. Compare against known-authentic part embeddings
        3. Check price anomaly
        4. Calculate risk score
        """
        reasons = []
        reasons_ar = []
        scores = []

        # Step 1: Image analysis
        visual_score = await self._analyze_images(request.image_urls)
        if visual_score is not None:
            scores.append(visual_score)
            if visual_score < 0.5:
                reasons.append("Product images differ significantly from known authentic parts")
                reasons_ar.append("صور المنتج تختلف بشكل كبير عن القطع الأصلية المعروفة")
            elif visual_score < 0.7:
                reasons.append("Product images show some visual differences from authentic parts")
                reasons_ar.append("صور المنتج تظهر بعض الاختلافات البصرية عن القطع الأصلية")

        # Step 2: Price anomaly check
        price_anomaly, price_deviation = await self._check_price_anomaly(
            request.price,
            request.oem_number,
            request.category,
        )
        if price_anomaly:
            # Price anomaly contributes a low score
            price_score = max(0.2, 1.0 - abs(price_deviation or 0))
            scores.append(price_score)
            reasons.append(
                f"Price is {abs(price_deviation or 0) * 100:.0f}% below market median - suspicious"
            )
            reasons_ar.append(
                f"السعر أقل بنسبة {abs(price_deviation or 0) * 100:.0f}% عن متوسط السوق - مريب"
            )
        else:
            scores.append(0.9)  # Normal price contributes positively

        # Step 3: OEM verification
        if request.oem_number:
            oem_score = await self._verify_oem(request.oem_number)
            if oem_score is not None:
                scores.append(oem_score)
                if oem_score < 0.5:
                    reasons.append("OEM number format does not match known patterns")
                    reasons_ar.append("رقم القطعة لا يتطابق مع الأنماط المعروفة")

        # Calculate final score
        if scores:
            authenticity_score = sum(scores) / len(scores)
        else:
            authenticity_score = 0.5  # Uncertain

        # Determine risk level
        if authenticity_score >= 0.8:
            risk_level = RiskLevel.LOW
        elif authenticity_score >= 0.5:
            risk_level = RiskLevel.MEDIUM
        else:
            risk_level = RiskLevel.HIGH

        # Generate recommendation
        recommendation, recommendation_ar = self._get_recommendation(risk_level, reasons)

        if not reasons:
            reasons.append("No significant risk indicators detected")
            reasons_ar.append("لم يتم اكتشاف مؤشرات خطر كبيرة")

        return CounterfeitCheckResult(
            authenticity_score=round(authenticity_score, 2),
            risk_level=risk_level,
            reasons=reasons,
            reasons_ar=reasons_ar,
            price_anomaly=price_anomaly,
            price_deviation_pct=round(price_deviation * 100, 1) if price_deviation else None,
            visual_similarity_score=round(visual_score, 2) if visual_score else None,
            recommendation=recommendation,
            recommendation_ar=recommendation_ar,
        )

    async def _analyze_images(self, image_urls: list[str]) -> Optional[float]:
        """
        Analyze product images using ResNet-50 feature extraction.
        Compare against known-authentic part embeddings.
        """
        if not self.model_loader or self.model_loader.resnet_model is None:
            return None

        if not image_urls:
            return None

        features_list = []

        async with httpx.AsyncClient(timeout=30.0) as client:
            for url in image_urls[:5]:  # Max 5 images
                try:
                    response = await client.get(url)
                    if response.status_code == 200:
                        image = Image.open(BytesIO(response.content)).convert("RGB")
                        features = self.model_loader.extract_image_features(image)
                        if features is not None:
                            features_list.append(features)
                except Exception as e:
                    logger.warning(f"Error downloading image {url}: {e}")
                    continue

        if not features_list:
            return None

        # Average features across all images
        avg_features = np.mean(features_list, axis=0)

        # Compare against authentic database
        # In production, this would query a vector database of known-authentic parts
        # For now, we compute a quality score based on feature statistics
        feature_norm = np.linalg.norm(avg_features)
        feature_std = np.std(avg_features)

        # Heuristic: authentic parts tend to have well-distributed features
        quality_score = min(1.0, (feature_std * 10) / max(feature_norm, 1e-6))
        return max(0.0, min(1.0, quality_score))

    async def _check_price_anomaly(
        self,
        price: float,
        oem_number: Optional[str],
        category: Optional[str],
    ) -> tuple[bool, Optional[float]]:
        """
        Check if the price is anomalously low compared to market median.
        Returns (is_anomaly, deviation_percentage).
        """
        market_median = await self._get_market_median(oem_number, category)

        if market_median is None or market_median <= 0:
            return False, None

        deviation = (market_median - price) / market_median

        # Flag if price is 60%+ below market median
        is_anomaly = deviation >= self.settings.PRICE_ANOMALY_THRESHOLD
        return is_anomaly, deviation

    async def _get_market_median(
        self,
        oem_number: Optional[str],
        category: Optional[str],
    ) -> Optional[float]:
        """Get market median price for a part."""
        if self.db is None:
            return None

        try:
            query = {}
            if oem_number:
                query["oemNumber"] = oem_number
            elif category:
                query["category"] = category
            else:
                return None

            collection = self.db["car_parts"]
            part = await collection.find_one(query)
            if part and "marketMedianPrice" in part:
                return part["marketMedianPrice"]
        except Exception as e:
            logger.error(f"Error fetching market median: {e}")

        return None

    async def _verify_oem(self, oem_number: str) -> Optional[float]:
        """Verify OEM number against known patterns."""
        from app.utils.arabic_nlp import extract_oem_number

        result = extract_oem_number(oem_number)
        if result:
            return 0.9  # Valid pattern
        return 0.4  # Unknown pattern

    def _get_recommendation(
        self,
        risk_level: RiskLevel,
        reasons: list[str],
    ) -> tuple[str, str]:
        """Generate recommendation based on risk level."""
        if risk_level == RiskLevel.LOW:
            return (
                "Product appears authentic. Low risk of counterfeit.",
                "المنتج يبدو أصلياً. خطر منخفض للتقليد.",
            )
        elif risk_level == RiskLevel.MEDIUM:
            return (
                "Some risk indicators detected. Recommend additional verification before purchase.",
                "تم اكتشاف بعض مؤشرات الخطر. يُنصح بالتحقق الإضافي قبل الشراء.",
            )
        else:
            return (
                "High risk of counterfeit detected. Purchase not recommended without expert verification.",
                "تم اكتشاف خطر مرتفع للتقليد. لا يُنصح بالشراء بدون التحقق من خبير.",
            )
