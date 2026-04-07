"""
Arabic NLP utilities for Egyptian dialect processing.
Handles text normalization, tashkeel removal, hamza/alef normalization,
synonym expansion, and typo correction for car parts terminology.
"""

import re
from typing import Optional


# Tashkeel (diacritics) characters
TASHKEEL = re.compile(r'[\u0617-\u061A\u064B-\u0652]')

# Arabic-specific normalizations
ALEF_VARIANTS = re.compile(r'[إأآا]')
TAA_MARBUTA = re.compile(r'ة')
ALEF_MAKSURA = re.compile(r'ى')
WAW_HAMZA = re.compile(r'ؤ')
YAA_HAMZA = re.compile(r'ئ')

# Egyptian Arabic car parts synonyms
PARTS_SYNONYMS: dict[str, list[str]] = {
    "فلتر": ["فلتر زيت", "فلتر هواء", "فلتر بنزين", "فلتر مكيف", "oil filter", "air filter"],
    "فلتر زيت": ["فلتر", "oil filter", "اويل فلتر"],
    "فلتر هواء": ["فلتر", "air filter", "اير فلتر"],
    "تيل فرامل": ["تيل", "فحمة فرامل", "بريك باد", "brake pad", "brake pads"],
    "ديسك فرامل": ["ديسك", "طنبورة", "brake disc", "brake rotor"],
    "بطارية": ["بطاريه", "اكيو", "بطارية سيارة", "car battery", "battery"],
    "بوجيهات": ["بوجي", "شمعة اشعال", "spark plug", "بوجيه"],
    "سير كاتينة": ["سير توقيت", "سير كام", "timing belt", "timing chain"],
    "رادياتير": ["رادياتور", "ردياتير", "مشع", "radiator"],
    "كمبروسر": ["كمبروسور", "ضاغط مكيف", "compressor", "ac compressor"],
    "دينامو": ["مولد كهرباء", "alternator", "الترناتور"],
    "مارش": ["بادئ حركة", "سلف", "starter", "starter motor"],
    "كلتش": ["دبرياج", "قابض", "clutch"],
    "علبة دركسيون": ["علبة فرمان", "steering box", "steering rack"],
    "مقص": ["مقص سفلي", "مقص علوي", "control arm", "ذراع تعليق"],
    "مساعد": ["مساعدين", "شوك ابسوربر", "shock absorber", "amortizer"],
    "كوالين": ["جلد فرامل", "brake shoe"],
    "طرمبة بنزين": ["مضخة وقود", "fuel pump", "طلمبة بنزين"],
    "طرمبة مياه": ["مضخة مياه", "water pump", "طلمبة ماء"],
    "حساس اكسجين": ["اكسجين سنسور", "oxygen sensor", "o2 sensor", "حساس شكمان"],
    "ثرموستات": ["بلف حرارة", "thermostat"],
    "جوان وش سلندر": ["جوان كولاس", "head gasket", "حشوة رأس المحرك"],
    "سير مجموعة": ["سير مروحة", "drive belt", "v-belt", "serpentine belt"],
    "بلى": ["رولمان بلي", "bearing", "بيرنج"],
    "كبالن": ["وصلة هوموسنتك", "cv joint", "كبلن"],
}

# Common Egyptian Arabic typos/phonetic variations for car parts
TYPO_CORRECTIONS: dict[str, str] = {
    "فلطر": "فلتر",
    "فيلتر": "فلتر",
    "بريك": "فرامل",
    "بريكات": "فرامل",
    "ردياتور": "رادياتير",
    "ردياتر": "رادياتير",
    "كومبريسور": "كمبروسر",
    "كومبريسر": "كمبروسر",
    "الترنيتر": "دينامو",
    "سيلف": "مارش",
    "ديبرياج": "كلتش",
    "دبرياش": "كلتش",
    "شوك ابصوربر": "مساعد",
    "اموريتزر": "مساعد",
    "ترموستات": "ثرموستات",
    "تيرموستات": "ثرموستات",
    "جوان كولاص": "جوان وش سلندر",
    "بلي": "بلى",
    "بيرينج": "بلى",
    "كوبالن": "كبالن",
}

# Car brand mappings (Egyptian dialect → standard)
CAR_BRAND_MAPPINGS: dict[str, str] = {
    "تويوتا": "Toyota",
    "هيونداي": "Hyundai",
    "هيونداى": "Hyundai",
    "كيا": "Kia",
    "نيسان": "Nissan",
    "شيفروليه": "Chevrolet",
    "شيفرولية": "Chevrolet",
    "بي ام دبليو": "BMW",
    "بي ام": "BMW",
    "مرسيدس": "Mercedes-Benz",
    "مرسيدس بنز": "Mercedes-Benz",
    "فولكس فاجن": "Volkswagen",
    "فولكس": "Volkswagen",
    "اوبل": "Opel",
    "فيات": "Fiat",
    "بيجو": "Peugeot",
    "رينو": "Renault",
    "سوزوكي": "Suzuki",
    "ميتسوبيشي": "Mitsubishi",
    "هوندا": "Honda",
    "سكودا": "Skoda",
    "جيلي": "Geely",
    "شيري": "Chery",
    "بروتون": "Proton",
    "لادا": "Lada",
    "دايو": "Daewoo",
    "ام جي": "MG",
    "سيات": "Seat",
    "جيب": "Jeep",
}

# Category keywords mapping
CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "engine_parts": [
        "محرك", "موتور", "بيستن", "شنبر", "عمود كرنك", "عمود كامات",
        "صبابات", "بلوف", "سلندر", "جوان", "بوجي", "بوجيهات",
        "حقن", "انجكشن", "بخاخ",
    ],
    "brake_system": [
        "فرامل", "تيل", "ديسك", "طنبورة", "كوالين", "هوب",
        "ماستر فرامل", "خرطوش فرامل", "اسطوانة فرامل",
    ],
    "electrical": [
        "كهرباء", "دينامو", "مارش", "بطارية", "سلك", "اسلاك",
        "كويل", "حساس", "سنسور", "كمبيوتر", "ريليه", "فيوز",
        "لمبة", "لمبات",
    ],
    "body_parts": [
        "سبويلر", "بامبر", "صدام", "شمعة", "فانوس", "كابوت",
        "شنطة", "باب", "جناح", "مرايا", "زجاج", "شبك",
    ],
    "filters": [
        "فلتر", "فلاتر", "فلتر زيت", "فلتر هواء", "فلتر بنزين",
        "فلتر مكيف", "فلتر ديزل",
    ],
    "suspension": [
        "تعليق", "مقص", "مساعد", "مساعدين", "ياي", "سوست",
        "جلبة", "جلب", "كاوتش", "عمود موازنة", "مقصات",
    ],
    "cooling": [
        "تبريد", "رادياتير", "مروحة", "ثرموستات", "طرمبة مياه",
        "خرطوش مياه", "مشع",
    ],
    "transmission": [
        "فتيس", "جير", "ناقل حركة", "كلتش", "دبرياج", "كبالن",
        "عكس", "كارونة", "اوتوماتيك",
    ],
}

# OEM number patterns by manufacturer
OEM_PATTERNS = [
    (r'\b\d{5}-\d{5}\b', "Toyota/Lexus"),
    (r'\b\d{2}\.\d{3}\.\d{3}\.\d{3}\b', "BMW"),
    (r'\bA\d{3}\s?\d{3}\s?\d{2}\s?\d{2}\b', "Mercedes-Benz"),
    (r'\b\d{3}\s?\d{3}\s?\d{3}\b', "Volkswagen/Audi"),
    (r'\b[A-Z]{2}\d{4}-[A-Z0-9]{5,6}\b', "Hyundai/Kia"),
    (r'\b\d{8,10}\b', "Generic OEM"),
    (r'\b[A-Z]{1,3}-?\d{4,8}\b', "Aftermarket"),
]


def remove_tashkeel(text: str) -> str:
    """Remove Arabic diacritics (tashkeel)."""
    return TASHKEEL.sub('', text)


def normalize_arabic(text: str) -> str:
    """Normalize Arabic text: remove tashkeel, normalize alef/hamza variants."""
    text = remove_tashkeel(text)
    text = ALEF_VARIANTS.sub('ا', text)
    text = TAA_MARBUTA.sub('ه', text)
    text = ALEF_MAKSURA.sub('ي', text)
    text = WAW_HAMZA.sub('و', text)
    text = YAA_HAMZA.sub('ي', text)
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def correct_typos(text: str) -> tuple[str, list[dict]]:
    """Correct common typos in Egyptian Arabic car parts terms."""
    corrections = []
    words = text.split()
    corrected_words = []

    for word in words:
        normalized = normalize_arabic(word)
        if normalized in TYPO_CORRECTIONS:
            correction = TYPO_CORRECTIONS[normalized]
            corrections.append({
                "original": word,
                "corrected": correction,
                "type": "typo_correction",
            })
            corrected_words.append(correction)
        else:
            corrected_words.append(word)

    return ' '.join(corrected_words), corrections


def expand_synonyms(text: str) -> list[str]:
    """Expand query with synonyms for car parts terms."""
    expanded = []
    normalized = normalize_arabic(text)

    for term, synonyms in PARTS_SYNONYMS.items():
        term_normalized = normalize_arabic(term)
        if term_normalized in normalized or normalized in term_normalized:
            expanded.extend(synonyms)

    # Also check if any synonym matches
    for term, synonyms in PARTS_SYNONYMS.items():
        for syn in synonyms:
            syn_normalized = normalize_arabic(syn) if any('\u0600' <= c <= '\u06FF' for c in syn) else syn.lower()
            text_check = normalized if any('\u0600' <= c <= '\u06FF' for c in syn) else text.lower()
            if syn_normalized in text_check:
                expanded.append(term)
                expanded.extend(s for s in synonyms if s != syn)
                break

    return list(set(expanded))


def detect_car_brand(text: str) -> Optional[str]:
    """Detect car brand from Arabic text."""
    normalized = normalize_arabic(text)
    for arabic_name, english_name in CAR_BRAND_MAPPINGS.items():
        if normalize_arabic(arabic_name) in normalized:
            return english_name
    # Check English names
    text_lower = text.lower()
    for english_name in CAR_BRAND_MAPPINGS.values():
        if english_name.lower() in text_lower:
            return english_name
    return None


def detect_category(text: str) -> Optional[tuple[str, float]]:
    """Detect part category from text using keyword matching."""
    normalized = normalize_arabic(text.lower())
    scores: dict[str, int] = {}

    for category, keywords in CATEGORY_KEYWORDS.items():
        score = 0
        for keyword in keywords:
            keyword_normalized = normalize_arabic(keyword)
            if keyword_normalized in normalized:
                score += len(keyword_normalized)  # Longer matches score higher
        if score > 0:
            scores[category] = score

    if not scores:
        return None

    best_category = max(scores, key=scores.get)  # type: ignore
    total_score = sum(scores.values())
    confidence = scores[best_category] / max(total_score, 1)
    return best_category, min(confidence, 1.0)


def extract_oem_number(text: str) -> Optional[tuple[str, str]]:
    """Extract OEM part number from text using pattern matching."""
    for pattern, manufacturer in OEM_PATTERNS:
        match = re.search(pattern, text)
        if match:
            return match.group(), manufacturer
    return None


def get_english_equivalents(text: str) -> list[str]:
    """Map Arabic car parts terms to English equivalents."""
    equivalents = []
    normalized = normalize_arabic(text)

    for term, synonyms in PARTS_SYNONYMS.items():
        term_normalized = normalize_arabic(term)
        if term_normalized in normalized:
            for syn in synonyms:
                if all('\u0600' > c or c > '\u06FF' for c in syn):
                    equivalents.append(syn)

    return list(set(equivalents))


def to_standard_arabic(text: str) -> str:
    """Convert Egyptian dialect to standard Arabic."""
    # Common Egyptian → MSA mappings for car context
    dialect_mappings = {
        "عربية": "سيارة",
        "موتور": "محرك",
        "كاوتش": "إطار",
        "كفر": "إطار",
        "فتيس": "ناقل حركة",
        "دركسيون": "مقود",
        "تابلوه": "لوحة قيادة",
        "شكمان": "عادم",
        "كالون": "قفل",
    }

    result = text
    for dialect, standard in dialect_mappings.items():
        result = result.replace(dialect, standard)

    return result
