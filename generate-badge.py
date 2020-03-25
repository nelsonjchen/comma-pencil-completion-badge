import subprocess
import json
from pathlib import Path

mask_count = 1000

out = subprocess.check_output("git diff --name-only HEAD 9b327ccde35edf7d9bd51af247e3d785a87f759e masks/*", cwd="comma10k", shell=True).strip().split(b"\n")
count_done = len(out)

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
