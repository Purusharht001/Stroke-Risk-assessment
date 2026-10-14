"""Postgres access: one insert, two reads. Plain SQL, no ORM.

`inputs` holds the 21 clinical fields only. No identifiers are stored.
"""
import os

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb


def _connect():
    return psycopg.connect(os.environ["DATABASE_URL"], row_factory=dict_row)


def insert(inputs: dict, probability: float, flagged: bool, threshold: float,
           model_version: str, shap_top: list) -> str:
    with _connect() as c:
        row = c.execute(
            """INSERT INTO assessments
                 (inputs, probability, flagged, threshold, model_version, shap_top)
               VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
            (Jsonb(inputs), probability, flagged, threshold, model_version, Jsonb(shap_top)),
        ).fetchone()
    return str(row["id"])


def recent(limit: int) -> list[dict]:
    with _connect() as c:
        return c.execute(
            """SELECT id, created_at, inputs, probability, flagged, threshold,
                      model_version, shap_top, source
               FROM assessments ORDER BY created_at DESC LIMIT %s""",
            (limit,),
        ).fetchall()


def for_drift() -> list[dict]:
    with _connect() as c:
        return c.execute(
            """SELECT created_at, inputs, probability, flagged FROM assessments
               WHERE model_version = 'model_B' ORDER BY created_at""",
        ).fetchall()


def count() -> int:
    with _connect() as c:
        return c.execute("SELECT count(*) AS n FROM assessments").fetchone()["n"]
