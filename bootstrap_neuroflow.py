#!/usr/bin/env python3
"""bootstrap_neuroflow.py — scaffold the NeuroFlow AI workspace.

Creates the directory tree, checks that the Colab model files are in place, and
reports how to install the four supporting tools.

Deliberately does NOT git-clone anything. The original project brief said to
clone four repositories; three of the four are not installed that way, and one
does not exist:

  graphify   -> uv tool install graphifyy && graphify install   (not a clone)
  ponytail   -> /plugin marketplace add DietrichGebert/ponytail (not a clone)
  agentskills-> a spec, not a dependency. Skills live in .claude/skills/,
                NOT .github/skills/ as the brief stated.
  "OpenRoute"-> does not exist. It is OpenRouter (openrouter.ai):
                pip install openrouter, or point the openai client at
                https://openrouter.ai/api/v1

Usage:
    python bootstrap_neuroflow.py [--root .] [--zip]
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

DIRS = [
    "plan", "docs", "logs", "models",
    "backend", "backend/sql", "frontend",
    ".claude/skills/neuroflow-inference",
    ".claude/skills/neuroflow-shap-narrative",
    ".claude/skills/neuroflow-drift",
    ".claude/skills/neuroflow-chatbot",
]

REQUIRED_MD = [
    "CLAUDE.md", "README.md",
    "plan/STATE.md", "plan/00_OVERVIEW.md",
    "plan/MODULE_0_SETUP.md", "plan/MODULE_1_BACKEND.md",
    "plan/MODULE_2_FORM.md", "plan/MODULE_3_RESULTS.md",
    "plan/MODULE_4_DRIFT.md", "plan/MODULE_5_CHATBOT.md",
    "docs/DATA_DICTIONARY.md", "docs/UI_COPY_RULES.md",
    "docs/MODEL_CARD.md", "docs/ACADEMIC_DOSSIER.md",
    "docs/CHATBOT_SCOPE.md",
    "logs/BUILD_LOG.md", "logs/AUDIT_LOG.md",
    ".claude/skills/neuroflow-inference/SKILL.md",
    ".claude/skills/neuroflow-shap-narrative/SKILL.md",
    ".claude/skills/neuroflow-drift/SKILL.md",
    ".claude/skills/neuroflow-chatbot/SKILL.md",
]

MODEL_FILES = [
    "stroke_model.joblib",
    "model_config.json",
    "sanity_input.csv",
    "sanity_expected.npy",
]

SQL_INIT = """-- 001_init.sql — the assessments table. Fixed schema; do not extend.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS assessments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  inputs        JSONB NOT NULL,
  probability   REAL NOT NULL,
  flagged       BOOLEAN NOT NULL,
  threshold     REAL NOT NULL,
  model_version TEXT NOT NULL,
  shap_top      JSONB,
  source        TEXT NOT NULL DEFAULT 'form'
);

CREATE INDEX IF NOT EXISTS idx_assessments_created
  ON assessments (created_at DESC);

-- No names, emails, IPs, or user agents. Session UUIDs only.
"""

VERIFY_MODEL = '''#!/usr/bin/env python3
"""verify_model.py — prove the bundle reproduces Colab's numbers here.

Exits 0 on success, 1 on any failure. Module 0 requires exit 0 before the
backend is built.
"""
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / "models"


def main() -> int:
    missing = [f for f in ("stroke_model.joblib", "sanity_input.csv",
                           "sanity_expected.npy")
               if not (MODELS / f).exists()]
    if missing:
        print(f"FAIL: missing in models/: {missing}")
        return 1

    bundle = joblib.load(MODELS / "stroke_model.joblib")
    meta = bundle["meta"]

    print("Bundle metadata")
    for k, v in meta.items():
        if k not in ("excluded_leakage", "suspect_features_removed_in_B"):
            print(f"  {k:24s} {v}")

    import sklearn, xgboost
    print("\\nInstalled vs expected")
    mismatched = False
    for lib, installed, expected in [
        ("scikit-learn", sklearn.__version__, meta.get("sklearn")),
        ("xgboost", xgboost.__version__, meta.get("xgboost")),
        ("numpy", np.__version__, meta.get("numpy")),
    ]:
        mark = "ok" if installed == expected else "MISMATCH"
        if mark == "MISMATCH":
            mismatched = True
        print(f"  {lib:16s} {installed:12s} expected {expected:12s} {mark}")

    M = bundle["model_B"]
    print(f"\\nModel B: {len(M['features'])} features, "
          f"threshold {M['threshold']:.4f}")
    if len(M["features"]) != 21:
        print(f"FAIL: expected 21 features, got {len(M['features'])}")
        return 1

    X = pd.read_csv(MODELS / "sanity_input.csv")[M["features"]]
    raw = M["model"].predict_proba(M["preprocessor"].transform(X))[:, 1]
    got = M["calibrator"].predict(raw)
    want = np.load(MODELS / "sanity_expected.npy")

    diff = float(np.abs(got - want).max())
    print(f"\\nSanity check over {len(X)} rows: max |diff| = {diff:.3e}")

    if diff >= 1e-6:
        print("FAIL: predictions do not reproduce Colab's output.")
        if mismatched:
            print("      Library versions differ — pin them and reinstall.")
        return 1

    print("PASS: bundle verified.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
'''


def check_tool(cmd: list[str]) -> bool:
    try:
        subprocess.run(cmd, capture_output=True, timeout=10, check=False)
        return True
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".", help="workspace root")
    ap.add_argument("--zip", action="store_true",
                    help="also produce neuroflow_ai_starter.zip")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    root.mkdir(parents=True, exist_ok=True)
    print(f"Workspace: {root}\n")

    print("Directories")
    for d in DIRS:
        (root / d).mkdir(parents=True, exist_ok=True)
    print(f"  {len(DIRS)} created or already present\n")

    print("Seed files")
    sql = root / "backend/sql/001_init.sql"
    if not sql.exists():
        sql.write_text(SQL_INIT)
        print("  backend/sql/001_init.sql   written")
    else:
        print("  backend/sql/001_init.sql   exists, left alone")

    ver = root / "backend/verify_model.py"
    if not ver.exists():
        ver.write_text(VERIFY_MODEL)
        ver.chmod(0o755)
        print("  backend/verify_model.py    written")
    else:
        print("  backend/verify_model.py    exists, left alone")

    print("\nDocumentation")
    absent = [f for f in REQUIRED_MD if not (root / f).exists()]
    if absent:
        print(f"  MISSING {len(absent)} of {len(REQUIRED_MD)}:")
        for f in absent:
            print(f"    - {f}")
        print("  Copy them from the starter pack before running Claude Code.")
    else:
        print(f"  all {len(REQUIRED_MD)} present")

    print("\nModel bundle")
    missing_models = [f for f in MODEL_FILES if not (root / "models" / f).exists()]
    if missing_models:
        print(f"  MISSING {len(missing_models)} of 4:")
        for f in missing_models:
            print(f"    - models/{f}")
        print("  Download these from the Colab notebook's export cell.")
    else:
        print("  all 4 present")
        cfg = root / "models/model_config.json"
        try:
            data = json.loads(cfg.read_text())
            print(f"  schema fields: {len(data.get('schema', {}))}")
            print(f"  model_B threshold: {data.get('model_B_threshold')}")
        except Exception as exc:
            print(f"  could not parse model_config.json: {exc}")

    print("\nTooling")
    tools = [
        ("uv", ["uv", "--version"],
         "curl -LsSf https://astral.sh/uv/install.sh | sh"),
        ("graphify", ["graphify", "--version"],
         "uv tool install graphifyy && graphify install"),
        ("node", ["node", "--version"], "https://nodejs.org"),
        ("psql", ["psql", "--version"], "install PostgreSQL"),
    ]
    for name, probe, how in tools:
        print(f"  {name:10s} {'found' if check_tool(probe) else 'not found — ' + how}")

    print("\n  ponytail    /plugin marketplace add DietrichGebert/ponytail")
    print("              /plugin install ponytail@ponytail        (inside Claude Code)")
    print("  OpenRouter  pip install openrouter    — set OPENROUTER_API_KEY")
    print("              (the brief called this 'OpenRoute'; no such project exists)")
    print("  skills      .claude/skills/<name>/SKILL.md")
    print("              (the brief said .github/skills/ — Claude Code does not read that)")

    if args.zip:
        out = root.parent / "neuroflow_ai_starter"
        archive = shutil.make_archive(str(out), "zip", root_dir=root.parent,
                                      base_dir=root.name)
        print(f"\nPackaged: {archive}")

    ready = not absent and not missing_models
    print("\n" + "=" * 62)
    if ready:
        print("Ready. Open Claude Code here and type: continue")
    else:
        print("Not ready. Resolve the MISSING items above, then re-run.")
    print("=" * 62)
    return 0 if ready else 1


if __name__ == "__main__":
    sys.exit(main())
