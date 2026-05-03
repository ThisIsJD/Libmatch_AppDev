# LibMatch Frontend

React + Vite frontend for the LibMatch AppDev project. Provides faculty login, protected dashboard, syllabus upload modal, topic review, and inline course search.

## Requirements

- Node.js 20+
- Backend API running on `http://localhost:8000`

## Setup

```powershell
cd frontend
npm install
```

Optional `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

If the variable is omitted, the app defaults to `http://localhost:8000`.

## Run

```powershell
npm run dev
```

Open the printed Vite URL, usually `http://localhost:5173`. If that port is occupied, Vite will use the next available port.

Seed login:

- Email: `faculty@libmatch.dev`
- Password: `libmatch123`

## Test

```powershell
npm test
```

## Build

```powershell
npm run build
```

## Notes

- Cataloger and Librarian role tabs are visible placeholders for Capstone.
- Search is debounced at 300ms and calls `GET /courses/search?q=`.
- Chapter matching, citations, and export are disabled AppDev placeholders.
