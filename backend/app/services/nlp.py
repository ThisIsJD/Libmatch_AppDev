from __future__ import annotations

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
    """Extract ranked topic suggestions from free text using noun chunks and entities."""
    if limit <= 0:
        return []

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