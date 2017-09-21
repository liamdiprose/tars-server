import json
from sys import argv

ys = []
xs = []

with open(argv[1], 'r') as f:
    id = f.readline().strip('\n')
    name = f.readline().strip()
    nx = int(f.readline())

    for i in range(nx):
        xs.append(list(map(int, f.readline().split('.'))))

    ny = int(f.readline())

    for i in range(ny):
        ys.append(list(map(int, f.readline().split('.'))))

X_STEP = 2
X_GAP = 2
Y_STEP = 1.1
Y_GAP = 2

layout = []

for (xsteps, xgaps) in xs:
    for (ysteps, ygaps) in ys:
        x = xsteps * X_STEP + xgaps * X_GAP
        y = ysteps * Y_STEP + ygaps * Y_GAP

        layout.append({
            "computer": f"{xsteps}.{xgaps} {ysteps}.{ygaps}",
            "shape": {
                "x": round(x, 3),
                "y": round(y, 3),
                "h": Y_STEP,
                "w": X_STEP
            }
        })

final = {}
final['id'] = id
final['name'] = name
final['layout'] = layout

f = open(f"{id}.json", 'w')
json.dump(final, f, indent=4)
