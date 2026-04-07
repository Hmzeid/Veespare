"""
Arabic Search Enhancement Service - processes user queries in Egyptian Arabic dialect
for improved car parts search.
"""

from loguru import logger
from typing import Optional

from app.models.schemas import (
    SearchEnhanceRequest,
    SearchEnhanceResult,
    CarMatch,
    PartCategory,
)
from app.utils.arabic_nlp import (
    normalize_arabic,
    correct_typos,
    expand_synonyms,
    detect_car_brand,
    detect_category,
    extract_oem_number,
    get_english_equivalents,
    to_standard_arabic,
)


class SearchService:
    """Service for enhancing Arabic search queries."""

    def __init__(self, model_loader=None):
        self.model_loader = model_loader

    async def enhance_query(self, request: SearchEnhanceRequest) -> SearchEnhanceResult:
        """
        Process and enhance a user search query in Egyptian Arabic.

        Steps:
        1. Normalize Arabic text
        2. Correct common typos
        3. Expand with synonyms
        4. Detect category and car
        5. Map to English equivalents
        """
        query = request.query.strip()

        # Step 1: Normalize
        normalized = normalize_arabic(query)

        # Step 2: Correct typos
        corrected, spelling_corrections = correct_typos(normalized)

        # Step 3: Convert to standard Arabic
        standard_arabic = to_standard_arabic(corrected)

        # Step 4: Expand synonyms
        synonyms = expand_synonyms(corrected)

        # Step 5: Get English equivalents
        english_equivalents = get_english_equivalents(corrected)

        # Step 6: Detect OEM number
        detected_oem = None
        oem_result = extract_oem_number(query)
        if oem_result:
            detected_oem = oem_result[0]

        # Step 7: Detect category
        detected_category = None
        category_result = detect_category(corrected)
        if category_result:
            cat, _ = category_result
            try:
                detected_category = PartCategory(cat)
            except ValueError:
                pass

        # Step 8: Detect car
        detected_car = None
        brand = detect_car_brand(corrected)
        if brand:
            detected_car = CarMatch(
                make=brand,
                model=request.car_model or "All",
                confidence=0.7,
            )

        # Step 9: Build expanded queries
        expanded_queries = self._build_expanded_queries(
            corrected, synonyms, english_equivalents, request
        )

        return SearchEnhanceResult(
            normalized_query=corrected,
            expanded_queries=expanded_queries,
            english_equivalents=english_equivalents,
            standard_arabic=standard_arabic,
            detected_oem=detected_oem,
            detected_category=detected_category,
            detected_car=detected_car,
            spelling_corrections=spelling_corrections,
            synonyms=synonyms[:10],
        )

    def _build_expanded_queries(
        self,
        query: str,
        synonyms: list[str],
        english_terms: list[str],
        request: SearchEnhanceRequest,
    ) -> list[str]:
        """Build expanded query variations for better search recall."""
        expanded = [query]

        # Add car context if provided
        if request.car_make:
            expanded.append(f"{query} {request.car_make}")
            if request.car_model:
                expanded.append(f"{query} {request.car_make} {request.car_model}")
                if request.car_year:
                    expanded.append(
                        f"{query} {request.car_make} {request.car_model} {request.car_year}"
                    )

        # Add top synonyms
        for syn in synonyms[:5]:
            if syn != query and syn not in expanded:
                expanded.append(syn)

        # Add English terms
        for term in english_terms[:3]:
            if term not in expanded:
                expanded.append(term)

        return expanded[:10]  # Max 10 expanded queries
