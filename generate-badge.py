import subprocess
import json
from pathlib import Path
import os

out = subprocess.check_output(
    "git rev-list --objects --all | awk '$2' | sort -k2 | uniq -cf1 | sort -rn",
    shell=True,
    cwd="comma10k"
) \
    .strip().split(b"\n")
fnn = []
al = 0
for j in out:
    jj = j.strip().split(b" ")
    if len(jj) != 3:
        continue
    cnt, _, fn = jj
    cnt = int(cnt)
    if os.path.isfile(b"comma10k/" + fn) and fn.startswith(b"masks/"):
        if cnt > 1:
            fnn.append(fn)
        al += 1
out = sorted(fnn)

mask_count = al

touched_masks = set(out)

# Remove empty string when new masks are dropped
touched_masks.discard(b'')

count_done = len(touched_masks)

percentage_float = (count_done / mask_count) * 100

if percentage_float > 95.0:
    color = 'brightgreen'
elif percentage_float > 90.0:
    color = 'green'
elif percentage_float > 85.0:
    color = 'yellowgreen'
elif percentage_float > 80.0:
    color = 'yellow'
elif percentage_float > 70.0:
    color = 'orange'
else:
    color = 'red'

badge_json = {
    'schemaVersion': 1,
    'label': "Count and Percentage of Available Images Labeled",
    'message': f"{count_done} out of {mask_count}, {percentage_float:.2f}%",
    'color': color,
}

public_dir = Path('public')

public_dir.mkdir(exist_ok=True)

with open(public_dir / "badge.json", "w") as write_file:
    json.dump(badge_json, write_file)

print(badge_json)
