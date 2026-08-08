# Product Requirements Document
## Internal Break Test Logging App (SGCC QA Production Testing)

**Version:** 1.0
**Date:** August 6, 2026
**Author:** [Your Name]
**Status:** Draft for build

---

## 1. Purpose

Replace paper-based Daily Tempering Break Test Logs and Laminated Ball Drop Test Logs (per SGCC SD-211 Appendix A) with a simple, self-hosted, mobile-friendly web app. The app must satisfy SGCC's requirement that production test records be traceable, dated/timed, and retained for a minimum of 10 years.

## 2. Background

SGCC SD-211 requires two recurring in-plant production tests:

- **Tempered (Center Punch):** minimum of first-of-each-thickness-per-shift, logged on a Daily Tempering Break Test Log.
- **Laminated (Ball Drop):** minimum weekly sample collection, monthly testing, logged on a Laminated Glass Ball Drop Test Log with traceability and testing sections.

Both logs currently exist as paper/Excel forms (see Appendix A of SD-211). The goal is a digital form that mirrors these fields, works well on a phone on the shop floor, supports a photo of each test/specimen, and is usable by bilingual (English/Spanish) staff.

## 3. Goals

- Digitize both test logs with the exact fields required by SD-211.
- Make data entry fast on a phone (large touch targets, minimal typing, dropdowns/pickers over free text where possible).
- Capture a photo per test entry, triggering the device camera directly on mobile.
- Support English and Spanish, switchable by the user, saved as a preference.
- Support light and dark mode, switchable by the user, saved as a preference.
- Run as a single self-hosted Docker container (plus a database container if needed) with no external cloud dependency.
- Keep the UI as simple as possible — this is a shop-floor tool, not an enterprise QA suite.

## 4. Non-Goals

- No integration with SGCC or external certification bodies.
- No user-facing analytics/dashboards beyond basic filtering and export (nice-to-have only).
- No offline-first / PWA sync requirement in v1 (assume plant has reliable local Wi-Fi). Flag as a future enhancement.
- No multi-tenant support — this is single-plant/single-org internal use.

## 5. Users

- **Operators / Technicians:** log tests during production, mostly on a phone or tablet at the line.
- **QA Representative (Designated Rep):** reviews records, exports data for the twice-yearly SGCC audit.
- **Admin:** manages users and product/thickness lists.

## 6. Core Features

### 6.1 Authentication
- Simple username/password login. No self-registration — accounts created by Admin.
- Roles: Operator, QA Rep, Admin.
- Session stays logged in on shared shop-floor devices for a configurable period.

### 6.2 Language
- Toggle between English and Spanish from any screen (e.g., a flag/globe icon in the header).
- Preference persists per user.
- All labels, buttons, validation messages, and the two form types are fully translated.

### 6.3 Theme
- Light/dark toggle, persists per user. Default to system preference on first login.

### 6.4 Auto-Calculation Principle

Wherever a value can be derived from other entered fields, the app should calculate it automatically rather than asking the operator to type or look it up — for example: max allowable particle weight from specimen dimensions/weight, date/time defaulting to "now," operator defaulting to the logged-in user, drop height/tolerance from the selected Class, and a suggested Pass/Fail from the entered measurements. The one exception is Pass/Fail itself: the app may pre-select a suggested result, but it must always require the operator to actively confirm it before the record can be saved (see 6.5 and 6.6) — this is a judgment/compliance step that should never be silently automated.

### 6.5 Tempered — Daily Break Test Log
Fields (per SD-211 Appendix A):

| Field | Type | Notes |
|---|---|---|
| Date | Date, auto-filled, editable | |
| Time | Time, auto-filled, editable | |
| SGCC # | Text | |
| Glass Type | Select: TTG (Non-Pattern) / TPG (Pattern) | |
| Thickness | Select | List configurable by Admin (e.g., 1/8", 5/32", 3/16", 1/4", 5/16", 3/8", 1/2", 5/8", 3/4") |
| Sample Size | Text or Select | e.g., 34x76 |
| Maximum Allowable Particle Weight | Number (grams), auto-calculated | Formula: `((specimen weight lbs / (34x76 in²)) x 10 in²) x 453.59` — allow manual override |
| Actual 10-Piece Particle Weight | Number (grams) | |
| Pass/Fail | Select: Pass / Fail — **requires operator confirmation** | System auto-calculates a suggested result by comparing actual vs. maximum allowable particle weight, but the record cannot be saved until the operator explicitly confirms Pass or Fail. The suggested value is pre-selected but must be actively confirmed, not just left as a default. |
| Operator | Auto-filled from logged-in user, editable | |
| Photo | Camera capture | See 6.6 |
| Notes | Free text, optional | |

Reminder banner on the entry screen: *"Must test first product of each thickness per shift and thickness change."*

### 6.6 Laminated — Ball Drop Test Log
Two related record types, matching the SD-211 form structure:

**A. Specimen Traceability (collected weekly)**
| Field | Type |
|---|---|
| Date of Production | Date |
| Time of Production | Time |
| SGCC # (if applicable) | Text |
| Interlayer Type & Trade Name (e.g., PVB/Sentry/EVA) | Text |
| Type (Clear / Low-E / Satin) | Select |
| Kind (AN, HS, FT, CS) | Select |
| Thickness (nominal) | Select, Admin-configurable list |
| Week collected | Select: Week 1–4 |

**B. Test Results (performed at least monthly, within 30 days of collection)**
| Field | Type |
|---|---|
| Specimen # (1–4, min 3) | Select |
| Date Tested | Date |
| Time Tested | Time |
| Specimen Temperature | Number (°C or °F, unit toggle) |
| Measured Minimum Thickness | Number, multiple location entries allowed |
| Drop Height / Class | Select: Class A (3.66 m / 12 ft) or Class B (0.75 m / 2.46 ft) — auto-fills the standard drop height/tolerance, editable |
| Pass/Fail | Select: 1, 2, 3, or 4 (per ASTM F3007-13 Table 1) — **requires operator confirmation**, same pattern as the tempered log: the app can pre-select a suggested category based on entered results where the criteria are objective, but the operator must actively confirm before the record saves |
| Photo | Camera capture, one per specimen |
| Notes | Free text, optional |

Each traceability record can have 3–4 linked test result entries.

### 6.7 Photo Capture
- On mobile, the "Add Photo" button must open the device camera directly (use `<input type="file" accept="image/*" capture="environment">` or equivalent) rather than a generic file picker.
- On desktop, fall back gracefully to a standard file upload.
- Store photos linked to the specific test record; allow viewing/replacing before submit.
- Compress images client-side before upload to keep storage reasonable (e.g., max 1600px longest edge, JPEG ~80% quality).

### 6.8 Record Management
- List/search/filter view by date range, glass type, SGCC #, pass/fail, operator.
- Edit records (with an audit trail: who edited, when, what changed) — records should not be silently overwritten, since these are compliance records.
- Export to CSV and PDF (for audit prep) filtered by date range — supports the SGCC requirement to produce historical testing records for the auditor.
- Records retained indefinitely by default (SD-211 requires a 10-year minimum) — no auto-delete.

### 6.9 Admin
- Manage users and roles.
- Manage configurable dropdown lists (thicknesses, glass kinds, interlayer types).
- View/download full data export.

## 7. Non-Functional Requirements

- **Mobile-first responsive design:** primary use case is a phone at the production line; desktop/tablet is secondary.
- **Simplicity:** minimize taps/fields; use pickers and sane defaults over typing.
- **Self-hosted:** ships as Docker Compose — one container for the app, one for the database. No external services required to operate.
- **Data durability:** database on a persistent Docker volume; document a backup approach (e.g., scheduled `pg_dump` or SQLite file copy).
- **Security:** password hashing (bcrypt/argon2), HTTPS-ready (behind reverse proxy — document this), no data leaves the local network by default.
- **Performance:** usable on low-end Android devices and spotty Wi-Fi typical of a plant floor.

## 8. Tech Stack (decided)

- **Frontend:** React (or plain server-rendered templates) with a mobile-first CSS framework (e.g., Tailwind), i18n via a lightweight library (e.g., `react-i18next` or simple JSON dictionaries).
- **Backend:** Node.js/Express or Python/FastAPI — single process.
- **Database:** MariaDB, on a mounted volume.
- **DB Administration / Backups:** phpMyAdmin container in the same stack, for browsing data and performing manual/exported backups (SQL dump via phpMyAdmin's export feature). Document a scheduled `mysqldump` / `mariabackup` cron job on the host as the primary automated backup method, with phpMyAdmin as the manual/ad-hoc option.
- **Photo storage:** filesystem on a mounted volume, referenced by path in the DB (simplest for self-hosting; avoids needing S3).
- **Packaging:** `docker-compose.yml` wiring three services — app, MariaDB, phpMyAdmin — plus named volumes for DB data and photos.
- **Hosting:** Linux VM on Proxmox, running Docker + Docker Compose. No cloud dependency.

## 9. Success Criteria

- An operator can log a complete tempered break test, including a photo taken with their phone camera, in under 60 seconds.
- A QA Rep can pull all records for a given month/product and export them as PDF/CSV for an auditor within a couple of minutes.
- App runs with `docker compose up` on a local server/NAS with no external dependencies.
- All UI text is available in English and Spanish with no missing translation strings.

## 10. Decisions Log

- **Database:** MariaDB, with phpMyAdmin included in the stack for browsing/manual backups.
- **Pass/Fail:** always requires explicit operator confirmation, even when the app suggests a result.
- **Hosting:** Linux VM on Proxmox, Docker + Docker Compose.

## 11. Open Questions

- Any requirement for barcode/QR scanning of SGCC # in the future?
- Automated backup schedule/retention for `mysqldump` on the host — nightly? weekly?
- Should phpMyAdmin be reachable only from the VM's local network, or also need to be reverse-proxied with its own auth?

---

# Build Prompt for Google Antigravity IDE 2.0

Copy the block below into Antigravity IDE 2.0 as the initial build prompt.

```
Build a self-hosted, mobile-first, bilingual (English/Spanish) internal web app 
for logging glass safety-testing records at a manufacturing plant, per the 
attached PRD. Target deployment is a Linux VM on Proxmox running Docker + 
Docker Compose. Key requirements:

1. STACK: Docker Compose setup with three services:
   - App container (Node.js/Express + React frontend, or Python/FastAPI + 
     server-rendered templates, your choice).
   - MariaDB container for the database, with a named volume for data 
     persistence.
   - phpMyAdmin container, connected to the MariaDB instance, for browsing 
     data and performing manual/exported SQL backups.
   Use a named volume for uploaded photos as well. No external/cloud 
   services required to operate.

2. AUTH: Simple username/password login, roles = Operator, QA Rep, Admin. 
   Accounts created by Admin only, no public registration. Hash passwords 
   with bcrypt or argon2.

3. TWO RECORD TYPES:
   a) Tempered Break Test — fields: date, time, SGCC #, glass type 
      (TTG/TPG), thickness (dropdown), sample size, max allowable particle 
      weight (auto-calculated from the formula 
      ((specimen weight lbs / (34x76 in²)) x 10 in²) x 453.59, editable), 
      actual 10-piece particle weight, pass/fail, operator, photo, notes.
   b) Laminated Ball Drop Test — a traceability record (date/time of 
      production, SGCC #, interlayer type & trade name, type, kind, 
      nominal thickness, collection week) with 3–4 linked test result 
      entries (date/time tested, specimen temperature, measured minimum 
      thickness, drop height/class A or B, pass/fail 1–4, photo, notes).

4. AUTO-CALCULATION: Automate every field that can be derived from other 
   entered data rather than making the operator type or look it up — e.g. 
   max allowable particle weight, date/time defaults to "now," operator 
   defaults to the logged-in user, drop height/tolerance from the selected 
   Class. The single exception is Pass/Fail (see #5) — never auto-save a 
   Pass/Fail result without explicit operator confirmation.

5. PASS/FAIL CONFIRMATION (required, not optional): For both record types, 
   the app may calculate and pre-select a suggested Pass/Fail result based 
   on the entered measurements, but the record CANNOT be saved until the 
   operator explicitly confirms that result (e.g. a confirmation tap/toggle 
   distinct from just leaving a pre-filled default in place). This is a 
   hard requirement, not a nice-to-have.

6. PHOTOS: The "add photo" control must trigger the device camera directly 
   on mobile (use capture="environment" on a file input, or the 
   MediaDevices/getUserMedia API), with a normal file picker fallback on 
   desktop. Compress images client-side (max ~1600px longest edge, ~80% 
   JPEG quality) before upload. Store on the filesystem volume, reference 
   by path in the database.

7. I18N: Full English/Spanish support via a translation dictionary 
   (JSON per language). Language toggle available on every screen, 
   persisted per user. No hard-coded UI strings outside the dictionaries.

8. THEME: Light/dark mode toggle, persisted per user, defaults to system 
   preference on first login.

9. UI: Mobile-first, large touch targets, minimal typing — use dropdowns/
   selects for anything with a fixed set of values (thickness, glass 
   kind, class) instead of free text. Keep every screen as simple as 
   possible; this is a shop-floor tool used quickly between production 
   runs, not a data-entry-heavy enterprise app.

10. RECORDS: List/search/filter by date range, SGCC #, glass type, 
    pass/fail, operator. Records are never hard-deleted; edits are 
    tracked with who/when/what changed (audit trail), since these are 
    compliance records that must be retained a minimum of 10 years. 
    Support CSV and PDF export filtered by date range for audit prep.

11. ADMIN: Manage users/roles and manage the configurable dropdown lists 
    (thicknesses, glass kinds, interlayer types).

12. DELIVERABLES: Dockerfile(s), docker-compose.yml (app + MariaDB + 
    phpMyAdmin + named volumes), database migration/schema script, seed 
    script for an initial Admin user, and a short README covering: how to 
    run with `docker compose up` on the Proxmox VM, how to put the app 
    behind a reverse proxy for HTTPS, how to restrict/secure phpMyAdmin 
    access, and how to back up the MariaDB data and photo volume (both via 
    phpMyAdmin export and a scheduled `mysqldump` approach).

Prioritize simplicity, reliability, and mobile usability over feature 
breadth. Ask me clarifying questions only if something in the PRD is 
ambiguous enough to block implementation.
```
