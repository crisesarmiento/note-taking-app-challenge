import os
from pathlib import Path

from decouple import Config, RepositoryEnv, UndefinedValueError

BASE_DIR = Path(__file__).resolve().parent.parent

# Documented placeholder in .env.example — must not be used as a real password.
INVALID_DEMO_PASSWORD_PLACEHOLDER = '<set-a-local-demo-password>'

_config: Config | None = None
_env_path = BASE_DIR / '.env'
if _env_path.exists():
    _config = Config(RepositoryEnv(str(_env_path)))


def _env_value(key, default=None):
    v = os.getenv(key)
    if v is not None and v.strip() != '':
        return v.strip().strip('"').strip("'")
    if _config is not None:
        try:
            out = _config.get(key)
            if out is not None and str(out).strip() != '':
                return str(out).strip().strip('"').strip("'")
        except UndefinedValueError:
            pass
    return default


def is_invalid_demo_password_placeholder(password):
    if password is None:
        return True
    p = password.strip()
    if not p:
        return True
    return p == INVALID_DEMO_PASSWORD_PLACEHOLDER or INVALID_DEMO_PASSWORD_PLACEHOLDER in p


DEFAULT_CATEGORIES = [
    {'name': 'Random Thoughts', 'color': '#E8A87C'},
    {'name': 'School', 'color': '#F9E4A0'},
    {'name': 'Personal', 'color': '#8FBCBC'},
]

DEMO_USER_EMAIL = _env_value('DEMO_EMAIL', 'demo@example.com')


def get_demo_password():
    # Keep the demo password out of source control so secret scanners do not block the PR.
    return _env_value('DEMO_PASSWORD')

DEMO_NOTES = [
    {
        'title': 'Grocery List',
        'content': 'Milk\nEggs\nBread\nBananas\nSpinach',
        'category': 'Random Thoughts',
    },
    {
        'title': 'Meeting with Team',
        'content': 'Discuss project timeline and milestones.\nReview budget and resource allocation.\nAddress blockers and plan next steps.',
        'category': 'School',
    },
    {
        'title': 'Vacation Ideas',
        'content': 'Visit Bali for beaches and culture.\nExplore historic sites in Rome.\nGo hiking in the Swiss Alps.\nRelax in Iceland hot springs.',
        'category': 'Random Thoughts',
    },
    {
        'title': 'Books to Read',
        'content': 'The Alchemist, Educated, and Becoming are at the top of my reading list this month.',
        'category': 'Personal',
    },
    {
        'title': 'Project X Updates',
        'content': 'Finalized design mockups and received stakeholder approval. Front-end development is underway and backend integration is next.',
        'category': 'School',
    },
]
