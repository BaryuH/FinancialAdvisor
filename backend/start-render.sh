#!/bin/sh
# Render / any host: cwd is unreliable; always run from this file's directory (backend/).
set -e
cd "$(dirname "$0")"
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:?}"
