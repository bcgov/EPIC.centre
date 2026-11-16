#!/bin/sh

echo 'starting application'
# exec so gunicorn gets SIGTERM on shutdown
exec gunicorn --config gunicorn_config.py --bind 0.0.0.0:8080 --timeout 60 wsgi:application
