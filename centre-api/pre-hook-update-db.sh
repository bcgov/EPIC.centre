#! /bin/sh
cd /opt/app-root
echo 'starting upgrade'
flask db upgrade
