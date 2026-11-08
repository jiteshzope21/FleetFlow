# FleetFlow Architecture, Authentication & Security

## System Overview
FleetFlow is an enterprise-grade multi-tenant Software-as-a-Service (SaaS) platform built specifically for transport and logistics operators, fleet owners, and freight forwarders. FleetFlow acts as a centralized operating system for logistics companies.

## Multi-Tenant Data Isolation
Every transport company registered on FleetFlow operates inside its own private workspace:
1. **Server-Enforced Scope:** The active company ID (`companyId`) is resolved exclusively from the verified JWT bearer token payload or session context (`req.user.companyId`).
2. **Tamper Prevention:** Incoming requests cannot override or specify an arbitrary `companyId` in URL query parameters or request bodies.
3. **Database-Level Scoping:** All Mongoose queries touching company-owned documents automatically filter with `{ companyId: req.companyId }`.
4. **Cross-Tenant Barrier:** Company A can never view, mutate, or query Company B's vehicles, drivers, shipments, trips, customers, invoices, fuel logs, or maintenance records. Cross-tenant access attempts return HTTP 404 (Not Found).

## Supported User Roles & Permissions (RBAC)
FleetFlow enforces 9 discrete user roles:
1. **`SUPER_ADMIN`**: Platform-level administrator. Monitors cross-tenant health, manages subscription plans, reviews system audit logs, publishes platform announcements, and oversees carrier support tickets. Does not belong to an individual company workspace.
2. **`COMPANY_OWNER`**: Highest authority within a company workspace. Can edit company profile, manage subscription plans, purchase upgrades, invite and manage team members, assign user roles, and access all operational and financial modules.
3. **`MANAGER`**: Operational supervisor. Can edit company profile, manage non-owner users, oversee dispatch, create shipments, schedule trips, and review financial reports.
4. **`DISPATCHER`**: Operations coordinator. Focuses on shipment booking, assigning vehicles and drivers to trips, monitoring active shipments in transit, and recording trip lifecycle milestones.
5. **`ACCOUNTANT`**: Financial officer. Manages invoices, records customer payments, tracks operational expenses and fuel logs, and generates financial summaries.
6. **`FLEET_MANAGER`**: Fleet custodian. Manages vehicle inventory, tracks vehicle registration and insurance expiry, schedules maintenance, and monitors fleet telemetry.
7. **`MAINTENANCE_MANAGER`**: Workshop supervisor. Creates maintenance work orders, logs repairs and inspections, records parts and labor costs, and returns serviced vehicles to Active status.
8. **`DRIVER`**: Operational crew member. Views assigned vehicle, assigned trips, pickup and delivery instructions, and provides delivery confirmation details.
9. **`VIEWER`**: Read-only auditor. Can review company data, trips, and reports without write or delete permissions.

## Authentication & Session Security
- Passwords are encrypted using `bcryptjs` with 10 salt rounds. Plaintext passwords are never stored or logged.
- Sessions use stateless JSON Web Tokens (JWT) signed with HMAC-SHA256 (`JWT_SECRET`). Tokens contain `userId`, `email`, `role`, and `companyId`.
- Login rate-limiting protects against brute-force attacks on `/api/auth/login`.
- If an account is suspended or set to `INACTIVE`, all subsequent API calls are immediately rejected with HTTP 401 or 403.
- Password reset uses expiring cryptographically random reset tokens with a 1-hour validity window.

