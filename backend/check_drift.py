"""Module 4 acceptance checks 2-5 for drift.py. Run from the repo root (WSL):
  backend/.venv/bin/python backend/check_drift.py
"""
import sys

import numpy as np

sys.path.insert(0, "backend")
import drift  # noqa: E402


def notebook_psi(expected, actual, bins=10):  # training-notebook reference implementation
    e, a = np.asarray(expected, float), np.asarray(actual, float)
    if len(np.unique(e)) <= 2:
        edges = np.array([-np.inf, 0.5, np.inf])
    else:
        edges = np.unique(np.percentile(e, np.linspace(0, 100, bins + 1)))
        edges[0], edges[-1] = -np.inf, np.inf
    return drift.psi(drift.bin_props(e, edges), drift.bin_props(a, edges)), edges


rng = np.random.default_rng(0)
ok = True

def check(name, cond, detail):
    global ok
    ok &= bool(cond)
    print(f"[{'PASS' if cond else 'FAIL'}] {name}: {detail}")

# 2. distribution against itself
worst = max(abs(drift.psi(E, E)) for _, E in drift.REFERENCE.values())
check("2a reference vs itself, all 21 features", worst < 1e-6, f"max |PSI| = {worst:.3e}")
x = rng.normal(50, 10, 100_000)
v, _ = notebook_psi(x, x)
check("2b sample vs itself (decile edges)", abs(v) < 1e-6, f"PSI = {v:.3e}")

# 3. obviously shifted distribution
v, _ = notebook_psi(x, rng.normal(65, 10, 100_000))
check("3a N(50,10) vs N(65,10)", v > 0.25, f"PSI = {v:.4f}")
edges, E = drift.REFERENCE["age"]
v = drift.psi(E, drift.bin_props(rng.uniform(75, 80, 500), edges))
check("3b age: training vs live all 75-80", v > 0.25, f"PSI = {v:.4f}")
edges, E = drift.REFERENCE["high_bp"]
v = drift.psi(E, drift.bin_props(np.ones(200), edges))
check("3c high_bp: training vs live all 1", v > 0.25, f"PSI = {v:.4f}")

# 4. empty bins produce no inf/nan
vals = [drift.psi(E, drift.bin_props(np.full(50, edges[1] - 1e-9), edges))
        for edges, E in drift.REFERENCE.values()]
check("4 one occupied bin, 9 empty, every feature", np.all(np.isfinite(vals)),
      f"all finite, max PSI = {max(vals):.3f}")

# 5. band cutoffs
cases = {0.0: "stable", 0.0999: "stable", 0.1: "moderate", 0.2: "moderate",
         0.25: "moderate", 0.2501: "significant", 3.0: "significant"}
got = {k: drift.band(k) for k in cases}
check("5 bands at 0.1 and 0.25", got == cases, got)

print("ALL PASS" if ok else "FAILURES")
sys.exit(0 if ok else 1)
