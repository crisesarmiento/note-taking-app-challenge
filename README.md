# Cozy Notes

A warm, Figma-driven notes-taking app built for a 72-hour hiring challenge with Django REST Framework and Next.js.

## Quick Start

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000) and sign in with **demo@example.com** / **demo123**. No `.env` files or manual environment setup is required.

The backend seeds the demo user, default categories, and sample notes on startup. Data persists in the `postgres_data` Docker volume between restarts.

## Stack

- Backend: Python 3.12, Django 5.2 LTS, Django REST Framework, SimpleJWT, PostgreSQL
- Frontend: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Playfair Display, Inter
- Local runtime: Docker Compose
- Workflow: `development` integration branch, `main` final/release branch, PR-based delivery, GitHub Actions CI

## Why These Versions

- **Next.js 15**: chosen instead of Next.js 14 because 15.x is currently the safer supported line for a 2026 challenge, while 14.x is no longer the right default.
- **Django 5.2 LTS**: current LTS support window and modern Django baseline.
- **Django ORM over Prisma**: Django owns the API, models, migrations, auth, and permissions. Prisma would add unnecessary cross-stack complexity.
- **SimpleJWT with localStorage**: good speed/clarity tradeoff for a challenge. In production, httpOnly cookies would be the safer token storage choice.
- **shadcn/ui**: used as an accessible component foundation, then fully themed with Tailwind/CSS variables so the UI keeps the hand-crafted warm Figma aesthetic. No default shadcn visual look is intentionally kept.

## Running Locally

Use **Quick Start** for the full stack. Reference URLs:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api

The backend entrypoint runs migrations and `python manage.py seed_demo_data` on every container start.

### Backend only (no Docker)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_demo_data
python manage.py runserver
```

### Frontend Only

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## API Overview

```text
POST   /api/auth/register/          create user, seed categories, return JWTs
POST   /api/auth/token/             email/password login, return JWTs
POST   /api/auth/token/refresh/     refresh access token

GET    /api/categories/             list user categories with note_count
GET    /api/notes/                  list user notes, supports ?category=<id>
POST   /api/notes/                  create empty note, defaults to first category
GET    /api/notes/<id>/             retrieve note
PATCH  /api/notes/<id>/             update title/content/category_id
DELETE /api/notes/<id>/             delete note
```

## Product Decisions

- Registration seeds three MVP categories: Random Thoughts, School, Personal.
- `Drama` exists in the Figma dropdown, but the video/spec confirms three categories, so it is not seeded for MVP.
- The voice/headphones affordance in Figma is skipped because it is not in the written challenge requirements.
- `+ New Note` immediately POSTs an empty note, then redirects to `/notes/[id]`.
- The note editor uses borderless textareas styled as inline editing surfaces inside the colored note card.
- Category changes are optimistic: the card color changes immediately while the PATCH request runs.

## GitHub Workflow

Recommended branch model:

```text
feature/* -> development -> main
```

Suggested issue slices:

1. Backend API and auth
2. Frontend foundation, shadcn/ui, and design system
3. Notes list and editor
4. Docker, CI, tests, README, and final polish

Recommended branch protection settings for a team:

- Require PRs into `development` and `main`
- Require CI passing before merge
- Disable force pushes on protected branches
- Keep `main` as the final/release branch only

## Validation

### Backend Unit Tests and Coverage

```bash
cd backend
pip install -r requirements-dev.txt
pytest --cov=notes --cov-report=term-missing --cov-fail-under=80
```

### Frontend Checks

```bash
cd frontend
npm run lint
npm run typecheck
npm run build
```

### Playwright E2E Tests

With the Docker stack running (**Quick Start**), the tests use the same demo account (**demo@example.com** / **demo123**) by default.

```bash
cd frontend
npm run test:e2e
```

Other useful commands:

```bash
npm run test:e2e:ui
PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npx playwright install chromium
```

## AI Tools Used

AI was used to accelerate planning, architecture tradeoff analysis, and implementation scaffolding:

- Extracted and organized the Figma/UI requirements into implementation-ready sections.
- Compared framework/version choices against challenge risk and support windows.
- Generated Django REST Framework models, serializers, viewsets, tests, and CI structure.
- Generated Next.js App Router components, shadcn/ui-themed primitives, and Tailwind design tokens.
- Helped document tradeoffs clearly for reviewers.

Human decisions kept the implementation intentionally scoped: no Prisma, no second auth provider, no voice feature, no deployment dependency, and no over-engineered state management.

## Known Tradeoffs

- JWTs are stored in `localStorage` for speed; production should prefer httpOnly cookies.
- The frontend uses client-side auth guards because Next.js middleware cannot read `localStorage`.
- The UI uses local Figma-exported PNGs rather than live Figma API access.
- No Vercel production deployment is required; local Docker reproducibility is prioritized.
