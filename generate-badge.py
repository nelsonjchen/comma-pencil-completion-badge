import subprocess
import json
from collections import namedtuple
from pathlib import Path

TouchedMasks = namedtuple("TouchedMasks", ["count", "commit_pair_str"])

touched_masks_count_and_pairs = [
    # Initial 1000
    TouchedMasks(1000, "675f01fec8ebd430f2781ccdef6c17bd542ad9c5~1 9b327ccde35edf7d9bd51af247e3d785a87f759e"),
    # Second 1000
    TouchedMasks(1000, "0c2e5ee5e4f2f72ab0c2e2521344b1035fdaddba~1 675f01fec8ebd430f2781ccdef6c17bd542ad9c5"),
    # Hard 100
    TouchedMasks(100, "6bfbd3202cc88071d9b48b41cd75ecb63f1bf666~1 0c2e5ee5e4f2f72ab0c2e2521344b1035fdaddba"),
    # Requests 2
    TouchedMasks(100, "43e5683571a41e0e8713f69ceb9c18e0feeb9678~1 6bfbd3202cc88071d9b48b41cd75ecb63f1bf666"),
    # Requests 5
    TouchedMasks(100, "HEAD 43e5683571a41e0e8713f69ceb9c18e0feeb9678"),
]

mask_count = sum(t.count for t in touched_masks_count_and_pairs)

touched_masks = set()

for touched_commit_pair in touched_masks_count_and_pairs:
    touched_masks = touched_masks.union(
        subprocess.check_output(f"git diff --name-only {touched_commit_pair.commit_pair_str} masks/*", cwd="comma10k",
                                shell=True).strip().split(b"\n")
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
