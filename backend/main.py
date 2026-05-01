import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import os
from datetime import datetime, timedelta, timezone
import re as _re
import shutil
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles
from jose import JWTError, jwt
from pydantic import BaseModel

from auth import login as auth_login
from crud import get_connection, hash_password, release_connection

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

SECRET_KEY = os.getenv("JWT_SECRET", "change-me-before-production")
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 8 * 60

app = FastAPI(title="IIDMS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


# ── contract table initialization ─────────────────────────────────────────

_COMMON_COLS = """
    name_of_project                         TEXT,
    estimate_number                         TEXT,
    year_of_estimate                        TEXT,
    agreement_number                        TEXT,
    year_of_agreement                       TEXT,
    designation_of_officer_executed_contract TEXT,
    status                                  TEXT DEFAULT 'Pending',
    created_by                              INTEGER,
    approved_by                             TEXT,
    approved_at                             TIMESTAMP,
    is_draft                                BOOLEAN DEFAULT TRUE,
    master_id                               INTEGER,
    approval_status                         TEXT,
    draft_id                                TEXT,
    created_at                              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
"""

_CONTRACT_TABLE_SCHEMAS: dict[str, str] = {
    "contract_management_admin_financial_sanction": f"""
        CREATE TABLE IF NOT EXISTS contract_management_admin_financial_sanction (
            id SERIAL PRIMARY KEY,
            {_COMMON_COLS},
            sanction_order_number           TEXT,
            date_of_financial_sanction      DATE,
            financial_sanction_amount       NUMERIC,
            name_of_work                    TEXT,
            administrative_approval_number  TEXT,
            date_of_administrative_approval DATE,
            approving_authority             TEXT
        )
    """,
    "contract_management_technical_sanction": f"""
        CREATE TABLE IF NOT EXISTS contract_management_technical_sanction (
            id SERIAL PRIMARY KEY,
            {_COMMON_COLS},
            ts_number                       TEXT,
            date_of_technical_sanction      DATE,
            ts_amount                       NUMERIC,
            approving_authority             TEXT,
            revised_ts_number               TEXT,
            date_of_revised_ts              DATE,
            revised_ts_amount               NUMERIC,
            excess_over_ts_amount           NUMERIC
        )
    """,
    "contract_management_tender_award_contract": f"""
        CREATE TABLE IF NOT EXISTS contract_management_tender_award_contract (
            id SERIAL PRIMARY KEY,
            {_COMMON_COLS},
            nit_number                      TEXT,
            date_of_nit                     DATE,
            nit_estimated_cost              NUMERIC,
            tender_opening_date             DATE,
            lowest_tender_amount            NUMERIC,
            percentage_above_below_ts       TEXT,
            awarded_contractor              TEXT,
            date_of_award                   DATE,
            agreement_amount                NUMERIC,
            date_of_agreement               DATE
        )
    """,
    "contract_management_contract_master": f"""
        CREATE TABLE IF NOT EXISTS contract_management_contract_master (
            id SERIAL PRIMARY KEY,
            {_COMMON_COLS},
            contractor_name                 TEXT,
            contractor_address              TEXT,
            date_of_start                   DATE,
            stipulated_completion_date      DATE,
            extended_completion_date        DATE,
            nature_of_work                  TEXT,
            security_deposit                NUMERIC,
            performance_security            NUMERIC,
            defect_liability_period         TEXT
        )
    """,
    "contract_management_payments_recoveries": f"""
        CREATE TABLE IF NOT EXISTS contract_management_payments_recoveries (
            id SERIAL PRIMARY KEY,
            {_COMMON_COLS},
            gross_amount_paid               NUMERIC,
            deductions                      NUMERIC,
            net_payment_amount              NUMERIC,
            advance_paid                    NUMERIC,
            advance_recovered               NUMERIC,
            labour_cess                     NUMERIC,
            cumulative_expenditure          NUMERIC,
            last_mb_number                  TEXT,
            date_of_last_mb                 DATE,
            work_done_percentage            NUMERIC
        )
    """,
    "contract_management_budget_summary": f"""
        CREATE TABLE IF NOT EXISTS contract_management_budget_summary (
            id SERIAL PRIMARY KEY,
            {_COMMON_COLS},
            sanctioned_budget               NUMERIC,
            current_year_allocation         NUMERIC,
            expenditure_this_year           NUMERIC,
            cumulative_expenditure          NUMERIC,
            balance_to_complete             NUMERIC,
            physical_progress               NUMERIC,
            financial_progress              NUMERIC,
            remarks                         TEXT
        )
    """,
    "contract_management_technical_inspection": f"""
        CREATE TABLE IF NOT EXISTS contract_management_technical_inspection (
            id SERIAL PRIMARY KEY,
            {_COMMON_COLS},
            ce_contractual_compliance               TEXT,
            ce_functionality_design_intent          TEXT,
            ce_environmental_social_aspects         TEXT,
            ce_safety_measures                      TEXT,
            ce_measurement_records                  TEXT,
            ce_progress_of_work                     TEXT,
            ce_workmanship_construction_quality     TEXT,
            ce_quality_of_materials                 TEXT,
            ce_conformity_design_drawings           TEXT,
            se_contractual_compliance               TEXT,
            se_functionality_design_intent          TEXT,
            se_environmental_social_aspects         TEXT,
            se_safety_measures                      TEXT,
            se_measurement_records                  TEXT,
            se_progress_of_work                     TEXT,
            se_workmanship_construction_quality     TEXT,
            se_quality_of_materials                 TEXT,
            se_conformity_design_drawings           TEXT,
            ee_contractual_compliance               TEXT,
            ee_functionality_design_intent          TEXT,
            ee_environmental_social_aspects         TEXT,
            ee_safety_measures                      TEXT,
            ee_measurement_records                  TEXT,
            ee_progress_of_work                     TEXT,
            ee_workmanship_construction_quality     TEXT,
            ee_quality_of_materials                 TEXT,
            ee_conformity_design_drawings           TEXT,
            tac_contractual_compliance              TEXT,
            tac_functionality_design_intent         TEXT,
            tac_environmental_social_aspects        TEXT,
            tac_safety_measures                     TEXT,
            tac_measurement_records                 TEXT,
            tac_progress_of_work                    TEXT,
            tac_workmanship_construction_quality    TEXT,
            tac_quality_of_materials                TEXT,
            tac_conformity_design_drawings          TEXT
        )
    """,
}


def _ensure_contract_tables():
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        for ddl in _CONTRACT_TABLE_SCHEMAS.values():
            cur.execute(ddl)
        conn.commit()
    except Exception as exc:
        if conn:
            conn.rollback()
        print(f"[WARN] Could not create contract tables: {exc}")
    finally:
        if cur:
            cur.close()
        if conn:
            release_connection(conn)


@app.on_event("startup")
def startup_event():
    _ensure_contract_tables()


# ── helpers ────────────────────────────────────────────────────────────────

def _make_token(user: dict) -> str:
    payload = {
        **user,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    return _decode_token(creds.credentials)


def _iso(v):
    if v is None:
        return None
    if hasattr(v, "isoformat"):
        return v.isoformat()
    return str(v)


def _int(v):
    try:
        return int(v or 0)
    except Exception:
        return 0


# ── schemas ────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class DPRUpsert(BaseModel):
    category_of_project: Optional[str] = None
    type_of_project: Optional[str] = None
    location_of_head_works: Optional[str] = None
    date_of_investement_clearance_by_goi: Optional[str] = None
    date_of_cwc_clearence: Optional[str] = None
    date_of_approval_of_efc: Optional[str] = None
    districts_covered: Optional[str] = None
    gross_command_area: Optional[str] = None
    cca: Optional[str] = None
    irrigation_potential_in_rabi: Optional[str] = None
    irrigation_potential_in_kharif: Optional[str] = None
    requirement_of_water_for_project: Optional[str] = None
    availability_of_water_against_the_requirement: Optional[str] = None
    pre_project_crop_pattern_in_rabi: Optional[str] = None
    pre_project_crop_pattern_in_kharif: Optional[str] = None
    post_project_crop_pattern_in_rabi: Optional[str] = None
    post_project_crop_pattern_in_kharif: Optional[str] = None
    # Revision fields
    date_of_approval_revised_dpr_revision_1: Optional[str] = None
    amount_of_revised_dpr_revision_1: Optional[str] = None
    target_date_to_complete_project_revision_1: Optional[str] = None
    date_of_approval_revised_dpr_revision_2: Optional[str] = None
    amount_of_revised_dpr_revision_2: Optional[str] = None
    target_date_to_complete_project_revision_2: Optional[str] = None
    date_of_approval_revised_dpr_revision_3: Optional[str] = None
    amount_of_revised_dpr_revision_3: Optional[str] = None
    target_date_to_complete_project_revision_3: Optional[str] = None
    date_of_approval_revised_dpr_revision_4: Optional[str] = None
    amount_of_revised_dpr_revision_4: Optional[str] = None
    target_date_to_complete_project_revision_4: Optional[str] = None
    date_of_approval_revised_dpr_revision_5: Optional[str] = None
    amount_of_revised_dpr_revision_5: Optional[str] = None
    target_date_to_complete_project_revision_5: Optional[str] = None
    date_of_approval_revised_dpr_revision_6: Optional[str] = None
    amount_of_revised_dpr_revision_6: Optional[str] = None
    target_date_to_complete_project_revision_6: Optional[str] = None


class EstimateCreate(BaseModel):
    estimate_number: str
    year_of_estimate: str


class ContractCreate(BaseModel):
    project_name: str
    estimate_number: str
    year_of_estimate: str


class StatusUpdate(BaseModel):
    status: str


# ── auth ──────────────────────────────────────────────────────────────────

@app.post("/api/auth/login")
def login(body: LoginRequest):
    user, error = auth_login(body.username, body.password)
    if error:
        status = 423 if "locked" in error.lower() else 401
        raise HTTPException(status_code=status, detail=error)
    token = _make_token(user)
    return {"token": token, "user": user}


@app.get("/api/auth/me")
def me(current_user: dict = Depends(get_current_user)):
    return current_user


@app.post("/api/auth/logout")
def logout():
    return {"ok": True}


# ── dashboard ─────────────────────────────────────────────────────────────

@app.get("/api/dashboard/stats")
def dashboard_stats(current_user: dict = Depends(get_current_user)):
    is_admin = (current_user.get("role") or "").lower() == "admin"
    user_id = current_user["id"]
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        uf = "" if is_admin else "AND m.user_id = %s"
        p = [] if is_admin else [user_id]

        cur.execute(f"""
            SELECT
                COUNT(DISTINCT LOWER(TRIM(name_of_project)))                         AS total_projects,
                COUNT(DISTINCT (LOWER(TRIM(estimate_number)), year_of_estimate))     AS total_estimates,
                COUNT(*)                                                             AS total_contracts
            FROM master_submission m
            WHERE module = 'contract_management' {uf}
        """, p)
        row = cur.fetchone()
        total_projects, total_estimates, total_contracts = row

        cur.execute(f"""
            SELECT COUNT(*) FROM project_dpr
            WHERE module = 'contract_management'
            {"" if is_admin else "AND user_id = %s"}
        """, [] if is_admin else [user_id])
        total_dprs = cur.fetchone()[0]

        return {
            "total_projects":  _int(total_projects),
            "total_estimates": _int(total_estimates),
            "total_contracts": _int(total_contracts),
            "total_dprs":      _int(total_dprs),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur: cur.close()
        if conn: release_connection(conn)


@app.get("/api/dashboard/mini-stats")
def dashboard_mini_stats(current_user: dict = Depends(get_current_user)):
    is_admin = (current_user.get("role") or "").lower() == "admin"
    user_id = current_user["id"]
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        uf_dpr  = "" if is_admin else "AND user_id = %s"
        uf_ms   = "" if is_admin else "AND m.user_id = %s"
        uf_ms2  = "" if is_admin else "AND user_id = %s"
        p       = [] if is_admin else [user_id]

        # ── DPR details ──
        cur.execute(f"""
            SELECT project_name, updated_at
            FROM project_dpr
            WHERE module = 'contract_management' {uf_dpr}
            ORDER BY updated_at DESC
        """, p)
        dpr_rows = cur.fetchall()
        dpr_details = [{"project_name": r[0], "updated_at": _iso(r[1])} for r in dpr_rows]
        dpr_project_set = {r[0].strip().lower() for r in dpr_rows}

        # ── Estimate details (grouped) ──
        cur.execute(f"""
            SELECT
                TRIM(name_of_project)                    AS project_name,
                TRIM(estimate_number)                    AS estimate_number,
                TRIM(CAST(year_of_estimate AS TEXT))     AS year_of_estimate,
                BOOL_OR(status = 'COMPLETED')            AS is_completed,
                MAX(created_at)                          AS latest_date,
                COUNT(*)                                 AS contract_count,
                SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) AS completed_count
            FROM master_submission
            WHERE module = 'contract_management'
              AND TRIM(COALESCE(estimate_number,'')) <> ''
              {uf_ms2}
            GROUP BY
                LOWER(TRIM(name_of_project)), TRIM(name_of_project),
                LOWER(TRIM(estimate_number)), TRIM(estimate_number),
                TRIM(CAST(year_of_estimate AS TEXT))
            ORDER BY MAX(created_at) DESC
        """, p)
        est_rows = cur.fetchall()
        est_details = []
        for r in est_rows:
            est_details.append({
                "project_name":    r[0],
                "estimate_number": r[1],
                "year_of_estimate": r[2],
                "status":          "COMPLETED" if r[3] else "INCOMPLETE",
                "latest_date":     _iso(r[4]),
                "contract_count":  _int(r[5]),
                "completed_count": _int(r[6]),
            })

        # ── Contract details (all rows) ──
        cur.execute(f"""
            SELECT m.id, TRIM(m.name_of_project), TRIM(m.estimate_number),
                   TRIM(CAST(m.year_of_estimate AS TEXT)), m.status, m.created_at,
                   u.username
            FROM master_submission m
            JOIN users u ON m.user_id = u.id
            WHERE m.module = 'contract_management' {uf_ms}
            ORDER BY m.created_at DESC
        """, p)
        con_rows = cur.fetchall()
        contract_details = []
        for r in con_rows:
            contract_details.append({
                "id":              r[0],
                "project_name":    r[1],
                "estimate_number": r[2],
                "year_of_estimate": r[3],
                "status":          r[4],
                "created_at":      _iso(r[5]),
                "username":        r[6],
            })

        # ── Project details (registry) ──
        cur.execute(f"""
            SELECT
                TRIM(name_of_project)                    AS project_name,
                COUNT(DISTINCT (LOWER(TRIM(estimate_number)), TRIM(CAST(year_of_estimate AS TEXT)))) AS estimate_count,
                SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) AS completed_count,
                COUNT(*) AS contract_count
            FROM master_submission
            WHERE module = 'contract_management'
              AND TRIM(COALESCE(name_of_project,'')) <> ''
              {uf_ms2}
            GROUP BY LOWER(TRIM(name_of_project)), TRIM(name_of_project)
            ORDER BY MAX(created_at) DESC
        """, p)
        proj_rows = cur.fetchall()
        project_details = []
        for r in proj_rows:
            project_details.append({
                "project_name":   r[0],
                "estimate_count": _int(r[1]),
                "completed_count": _int(r[2]),
                "contract_count": _int(r[3]),
                "has_dpr":        r[0].strip().lower() in dpr_project_set,
            })

        # ── Aggregate counts ──
        est_completed   = sum(1 for e in est_details if e["status"] == "COMPLETED")
        est_incomplete  = sum(1 for e in est_details if e["status"] != "COMPLETED")
        con_completed   = sum(1 for c in contract_details if c["status"] == "COMPLETED")
        con_incomplete  = sum(1 for c in contract_details if c["status"] != "COMPLETED")
        proj_completed  = sum(1 for p2 in project_details if p2["completed_count"] > 0 and p2["completed_count"] == p2["contract_count"])
        proj_incomplete = sum(1 for p2 in project_details if not (p2["completed_count"] > 0 and p2["completed_count"] == p2["contract_count"]))

        return {
            "dpr": {
                "total":    len(dpr_details),
                "details":  dpr_details,
            },
            "estimates": {
                "completed":  est_completed,
                "incomplete": est_incomplete,
                "details":    est_details,
            },
            "contracts": {
                "completed":  con_completed,
                "incomplete": con_incomplete,
                "details":    contract_details,
            },
            "projects": {
                "completed":  proj_completed,
                "incomplete": proj_incomplete,
                "details":    project_details,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur: cur.close()
        if conn: release_connection(conn)


# ── projects ──────────────────────────────────────────────────────────────

@app.get("/api/projects")
def list_projects(current_user: dict = Depends(get_current_user)):
    is_admin = (current_user.get("role") or "").lower() == "admin"
    user_id = current_user["id"]
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        uf = "" if is_admin else "AND user_id = %s"
        p  = [] if is_admin else [user_id]

        cur.execute(f"""
            SELECT
                TRIM(name_of_project)                                                   AS project_name,
                COUNT(DISTINCT (LOWER(TRIM(estimate_number)), year_of_estimate))        AS estimate_count,
                COUNT(*)                                                                AS contract_count,
                SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END)                  AS completed_count,
                MAX(created_at)                                                         AS last_updated
            FROM master_submission
            WHERE module = 'contract_management'
              AND TRIM(name_of_project) <> ''
              {uf}
            GROUP BY LOWER(TRIM(name_of_project)), TRIM(name_of_project)
            ORDER BY MAX(created_at) DESC
        """, p)

        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        for r in rows:
            r["last_updated"]    = _iso(r.get("last_updated"))
            r["estimate_count"]  = _int(r["estimate_count"])
            r["contract_count"]  = _int(r["contract_count"])
            r["completed_count"] = _int(r["completed_count"])

        # Attach has_dpr
        dpr_p = [] if is_admin else [user_id]
        dpr_uf = "" if is_admin else "AND user_id = %s"
        cur.execute(f"""
            SELECT LOWER(TRIM(project_name)) FROM project_dpr
            WHERE module = 'contract_management' {dpr_uf}
        """, dpr_p)
        dpr_set = {r2[0] for r2 in cur.fetchall()}
        for r in rows:
            r["has_dpr"] = r["project_name"].strip().lower() in dpr_set

        # Estimate completion counts per project
        cur.execute(f"""
            SELECT
                TRIM(project_name),
                SUM(CASE WHEN is_comp THEN 1 ELSE 0 END),
                SUM(CASE WHEN NOT is_comp THEN 1 ELSE 0 END)
            FROM (
                SELECT
                    TRIM(name_of_project) AS project_name,
                    BOOL_OR(status = 'COMPLETED') AS is_comp
                FROM master_submission
                WHERE module = 'contract_management'
                  AND TRIM(COALESCE(estimate_number, '')) <> ''
                  {uf}
                GROUP BY
                    LOWER(TRIM(name_of_project)), TRIM(name_of_project),
                    LOWER(TRIM(estimate_number)), TRIM(estimate_number),
                    TRIM(CAST(year_of_estimate AS TEXT))
            ) sub
            GROUP BY TRIM(project_name)
        """, p)
        est_map = {}
        for r2 in cur.fetchall():
            est_map[r2[0].strip().lower()] = {
                "est_completed": _int(r2[1]),
                "est_incomplete": _int(r2[2]),
            }

        # DPR identity fields per project
        cur.execute(f"""
            SELECT
                LOWER(TRIM(project_name)),
                COALESCE(type_of_project, ''),
                COALESCE(location_of_head_works, ''),
                COALESCE(districts_covered, ''),
                COALESCE(amount_of_revised_dpr_revision_1, ''),
                COALESCE(amount_of_revised_dpr_revision_2, ''),
                COALESCE(amount_of_revised_dpr_revision_3, ''),
                COALESCE(amount_of_revised_dpr_revision_4, ''),
                COALESCE(amount_of_revised_dpr_revision_5, ''),
                COALESCE(amount_of_revised_dpr_revision_6, '')
            FROM project_dpr
            WHERE module = 'contract_management' {dpr_uf}
        """, dpr_p)
        dpr_info_map = {}
        for r2 in cur.fetchall():
            pkey = r2[0]
            location = str(r2[2]).strip() or str(r2[3]).split(",")[0].strip()
            sanctioned = ""
            for i in range(4, 10):
                val = str(r2[i]).strip()
                if val:
                    sanctioned = val
                    break
            dpr_info_map[pkey] = {
                "type_of_project": str(r2[1]).strip(),
                "dpr_location": location,
                "sanctioned_amount": sanctioned,
            }

        # Attach extra fields and compute health %
        for r in rows:
            pkey = r["project_name"].strip().lower()
            est_info = est_map.get(pkey, {"est_completed": 0, "est_incomplete": 0})
            dpr_info = dpr_info_map.get(pkey, {"type_of_project": "", "dpr_location": "", "sanctioned_amount": ""})
            r["est_completed"]   = est_info["est_completed"]
            r["est_incomplete"]  = est_info["est_incomplete"]
            r["type_of_project"] = dpr_info["type_of_project"]
            r["dpr_location"]    = dpr_info["dpr_location"]
            r["sanctioned_amount"] = dpr_info["sanctioned_amount"]
            con_completed  = r["completed_count"]
            con_incomplete = r["contract_count"] - con_completed
            est_completed  = r["est_completed"]
            est_incomplete = r["est_incomplete"]
            total_items    = 1 + est_completed + est_incomplete + con_completed + con_incomplete
            done_items     = (1 if r["has_dpr"] else 0) + est_completed + con_completed
            r["health_pct"] = int((done_items / max(total_items, 1)) * 100)

        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur: cur.close()
        if conn: release_connection(conn)


@app.get("/api/projects/{project_name}")
def get_project(project_name: str, current_user: dict = Depends(get_current_user)):
    is_admin = (current_user.get("role") or "").lower() == "admin"
    user_id = current_user["id"]
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        uf = "" if is_admin else "AND user_id = %s"
        p  = [] if is_admin else [user_id]

        cur.execute(f"""
            SELECT
                COUNT(DISTINCT (LOWER(TRIM(estimate_number)), year_of_estimate)) AS estimate_count,
                COUNT(*)                                                          AS contract_count,
                SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END)            AS completed_count,
                MAX(created_at)                                                   AS last_updated
            FROM master_submission
            WHERE module = 'contract_management'
              AND LOWER(TRIM(name_of_project)) = LOWER(TRIM(%s))
              {uf}
        """, [project_name] + p)
        row = cur.fetchone()

        estimate_count  = _int(row[0]) if row else 0
        contract_count  = _int(row[1]) if row else 0
        completed_count = _int(row[2]) if row else 0
        last_updated    = _iso(row[3]) if row else None

        cur.execute(f"""
            SELECT COUNT(*) FROM project_dpr
            WHERE module = 'contract_management'
              AND LOWER(TRIM(project_name)) = LOWER(TRIM(%s))
              {"" if is_admin else "AND user_id = %s"}
        """, [project_name] + ([] if is_admin else [user_id]))
        has_dpr = (_int(cur.fetchone()[0])) > 0

        cur.execute(f"""
            SELECT
                TRIM(estimate_number)                                            AS estimate_number,
                TRIM(CAST(year_of_estimate AS TEXT))                            AS year_of_estimate,
                MAX(status)                                                      AS status,
                COUNT(*)                                                         AS contract_count,
                SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END)           AS completed_count,
                MAX(created_at)                                                  AS latest_date
            FROM master_submission
            WHERE module = 'contract_management'
              AND LOWER(TRIM(name_of_project)) = LOWER(TRIM(%s))
              AND TRIM(estimate_number) <> ''
              {uf}
            GROUP BY LOWER(TRIM(estimate_number)), TRIM(estimate_number), year_of_estimate
            ORDER BY MAX(created_at) DESC
        """, [project_name] + p)

        cols = [d[0] for d in cur.description]
        estimates = []
        for r in cur.fetchall():
            est = dict(zip(cols, r))
            est["latest_date"]    = _iso(est.get("latest_date"))
            est["contract_count"] = _int(est["contract_count"])
            est["completed_count"] = _int(est["completed_count"])
            estimates.append(est)

        # Contracts flat list
        con_uf = "" if is_admin else "AND m.user_id = %s"
        cur.execute(f"""
            SELECT m.id, TRIM(m.estimate_number) AS estimate_number,
                   TRIM(CAST(m.year_of_estimate AS TEXT)) AS year_of_estimate,
                   m.status, m.created_at, u.username AS created_by_user,
                   m.estimate_attachment
            FROM master_submission m
            JOIN users u ON m.user_id = u.id
            WHERE m.module = 'contract_management'
              AND LOWER(TRIM(m.name_of_project)) = LOWER(TRIM(%s))
              {con_uf}
            ORDER BY m.created_at DESC
        """, [project_name] + p)
        ccols = [d[0] for d in cur.description]
        contracts = []
        for r in cur.fetchall():
            c = dict(zip(ccols, r))
            c["created_at"] = _iso(c.get("created_at"))
            contracts.append(c)

        return {
            "project_name":    project_name,
            "estimate_count":  estimate_count,
            "contract_count":  contract_count,
            "completed_count": completed_count,
            "last_updated":    last_updated,
            "has_dpr":         has_dpr,
            "estimates":       estimates,
            "contracts":       contracts,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur: cur.close()
        if conn: release_connection(conn)


# ── DPR ───────────────────────────────────────────────────────────────────

@app.get("/api/projects/{project_name}/dpr")
def get_dpr(project_name: str, current_user: dict = Depends(get_current_user)):
    is_admin = (current_user.get("role") or "").lower() == "admin"
    user_id = current_user["id"]
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        project_key = " ".join(project_name.lower().split())
        cur.execute("""
            SELECT * FROM project_dpr
            WHERE module = 'contract_management'
              AND project_key = %s
              AND (%s OR user_id = %s)
            ORDER BY updated_at DESC LIMIT 1
        """, [project_key, is_admin, user_id])
        row = cur.fetchone()
        if not row:
            return None
        cols = [d[0] for d in cur.description]
        rec = dict(zip(cols, row))
        rec["created_at"] = _iso(rec.get("created_at"))
        rec["updated_at"] = _iso(rec.get("updated_at"))
        return rec
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur: cur.close()
        if conn: release_connection(conn)


@app.post("/api/projects/{project_name}/dpr")
def upsert_dpr(project_name: str, body: DPRUpsert, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        project_key = " ".join(project_name.strip().lower().split())

        fields = body.model_dump(exclude_none=True)

        # Build SET clause dynamically
        set_parts = []
        vals = []
        for col, val in fields.items():
            set_parts.append(f"{col} = %s")
            vals.append(val or None)
        set_parts.append("updated_at = NOW()")

        if set_parts:
            set_clause = ", ".join(set_parts)
            cur.execute(f"""
                UPDATE project_dpr
                SET {set_clause}
                WHERE user_id = %s AND module = 'contract_management' AND project_key = %s
            """, vals + [user_id, project_key])

            if cur.rowcount == 0:
                # Insert
                cols_str = ", ".join(["user_id", "module", "project_name", "project_key"] + list(fields.keys()) + ["created_at", "updated_at"])
                placeholders = ", ".join(["%s"] * (4 + len(fields)) + ["NOW()", "NOW()"])
                cur.execute(f"""
                    INSERT INTO project_dpr ({cols_str})
                    VALUES ({placeholders})
                """, [user_id, "contract_management", project_name.strip(), project_key] + list(v or None for v in fields.values()))

        conn.commit()
        return {"ok": True}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur: cur.close()
        if conn: release_connection(conn)


# ── estimates ─────────────────────────────────────────────────────────────

@app.post("/api/projects/{project_name}/estimates")
def create_estimate(project_name: str, body: EstimateCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        # Check duplicate
        cur.execute("""
            SELECT id FROM master_submission
            WHERE LOWER(TRIM(name_of_project)) = LOWER(TRIM(%s))
              AND LOWER(TRIM(estimate_number)) = LOWER(TRIM(%s))
              AND TRIM(CAST(year_of_estimate AS TEXT)) = TRIM(%s)
              AND module = 'contract_management'
              AND user_id = %s
            LIMIT 1
        """, [project_name, body.estimate_number, body.year_of_estimate, user_id])
        existing = cur.fetchone()
        if existing:
            raise HTTPException(status_code=409, detail=f"Estimate {body.estimate_number} ({body.year_of_estimate}) already exists for this project.")

        cur.execute("""
            SELECT COALESCE(MAX(cycle), 0) FROM master_submission
            WHERE user_id = %s AND module = 'contract_management'
        """, [user_id])
        cycle = cur.fetchone()[0] + 1

        cur.execute("""
            INSERT INTO master_submission
                (user_id, cycle, status, module, created_at, estimate_number, year_of_estimate, name_of_project)
            VALUES (%s, %s, 'DRAFT', 'contract_management', NOW(), %s, %s, %s)
            RETURNING id
        """, [user_id, cycle, body.estimate_number, body.year_of_estimate, project_name.strip()])
        master_id = cur.fetchone()[0]
        conn.commit()
        return {"master_id": master_id, "ok": True}
    except HTTPException:
        raise
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur: cur.close()
        if conn: release_connection(conn)


# ── contracts ─────────────────────────────────────────────────────────────

@app.get("/api/contracts")
def list_contracts(
    project: str = Query(...),
    est_no:  str = Query(...),
    est_yr:  str = Query(...),
    current_user: dict = Depends(get_current_user),
):
    is_admin = (current_user.get("role") or "").lower() == "admin"
    user_id = current_user["id"]
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        uf = "" if is_admin else "AND m.user_id = %s"
        p  = [] if is_admin else [user_id]

        cur.execute(f"""
            SELECT m.id, m.status, m.created_at, u.username AS created_by_user,
                   m.estimate_attachment, m.sar_attachment, m.cycle
            FROM master_submission m
            JOIN users u ON m.user_id = u.id
            WHERE m.module = 'contract_management'
              AND LOWER(TRIM(m.name_of_project)) = LOWER(TRIM(%s))
              AND LOWER(TRIM(m.estimate_number)) = LOWER(TRIM(%s))
              AND TRIM(CAST(m.year_of_estimate AS TEXT)) = TRIM(%s)
              {uf}
            ORDER BY m.created_at DESC
        """, [project, est_no, est_yr] + p)

        cols = [d[0] for d in cur.description]
        rows = []
        for r in cur.fetchall():
            rec = dict(zip(cols, r))
            rec["created_at"] = _iso(rec.get("created_at"))
            rows.append(rec)
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur: cur.close()
        if conn: release_connection(conn)


@app.post("/api/contracts")
def create_contract(body: ContractCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT COALESCE(MAX(cycle), 0) FROM master_submission
            WHERE user_id = %s AND module = 'contract_management'
        """, [user_id])
        cycle = cur.fetchone()[0] + 1

        cur.execute("""
            INSERT INTO master_submission
                (user_id, cycle, status, module, created_at, estimate_number, year_of_estimate, name_of_project)
            VALUES (%s, %s, 'DRAFT', 'contract_management', NOW(), %s, %s, %s)
            RETURNING id
        """, [user_id, cycle, body.estimate_number, body.year_of_estimate, body.project_name.strip()])
        master_id = cur.fetchone()[0]
        conn.commit()
        return {"master_id": master_id, "ok": True}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur: cur.close()
        if conn: release_connection(conn)


# ── submissions ───────────────────────────────────────────────────────────

@app.get("/api/submissions/{sub_id}")
def get_submission(sub_id: int, current_user: dict = Depends(get_current_user)):
    is_admin = (current_user.get("role") or "").lower() == "admin"
    user_id = current_user["id"]
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT m.id, m.user_id, m.cycle, m.status, m.module,
                   m.estimate_number, TRIM(CAST(m.year_of_estimate AS TEXT)) AS year_of_estimate,
                   m.name_of_project, m.created_at, m.estimate_attachment, m.sar_attachment,
                   u.username AS created_by_user
            FROM master_submission m
            JOIN users u ON m.user_id = u.id
            WHERE m.id = %s
              AND (%s OR m.user_id = %s)
        """, [sub_id, is_admin, user_id])
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Submission not found")
        cols = [d[0] for d in cur.description]
        rec = dict(zip(cols, row))
        rec["created_at"] = _iso(rec.get("created_at"))

        # Also fetch table data from contract_management tables
        cur.execute("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema='public' AND table_type='BASE TABLE'
              AND (table_name LIKE 'contract_management_%' OR table_name LIKE 'canal_performance_%')
            ORDER BY table_name
        """)
        tables = [r[0] for r in cur.fetchall()]

        table_data = {}
        for table in tables:
            # safe check - only alphanumeric and underscores
            import re as _re
            if not _re.match(r'^[A-Za-z_][A-Za-z0-9_]*$', table):
                continue
            cur.execute(f"""
                SELECT * FROM "{table}" WHERE master_id = %s
            """, [sub_id])
            trows = cur.fetchall()
            if trows:
                tcols = [d[0] for d in cur.description]
                # exclude system cols
                sys_cols = {'id','user_id','module','created_by','is_draft','master_id',
                           'submitted_at','approval_status','approved_at','rejected_at',
                           'status','approved_by','draft_id','updated_at'}
                filtered_cols = [c for c in tcols if c not in sys_cols]
                table_data[table] = []
                for tr in trows:
                    row_dict = dict(zip(tcols, tr))
                    filtered_row = {k: (_iso(v) if hasattr(v, 'isoformat') else v)
                                   for k, v in row_dict.items() if k in filtered_cols}
                    table_data[table].append(filtered_row)

        rec["table_data"] = table_data
        return rec
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur: cur.close()
        if conn: release_connection(conn)


@app.patch("/api/submissions/{sub_id}/status")
def update_submission_status(sub_id: int, body: StatusUpdate, current_user: dict = Depends(get_current_user)):
    is_admin = (current_user.get("role") or "").lower() == "admin"
    user_id = current_user["id"]
    if body.status not in ("DRAFT", "COMPLETED"):
        raise HTTPException(status_code=400, detail="Invalid status")
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE master_submission SET status = %s
            WHERE id = %s AND (%s OR user_id = %s)
        """, [body.status, sub_id, is_admin, user_id])
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Submission not found")
        conn.commit()
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur: cur.close()
        if conn: release_connection(conn)


# ── contract table columns & form data ───────────────────────────────────

_CONTRACT_TABLE_RE = _re.compile(r'^contract_management_[A-Za-z0-9_]+$')

_SYSTEM_COLS = {
    'id', 'user_id', 'module', 'created_by', 'is_draft', 'master_id',
    'submitted_at', 'approval_status', 'approved_at', 'submission_cycle',
    'created_at', 'updated_at', 'status', 'approved_by', 'draft_id', 'rejected_at',
}


@app.get("/api/tables/{table_name}/columns")
def get_table_columns(table_name: str, _current_user: dict = Depends(get_current_user)):
    if not _CONTRACT_TABLE_RE.match(table_name):
        raise HTTPException(status_code=400, detail="Invalid table name")
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position
        """, [table_name])
        rows = [
            {"column_name": r[0], "data_type": r[1], "is_nullable": r[2]}
            for r in cur.fetchall()
            if r[0] not in _SYSTEM_COLS
        ]
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur: cur.close()
        if conn: release_connection(conn)


class TableDataSave(BaseModel):
    data: Dict[str, Any]


@app.post("/api/submissions/{sub_id}/tables/{table_name}")
def save_table_section(
    sub_id: int,
    table_name: str,
    body: TableDataSave,
    current_user: dict = Depends(get_current_user),
):
    if not _CONTRACT_TABLE_RE.match(table_name):
        raise HTTPException(status_code=400, detail="Invalid table name")
    is_admin = (current_user.get("role") or "").lower() == "admin"
    user_id = current_user["id"]
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT id, user_id, estimate_number, year_of_estimate, name_of_project
            FROM master_submission WHERE id = %s AND (%s OR user_id = %s)
        """, [sub_id, is_admin, user_id])
        master = cur.fetchone()
        if not master:
            raise HTTPException(status_code=404, detail="Submission not found")
        master_owner_id, est_no, est_yr, proj = master[1], master[2], master[3], master[4]

        cur.execute("""
            SELECT column_name, data_type FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
        """, [table_name])
        valid_cols = {r[0]: r[1] for r in cur.fetchall()}
        if not valid_cols:
            raise HTTPException(status_code=404, detail="Table not found")

        save = {}
        for k, v in body.data.items():
            if k in _SYSTEM_COLS or k not in valid_cols:
                continue
            save[k] = None if v == "" else v

        if "estimate_number" in valid_cols:   save["estimate_number"] = est_no
        if "year_of_estimate" in valid_cols:  save["year_of_estimate"] = est_yr
        if "name_of_project" in valid_cols:   save["name_of_project"] = proj
        if "created_by" in valid_cols:        save["created_by"] = master_owner_id
        if "master_id" in valid_cols:         save["master_id"] = sub_id
        if "is_draft" in valid_cols:          save["is_draft"] = True

        cur.execute(f'SELECT id FROM "{table_name}" WHERE master_id = %s LIMIT 1', [sub_id])
        existing = cur.fetchone()

        if existing:
            set_clause = ", ".join(f'"{k}" = %s' for k in save)
            cur.execute(
                f'UPDATE "{table_name}" SET {set_clause} WHERE id = %s',
                list(save.values()) + [existing[0]],
            )
        else:
            cols_sql = ", ".join(f'"{k}"' for k in save)
            placeholders = ", ".join(["%s"] * len(save))
            cur.execute(
                f'INSERT INTO "{table_name}" ({cols_sql}) VALUES ({placeholders})',
                list(save.values()),
            )

        conn.commit()
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur: cur.close()
        if conn: release_connection(conn)


# ── file upload ───────────────────────────────────────────────────────────

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    _current_user: dict = Depends(get_current_user),
):
    ext = Path(file.filename).suffix if file.filename else ".bin"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest = UPLOAD_DIR / unique_name
    with open(dest, "wb") as fout:
        shutil.copyfileobj(file.file, fout)
    return {"path": f"uploads/{unique_name}", "original": file.filename}


class AttachmentUpdate(BaseModel):
    attachment_type: str  # "estimate" or "sar"
    path: str


@app.patch("/api/submissions/{sub_id}/attachments")
def update_attachment(
    sub_id: int,
    body: AttachmentUpdate,
    current_user: dict = Depends(get_current_user),
):
    is_admin = (current_user.get("role") or "").lower() == "admin"
    user_id = current_user["id"]
    col = "estimate_attachment" if body.attachment_type == "estimate" else "sar_attachment"
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            f'UPDATE master_submission SET "{col}" = %s WHERE id = %s AND (%s OR user_id = %s)',
            [body.path, sub_id, is_admin, user_id],
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Submission not found")
        conn.commit()
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur: cur.close()
        if conn: release_connection(conn)


# ── global registry ───────────────────────────────────────────────────────

@app.get("/api/global/dprs")
def global_dprs(current_user: dict = Depends(get_current_user)):
    is_admin = (current_user.get("role") or "").lower() == "admin"
    user_id = current_user["id"]
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        uf = "" if is_admin else "AND user_id = %s"
        p: List = [] if is_admin else [user_id]
        cur.execute(f"""
            SELECT project_name, category_of_project, type_of_project,
                   location_of_head_works, districts_covered,
                   updated_at, created_at
            FROM project_dpr
            WHERE module = 'contract_management' {uf}
            ORDER BY COALESCE(updated_at, created_at) DESC
        """, p)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        for r in rows:
            r["updated_at"] = _iso(r.get("updated_at"))
            r["created_at"] = _iso(r.get("created_at"))
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur: cur.close()
        if conn: release_connection(conn)


@app.get("/api/global/estimates")
def global_estimates(current_user: dict = Depends(get_current_user)):
    is_admin = (current_user.get("role") or "").lower() == "admin"
    user_id = current_user["id"]
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        uf = "" if is_admin else "AND m.user_id = %s"
        p: List = [] if is_admin else [user_id]
        cur.execute(f"""
            SELECT
                TRIM(m.name_of_project)                                  AS project_name,
                TRIM(m.estimate_number)                                  AS estimate_number,
                TRIM(CAST(m.year_of_estimate AS TEXT))                   AS year_of_estimate,
                COUNT(*)                                                  AS contract_count,
                SUM(CASE WHEN m.status='COMPLETED' THEN 1 ELSE 0 END)   AS completed_count,
                MAX(m.created_at)                                         AS latest_date
            FROM master_submission m
            WHERE m.module = 'contract_management'
              AND TRIM(m.name_of_project) <> '' {uf}
            GROUP BY LOWER(TRIM(m.name_of_project)), TRIM(m.name_of_project),
                     LOWER(TRIM(m.estimate_number)), TRIM(m.estimate_number),
                     TRIM(CAST(m.year_of_estimate AS TEXT))
            ORDER BY MAX(m.created_at) DESC
        """, p)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        for r in rows:
            r["latest_date"]     = _iso(r.get("latest_date"))
            r["contract_count"]  = _int(r["contract_count"])
            r["completed_count"] = _int(r["completed_count"])
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur: cur.close()
        if conn: release_connection(conn)


# ── admin ─────────────────────────────────────────────────────────────────

def _require_admin(current_user: dict):
    if (current_user.get("role") or "").lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin only")


@app.get("/api/admin/users")
def admin_list_users(current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, username, role, is_active, allowed_modules
            FROM users ORDER BY id
        """)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        for r in rows:
            r["created_at"] = None
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur: cur.close()
        if conn: release_connection(conn)


class CreateUserBody(BaseModel):
    username: str
    password: str
    role: str = "operator"
    allowed_modules: str = ""


@app.post("/api/admin/users")
def admin_create_user(body: CreateUserBody, current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    if not body.username.strip() or not body.password:
        raise HTTPException(status_code=400, detail="Username and password required")
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE LOWER(username)=LOWER(%s)", [body.username])
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="Username already exists")
        pw_hash = hash_password(body.password)
        cur.execute("""
            INSERT INTO users (username, password_hash, role, is_active, allowed_modules)
            VALUES (%s, %s, %s, TRUE, %s) RETURNING id
        """, [body.username.strip(), pw_hash, body.role, body.allowed_modules])
        new_id = cur.fetchone()[0]
        conn.commit()
        return {"id": new_id, "ok": True}
    except HTTPException:
        raise
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur: cur.close()
        if conn: release_connection(conn)


class UpdateUserBody(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None
    allowed_modules: Optional[str] = None


@app.patch("/api/admin/users/{uid}")
def admin_update_user(uid: int, body: UpdateUserBody, current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        sets, vals = [], []
        if body.role is not None:
            sets.append("role = %s"); vals.append(body.role)
        if body.is_active is not None:
            sets.append("is_active = %s"); vals.append(body.is_active)
        if body.allowed_modules is not None:
            sets.append("allowed_modules = %s"); vals.append(body.allowed_modules)
        if not sets:
            return {"ok": True}
        vals.append(uid)
        cur.execute(f"UPDATE users SET {', '.join(sets)} WHERE id = %s", vals)
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")
        conn.commit()
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur: cur.close()
        if conn: release_connection(conn)


@app.get("/api/admin/submissions")
def admin_list_submissions(current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT m.id, m.status, m.module, m.name_of_project,
                   m.estimate_number, TRIM(CAST(m.year_of_estimate AS TEXT)) AS year_of_estimate,
                   m.created_at, u.username AS created_by_user
            FROM master_submission m
            JOIN users u ON m.user_id = u.id
            WHERE m.module = 'contract_management'
            ORDER BY m.created_at DESC
        """)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        for r in rows:
            r["created_at"] = _iso(r.get("created_at"))
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur: cur.close()
        if conn: release_connection(conn)


# ── health ────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok"}
