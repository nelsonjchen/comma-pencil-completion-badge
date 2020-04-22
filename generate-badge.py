import subprocess
import json
from pathlib import Path

mask_count = \
    1000 + \
    1000 + \
    100

touched_commit_pairs = [
    "675f01fec8ebd430f2781ccdef6c17bd542ad9c5~1 9b327ccde35edf7d9bd51af247e3d785a87f759e",
    "0c2e5ee5e4f2f72ab0c2e2521344b1035fdaddba~1 675f01fec8ebd430f2781ccdef6c17bd542ad9c5",
    "HEAD 0c2e5ee5e4f2f72ab0c2e2521344b1035fdaddba",
]

touched_masks = set()

for touched_commit_pair in touched_commit_pairs:
    touched_masks = touched_masks.union(
        subprocess.check_output(f"git diff --name-only {touched_commit_pair} masks/*", cwd="comma10k", shell=True).strip().split(b"\n")
    )

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
    'label': "Count and Percentage of Images Labeled",
    'message': f"{count_done}, {percentage_float}%",
    'color': color,
}

public_dir = Path('public')

public_dir.mkdir(exist_ok=True)

with open(public_dir / "badge.json", "w") as write_file:
    json.dump(badge_json, write_file)

print(badge_json)
