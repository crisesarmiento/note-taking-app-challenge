#!/bin/sh
set -e

python manage.py migrate
python manage.py seed_demo_data

exec "$@"
