# Cozy Notes

A warm, Figma-driven notes-taking app built for a 72-hour hiring challenge with Django REST Framework and Next.js.

## Stack

- Backend: Python 3.12, Django 5.2 LTS, Django REST Framework, SimpleJWT, PostgreSQL
- Frontend: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Playfair Display, Inter
- Local runtime: Docker Compose
- Workflow: `development` integration branch, `main` final/release branch, PR-based delivery, GitHub Actions CI

## Demo Account

Docker startup automatically seeds a persistent demo account, default categories, and realistic sample notes.

**Easy local demo:** `docker-compose.yml` sets `DEMO_PASSWORD` to **`demo123`** by default (via `DEMO_PASSWORD: ${DEMO_PASSWORD:-demo123}`). You do not need a `backend/.env` file for the stack to start; the backend, Playwright, and browser login all use that same value unless you override it.

```text
DEMO_EMAIL=demo@example.com
DEMO_PASSWORD=demo123   # default in Docker Compose; export a different value to override
```

For a **custom** password, export it before `docker compose up` so Compose, the container, and your shell stay aligned (the `environment` block overrides `DEMO_PASSWORD` from `backend/.env`):

```bash
export DEMO_PASSWORD='your-secret'
docker compose up --build
```

Copy `backend/.env.example` to `backend/.env` when you need extra backend-only settings; `DEMO_PASSWORD` there must not be the template placeholder `<set-a-local-demo-password>` (the seed command rejects it).

The seeded data persists across container restarts because PostgreSQL uses the `postgres_data` Docker volume. The seed command is idempotent, so restarting the backend will not duplicate demo notes.

### Troubleshooting demo login

- **"Invalid email or password"** in the app almost always means the password you type does not match **`DEMO_PASSWORD`** in the backend environment. With Docker, that is **`demo123`** unless you overrode it when starting Compose.
- **`seed_demo_data` fails** on the placeholder: edit `backend/.env` (or your environment) and set a real password.

## Why These Versions

- **Next.js 15**: chosen instead of Next.js 14 because 15.x is currently the safer supported line for a 2026 challenge, while 14.x is no longer the right default.
- **Django 5.2 LTS**: current LTS support window and modern Django baseline.
- **Django ORM over Prisma**: Django owns the API, models, migrations, auth, and permissions. Prisma would add unnecessary cross-stack complexity.
- **SimpleJWT with localStorage**: good speed/clarity tradeoff for a challenge. In production, httpOnly cookies would be the safer token storage choice.
- **shadcn/ui**: used as an accessible component foundation, then fully themed with Tailwind/CSS variables so the UI keeps the hand-crafted warm Figma aesthetic. No default shadcn visual look is intentionally kept.

## Running Locally

### Docker

```bash
docker compose up --build
```

Optional: `cp backend/.env.example backend/.env` if you use backend-only tools or extra env vars. For the default demo user you can rely on Compose's `demo123` password.


Then open:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api

The backend entrypoint runs migrations and `python manage.py seed_demo_data` on every container start.

### Backend Only

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
# .env.example includes DEMO_PASSWORD=demo123 for local seeding; change if needed.
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

Start the Docker stack first so the backend, frontend, PostgreSQL, and seeded demo user are available:

```bash
docker compose up --build
```

Playwright defaults to the same demo password as Docker (**`demo123`**). Override only if you changed `DEMO_PASSWORD` when starting Compose:

```bash
export DEMO_EMAIL=demo@example.com
export DEMO_PASSWORD=demo123
```

Then run:

```bash
cd frontend
npm test
# or
npx playwright test
```

Useful Playwright commands:

```bash
npm run test:e2e
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
