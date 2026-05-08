from app.services.nlp import extract_course_info
from app.services.nlp import extract_keywords_for_topic


def test_extract_course_info_from_unc_course_details_table():
    raw_text = """
    ## COURSE DETAILS

    | **Course No.** | MATH311L | **Course Description** |
    |---|---|---|
    | **Course Title** | **STATISTICS** | This course introduces the basic concepts and principles of statistics. It covers how to describe and analyze data using descriptive and inferential statistics, and how to apply probability in understanding data. |
    | **Credit** | 3 Units | |
    | **Contact Hours/Week** | 3 Hours (3 Lecture Hours) | |
    | **Pre-requisites** | MMW | *Legend:* |
    | **Classification/Field** | Additional Mathematics Requirements | *I – An introductory course to an outcome* |
    | **CMO** | CMO No. 25 S. 2015 | *E – A course that strengthens the outcome* |
    | **Syllabus Revision No.** | 1 | *D – A course demonstrating an outcome* |
    | **Year Level** | 3rd year | |
    | **Term** | 1st Sem, A/Y 2025-26 | |
    """

    result = extract_course_info(raw_text)

    assert result == {
        "course_code": "MATH311L",
        "course_title": "STATISTICS",
        "department": "Additional Mathematics Requirements",
        "description": "This course introduces the basic concepts and principles of statistics. It covers how to describe and analyze data using descriptive and inferential statistics, and how to apply probability in understanding data.",
        "semester": "1st Sem, A/Y 2025-26",
    }


def test_extract_course_info_returns_empty_dict_without_course_details():
    result = extract_course_info("Course coverage\nObject-Oriented Programming (3 hrs)")

    assert result == {}


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