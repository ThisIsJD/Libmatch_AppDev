from __future__ import annotations

import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

ALLOWED_FILE_TYPES: dict[str, str] = {
    ".pdf": "pdf",
    ".docx": "docx",
}


def infer_file_type(filename: str) -> str:
    """Infer a supported file type from the uploaded filename."""
    suffix = Path(filename).suffix.lower()
    file_type = ALLOWED_FILE_TYPES.get(suffix)
    if file_type is None:
        raise ValueError("Unsupported file type. Only PDF and DOCX files are allowed.")
    return file_type


def save_upload_file(upload_file: UploadFile, upload_dir: str) -> tuple[str, str]:
    """Save an uploaded file to local disk and return (stored_path, original_name)."""
    original_name = (upload_file.filename or "").strip()
    if not original_name:
        raise ValueError("Uploaded file is missing a filename.")

    file_type = infer_file_type(original_name)

    target_dir = Path(upload_dir)
    target_dir.mkdir(parents=True, exist_ok=True)

    stored_name = f"{uuid4().hex}.{file_type}"
    stored_path = target_dir / stored_name

    upload_file.file.seek(0)
    with stored_path.open("wb") as destination:
        shutil.copyfileobj(upload_file.file, destination)

    return stored_path.as_posix(), original_name