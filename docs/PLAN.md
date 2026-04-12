# Notes Taking App Challenge Plan

## Summary

- Build a polished monorepo notes app with `backend/` Django REST Framework and `frontend/` Next.js.
- Use **Next.js 15** for the frontend because 15.x is currently Maintenance LTS, while 14.x is unsupported per the [Next.js Support Policy](https://nextjs.org/support-policy).
- Use **Django 5.2 LTS** for the backend because it is the current Django LTS line with support through April 2028 per [Django supported versions](https://www.djangoproject.com/download/).
- Use **PostgreSQL + Django ORM**, not Prisma. Django should own the models, migrations, auth, and API.
- Use **DRF SimpleJWT + client-side auth guard**.
- Use **shadcn/ui as the frontend component foundation**, but fully theme every component so the app feels hand-crafted and matches the warm Figma aesthetic.
- Skip the voice/headphones feature for MVP because it appears in Figma but is not part of the core challenge spec.

## Architecture And Stack

- Repository structure:

```text
backend/
frontend/
.github/
docker-compose.yml
README.md
```

- Backend:

```text
Python 3.12
Django 5.2 LTS
Django REST Framework
djangorestframework-simplejwt
django-cors-headers
psycopg[binary]
python-decouple or django-environ
PostgreSQL 16 via Docker Compose
```

- Frontend:

```text
Next.js 15 App Router
TypeScript
Tailwind CSS
shadcn/ui
Playfair Display via next/font/google
Inter via next/font/google
axios
date-fns
lodash.debounce
```

- shadcn/ui setup:

```bash
npx shadcn@latest init -d --base radix
npx shadcn@latest add button card dropdown-menu input textarea label
```

- Primary local command:

```bash
docker-compose up --build
```

## Product Scope

- Routes:

```text
/                   -> client redirect to /notes if authed, otherwise /auth/signup
/auth/signup        -> signup page
/auth/login         -> login page
/notes              -> notes list with sidebar, empty state, grid, category filter
/notes/[id]         -> note editor
```

- MVP categories:

```python
Random Thoughts -> #E8A87C
School          -> #F9E4A0
Personal        -> #8FBCBC
```

- Do not seed `Drama` for MVP. Keep frontend color fallback support for `Drama` only if needed for Figma parity or sample data.
- Use local Figma export assets:

```text
cat-sleeping.png -> signup page
cactus.png       -> login page
bubble-tea.png   -> empty state
```

- Copy assets into:

```text
frontend/public/illustrations/
```

## Backend Implementation

- Create `Category` and `Note` models using Django ORM.
- Use Django’s default `User` model for speed; store `username=email` during registration.
- Registration must run in a transaction:

```text
create user
seed default categories
return access + refresh JWTs
```

- Implement email/password login over SimpleJWT.
- API endpoints:

```text
POST   /api/auth/register/
POST   /api/auth/token/
POST   /api/auth/token/refresh/

GET    /api/categories/
GET    /api/notes/
POST   /api/notes/
GET    /api/notes/<id>/
PATCH  /api/notes/<id>/
DELETE /api/notes/<id>/
```

- `GET /api/categories/` returns user categories with `note_count`.
- `GET /api/notes/?category=<id>` filters notes by category.
- `POST /api/notes/` creates an empty note and defaults to the user’s first category if no category is provided.
- All note/category endpoints require JWT auth and only expose `request.user` data.
- Note serializer response shape:

```json
{
  "id": 1,
  "title": "",
  "content": "",
  "category": {
    "id": 1,
    "name": "Random Thoughts",
    "color": "#E8A87C"
  },
  "created_at": "...",
  "updated_at": "..."
}
```

## Frontend Implementation

- Install shadcn/ui during the **Next.js foundation phase, Hour 10-16**:

```bash
npx shadcn@latest init -d --base radix
npx shadcn@latest add button card dropdown-menu input textarea label
```

- Use shadcn/ui as a component foundation, not as the visual identity.
- Components to add and customize:

```text
Button       -> auth buttons, + New Note, close/action buttons
Card         -> note cards and editor card
DropdownMenu -> category selector in editor
Input        -> email/password fields
Textarea     -> note title/content inline editing
Label        -> accessible auth form labels
```

- Heavily customize every shadcn component to match Figma:

```text
no default shadcn look
warm cream app background: #F5ECD7
tan input/button borders: #C8A87A
warm brown meta/button text: #7B5E3A
muted placeholder/link text: #A07840
Playfair Display for auth titles and note titles
Inter for body text, labels, metadata, buttons
category-colored note and editor cards
custom darker category card borders
pill outline buttons matching Figma
borderless inline editor textareas
cream dropdown menu with soft shadow
```

- Use the existing Tailwind theme extension plus CSS variables as the single source of design tokens:

```css
--bg-page: #F5ECD7;
--text-primary: #1A1A1A;
--text-meta: #7B5E3A;
--text-muted: #A07840;
--border-input: #C8A87A;

--color-random-thoughts: #E8A87C;
--color-school: #F9E4A0;
--color-personal: #8FBCBC;
--color-drama: #C8D5A8;

--border-random-thoughts: #D4946A;
--border-school: #E8CC78;
--border-personal: #7AABAB;
--border-drama: #B4C490;
```

- Use `NEXT_PUBLIC_API_URL=http://localhost:8000/api`.
- Implement `lib/api.ts` with axios, access-token injection, and one refresh retry on `401`.
- Implement `lib/auth.ts` for register, login, logout, token storage, refresh token storage, and auth helpers.
- Store JWTs in `localStorage` for MVP and document the production tradeoff in README.
- Do not use `middleware.ts` for auth redirects because middleware cannot read `localStorage`.
- Implement `RequireAuth` as a client component for `/notes` and `/notes/[id]`.
- Auth UI:

```text
centered 400px form
illustration above title
shadcn Input customized with tan border, warm cream background, muted placeholder
password Input with eye toggle
shadcn Button customized as full-width Figma pill outline
underlined warm brown navigation link
```

- Notes list:

```text
left sidebar around 220px
All Categories selected by default
category dots and note counts
top-right + New Note shadcn Button customized as Figma pill
empty state with bubble tea illustration
responsive grid: 1 col mobile, 2 col tablet, 3 col desktop
shadcn Card customized into category-colored note cards
variable-height cards with category color and custom border
```

## New Note Flow

- Exact flow:

```text
user clicks + New Note
frontend immediately sends POST /api/notes/
backend creates empty note with first category
frontend receives created note id
frontend redirects to /notes/[id]
editor opens with empty title/content and category-colored card
```

- Do not open a modal.
- Do not create the note only after typing.
- Do not keep the user on `/notes` after creation.
- Disable the button or show a small loading state while the POST is in flight to prevent duplicate notes.

## Note Editor Polish

- Use shadcn `Card` as the editor card base, but fully restyle it:

```text
border-radius: 16px
padding around 32px desktop, 20px mobile
background = current category color
border = darker category border
no default white card styling
```

- Title and content fields should feel like inline editing, not form fields.
- Use shadcn `Textarea` for title and content, heavily customized.
- Title textarea styling:

```text
border: none
background: transparent
box-shadow: none
resize: none
outline: none
focus ring: none
Playfair Display
font-weight: 700
font-size: 1.5rem
color: #1A1A1A
placeholder: "Note Title"
```

- Content textarea styling:

```text
border: none
background: transparent
box-shadow: none
resize: none
outline: none
focus ring: none
Inter
font-size: 0.875rem
line-height: relaxed
color: #1A1A1A
placeholder: "Pour your heart out..."
min-height fills remaining card space
```

- Tailwind class target:

```tsx
className="border-0 bg-transparent p-0 shadow-none outline-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#A07840]"
```

- Use auto-growing title textarea for long titles and a flexible content textarea for note body.
- Keep `Last Edited: ...` inside the card at the top-right.
- Use shadcn `DropdownMenu` for category selector, but restyle it as a cream rounded card with soft shadow.
- Category change flow:

```text
select category
optimistically update current category
card background changes immediately
PATCH /api/notes/<id>/ with category id
close dropdown
rollback or show inline error if PATCH fails
```

- Auto-save flow:

```text
title/content local state updates immediately
PATCH is debounced by 500ms
last edited timestamp updates after successful PATCH response
show subtle "Saving..." / "Saved" state if time allows
```

## GitHub Workflow And Repository Signal

- Keep `main` as final/release branch and `development` as integration branch.
- Use feature branches from `development`:

```text
feature/backend-api
feature/frontend-foundation
feature/notes-ui
chore/ci-docker-readme
```

- Use small PRs into `development`; create one final release PR from `development` into `main`.
- Add repo-local workflow artifacts:

```text
.github/workflows/ci.yml
.github/pull_request_template.md
.github/ISSUE_TEMPLATE/feature_request.md
.github/ISSUE_TEMPLATE/bug_report.md
```

- CI should run on PRs to `development` and `main`, plus pushes to both branches.
- CI jobs:

```text
backend: install Python deps, run migrations/checks, run Django tests
frontend: npm ci, lint, typecheck, build
```

- Document branch protection recommendations in README:

```text
Require PRs into main and development
Require CI passing before merge
Disable force pushes
Keep main final/release only
```

## 72-Hour Execution Schedule

- Hour 0-3: repo setup, Docker Compose, backend/frontend scaffolds, env examples, base README.
- Hour 3-10: Django models, migrations, serializers, auth endpoints, notes/categories endpoints, backend tests.
- Hour 10-16: Next.js foundation, Tailwind theme, **shadcn/ui init and component adds**, Figma CSS variables, Playfair/Inter fonts, auth pages, token handling, client guard.
- Hour 16-28: notes list, sidebar, empty state, note cards, category filtering, New Note POST-to-editor flow.
- Hour 28-38: editor, inline textarea polish, category dropdown, debounced auto-save, timestamps, optimistic category updates.
- Hour 38-46: responsive polish, accessibility pass, loading/error/empty states, illustration placement.
- Hour 46-56: Docker hardening, CI, backend/frontend tests, build fixes.
- Hour 56-64: README process writeup, AI usage section, architecture decisions, branch workflow documentation.
- Hour 64-72: manual QA, final release PR to `main`, demo video, final cleanup.

## Test Plan

- Backend tests:

```text
registration creates user and 3 categories
JWT login works with email/password
users cannot read or mutate other users’ notes/categories
GET /api/categories/ returns correct note_count
GET /api/notes/?category=<id> filters correctly
POST /api/notes/ defaults to first category
PATCH updates title/content/category
DELETE removes only authenticated user’s note
```

- Frontend checks:

```text
npm run lint
npm run typecheck
npm run build
```

- Manual QA:

```text
signup -> notes empty state
login -> notes
+ New Note -> immediate POST -> redirect to /notes/[id]
editor title/content look borderless and inline
typing title/content auto-saves
closing editor returns to list with updated card
category filter updates visible cards
category dropdown changes editor/card color
logout clears tokens and blocks notes routes
```

## README Requirements

- Include:

```text
Project summary
Stack and version choices
Docker setup
Manual setup fallback
API overview
Branch/PR workflow explanation
Key technical decisions
AI tools used and how
Known tradeoffs
Future improvements
```

- Explicitly document:

```text
Next.js 15 chosen because 14 is unsupported and 16 is newer-risk for a 72h challenge
Django 5.2 LTS chosen for current LTS support
SimpleJWT chosen because Django owns auth
localStorage JWT chosen for challenge speed; httpOnly cookies would be production preference
Postgres + Django ORM chosen instead of Prisma
shadcn/ui used as a component foundation, then fully themed with Tailwind/CSS variables to feel hand-crafted and match Figma
no default shadcn visual look was kept
voice/headphones UI skipped because it is visible in Figma but out of MVP spec
```

## Assumptions

- The evaluator values functionality, maintainability, tasteful UI, and visible team workflow more than feature breadth.
- Vercel deployment is out of scope unless extra time remains.
- Docker local run is enough for delivery.
- `Drama` is not part of MVP because the challenge spec confirms three categories.
- GitHub external settings should be documented unless explicitly configured later with permission.
