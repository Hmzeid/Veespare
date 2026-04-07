"""
Counterfeit Detection API endpoints.
"""

from fastapi import APIRouter, Request, HTTPException
from loguru import logger

from app.models.schemas import CounterfeitCheckRequest, CounterfeitCheckResult
from app.services.counterfeit_service import CounterfeitService

router = APIRouter()


@router.post("/check", response_model=CounterfeitCheckResult)
async def check_counterfeit(request: Request, data: CounterfeitCheckRequest):
    """
    Check a product for counterfeit indicators.

    Analyzes product images using ResNet-50 feature extraction,
    compares against known-authentic parts, and checks for price anomalies.

    Returns authenticity score (0-1), risk level, and detailed reasons.
    """
    try:
        model_loader = request.app.state.model_loader
        service = CounterfeitService(model_loader=model_loader)
        result = await service.check(data)

        logger.info(
            f"Counterfeit check for product {data.product_id}: "
            f"score={result.authenticity_score}, risk={result.risk_level}"
        )

        return result
    except Exception as e:
        logger.error(f"Counterfeit check error: {e}")
        raise HTTPException(status_code=500, detail=f"Counterfeit check failed: {str(e)}")


@router.post("/batch-check", response_model=list[CounterfeitCheckResult])
async def batch_check_counterfeit(request: Request, items: list[CounterfeitCheckRequest]):
    """
    Check multiple products for counterfeit indicators.
    Maximum 20 items per batch.
    """
    if len(items) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 items per batch")

    model_loader = request.app.state.model_loader
    service = CounterfeitService(model_loader=model_loader)

    results = []
    for item in items:
        try:
            result = await service.check(item)
            results.append(result)
        except Exception as e:
            logger.error(f"Batch counterfeit check error for {item.product_id}: {e}")
            results.append(CounterfeitCheckResult(
                authenticity_score=0.5,
                risk_level="medium",
                reasons=[f"Check failed: {str(e)}"],
                reasons_ar=[f"فشل الفحص: {str(e)}"],
                recommendation="Manual review recommended due to check failure",
                recommendation_ar="يُنصح بالمراجعة اليدوية بسبب فشل الفحص",
            ))

    return results
