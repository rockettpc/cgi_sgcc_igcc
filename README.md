# SGCC & ASTM Quality Assurance Production Testing App

Self-hosted, mobile-first, bilingual (English & Spanish) web application designed for logging glass safety-testing records in manufacturing plants according to **SGCC SD-211 Quality Assurance Guidelines** and **ASTM Standards (ASTM C1651 & ASTM F3007-13)**.

Target deployment is a Linux VM on **Proxmox** running **Docker + Docker Compose**.

---

## 📸 Interface Screenshots

### Main Dashboard & Compliance Reminder
![SGCC QA Main Dashboard](docs/screenshots/Screenshot%20From%202026-08-15%2009-39-54.png)

### Tempered Glass Center Punch Break Test
![Tempered Glass Break Test Form](docs/screenshots/Screenshot%20From%202026-08-15%2009-40-27.png)

### Laminated Glass Ball Drop Test & Traceability
![Laminated Glass Traceability & Test Form](docs/screenshots/Screenshot%20From%202026-08-15%2009-40-36.png)

### Roll Wave Distortion Test (ASTM C1651) & SVG Contour Profile
![Roll Wave Optical Distortion Test Form](docs/screenshots/Screenshot%20From%202026-08-15%2009-40-43.png)
![ASTM C1651 Calculation Results & Chart](docs/screenshots/Screenshot%20From%202026-08-15%2009-40-51.png)

### Historical Records & Audit Trail Export
![Compliance Records List & Audit Filter](docs/screenshots/Screenshot%20From%202026-08-15%2009-41-01.png)
![Record Audit Details Modal](docs/screenshots/Screenshot%20From%202026-08-15%2009-41-09.png)

### Reference Standards Library & Official PDF Specifications
![QA & ASTM Reference Standards Library](docs/screenshots/Screenshot%20From%202026-08-15%2009-41-16.png)

### Admin Panel & User Role Management
![Admin Panel User & Dropdown List Management](docs/screenshots/Screenshot%20From%202026-08-15%2009-41-24.png)

---

## 📌 System Purpose & Standards Compliance

SGCC SD-211 and ASTM specifications require three recurring in-plant production safety tests:
1. **Tempered Glass (Center Punch Break Test)**: Minimum first-of-each-thickness per shift and per thickness change (SGCC SD-211 / ANSI Z97.1).
2. **Laminated Glass (Ball Drop Test)**: Minimum weekly specimen collection (Traceability) and monthly ball drop impact testing per ASTM F3007-13.
3. **Roll Wave Distortion Test (ASTM C1651)**: Measurement of peak-to-valley out-of-plane roll wave depth ($W$) and wavelength ($L$) in heat-treated flat glass to compute optical distortion ($D$) in millidiopters ($mdpt$).

All compliance test records are dated/timed, traceable, and retained for a minimum of **10 years**.

---

## ⭐ Core Application Features

### 1. Tempered Glass Break Test Log (Center Punch)
- **Pre-filled SGCC Number**: Defaults to plant SGCC # `CUS01CA` to save repetitive typing.
- **Dynamic Specimen Weight Auto-Calculation**: Automatically calculates nominal specimen weight in lbs based on selected glass thickness (`1/8"`, `5/32"`, `3/16"`, `1/4"`, `5/16"`, `3/8"`, `1/2"`, `5/8"`, `3/4"`) and sample dimensions (e.g. `34x76`).
- **Real-Time Max Allowable Particle Weight**: Dynamically computes max allowable particle weight in grams using the SD-211 formula:
  $$\text{Max Weight (g)} = \left(\left(\frac{\text{Specimen Weight (lbs)}}{\text{Specimen Area (sq in)}}\right) \times 10\right) \times 453.59$$
- **Auto-Suggested Pass/Fail & Mandatory Operator Confirmation**: System compares actual 10-piece particle weight against calculated limit to suggest Pass/Fail. **Enforces explicit operator button confirmation** before allowing record save.
- **Shop-Floor Camera Integration**: Triggers device camera directly on mobile phones (`capture="environment"`) with client-side canvas compression (max 1600px edge, 80% JPEG quality) prior to upload.

### 2. Laminated Glass Ball Drop Test Log
- **Weekly Specimen Traceability (Section A)**: Log production date/time, SGCC #, interlayer type/tradename (PVB/Sentry/EVA), glass type (Clear/Low-E/Satin), glass kind (AN/HS/FT/CS), nominal thickness, and collection week (Week 1–4).
- **Monthly Specimen Test Results (Section B)**: Link 3–4 specimen test entries per traceability record, capturing specimen temperature, measured min thickness, drop height class (Class A 12 ft / Class B 2.46 ft), ASTM F3007-13 category selection (1–4), and specimen photo.

### 3. Roll Wave Optical Distortion Test (ASTM C1651)
- **Dual Gauge Support**: Supports Procedure A (Flat Bottom Gauge) and Procedure B (Three-Point Contact Gauge).
- **Millidiopter Calculation Engine**: Computes optical distortion in millidiopters ($mdpt$) using ASTM equations:
  $$D_{mdpt} = 4 \pi^2 \cdot \frac{W}{L^2} \cdot 10^6$$
- **Interactive SVG Contour Chart**: Renders real-time SVG wave profile diagrams indicating peak ($P$) and valley ($V$) positions along the glass surface.
- **ASTM Table 1 Sample Data Loader**: Allows quick loading of ASTM standard sample test data for verification and calibration.

### 4. Reference Standards PDF Library
- **Official Specification Access**: In-app library allowing operators and QA staff to access official standard specifications (`docs/standards/`).
- **1-Click PDF Downloads**: Direct downloading of **SGCC SD-211 Guidance Standard** and **ASTM C1651 Standard Specification** PDF files.

### 5. User Authentication & Role Management
- **Role-Based Access Control**:
  - **Operator**: Shop floor test logging and photo capture.
  - **QA Rep**: Review logs, view audit trails, and export CSV/PDF reports.
  - **Admin**: Full control — manage users/roles, edit/delete compliance logs, and manage configurable dropdown lists.
- **User Management Panel**: Admins can add new users, edit user roles (`Operator`, `QA Rep`, `Admin`), reset user passwords, and delete accounts.

### 6. Records Management & Audit Trail
- **Search & Multi-Filter**: Search records by date range, glass type, SGCC #, pass/fail status, or operator across all 3 test types.
- **Detail View & Photo Lightbox**: View complete record parameters, notes, and full-resolution specimen photos.
- **Admin Record Editing & Deletion**: Every edit or deletion is logged in an immutable `audit_logs` table.
- **Audit Prep Exports**:
  - **CSV Export**: Filterable data export for Excel auditing.
  - **PDF Export**: Formatted PDF audit report with **embedded specimen photos**, clean page layout, and explicit spacing.

### 7. Full i18n Internationalization & UI Design System
- **100% Complete English & Spanish Translation**: Every string (navigation, body text, form fields, drop options, placeholders, table column headers, audit logs, and reference cards) translates instantly.
- **Light & Dark Theme**: Toggle between high-contrast dark mode and clean light mode.
- **Mobile-Responsive Navigation Header**: 2-tier top header bar and scrollable horizontal navigation tab bar supporting all 6 views.

---

## 🏗️ Technology Stack

| Component | Technology |
|---|---|
| **Frontend** | React 18, Vite, Lucide Icons, Vanilla CSS Design Tokens |
| **Backend API** | Node.js, Express, MySQL2 (`mysql2/promise`), JWT Auth, Multer |
| **PDF & CSV** | PDFKit (PDF report generation with images), Fast-CSV |
| **Database** | MariaDB 10.11 with `UNIQUE KEY` constraints and named volumes |
| **Administration** | phpMyAdmin 5.x on port 8081 |
| **Containerization** | Docker, Docker Compose, Multi-stage Dockerfile |

---

## 🚀 Deployment on Proxmox Linux VM

### Prerequisites
- Docker & Docker Compose installed on the VM.
- Open ports: `3000` (Web App) and `8081` (phpMyAdmin).

### Quick Start Deployment

```bash
# 1. Navigate to project directory
cd /path/to/SGCC

# 2. Build and start containers in detached mode
docker compose up -d --build

# 3. Verify container status
docker compose ps
```

The app is now running at `http://<VM-IP-ADDRESS>:3000`.

### Initial Credentials
- **Username**: `admin`
- **Password**: `AdminPass123!`

---

## 💾 Database & Photo Backup Procedures

Per SGCC SD-211 requirements, all test records and photos must be retained for a **minimum of 10 years**.

### Automated Daily Host Backup (`mysqldump` Cron)

Add a daily cron job on the Proxmox host VM at 2:00 AM:

```bash
0 2 * * * docker exec sgcc_db mysqldump -u root -proot_pass_2026 sgcc_break_test > /backups/sgcc_db_$(date +\%F).sql && tar -czf /backups/photos_$(date +\%F).tar.gz -C /var/lib/docker/volumes/sgcc_uploaded_photos/_data .
```
