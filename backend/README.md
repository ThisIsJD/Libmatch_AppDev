# LibMatch Backend

FastAPI backend for the LibMatch AppDev project. Handles faculty auth, course catalog search, syllabus upload, text extraction, topic suggestions, and topic confirmation.

## Requirements

- Python 3.11+
- PostgreSQL database (Supabase Session Mode connection string, port 5432)
- spaCy English model: `en_core_web_sm`

## Setup

```powershell
cd backend
python -m venv ..\.venv
..\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg2://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
JWT_SECRET=replace-with-a-long-random-secret
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
UPLOAD_DIR=./uploads
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

## Database

```powershell
alembic upgrade head
python seed.py
```

Seed credentials:

- Email: `faculty@libmatch.dev`
- Password: `libmatch123`

## Run

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API docs: `http://127.0.0.1:8000/docs`

## Test

```powershell
python -m pytest tests/ -v
```

## Main Endpoints

- `POST /auth/login`
- `GET /auth/me`
- `GET /courses`
- `GET /courses/search?q=`
- `GET /syllabi`
- `POST /syllabi/upload`
- `GET /syllabi/{id}`
- `GET /syllabi/{id}/topics`
- `PUT /syllabi/{id}/topics`