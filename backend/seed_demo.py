"""Seed demonstration assessments so the drift dashboard has >= 30 rows.

Inputs are sampled from the training reference bins, scored through the normal
Model B path, and stored with source='seed'. Remove them with:
  DELETE FROM assessments WHERE source = 'seed';
Run from the repo root (WSL): backend/.venv/bin/python backend/seed_demo.py [n]
"""
import os
import sys
from pathlib import Path

import numpy as np
import psycopg
from dotenv import load_dotenv
from psycopg.types.json import Jsonb

sys.path.insert(0, "backend")
load_dotenv(Path(".env"))
import drift  # noqa: E402
import model  # noqa: E402
from schema import SCHEMA  # noqa: E402

rng = np.random.default_rng()
n = int(sys.argv[1]) if len(sys.argv) > 1 else 40

with psycopg.connect(os.environ["DATABASE_URL"]) as c:
    for _ in range(n):
        inputs = {}
        for f, (edges, expected) in drift.REFERENCE.items():
            s = SCHEMA[f]
            b = rng.choice(len(expected), p=expected / expected.sum())
            if f == "bmi":  # the only continuous input
                inputs[f] = round(rng.uniform(max(edges[b], s["min"]), min(edges[b + 1], s["max"])), 2)
                continue
            ks = [k for k in range(int(s["min"]), int(s["max"]) + 1) if edges[b] <= k < edges[b + 1]]
            inputs[f] = int(rng.choice(ks)) if ks else int(s["median"])
        r = model.predict(inputs)
        c.execute(
            """INSERT INTO assessments
                 (inputs, probability, flagged, threshold, model_version, shap_top, source)
               VALUES (%s, %s, %s, %s, %s, %s, 'seed')""",
            (Jsonb(inputs), r["probability"], r["flagged"], r["threshold"],
             r["model_version"], Jsonb(r["contributions"])),
        )
print(f"seeded {n} rows (source='seed')")
