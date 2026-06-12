#!/bin/sh
# Trim the shared leaderboard to top-10, dump to leaderboard.json, push if changed.
# Run from cron every 10 minutes.
set -e
REPO="$(cd "$(dirname "$0")" && pwd)"
BUCKET="https://kvdb.io/A2EYg5Q1vde6wu5QJEAnbe"

cd "$REPO"
RAW=$(mktemp); TOP=$(mktemp)
curl -sf "$BUCKET/?values=true&format=json&_=$(date +%s)" > "$RAW" || { rm -f "$RAW" "$TOP"; exit 0; }

# пишет топ-10 в $TOP, на stdout выдаёт url-encoded ключи за пределами топа
python3 - "$RAW" "$TOP" <<'EOF' |
import json, sys, urllib.parse
rows = sorted(((k, int(v)) for k, v in json.load(open(sys.argv[1]))), key=lambda r: -r[1])
json.dump([{"name": k, "score": v} for k, v in rows[:10]],
          open(sys.argv[2], 'w'), ensure_ascii=False, indent=2)
for k, _ in rows[10:]:
    print(urllib.parse.quote(k, safe=''))
EOF
while read -r key; do
  [ -n "$key" ] && curl -sf -X DELETE "$BUCKET/$key" >/dev/null || true
done

if ! cmp -s "$TOP" leaderboard.json 2>/dev/null; then
  mv "$TOP" leaderboard.json
  git add leaderboard.json
  git commit -q -m "leaderboard snapshot $(date -u +%Y-%m-%dT%H:%MZ)"
  git push -q origin main
fi
rm -f "$RAW" "$TOP"
