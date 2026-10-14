"""PatientInput, generated from models/model_config.json at import time.

No range or enum is hardcoded here: types and bounds come from the config's
`schema`, filtered to the 21 Model B features in fitted order.
"""
import json
import os

from pydantic import ConfigDict, Field, create_model

from model import FEATURES, ROOT

CONFIG = json.loads((ROOT / os.environ.get("MODEL_CONFIG", "models/model_config.json")).read_text())

# Config carries all 28 Model A features; keep only Model B's, in fitted order.
SCHEMA = {name: CONFIG["schema"][name] for name in FEATURES}

_TYPES = {"numeric": float, "binary": int, "categorical": int}

PatientInput = create_model(
    "PatientInput",
    __config__=ConfigDict(extra="forbid"),  # nothing but the clinical fields gets in
    **{
        name: (_TYPES[spec["type"]], Field(..., ge=spec["min"], le=spec["max"]))
        for name, spec in SCHEMA.items()
    },
)
