# Daily leaderboard backup: merges the server and the old kvdb bucket into backup/scores.json,
# keeping the max per key, so a wiped server never shrinks the backup.
# Fails (after writing) when the server is down, so the scheduled run reports the outage.
import json, pathlib, urllib.request

SERVER = 'https://vps.taila0218e.ts.net:8443/'
KVDB = 'https://kvdb.io/A2EYg5Q1vde6wu5QJEAnbe/?values=true&format=json'
path = pathlib.Path('backup/scores.json')
def up(k):
    pre, _, name = k.partition(':')
    return pre + ':' + name.upper()

best = {}
if path.exists():
    for k, v in json.loads(path.read_text()):
        best[up(k)] = max(best.get(up(k), -1), int(v))

def merge(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'grib-backup'})
    with urllib.request.urlopen(req, timeout=30) as r:
        for k, v in json.load(r):
            k = up(k)
            if (k.startswith('v2:') or k.startswith('v2s:')) and int(v) > best.get(k, -1):
                best[k] = int(v)

server_ok = True
for url in (SERVER, KVDB):
    try:
        merge(url)
    except Exception as e:
        print('skip', url, e)
        server_ok = server_ok and url != SERVER
path.parent.mkdir(exist_ok=True)
path.write_text('[\n' + ',\n'.join(json.dumps([k, best[k]], ensure_ascii=False) for k in sorted(best)) + '\n]\n')
if not server_ok:
    raise SystemExit('leaderboard server unreachable')
