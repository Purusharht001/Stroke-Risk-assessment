"""NeuroFlow API — stroke-history screening over Model B.

Run from the repo root (WSL):
  backend/.venv/bin/uvicorn main:app --app-dir backend --port 8000
"""
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from typing import Literal  # noqa: E402

from fastapi import FastAPI, HTTPException, Query  # noqa: E402
from pydantic import BaseModel, Field, field_validator  # noqa: E402

import db  # noqa: E402
import drift  # noqa: E402
import model  # noqa: E402
import narrative  # noqa: E402
from schema import SCHEMA, PatientInput  # noqa: E402


class Contribution(BaseModel):
    feature: str
    direction: Literal["up", "down"]

    @field_validator("feature")
    @classmethod
    def model_b_only(cls, v):
        if v not in model.FEATURES:
            raise ValueError("feature is not a Model B feature")
        return v


class NarrativeRequest(BaseModel):
    contributions: list[Contribution] = Field(max_length=5)

PROB_CEILING = 0.99

DISCLAIMER = "Screening estimate from self-reported survey data, not a diagnosis."

app = FastAPI(title="NeuroFlow")


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": True, "model_version": model.VERSION}


@app.get("/api/v1/schema")
def input_schema():
    return {"features": model.FEATURES, "schema": SCHEMA}


@app.post("/api/v1/predict")
def predict(p: PatientInput):
    inputs = p.model_dump()
    try:
        r = model.predict(inputs)
    except Exception as e:
        raise HTTPException(500, "Model inference failed") from e
    rid = db.insert(inputs, r["probability"], r["flagged"], r["threshold"],
                    r["model_version"], r["contributions"])
    # Isotonic calibration saturates at exactly 1.0 when its top PAV block is
    # pure-positive ("yes" to every condition). Clamp the returned float only:
    # flagged was decided on the raw value, and the DB keeps the raw value.
    prob = min(r["probability"], PROB_CEILING)
    return {
        "id": rid,
        "probability": prob,
        "percent": f"{prob * 100:.1f}%",
        "flagged": r["flagged"],
        "threshold": r["threshold"],
        "model_version": r["model_version"],
        "contributions": r["contributions"],
        "disclaimer": DISCLAIMER,
    }


@app.post("/api/v1/narrative")
def shap_narrative(req: NarrativeRequest):
    # null on any failure; the client then shows the SHAP bars alone.
    return {"narrative": narrative.generate([c.model_dump() for c in req.contributions])}


@app.get("/api/v1/drift")
def drift_report():
    return drift.report(db.for_drift())


@app.get("/api/v1/assessments")
def assessments(limit: int = Query(100, ge=1, le=1000)):
    return db.recent(limit)
