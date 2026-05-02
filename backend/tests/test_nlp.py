from app.services.nlp import extract_keywords_for_topic


def test_extract_keywords_for_topic_returns_representative_terms():
    topic_text = "Object-Oriented Programming and Inheritance"
    result = extract_keywords_for_topic(
        topic_text,
        "Object-Oriented Programming covers classes, objects, inheritance, encapsulation, and polymorphism.",
    )

    keyword_texts = {keyword["keyword_text"] for keyword in result}

    assert 3 <= len(result) <= 4
    assert "inheritance" in keyword_texts
    assert "programming" in keyword_texts
    assert topic_text.casefold() not in keyword_texts
    assert round(sum(keyword["weight"] for keyword in result), 4) == 1.0


def test_extract_keywords_for_topic_uses_raw_text_context_for_short_topics():
    result = extract_keywords_for_topic(
        "Inheritance",
        "Inheritance covers classes, objects, polymorphism, and encapsulation in software design.",
    )

    keyword_texts = {keyword["keyword_text"] for keyword in result}

    assert 3 <= len(result) <= 4
    assert "inheritance" in keyword_texts
    assert keyword_texts & {"classes", "objects", "polymorphism", "encapsulation"}