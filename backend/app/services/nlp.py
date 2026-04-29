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