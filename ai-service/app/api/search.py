"""
Arabic Search Enhancement API endpoints.
"""

from fastapi import APIRouter, Request, HTTPException
from loguru import logger

from app.models.schemas import SearchEnhanceRequest, SearchEnhanceResult
from app.services.search_service import SearchService

router = APIRouter()


@router.post("/enhance", response_model=SearchEnhanceResult)
async def enhance_search(request: Request, data: SearchEnhanceRequest):
    """
    Enhance a search query in Egyptian Arabic dialect.

    Processes the query through:
    1. Arabic text normalization (remove tashkeel, normalize hamza/alef)
    2. Synonym expansion for car parts terminology
    3. Common typo and phonetic variation correction
    4. Dialect-to-standard Arabic mapping
    5. Arabic-to-English term mapping

    Returns enhanced query with expanded search terms.
    """
    try:
        model_loader = request.app.state.model_loader
        service = SearchService(model_loader=model_loader)
        result = await service.enhance_query(data)

        logger.info(
            f"Enhanced query '{data.query}' -> normalized: '{result.normalized_query}', "
            f"expansions: {len(result.expanded_queries)}"
        )

        return result
    except Exception as e:
        logger.error(f"Search enhancement error: {e}")
        raise HTTPException(status_code=500, detail=f"Search enhancement failed: {str(e)}")


@router.post("/batch-enhance", response_model=list[SearchEnhanceResult])
async def batch_enhance_search(request: Request, queries: list[SearchEnhanceRequest]):
    """
    Enhance multiple search queries in batch.
    Maximum 20 queries per batch.
    """
    if len(queries) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 queries per batch")

    model_loader = request.app.state.model_loader
    service = SearchService(model_loader=model_loader)

    results = []
    for query in queries:
        try:
            result = await service.enhance_query(query)
            results.append(result)
        except Exception as e:
            logger.error(f"Batch enhancement error for '{query.query}': {e}")
            results.append(SearchEnhanceResult(
                normalized_query=query.query,
                standard_arabic=query.query,
            ))

    return results
