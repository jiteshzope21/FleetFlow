# FleetFlow Architecture Specification — Phase 1

## 1. Overview & Product Architecture
FleetFlow is an enterprise-grade, multi-tenant SaaS platform built for transport and logistics operators. Unlike generic CRUD applications, FleetFlow is designed from the foundation as an operating system for transport companies, enforcing strict data isolation between tenants at every layer.

```
+-------------------------------------------------------------+
|                 Frontend (React + Vite + TS)                |
|  - Tailwind CSS + Custom Enterprise Design System           |
|  - TanStack Query + React Hook Form + Zod                   |
|  - Multi-tenant Session Context & Theme Engine              |
+------------------------------+------------------------------+
                               | REST APIs (JSON / Bearer JWT)
+------------------------------v------------------------------+
|                Backend API (Node.js + Express)              |
|  - Helmet, CORS, Rate Limiting, Centralized Error Handling  |
|  - Authentication & JWT Token Engine                        |
|  - Strict Tenant Isolation Middleware (req.companyId)       |
|  - Role-Based Access Control (RBAC - 9 Supported Roles)     |
+------------------------------+------------------------------+
                               | Mongoose ODM
+------------------------------v------------------------------+
|                  MongoDB Atlas (Free Tier)                  |
|  - Companies Collection (Tenant metadata & settings)        |
|  - Users Collection (Tenant-isolated credentials & roles)   |
|  - PasswordResetTokens Collection (Expiring TTL tokens)     |
+-------------------------------------------------------------+
```

---

## 2. Multi-Tenant Data Isolation Model

Every transport company registered on FleetFlow operates within its own private workspace.

### Strict Isolation Rules
1. **Server-Enforced Scope:** The active `companyId` is resolved exclusively from the verified JWT bearer token payload or session context (`req.user.companyId`).
2. **Tamper Prevention:** Incoming requests cannot override or specify an arbitrary `companyId` in URL parameters or request bodies.
3. **Database-Level Scoping:** All queries touching company-owned documents automatically include `{ companyId: req.companyId }`.
4. **Platform Super Admin Exemption:** Only users explicitly assigned `SUPER_ADMIN` can operate without an attached `companyId`, retaining the ability to audit cross-tenant health through controlled platform administrative tools.

---

## 3. Role-Based Access Control (RBAC) Matrix

FleetFlow supports 9 specialized transport industry roles:

| Role | Scope | Phase 1 Permissions | Future Roadmap Scope |
| :--- | :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Platform | Platform monitoring, cross-tenant auditing | SaaS billing plans, tenant suspensions (Phase 4) |
| **`COMPANY_OWNER`** | Workspace | Full workspace access, company profile edits, user CRUD, role assignment, status toggling | Financial approvals, subscription management |
| **`MANAGER`** | Workspace | Read/Write company profile, user CRUD (non-owner), operational supervision | Dispatch oversight, fleet operations |
| **`DISPATCHER`** | Workspace | View workspace, view users, view profile | Shipment creation, vehicle/driver assignment (Phase 3) |
| **`ACCOUNTANT`** | Workspace | View workspace, view users, view profile | Invoicing, payments, expense ledgers (Phase 3) |
| **`FLEET_MANAGER`** | Workspace | View workspace, view users, view profile | Vehicle registration, maintenance tracking (Phase 2) |
| **`MAINTENANCE_MANAGER`** | Workspace | View workspace, view users, view profile | Service schedules, vehicle health logs (Phase 2) |
| **`DRIVER`** | Workspace | View assigned workspace profile | Mobile trip views, delivery status updates (Phase 3) |
| **`VIEWER`** | Workspace | Read-only access to permitted company data | Read-only reporting |

---

## 4. Authentication & Security Engine
- **Password Security:** Salted and hashed using `bcryptjs` with configurable salt rounds (default: 10). Plaintext passwords are never stored or logged.
- **Token Mechanism:** Stateless JSON Web Tokens (JWT) signed using HMAC-SHA256 (`JWT_SECRET`). Tokens contain `userId`, `email`, `role`, and `companyId`.
- **Brute-Force Protection:** Rate limiting applied to `/api/auth/login`, `/api/auth/register`, and `/api/auth/forgot-password` via `express-rate-limit`.
- **Sanitized Responses:** Mongoose schema transforms automatically strip `passwordHash` and internal version keys from all JSON serialization.
- **Account Invalidation:** Inactive accounts are blocked immediately at both authentication and middleware verification steps.
