# SGCC Quality Assurance Production Testing App

Self-hosted, mobile-first, bilingual (English & Spanish) web application designed for logging glass safety-testing records in manufacturing plants according to **SGCC SD-211 Quality Assurance Testing Guidelines**.

Target deployment is a Linux VM on **Proxmox** running **Docker + Docker Compose**.

---

## 📌 System Purpose & Standards Compliance

SGCC SD-211 requires two recurring in-plant production safety tests:
1. **Tempered Glass (Center Punch Break Test)**: Minimum first-of-each-thickness per shift and per thickness change.
2. **Laminated Glass (Ball Drop Test)**: Minimum weekly specimen collection (Traceability) and monthly testing (Ball Drop Test) per ASTM F3007-13.

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

### 3. User Authentication & Role Management
- **Role-Based Access Control**:
  - **Operator**: Shop floor test logging and photo capture.
  - **QA Rep**: Review logs, view audit trails, and export CSV/PDF reports.
  - **Admin**: Full control — manage users/roles, edit/delete compliance logs, and manage configurable dropdown lists.
- **User Management Panel**: Admins can add new users, edit user roles (`Operator`, `QA Rep`, `Admin`), reset user passwords, and delete accounts.

### 4. Records Management & Audit Trail
- **Search & Multi-Filter**: Search records by date range, glass type, SGCC #, pass/fail status, or operator.
- **Detail View & Photo Lightbox**: All users can view complete record parameters, notes, and full-resolution specimen photos.
- **Admin Record Editing & Deletion**: Admins can edit or delete compliance entries. Every change is logged in an immutable `audit_logs` table (capturing user ID, username, action type, old values, new values, and timestamp).
- **Audit Prep Exports**:
  - **CSV Export**: Filterable data export for Excel auditing.
  - **PDF Export**: Formatted PDF audit report with **embedded specimen photos**, clean page layout, and explicit spacing.

### 5. Internationalization & UI Design System
- **Bilingual Support (English & Spanish)**: Instant UI translation switcher persisted per user.
- **Light & Dark Theme**: Toggle between high-contrast dark mode and clean light mode, defaulted to system preference.
- **Mobile-First Shop Floor UI**: Large touch targets (min 48px), high contrast input fields, and clean glassmorphism styling.

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

> ⚠️ **Security Notice**: Log in and update your password or create individual operator accounts in the Admin Panel immediately after setup.

---

## 🔒 Reverse Proxy & Security Setup (HTTPS)

Run a reverse proxy in front of port `3000` on the Proxmox host for secure plant-wide HTTPS access.

### Caddy Reverse Proxy Example:
```caddy
sgcc.internal.plant {
    reverse_proxy localhost:3000
}
```

### Nginx Reverse Proxy Example:
```nginx
server {
    listen 80;
    server_name sgcc.internal.plant;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🛡️ Securing phpMyAdmin Access

phpMyAdmin is mapped to port `8081` for manual database maintenance and backup exports.

To restrict access in production:
1. Bind phpMyAdmin to localhost in `docker-compose.yml`:
   ```yaml
   ports:
     - "127.0.0.1:8081:80"
   ```
2. Access phpMyAdmin securely via SSH Tunnel:
   ```bash
   ssh -L 8081:localhost:8081 user@proxmox-vm-ip
   ```

---

## 💾 Database & Photo Backup Procedures

Per SGCC SD-211 requirements, all test records and photos must be retained for a **minimum of 10 years**.

### Method 1: Automated Daily Host Backup (`mysqldump` Cron)

Create a daily cron job on the Proxmox host VM at 2:00 AM:

```bash
crontab -e
```

Add the following command line:
```bash
0 2 * * * docker exec sgcc_db mysqldump -u root -proot_pass_2026 sgcc_break_test > /backups/sgcc_db_$(date +\%F).sql && tar -czf /backups/photos_$(date +\%F).tar.gz -C /var/lib/docker/volumes/sgcc_uploaded_photos/_data .
```

### Method 2: Manual Backup via phpMyAdmin
1. Navigate to `http://<VM-IP-ADDRESS>:8081`.
2. Select database `sgcc_break_test`.
3. Click **Export** ➔ **Quick** ➔ **Go** to download a `.sql` backup file.
