# CAG Audit Management System
## Production Release Document (Government Submission Copy)

Document ID: `CAG-AMS-REL-1.0`  
Version: `1.0`  
Release Date: `09 April 2026`  
Prepared For: `Comptroller and Auditor General of India (CAG)`  
System: `Audit Management System - Irrigation Audit Wing`  
Prepared By: `Application Engineering Team`

---

## 1. Document Control

| Field | Value |
|---|---|
| Document Type | Production Release Note and Screen Register |
| Classification | Internal Government Use |
| Target Environment | Production |
| Application Stack | Streamlit + Python + PostgreSQL |
| Release Scope | Operator and Administrator workflows |

---

## 2. Release Summary

This release includes the complete operational workflow for:

1. Secure authentication and role-based access.
2. Operator-side estimate creation and section-wise data entry.
3. Administrator-side review, user creation, and permission management.
4. Draft and submission lifecycle support with module-wise progress tracking.

---

## 3. Validation Summary (Release Readiness Evidence)

### 3.1 Functional and Unit Validation

1. Unit and integration test suite executed: `57/57 PASSED`.
2. Authentication, user management, submission creation, and section save flows validated.

### 3.2 Concurrent Load Validation

Target requested: `300 users at a time`  
Validation command executed in production-like local setup:

```powershell
python load_test.py --users 300 --concurrency 300 --module contract_management --fill-scope first --cleanup --fail-on-errors --json-out .tmp\loadtest_300_fixed.json
```

Result:

1. Success count: `300`
2. Failure count: `0`
3. Success rate: `100%`
4. Evidence file: `.tmp/loadtest_300_fixed.json`

---

## 4. Deployment and Configuration Notes

### 4.1 Mandatory Runtime Settings

1. `DB_HOST`
2. `DB_NAME`
3. `DB_USER`
4. `DB_PASSWORD`
5. `DB_PORT`
6. `COOKIE_PASSWORD` (minimum 16 characters)

### 4.2 Connection Pool Tuning Parameters

1. `DB_POOL_MINCONN` (default `1`)
2. `DB_POOL_MAXCONN` (default `80`)
3. `DB_POOL_WAIT_TIMEOUT` (default `30` seconds)
4. `DB_POOL_WAIT_POLL_INTERVAL` (default `0.05` seconds)

---

## 5. User Roles in Scope

1. `Operator`
 - Creates estimates.
 - Fills module sections.
 - Saves drafts and submits applications.
2. `Administrator`
 - Reviews applications.
 - Creates users.
 - Revokes or grants user access.
 - Updates module permissions.

---

## 6. Screen Register With Release Screenshots

### 6.1 Login Page
![01 Login Page](screenshots/01_login_page.png)

### 6.2 Operator Dashboard
![02 Operator Dashboard](screenshots/02_operator_dashboard.png)

### 6.3 New Estimate Dialog (Blank)
![03 New Estimate Dialog](screenshots/03_new_estimate_dialog.png)

### 6.4 New Estimate Dialog (Filled)
![04 New Estimate Dialog Filled](screenshots/04_new_estimate_filled.png)

### 6.5 Contract Management Module - Overview
![05 Module Form Overview](screenshots/05_module_form_overview.png)

### 6.6 Tab: Admin Financial Sanction
![06 Admin Financial Sanction](screenshots/06_tab_admin_financial_sanction.png)

### 6.7 Tab: Technical Sanction
![07 Technical Sanction](screenshots/07_tab_technical_sanction.png)

### 6.8 Tab: Tender Award Contract
![08 Tender Award Contract](screenshots/08_tab_tender_award_contract.png)

### 6.9 Tab: Contract Master
![09 Contract Master](screenshots/09_tab_contract_master.png)

### 6.10 Tab: Payments Recoveries
![10 Payments Recoveries](screenshots/10_tab_payments_recoveries.png)

### 6.11 Tab: Budget Summary
![11 Budget Summary](screenshots/11_tab_budget_summary.png)

### 6.12 Post Logout Screen
![12 Login After Logout](screenshots/12_login_after_logout.png)

### 6.13 Admin Panel: Review Applications
![13 Admin Review Applications](screenshots/13_admin_review_applications.png)

### 6.14 Admin Panel: Create User
![14 Admin Create User](screenshots/14_admin_create_user.png)

### 6.15 Admin Panel: Manage Users
![15 Admin Manage Users](screenshots/15_admin_manage_users.png)

### 6.16 Admin Panel: Review Applications (All Users)
![16 Admin Review All Users](screenshots/16_admin_review_all_users.png)

### 6.17 Operator Estimate Dialog
![17 Operator Estimate Dialog](screenshots/17_operator_estimate_dialog.png)

---

## 7. Operational Runbook

### 7.1 Start Application

```powershell
streamlit run app.py
```

### 7.2 Health Verification

1. Login page renders.
2. Operator and admin logins succeed.
3. Database read/write operations succeed for draft save.

### 7.3 Rollback Guidance

1. Retain previous release package and dependency lock.
2. Re-point service start command to previous application build.
3. Restore DB from latest pre-release backup if schema/data change rollback is required.

---

## 8. Security and Governance Checklist

1. Role-based access controls validated for operator/admin roles.
2. Password hashing and verification enabled.
3. Cookie secret policy enforced.
4. DB connection pool controls added for concurrency resilience.
5. Release evidence includes functional and load validation outputs.

---

## 9. Sign-off Section

| Role | Name | Signature | Date | Status |
|---|---|---|---|---|
| Project Owner |  |  |  |  |
| Application Administrator |  |  |  |  |
| Information Security Officer |  |  |  |  |
| Deployment Authority |  |  |  |  |

---

## 10. Release Package Contents

1. Source application files (`app.py`, `auth.py`, `crud.py`, supporting assets)
2. Release documentation: this file
3. Screen evidence: `release/screenshots/`
4. Load validation evidence: `.tmp/loadtest_300_fixed.json`

