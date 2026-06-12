#!/bin/sh
# Dump the shared leaderboard to leaderboard.json and push if it changed.
# Run from cron every 10 minutes.
set -e
REPO="$(cd "$(dirname "$0")" && pwd)"
URL="https://kvdb.io/S1L2qbYm4ZTr2uX1hMJP4A/?values=true&format=json"

cd "$REPO"
TMP=$(mktemp)
curl -sf "$URL" | python3 -m json.tool > "$TMP" || { rm -f "$TMP"; exit 0; }
if ! cmp -s "$TMP" leaderboard.json 2>/dev/null; then
  mv "$TMP" leaderboard.json
  git add leaderboard.json
  git commit -q -m "leaderboard snapshot $(date -u +%Y-%m-%dT%H:%MZ)"
  git push -q origin main
else
  rm -f "$TMP"
fi
