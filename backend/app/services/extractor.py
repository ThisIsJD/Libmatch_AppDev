from __future__ import annotations

from pathlib import Path

from docx import Document
from PyPDF2 import PdfReader

SUPPORTED_FILE_TYPES = {"pdf", "docx"}


def extract_text(file_path: str, file_type: str) -> str:
    """Extract normalized plain text from a PDF or DOCX file path."""
    normalized_type = file_type.strip().lower()
    if normalized_type not in SUPPORTED_FILE_TYPES:
        raise ValueError("Unsupported file type. Only PDF and DOCX files are allowed.")

    path = Path(file_path)
    if not path.exists() or not path.is_file():
        raise ValueError("The provided file path does not exist.")

    if normalized_type == "pdf":
        raw_text = _extract_pdf_text(path)
    else:
        raw_text = _extract_docx_text(path)

    cleaned_text = _normalize_text(raw_text)
    if not cleaned_text:
        raise ValueError("No readable text content was found in the uploaded file.")

    return cleaned_text


def _extract_pdf_text(path: Path) -> str:
    """Extract text from all pages of a PDF file."""
    with path.open("rb") as pdf_file:
        reader = PdfReader(pdf_file)
        page_text = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(page_text)


def _extract_docx_text(path: Path) -> str:
    """Extract text from all non-empty paragraphs in a DOCX file."""
    document = Document(str(path))
    paragraphs = [paragraph.text for paragraph in document.paragraphs if paragraph.text.strip()]
    return "\n".join(paragraphs)


def _normalize_text(raw_text: str) -> str:
    """Collapse excessive whitespace while preserving line breaks."""
    lines = [" ".join(line.split()) for line in raw_text.splitlines()]
    non_empty_lines = [line for line in lines if line]
    return "\n".join(non_empty_lines).strip()