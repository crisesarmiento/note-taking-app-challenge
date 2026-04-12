# Demo Data, Coverage, and E2E Test Improvements

## Summary

- Create a new branch from `development`: `feature/demo-data-tests-polish`.
- Keep existing app behavior intact while adding idempotent demo data seeding, stronger Django coverage, Playwright E2E coverage, README test commands, and fixed Next.js image dimensions.
- Ignore the untracked `docs/` directory entirely.

## Backend Changes

- Add shared defaults in `backend/notes/defaults.py`:
  - `DEFAULT_CATEGORIES`
  - `DEMO_USER_EMAIL = "demo@example.com"`
  - `DEMO_PASSWORD` loaded from environment
  - `DEMO_NOTES` with 5 realistic notes across Random Thoughts, School, and Personal.
- Refactor `UserRegistrationSerializer` to import `DEFAULT_CATEGORIES` from `notes/defaults.py` instead of owning duplicate constants.
- Add management command:
  - File: `backend/notes/management/commands/seed_demo_data.py`
  - Behavior:
    - Idempotently creates or updates the demo user.
    - Ensures the 3 default categories exist for the demo user.
    - Creates sample notes only if they do not already exist for that demo user/title/category.
    - Does not delete user-created notes.
    - Prints a short summary of created/existing objects.
- Add startup script:
  - File: `backend/entrypoint.sh`
  - Runs:
    - `python manage.py migrate`
    - `python manage.py seed_demo_data`
    - then `exec "$@"`
- Update `backend/Dockerfile` to copy/use `entrypoint.sh`.
- Update `docker-compose.yml`:
  - Keep existing `postgres_data` volume unchanged.
  - Replace backend command with only `python manage.py runserver 0.0.0.0:8000`, letting entrypoint handle migrate + seed.
  - This preserves seeded/demo/user data across container restarts because Postgres remains volume-backed.

## Testing Changes

- Add backend test tooling:
  - File: `backend/requirements-dev.txt`
  - Include `-r requirements.txt`, `pytest`, `pytest-django`, `pytest-cov`, and optionally `coverage`.
  - Add `backend/pytest.ini` with `DJANGO_SETTINGS_MODULE=config.settings`, test file patterns, and default options.
- Expand Django tests beyond current API smoke tests:
  - Models: category uniqueness, note ordering, string fallbacks.
  - Serializers: registration normalizes email, duplicate email validation, category queryset scoping, default category on note create.
  - Views/auth: unauthenticated access blocked, login failure cases, token refresh still works.
  - CRUD/ownership/filtering: list/retrieve/update/delete user isolation, invalid category ownership rejected, category counts correct.
  - Seed command: idempotency, demo credentials valid, expected categories and sample notes created.
- Coverage target:
  - Add README command:

    ```bash
    cd backend
    pytest --cov=notes --cov-report=term-missing --cov-fail-under=80
    ```

  - Update CI backend job to install `requirements-dev.txt` and run the same coverage command.
- Add frontend Playwright:
  - Add dev dependency `@playwright/test`.
  - Add scripts in `frontend/package.json`:

    ```json
    "test": "playwright test",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
    ```

  - Add `frontend/playwright.config.ts`:
    - `baseURL: "http://127.0.0.1:3000"`
    - Use Chromium by default.
    - Reuse an existing local server when available.
    - Use trace/video/screenshot on failure.
  - Add E2E tests under `frontend/e2e/notes.spec.ts`.
- Playwright test scenarios:
  - Register flow with unique email, lands on notes page.
  - Login with demo user `demo@example.com` using `DEMO_PASSWORD` from environment.
  - Create note using `+ New Note`, verify redirect to `/notes/[id]`.
  - Edit title and content, wait for `Saved`.
  - Change category via editor dropdown, verify category UI changes.
  - Return to list, verify updated title/content card appears.
  - Category filtering shows the updated note under the selected category.
  - Logout redirects to login and prevents authenticated notes view.
- E2E backend data strategy:
  - Tests assume Docker/dev backend has run `seed_demo_data`.
  - For CI, add a new `e2e` GitHub Actions job that:
    - Installs frontend dependencies.
    - Installs Playwright Chromium.
    - Starts the full stack with `docker compose up -d --build`.
    - Waits for backend and frontend health via `curl`.
    - Runs `cd frontend && npm run test:e2e`.
    - Dumps logs on failure and tears down containers.
  - Use a unique generated email for register-flow tests to avoid collisions with persistent/local seeded data.

## Frontend Polish

- Fix Next.js Image warnings by making image dimensions explicit and proportional:
  - `cat-sleeping.png`: width `189`, height `134`.
  - `cactus.png`: width `96`, height `114`.
  - `bubble-tea.png`: width `297`, height `296`.
- Update `AuthLayout` API so pages pass image dimensions instead of forcing all auth illustrations through `128x128`.
- Keep `className="h-auto ..."` when applying CSS width overrides so Next does not warn about only one dimension being modified.
- Add stable test-friendly accessible labels where needed:
  - Keep existing input placeholders.
  - Ensure logout button has `aria-label="Logout"`.
  - Ensure category dropdown trigger has `aria-label="Change category"`.
  - If Playwright selectors need it, add minimal `aria-label` or `data-testid` only where role/text selectors are unreliable.

## README And CI Updates

- README updates:
  - Add demo credentials:

    ```text
    DEMO_EMAIL=demo@example.com
    DEMO_PASSWORD=<set-a-local-demo-password>
    ```

  - Explain demo data is seeded automatically on backend container startup and persists because Postgres uses `postgres_data`.
  - Add backend test commands:

    ```bash
    cd backend
    pip install -r requirements-dev.txt
    pytest --cov=notes --cov-report=term-missing --cov-fail-under=80
    ```

  - Add frontend commands:

    ```bash
    cd frontend
    npm run lint
    npm run typecheck
    npm run build
    npm test
    npx playwright test
    ```

  - Add E2E prerequisite note:

    ```bash
    docker-compose up --build
    ```

- CI updates:
  - Backend job uses `requirements-dev.txt` and coverage threshold.
  - Frontend job remains lint/typecheck/build.
  - Add separate Playwright E2E job using Docker Compose to test the integrated app.

## Validation Plan

- Run before commit:
  - `cd backend && pytest --cov=notes --cov-report=term-missing --cov-fail-under=80`
  - `cd frontend && npm run lint`
  - `cd frontend && npm run typecheck`
  - `cd frontend && npm run build`
  - `docker compose config`
  - `docker compose up -d --build`
  - `cd frontend && npx playwright test`
  - `docker compose down`
- Confirm manually:
  - Demo login works with `demo@example.com` using `DEMO_PASSWORD` from environment.
  - Restarting containers does not duplicate demo notes.
  - Restarting containers preserves Postgres data.
  - Existing register/login/create/edit/filter/logout flows still work.

## Assumptions

- Branch name will be `feature/demo-data-tests-polish`.
- `DEMO_PASSWORD` is intentionally loaded from local environment instead of source control so secret scanners do not block the PR.
- Existing persistent Docker volume remains named `postgres_data`; no volume reset is required.
- Playwright tests can rely on Docker Compose for backend/frontend startup in CI and local pre-test setup.
