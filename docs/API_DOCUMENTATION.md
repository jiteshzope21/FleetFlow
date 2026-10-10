# FleetFlow API Reference — Phase 1

All endpoints return standardized JSON responses:
```json
{
  "success": true,
  "message": "Optional human-readable confirmation message",
  "data": {},
  "meta": {}
}
```

---

## 1. Health & System Connectivity

### `GET /api/health`
Checks application uptime and MongoDB Atlas connectivity.
- **Access:** Public
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "FleetFlow SaaS API",
    "version": "1.0.0 (Phase 1)",
    "uptimeSeconds": 142,
    "timestamp": "2026-10-10T18:00:00.000Z",
    "database": {
      "status": "connected",
      "connected": true
    }
  }
}
```

---

## 2. Authentication & Onboarding

### `POST /api/auth/register`
Registers a new transport company and activates its primary owner account.
- **Access:** Public (Rate Limited: 30 req / 15 min)
- **Request Body:**
```json
{
  "companyName": "Apex Freight Logistics",
  "companyEmail": "contact@apexfreight.com",
  "companyPhone": "+1-555-0199",
  "businessType": "LOGISTICS",
  "ownerName": "Alice Walker",
  "ownerEmail": "alice@apexfreight.com",
  "password": "Password123!",
  "confirmPassword": "Password123!"
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "message": "Company and workspace registered successfully.",
  "data": {
    "user": {
      "id": "60d0fe4f5311236168a109ca",
      "name": "Alice Walker",
      "email": "alice@apexfreight.com",
      "role": "COMPANY_OWNER",
      "status": "ACTIVE"
    },
    "company": {
      "id": "60d0fe4f5311236168a109cb",
      "name": "Apex Freight Logistics",
      "slug": "apex-freight-logistics",
      "email": "contact@apexfreight.com",
      "status": "ACTIVE"
    },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

### `POST /api/auth/login`
Authenticates a user with email and password.
- **Access:** Public (Rate Limited)
- **Request Body:**
```json
{
  "email": "alice@apexfreight.com",
  "password": "Password123!"
}
```
- **Response `200 OK`:** Returns user details, company workspace details, and bearer JWT token.

### `GET /api/auth/me`
Retrieves current authenticated profile and workspace.
- **Access:** Authenticated (`Authorization: Bearer <token>`)

### `POST /api/auth/logout`
Revokes active session tokens.

### `POST /api/auth/forgot-password`
Initiates a password reset flow. Generates an expiring token.

### `POST /api/auth/reset-password`
Resets password using a verified token.

---

## 3. Company Workspace Profile

### `GET /api/company/profile`
Retrieves current company profile, address, and operational metrics.
- **Access:** Authenticated (Any Workspace Member)

### `PATCH /api/company/profile`
Updates company legal name, email, phone, physical address, and measurement units.
- **Access:** Authenticated (`COMPANY_OWNER`, `MANAGER`, `SUPER_ADMIN`)
- **Request Body:**
```json
{
  "name": "Apex Freight Logistics Inc.",
  "phone": "+1-555-0199",
  "address": {
    "street": "100 Logistics Blvd",
    "city": "Chicago",
    "state": "IL",
    "zipCode": "60601",
    "country": "USA"
  },
  "settings": {
    "currency": "USD",
    "distanceUnit": "km",
    "fuelUnit": "liters"
  }
}
```

---

## 4. User & Team Management

### `GET /api/users`
Lists members belonging to current company workspace with pagination and filters.
- **Query Parameters:** `page`, `limit`, `search`, `role`, `status`
- **Access:** Authenticated Workspace Member

### `POST /api/users`
Creates a new team member under current company.
- **Access:** `COMPANY_OWNER`, `MANAGER`
- **Request Body:**
```json
{
  "name": "David Miller",
  "email": "david@apexfreight.com",
  "role": "DISPATCHER",
  "password": "Password123!",
  "phone": "+1-555-0144"
}
```

### `PATCH /api/users/:id`
Updates user name, role, or phone.
- **Access:** `COMPANY_OWNER`, `MANAGER`

### `PATCH /api/users/:id/status`
Activates or deactivates user workspace access.
- **Access:** `COMPANY_OWNER`, `MANAGER`
- **Request Body:** `{ "status": "INACTIVE" }`

---

## 5. Dashboard Overview & Real Metrics

### `GET /api/dashboard/overview`
Returns real-time computed statistics from MongoDB Atlas (Team size, active users, driver accounts, and honest roadmap indicators for Phases 2-4).
- **Access:** Authenticated Workspace Member

### `GET /api/dashboard/activity`
Returns actual audit records of recent team actions.
- **Access:** Authenticated Workspace Member
