# FleetFlow — Super Admin Portal Implementation & Integration Guide

**Version:** 1.0.0  
**Updated:** October 11, 2026  
**Status:** Verified & Operational

---

## 1. Overview & Architecture

The **FleetFlow Super Admin Portal** is a dedicated, first-class platform administration suite that operates independently from individual company workspaces. It allows platform administrators to manage tenant companies, cross-platform users, subscription plans, platform-wide analytics, AI model telemetry, support tickets, broadcast announcements, and system health.

### Architectural Separation
```
+-------------------------------------------------------------+
|                      Browser / Client                       |
+------------------------------+------------------------------+
                               |
            +------------------+------------------+
            |                                     |
   [/admin/login, /admin/*]             [/login, /register, /*]
            |                                     |
+-----------v-----------------+     +-------------v---------------+
|     SuperAdminLayout        |     |          AppLayout          |
|  - Platform Navigation      |     |  - Operations Navigation    |
|  - System Health Pill       |     |  - Fleet & Shipments        |
|  - Cross-Tenant Scope       |     |  - Tenant-Scoped Sidebar    |
+-----------+-----------------+     +-------------+---------------+
            |                                     |
            v                                     v
+-----------------------------+     +-----------------------------+
|   Protected Admin Routes    |     |   Protected Tenant Routes   |
| (allowedRoles: SUPER_ADMIN) |     |  (Tenant Isolation Enforced)|
+-----------+-----------------+     +-------------+---------------+
            |                                     |
            v                                     v
+-------------------------------------------------------------+
|                     Express Backend                         |
|  - authenticate middleware                                  |
|  - requireRole('SUPER_ADMIN') on /api/admin/*               |
|  - Real-time Company suspension check on tenant routes      |
+-------------------------------------------------------------+
```

---

## 2. Authentication & Separate Entry Point

### Discoverability & Dedicated URL
- **Dedicated Route:** `http://localhost:5173/admin/login`
- **Carrier Login Link:** Visible on the standard login page (`/login`):  
  `Platform Administrator? Super Admin Login ->`
- **Carrier Registration Link:** Also linked at `/register` footer.
- **Top Navigation Indicator:** When an authenticated user holds the `SUPER_ADMIN` role, a prominent gradient **Super Admin** button appears in the main Topbar and Sidebar.
- **Auto-Routing:**
  - If a Super Admin logs in through `/admin/login` or the standard `/login`, they are automatically routed to `/admin`.
  - If a Super Admin opens `/` or `/dashboard`, they are redirected to `/admin`.
  - If an unauthenticated user enters an `/admin/*` URL directly, `ProtectedRoute` redirects them specifically to `/admin/login`.

---

## 3. Initial Super Admin Bootstrap / Provisioning

To securely initialize the first Super Admin without hardcoding credentials in git:

### 1. Configure the Setup Secret
In `.env` (or environment variables):
```env
ADMIN_SETUP_SECRET=FleetFlowSuperSecretSetupToken2026!
```

### 2. Provisioning Flow
1. Open `http://localhost:5173/admin/login`
2. Click **Bootstrap Admin?**
3. Fill in:
   - **Administrator Full Name:** `Platform Administrator`
   - **Administrative Email:** `admin@fleetflow.io`
   - **Create Secure Password:** (Minimum 8 characters)
   - **Setup Secret Key:** Matches `ADMIN_SETUP_SECRET` from `.env`
4. Click **Initialize Root Admin**.
5. The backend validates the secret, seeds default plans (`FREE`, `STARTER`, `PROFESSIONAL`, `ENTERPRISE`), creates the `SUPER_ADMIN` record with bcrypt hashing, logs an immutable `AuditLog` event, and issues an administrative JWT session.

### 3. Automatic Seeding from Environment Configuration
When the server starts (`npm run dev`), `seedSuperAdminAccount()` executes automatically during startup.
It reads:
```env
SUPER_ADMIN_EMAIL=superadmin@fleetflow.local
SUPER_ADMIN_PASSWORD=FleetFlowAdmin2026!
SUPER_ADMIN_NAME=FleetFlow Platform Admin
```
- If the account does not exist, it is created with role `SUPER_ADMIN`, status `ACTIVE`, and the configured password.
- If the account exists, its role and status are validated without disrupting active sessions.

### 4. Manual Seeding / Credential Reset CLI Command
To explicitly seed or synchronize the Super Admin credentials at any time:
```powershell
npm run seed:admin
```
This connects to MongoDB Atlas, synchronizes the password hash with `SUPER_ADMIN_PASSWORD`, seeds default subscription tiers, and exits cleanly.

---

## 4. Super Admin Modules & Capabilities

| Module | Route | Backend API | Description |
|---|---|---|---|
| **Platform Overview** | `/admin` | `GET /api/admin/overview` | Aggregated cross-platform stats: companies, users, vehicles, drivers, shipments, trips, revenue, active subscriptions. |
| **Companies** | `/admin/companies` | `GET /api/admin/companies`<br>`PATCH /api/admin/companies/:id/status` | Search, server-side pagination, operational drawer, suspend/reactivate with mandatory audit reason. |
| **Platform Users** | `/admin/users` | `GET /api/admin/users`<br>`PATCH /api/admin/users/:id/status` | Cross-tenant user directory with role visibility and active/inactive toggles. Passwords excluded. |
| **Subscription Plans** | `/admin/plans` | `GET /api/admin/plans`<br>`POST /api/admin/plans`<br>`PATCH /api/admin/plans/:id` | Configure tiers (`FREE`, `STARTER`, `PROFESSIONAL`, `ENTERPRISE`), limits (vehicles, users, shipments), pricing. |
| **Subscriptions** | `/admin/subscriptions` | `GET /api/admin/subscriptions`<br>`PATCH /api/admin/subscriptions/:id` | Carrier subscription directory, trial expiry adjustment, plan upgrades/downgrades. |
| **Platform Analytics** | `/admin/analytics` | `GET /api/admin/analytics/growth`<br>`GET /api/admin/analytics/revenue` | Platform growth curves, invoiced totals vs. collected payments, subscription breakdown. |
| **AI/ML Telemetry** | `/admin/ai-monitoring` | `GET /api/admin/ai/telemetry` | Real-time stream of trip inference requests, latency (ms), fallback usage, and scikit-learn model versions. |
| **Support Tickets** | `/admin/support` | `GET /api/admin/support`<br>`POST /api/admin/support/:id/reply` | Carrier ticket queue, priority triage, status updates (`OPEN`, `IN_PROGRESS`, `RESOLVED`), and replies. |
| **Announcements** | `/admin/announcements` | `GET/POST/PATCH/DELETE /api/admin/announcements` | Global platform broadcast announcements published directly to carrier workspaces (`GET /api/announcements`). |
| **Audit Logs** | `/admin/audit-logs` | `GET /api/admin/audit-logs` | Immutable audit trail capturing actor email, action, target, timestamp, and details. |
| **System Health** | `/admin/health` | `GET /api/admin/health` | Express server uptime, memory usage, MongoDB ping latency, and AI service health. |
| **Platform Settings** | `/admin/settings` | `GET/PATCH /api/admin/settings` | Global system governance settings with audit logging. |

---

## 5. Security & Isolation Enforcement

1. **Role Enforcement:** All endpoints under `/api/admin/*` require `requireRole('SUPER_ADMIN')`. Company owners, dispatchers, drivers, and accountants receive HTTP 403 Forbidden.
2. **Real-Time Token Revocation on Suspension:**
   When a company is suspended (`status === 'SUSPENDED'`), the authentication middleware (`auth.middleware.ts`) verifies the company status in MongoDB on every request. Existing JWTs belonging to that company are immediately blocked with HTTP 403.
3. **No Company ID Requirement:** Super Admin users are platform-level and do not require a tenant `companyId`.
4. **Subscription Plan Enforcement:** Backend services for vehicles and users validate company counts against the active plan limits before saving.
