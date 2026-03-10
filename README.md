# ven-chart

**K12 School District Vendor & Contract Management**

A production-quality, dockerized web application for tracking vendors, contracts, subscriptions, and renewal deadlines for school districts. Designed for technology and procurement teams who need operational visibility — not a fancy contact directory.

---

## What It Does

- **Vendor management** — track vendors with contacts, tags, support info, and procurement notes
- **Contract management** — track all contracts/subscriptions with renewal dates, notice deadlines, owners, departments, financial details, and compliance status
- **Renewals dashboard** — priority-bucketed list view (overdue / 30 days / 90 days) and calendar view
- **Dashboard** — operational overview with action items (missing owners, overdue renewals, auto-renew flags)
- **Microsoft SSO** — sign in with district Microsoft accounts via Microsoft Entra ID
- **Role-based access** — Admin, Editor, Viewer, Department Owner
- **Import/export** — full JSON export and import with dry-run validation
- **Audit trail** — activity log on every vendor and contract record

---

## Architecture

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth.js + Microsoft Entra ID (Azure AD) |
| Styling | Tailwind CSS |
| Deployment | Docker + Docker Compose |

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- A Microsoft Entra ID app registration (see below)

### 1. Clone and install

```bash
git clone <repo>
cd ven-chart
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values (see Configuration section below).

### 3. Start the database

```bash
docker compose -f docker-compose.dev.yml up -d
```

This starts a local PostgreSQL instance on port 5432.

### 4. Set up the database

```bash
# Run migrations
npm run db:push

# (Optional) Seed with sample data
npm run db:seed
```

### 5. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Production Deployment with Docker

### 1. Create your environment file

```bash
cp .env.example .env
# Edit .env with all production values
```

### 2. Build and start

```bash
docker compose up -d --build
```

The app runs on port 3000 by default. Put it behind a reverse proxy (nginx, Traefik, Caddy) for HTTPS.

### 3. Run database migrations

Migrations run automatically at container startup via `docker-entrypoint.sh`. To run manually:

```bash
docker exec venchart_app npx prisma migrate deploy
```

### 4. Optional: seed sample data

```bash
docker exec venchart_app npm run db:seed
```

---

## Configuration

All configuration is via environment variables. See `.env.example` for the full list.

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | Full URL of your app (e.g. `https://venchart.district.edu`) |
| `NEXTAUTH_SECRET` | Random secret string — generate with `openssl rand -base64 32` |
| `AZURE_AD_CLIENT_ID` | Microsoft Entra app client ID |
| `AZURE_AD_CLIENT_SECRET` | Microsoft Entra app client secret |
| `AZURE_AD_TENANT_ID` | Your Azure tenant ID (or `common` for multi-tenant) |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_DISTRICT_NAME` | District name shown in the UI | `School District` |
| `ADMIN_EMAIL` | Email of the first admin user | — |
| `APP_PORT` | Host port for the app | `3000` |
| `DB_PORT` | Host port for PostgreSQL | `5432` |

---

## Microsoft Entra ID Setup

This is the SSO integration with your district's Microsoft accounts.

### Step-by-step app registration

1. Go to [portal.azure.com](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations**

2. Click **New registration**:
   - **Name**: `ven-chart` (or `District Vendor Management`)
   - **Supported account types**: `Accounts in this organizational directory only (Single tenant)`
   - **Redirect URI**: Web → `https://your-app-url/api/auth/callback/azure-ad`
   - For local dev, also add: `http://localhost:3000/api/auth/callback/azure-ad`

3. After creation, from the **Overview** page:
   - Copy **Application (client) ID** → `AZURE_AD_CLIENT_ID`
   - Copy **Directory (tenant) ID** → `AZURE_AD_TENANT_ID`

4. Go to **Certificates & secrets** → **Client secrets** → **New client secret**:
   - Set an expiration (recommend 24 months, then rotate)
   - Copy the **Value** (not the ID) → `AZURE_AD_CLIENT_SECRET`

5. Go to **API permissions**:
   - Ensure `Microsoft Graph → User.Read (Delegated)` is present
   - Click **Grant admin consent**

6. (Optional) Go to **Authentication**:
   - Under **Front-channel logout URL**, you can add `https://your-app-url/auth/signin`
   - Enable **ID tokens** under Implicit grant if prompted

### First admin user

Set `ADMIN_EMAIL` in your environment to the email address of the first admin. When that user signs in for the first time, they will automatically be assigned the ADMIN role.

All other new users default to VIEWER role. An admin must change their role via **Admin → User Management**.

---

## Role & Permission Model

| Role | Capabilities |
|------|-------------|
| **Admin** | Full control: create, edit, delete all records; manage users; import/export |
| **Editor** | Create and edit vendors and contracts; archive records |
| **Department Owner** | Edit only records where they are the owner or in their department |
| **Viewer** | Read-only access to all records |

Roles are managed in **Admin → Users**. Users are created automatically on first login.

---

## Data Model Summary

```
Vendor (parent)
  ├── name, contacts (primary + support), tags
  ├── procurement notes, support notes, general notes
  └── Contract (child — renewal-driving entity)
        ├── productName, contractType, billingModel, purchaseType flags
        ├── startDate, renewalDate, noticeDeadline, autoRenew
        ├── cost, totalContractValue, fundingSource, budgetCode
        ├── procurementMethod, poNumber, invoiceReference
        ├── internalOwner, backupOwner, department
        ├── status (Active / Under Review / Pending Renewal / Non-Renewing / Expired / Archived)
        ├── compliance fields (DPA, studentData, securityReview, SOC2, FERPA/COPPA)
        └── notes, isArchived

Attachment (polymorphic — belongs to Vendor or Contract)
  └── title, url, optional file metadata

ActivityLog (audit trail)
  └── entityType, entityId, action, beforeState, afterState, user, timestamp

User (synced from Microsoft Entra)
  └── email, name, role, department, isActive
```

---

## Available Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

npm run db:push      # Push schema to DB (dev — no migration files)
npm run db:migrate   # Run pending migrations (production)
npm run db:generate  # Regenerate Prisma client
npm run db:seed      # Seed with sample data
npm run db:studio    # Open Prisma Studio (DB browser)
npm run db:reset     # Reset database (destructive — dev only)
```

---

## Import / Export Format

Data is exported as JSON with the following structure:

```json
{
  "schemaVersion": "1.0",
  "exportedAt": "2024-01-15T10:00:00Z",
  "exportedBy": "admin@district.edu",
  "counts": { "vendors": 7, "contracts": 9, "attachments": 4 },
  "vendors": [...],
  "contracts": [...],
  "attachments": [...]
}
```

Import supports:
- **Dry run mode** — validate before committing
- **Schema version awareness** — warns on version mismatch
- **Graceful skipping** — invalid records are skipped with warnings, not aborted
- Creates new records; does not overwrite existing ones

---

## Production Considerations

### HTTPS

Always run behind a reverse proxy with TLS in production. Example nginx config:

```nginx
server {
    listen 443 ssl;
    server_name venchart.district.edu;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Database backups

Back up the PostgreSQL volume regularly:

```bash
docker exec venchart_db pg_dump -U venchart venchart_db > backup-$(date +%Y%m%d).sql
```

Or use the app's JSON export as an additional backup layer.

### Secret rotation

- Rotate `NEXTAUTH_SECRET` only when necessary (existing sessions will be invalidated)
- Rotate the Azure AD client secret before expiration; update `AZURE_AD_CLIENT_SECRET` and restart

### Scaling

This is designed as a single-instance internal tool. If you need horizontal scaling, switch from database sessions to JWT sessions in NextAuth config.

---

## Known Limitations / Assumptions

- **File uploads**: Attachment support is URL-only. File upload storage (S3 or local) is stubbed but not implemented. URLs to documents in SharePoint, Google Drive, or your DMS work well.
- **Email notifications**: The schema and data model support renewal tracking, but automated email reminders are not implemented. This is a known gap for v2.
- **CSV export**: JSON is the supported export format. CSV export is a nice-to-have for a future version.
- **Multi-district**: This is scoped to a single district. The tenant ID in Azure AD enforces this at the auth layer.
- **Soft delete**: Records use `isArchived` instead of hard delete for safety. Only Admins can permanently delete.

---

## License

Internal use. All rights reserved by the deploying school district.
