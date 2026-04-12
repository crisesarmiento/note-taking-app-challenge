import os
from pathlib import Path


def _local_env_value(key):
    env_path = Path(__file__).resolve().parent.parent / '.env'
    if not env_path.exists():
        return None

    for line in env_path.read_text().splitlines():
        if not line or line.lstrip().startswith('#') or '=' not in line:
            continue
        name, value = line.split('=', 1)
        if name.strip() == key:
            return value.strip().strip('"').strip("'")
    return None


def _env_value(key, default=None):
    return os.getenv(key) or _local_env_value(key) or default

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
