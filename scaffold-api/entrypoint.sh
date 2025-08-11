#!/bin/bash
flask db upgrade && python wsgi.py