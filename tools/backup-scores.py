# Daily leaderboard backup: backup/scores.json mirrors the server, so deleted rows leave it too.
# Git history keeps every earlier version. Refuses to write when the server is down or the
# board suddenly shrank by more than half, so a wiped server can't wipe the backup.
import json, pathlib, urllib.request

SERVER = 'https://vps.taila0218e.ts.net:8443/'
path = pathlib.Path('backup/scores.json')
old = json.loads(path.read_text()) if path.exists() else []
req = urllib.request.Request(SERVER, headers={'User-Agent': 'grib-backup'})
with urllib.request.urlopen(req, timeout=30) as r:
    rows = sorted([k, int(v)] for k, v in json.load(r))
if len(old) > 5 and len(rows) < len(old) / 2:
    raise SystemExit(f'server has {len(rows)} rows, backup has {len(old)}: not overwriting')
path.parent.mkdir(exist_ok=True)
path.write_text('[\n' + ',\n'.join(json.dumps(x, ensure_ascii=False) for x in rows) + '\n]\n')
