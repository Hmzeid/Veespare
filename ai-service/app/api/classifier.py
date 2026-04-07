"""
Parts Classifier API endpoints.
"""

from fastapi import APIRouter, Request, HTTPException
from loguru import logger

from app.models.schemas import ClassificationRequest, ClassificationResult
from app.services.classifier_service import ClassifierService

router = APIRouter()


@router.post("/", response_model=ClassificationResult)
async def classify_part(request: Request, data: ClassificationRequest):
    """
    Classify a car part product.

    Given product name (Arabic/English), optional images and OEM number,
    returns category classification, compatible cars, and confidence score.
    Auto-rejects if confidence < 0.4.
    """
    try:
        model_loader = request.app.state.model_loader
        service = ClassifierService(model_loader=model_loader)
        result = await service.classify(data)

        logger.info(
            f"Classified '{data.name}' -> {result.category} "
            f"(confidence: {result.category_confidence})"
        )

        return result
    except Exception as e:
        logger.error(f"Classification error: {e}")
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")


@router.post("/batch", response_model=list[ClassificationResult])
async def classify_batch(request: Request, items: list[ClassificationRequest]):
    """
    Classify multiple car parts in batch.
    Maximum 50 items per batch.
    """
    if len(items) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 items per batch")

    model_loader = request.app.state.model_loader
    service = ClassifierService(model_loader=model_loader)

    results = []
    for item in items:
        try:
            result = await service.classify(item)
            results.append(result)
        except Exception as e:
            logger.error(f"Batch classification error for '{item.name}': {e}")
            # Return a default result for failed items
            results.append(ClassificationResult(
                category="other",
                category_confidence=0.0,
                needs_review=True,
                review_reason=f"Classification failed: {str(e)}",
                auto_approved=False,
            ))

    return results
