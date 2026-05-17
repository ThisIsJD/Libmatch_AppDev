from __future__ import annotations

import re
from collections import defaultdict
from functools import lru_cache

import spacy
from spacy.language import Language
from spacy.tokens import Doc
from spacy.tokens import Span

SPACY_MODEL_NAME = "en_core_web_sm"
NOUN_CHUNK_WEIGHT = 1.0
ENTITY_WEIGHT = 1.5
MAX_TOPIC_WORDS = 8
MIN_STRUCTURED_TOPICS = 3
KEYWORD_POS_TAGS = {"NOUN", "PROPN", "VERB", "ADJ"}
KEYWORD_WEIGHT_MAP = {
    "PROPN": 2.0,
    "NOUN": 1.5,
    "ADJ": 1.2,
    "VERB": 1.0,
}

# Minimum length for keyword text to filter out short non-informative candidates
MIN_KEYWORD_TEXT_LEN = 3
DEFAULT_MIN_KEYWORDS = 3
DEFAULT_MAX_KEYWORDS = 4
COURSE_INFO_MAX_LENGTHS = {
    "course_code": 20,
    "course_title": 255,
    "department": 100,
    "semester": 20,
}

COURSE_COVERAGE_MARKERS = (
    "course coverage",
    "course outline",
    "course content",
)

COURSE_COVERAGE_END_MARKERS = (
    "learning resources",
    "required references",
    "references",
    "course requirements",
    "course policies",
    "prepared by",
    "checked by",
    "approved by",
    "signature over printed name",
)

TOPIC_WITH_HOURS_PATTERN = re.compile(
    r"(?:[-*•●]+\s*|\d+[.)]\s*)?([A-Za-z][^●•*]{3,140}?)[\s\n]*\(\s*[\d\s.]+\s*hrs?\s*\)?",
    flags=re.IGNORECASE,
)

BULLET_TOPIC_PATTERN = re.compile(
    r"[-*•●]+\s*([A-Za-z][^●•*]{3,140})",
    flags=re.IGNORECASE,
)

LEADING_BULLET_PATTERN = re.compile(r"^(?:[-*•●]+\s*|\d+[.)]\s*)+")

MARKDOWN_FORMATTING_PATTERN = re.compile(r"[*_`]+")
HTML_BREAK_PATTERN = re.compile(r"<br\s*/?>", flags=re.IGNORECASE)
COURSE_DETAILS_START_PATTERN = re.compile(r"course\s+details", flags=re.IGNORECASE)
COURSE_DETAILS_END_PATTERN = re.compile(
    r"course\s+outcomes|course\s+coverage|program\s+outcomes|effectivity",
    flags=re.IGNORECASE,
)
COURSE_CODE_PATTERN = re.compile(
    r"\bcourse\s+no\.?\s*[:|\-]?\s*([A-Z]{2,6}\s*\d{2,6}[A-Z]?)\b",
    flags=re.IGNORECASE,
)
COURSE_TITLE_PATTERN = re.compile(
    r"\bcourse\s+title\s*[:|\-]?\s*([^\n|]+)",
    flags=re.IGNORECASE,
)
COURSE_DESCRIPTION_PATTERN = re.compile(
    r"\bcourse\s+description\s*[:|\-]?\s*(.+?)(?=\n\s*(?:credit|contact\s+hours|pre[-\s]?requisites|classification|cmo|syllabus\s+revision|year\s+level|term)\b|$)",
    flags=re.IGNORECASE | re.DOTALL,
)
COURSE_DEPARTMENT_PATTERN = re.compile(
    r"\bclassification(?:/field)?\s*[:|\-]?\s*([^\n|]+)",
    flags=re.IGNORECASE,
)
COURSE_SEMESTER_PATTERN = re.compile(
    r"\bterm\s*[:|\-]?\s*([^\n|]+)",
    flags=re.IGNORECASE,
)


@lru_cache
def get_nlp() -> Language:
    """Load and cache the spaCy pipeline for repeated extraction calls."""
    try:
        return spacy.load(SPACY_MODEL_NAME, disable=["textcat"])
    except OSError as exc:
        raise RuntimeError(
            "spaCy model 'en_core_web_sm' is not installed. "
            "Run `python -m spacy download en_core_web_sm`."
        ) from exc


def extract_topics(text: str, limit: int = 20) -> list[dict[str, str | float]]:
    """Extract ranked topic suggestions from structured coverage text or spaCy fallback."""
    if limit <= 0:
        return []

    structured_topics = _extract_structured_topics(text)
    structured_threshold = min(MIN_STRUCTURED_TOPICS, limit)
    if len(structured_topics) >= structured_threshold:
        selected_topics = structured_topics[:limit]
        equal_weight = round(1.0 / len(selected_topics), 4)
        return [
            {
                "topic_text": topic_text,
                "weight": equal_weight,
                "source": "extracted",
            }
            for topic_text in selected_topics
        ]

    normalized = _normalize_input_text(text)
    if not normalized:
        return []

    doc = get_nlp()(normalized)
    scores = _collect_topic_scores(doc)
    if not scores:
        return []

    total_score = sum(scores.values())
    ranked_topics = sorted(scores.items(), key=lambda item: (-item[1], item[0]))

    return [
        {
            "topic_text": topic_text,
            "weight": round(score / total_score, 4),
            "source": "extracted",
        }
        for topic_text, score in ranked_topics[:limit]
    ]


def extract_keywords_for_topic(
    topic_text: str,
    raw_text: str | None = None,
    min_keywords: int = DEFAULT_MIN_KEYWORDS,
    max_keywords: int = DEFAULT_MAX_KEYWORDS,
) -> list[dict[str, str | float]]:
    """Extract representative keywords for one topic phrase."""
    if max_keywords <= 0:
        return []

    normalized_topic = _normalize_input_text(topic_text)
    if not normalized_topic:
        return []

    target_minimum = min(max(min_keywords, 0), max_keywords)
    keyword_scores: dict[str, dict[str, str | float]] = {}
    nlp = get_nlp()

    _collect_keyword_scores(nlp(normalized_topic), keyword_scores)

    if len(keyword_scores) < target_minimum and raw_text:
        context_text = _topic_context_text(normalized_topic, raw_text)
        if context_text:
            _collect_keyword_scores(nlp(context_text), keyword_scores)

    ranked_keywords = sorted(
        keyword_scores.values(),
        key=lambda keyword: (-float(keyword["score"]), str(keyword["keyword_text"])),
    )[:max_keywords]
    if not ranked_keywords:
        return []

    total_score = sum(float(keyword["score"]) for keyword in ranked_keywords)
    return [
        {
            "keyword_text": str(keyword["keyword_text"]),
            "weight": round(float(keyword["score"]) / total_score, 4),
        }
        for keyword in ranked_keywords
    ]


def extract_course_info(text: str) -> dict[str, str]:
    """Extract course metadata from a UNC-style course details section."""
    try:
        course_details_text = _slice_course_details(text)
        if not course_details_text:
            return {}

        course_rows = _extract_course_detail_rows(course_details_text)
        extracted_fields = {
            "course_code": _extract_course_code(course_details_text, course_rows),
            "course_title": _extract_course_title(course_details_text, course_rows),
            "description": _extract_course_description(course_details_text, course_rows),
            "department": _extract_course_department(course_details_text, course_rows),
            "semester": _extract_course_semester(course_details_text, course_rows),
        }

        return {
            field_name: field_value
            for field_name, field_value in extracted_fields.items()
            if field_value
        }
    except Exception:
        return {}


def _extract_course_code(text: str, rows: dict[str, list[str]]) -> str | None:
    value = _validated_course_info_value("course_code", _row_value(rows, "course no"))
    if value:
        return value.upper().replace(" ", "")

    match = COURSE_CODE_PATTERN.search(text)
    if not match:
        return None

    value = _validated_course_info_value("course_code", match.group(1))
    return value.upper().replace(" ", "") if value else None


def _extract_course_title(text: str, rows: dict[str, list[str]]) -> str | None:
    value = _row_value(rows, "course title")
    if not value:
        match = COURSE_TITLE_PATTERN.search(text)
        value = match.group(1) if match else None

    return _validated_course_info_value("course_title", value)


def _extract_course_description(text: str, rows: dict[str, list[str]]) -> str | None:
    description_parts: list[str] = []
    description_started = False

    for row in rows.values():
        if row and _normalize_course_label(row[-1]) == "course description":
            description_started = True
            continue

        if not description_started or len(row) < 3:
            continue

        description_cell = row[2]
        if _is_course_description_noise(description_cell):
            continue
        if description_cell:
            description_parts.append(description_cell)

    value = " ".join(description_parts)
    if not value:
        match = COURSE_DESCRIPTION_PATTERN.search(text)
        value = match.group(1) if match else None

    return _clean_course_info_value(value)


def _extract_course_department(text: str, rows: dict[str, list[str]]) -> str | None:
    value = _row_value(rows, "classification/field") or _row_value(rows, "classification")
    if not value:
        match = COURSE_DEPARTMENT_PATTERN.search(text)
        value = match.group(1) if match else None

    return _validated_course_info_value("department", value)


def _extract_course_semester(text: str, rows: dict[str, list[str]]) -> str | None:
    value = _row_value(rows, "term")
    if not value:
        match = COURSE_SEMESTER_PATTERN.search(text)
        value = match.group(1) if match else None

    return _validated_course_info_value("semester", value)


def _slice_course_details(text: str) -> str:
    if not text or not text.strip():
        return ""

    start_match = COURSE_DETAILS_START_PATTERN.search(text)
    if not start_match:
        return ""

    end_match = COURSE_DETAILS_END_PATTERN.search(text, start_match.end())
    end_index = end_match.start() if end_match else len(text)
    return text[start_match.end():end_index]


def _extract_course_detail_rows(text: str) -> dict[str, list[str]]:
    rows: dict[str, list[str]] = {}

    for line in text.splitlines():
        cells = _split_markdown_table_row(line)
        if len(cells) < 2:
            continue

        label = _normalize_course_label(cells[0])
        if label:
            rows[label] = cells

    return rows


def _split_markdown_table_row(line: str) -> list[str]:
    stripped = line.strip()
    if not stripped.startswith("|"):
        return []
    if re.fullmatch(r"\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?", stripped):
        return []

    return [_clean_course_info_value(cell) for cell in stripped.strip("|").split("|")]


def _is_course_description_noise(value: str) -> bool:
    normalized = _normalize_course_label(value)
    return (
        not normalized
        or normalized == "legend"
        or normalized.startswith(("i ", "e ", "d "))
        or "course that" in normalized
        or "introductory course" in normalized
        or "demonstrating an outcome" in normalized
    )


def _row_value(rows: dict[str, list[str]], label: str) -> str | None:
    row = rows.get(_normalize_course_label(label))
    if not row or len(row) < 2:
        return None
    return row[1]


def _normalize_course_label(value: str | None) -> str:
    cleaned = _clean_course_info_value(value)
    cleaned = cleaned.rstrip(".:")
    return cleaned.casefold()


def _validated_course_info_value(field_name: str, value: str | None) -> str | None:
    cleaned = _clean_course_info_value(value)
    if not cleaned:
        return None

    max_length = COURSE_INFO_MAX_LENGTHS.get(field_name)
    if max_length and len(cleaned) > max_length:
        return None

    return cleaned


def _clean_course_info_value(value: str | None) -> str:
    if not value:
        return ""

    cleaned = HTML_BREAK_PATTERN.sub(" ", value)
    cleaned = MARKDOWN_FORMATTING_PATTERN.sub("", cleaned)
    cleaned = " ".join(cleaned.split())
    return cleaned.strip(" -:;|")


def _collect_keyword_scores(
    doc: Doc,
    keyword_scores: dict[str, dict[str, str | float]],
) -> None:
    for token in doc:
        if token.pos_ not in KEYWORD_POS_TAGS:
            continue
        if token.is_stop or token.is_punct or token.is_space or token.like_num:
            continue

        lemma = token.lemma_.casefold().strip()
        if len(lemma) < MIN_KEYWORD_TEXT_LEN or not re.search(r"[a-z]", lemma):
            continue

        display_text = token.text.casefold().strip()
        if not display_text:
            continue

        score = KEYWORD_WEIGHT_MAP.get(token.pos_, 1.0)
        existing = keyword_scores.get(lemma)
        if existing:
            existing["score"] = float(existing["score"]) + score
        else:
            keyword_scores[lemma] = {
                "keyword_text": display_text,
                "score": score,
            }


def _topic_context_text(topic_text: str, raw_text: str, max_sentences: int = 3) -> str:
    normalized_topic = topic_text.casefold()
    if not normalized_topic:
        return ""

    sentence_candidates = re.split(r"(?<=[.!?])\s+|\n+", raw_text)
    matches = [
        sentence.strip()
        for sentence in sentence_candidates
        if normalized_topic in sentence.casefold()
    ]

    return " ".join(matches[:max_sentences])


def _collect_topic_scores(doc: Doc) -> dict[str, float]:
    """Aggregate phrase scores from noun chunks and named entities."""
    scores: defaultdict[str, float] = defaultdict(float)

    for chunk in doc.noun_chunks:
        candidate = _candidate_from_span(chunk)
        if candidate:
            scores[candidate] += NOUN_CHUNK_WEIGHT

    for entity in doc.ents:
        candidate = _candidate_from_span(entity)
        if candidate:
            scores[candidate] += ENTITY_WEIGHT

    return dict(scores)


def _extract_structured_topics(text: str) -> list[str]:
    """Extract topic rows from course coverage using structured patterns."""
    if not text or not text.strip():
        return []

    coverage_text = _slice_course_coverage(text)
    
    # Primary: Extract topics with (X hrs) format
    candidates = [match.group(1) for match in TOPIC_WITH_HOURS_PATTERN.finditer(coverage_text)]
    
    # Secondary: Fallback to bullet lists if hours pattern yields few results
    if len(candidates) < MIN_STRUCTURED_TOPICS:
        candidates.extend([match.group(1) for match in BULLET_TOPIC_PATTERN.finditer(coverage_text)])

    topics: list[str] = []
    seen: set[str] = set()

    for candidate in candidates:
        normalized_topic = _normalize_structured_topic(candidate)
        if not normalized_topic:
            continue

        dedupe_key = normalized_topic.casefold()
        if dedupe_key in seen:
            continue

        seen.add(dedupe_key)
        topics.append(normalized_topic)

    return topics


def _slice_course_coverage(text: str) -> str:
    """Limit parsing to the likely course-coverage section when markers are present."""
    lowered = text.lower()

    start_index = -1
    for marker in COURSE_COVERAGE_MARKERS:
        marker_index = lowered.find(marker)
        if marker_index != -1:
            # Skip the marker line to avoid matching header text as a topic
            header_end = text.find("\n", marker_index)
            if header_end != -1:
                start_index = header_end + 1
            else:
                start_index = marker_index + len(marker)
            break

    if start_index == -1:
        return text

    end_index = len(text)
    for marker in COURSE_COVERAGE_END_MARKERS:
        marker_index = lowered.find(marker, start_index + 1)
        if marker_index != -1:
            end_index = min(end_index, marker_index)

    return text[start_index:end_index]


def _normalize_structured_topic(candidate: str) -> str | None:
    """Clean and validate topic strings extracted from structured regex matches."""
    cleaned = LEADING_BULLET_PATTERN.sub("", candidate)
    cleaned = " ".join(cleaned.split()).strip(" -:;,.")

    if len(cleaned) < 5 or len(cleaned) > 140:
        return None

    if not re.search(r"[A-Za-z]", cleaned):
        return None

    # Filter out section headers misidentified as topics
    if cleaned.lower().startswith(("week ", "module ", "chapter ", "course ")):
        return None

    return cleaned


def _candidate_from_span(span: Span) -> str | None:
    """Convert a spaCy span to a normalized candidate phrase, or None if invalid."""
    tokens = [token for token in span if not token.is_space and not token.is_punct]
    if not tokens:
        return None

    if all(token.is_stop for token in tokens):
        return None

    if all(token.like_num for token in tokens):
        return None

    if len(tokens) > MAX_TOPIC_WORDS:
        return None

    phrase = " ".join(token.text.lower() for token in tokens)
    phrase = " ".join(phrase.split()).strip()
    if len(phrase) < 3:
        return None

    return phrase


def _normalize_input_text(text: str) -> str:
    """Collapse excessive whitespace before NLP processing."""
    return " ".join(text.split())