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
Returns real-time computed statistics from MongoDB Atlas:
- Fleet status: Total vehicles, active, in-maintenance, inactive
- Drivers: Total drivers, active licensed drivers
- Customers: Total accounts, active accounts
- Maintenance: Scheduled services, in-progress count, maintenance spend
- Fuel: Total consumption in Litres, total fuel expenditure
- Expenses: Categorized operational expenses, fuel expense, maintenance expense, and non-overlapping total operating cost
- Compliance Alerts: Expiring vehicle documents, driver licences, and due services within 30 days
- **Access:** Authenticated Workspace Member

### `GET /api/dashboard/activity`
Returns actual audit records of recent team actions across collections (users, vehicles, maintenance, fuel, expenses).
- **Access:** Authenticated Workspace Member

---

## 6. Phase 2 — Vehicle Management (`/api/vehicles`)

### `GET /api/vehicles`
List tenant vehicles with pagination, search, status, and type filtering.
- **Query Params:** `page`, `limit`, `search`, `status`, `type`, `fuelType`
- **Access:** Authenticated Workspace Member

### `POST /api/vehicles`
Create a new fleet vehicle.
- **Access:** Any role with `manage_fleet` (Owner, Manager, Fleet Manager, Dispatcher)
- **Request Body:**
```json
{
  "registrationNumber": "MH12AB1234",
  "type": "TRUCK",
  "make": "Tata Motors",
  "model": "Prima 4028",
  "year": 2023,
  "fuelType": "DIESEL",
  "currentOdometer": 45000,
  "status": "ACTIVE",
  "purchaseDate": "2023-01-15T00:00:00.000Z",
  "purchasePrice": 3200000,
  "insuranceExpiryDate": "2027-01-15T00:00:00.000Z"
}
```

### `GET /api/vehicles/:id`
Retrieve single vehicle details with populated driver.
- **Access:** Authenticated Workspace Member

### `PATCH /api/vehicles/:id`
Update vehicle attributes, odometer, or compliance dates.
- **Access:** `manage_fleet`

### `DELETE /api/vehicles/:id`
Soft-archives vehicle safely.
- **Access:** `manage_fleet`

---

## 7. Phase 2 — Driver Management (`/api/drivers`)

### `GET /api/drivers`
List tenant drivers with search, status filtering, and vehicle assignment details.
- **Query Params:** `page`, `limit`, `search`, `status`
- **Access:** Authenticated Workspace Member

### `POST /api/drivers`
Onboard a new transport driver with optional vehicle assignment.
- **Access:** `manage_fleet`
- **Request Body:**
```json
{
  "name": "Rajesh Kumar",
  "phone": "+91 98765 43210",
  "email": "rajesh.driver@apexfreight.com",
  "licenseNumber": "MH14-2022-0045678",
  "licenseCategory": "HEAVY_GOODS",
  "licenseExpiryDate": "2028-10-15T00:00:00.000Z",
  "dateOfJoining": "2024-01-01T00:00:00.000Z",
  "status": "ACTIVE",
  "assignedVehicleId": "6aca990cb109a16aa66c42fd"
}
```

### `GET /api/drivers/:id`
Retrieve single driver details.
- **Access:** Authenticated Workspace Member

### `PATCH /api/drivers/:id`
Update driver details or change assigned vehicle.
- **Access:** `manage_fleet`

### `DELETE /api/drivers/:id`
Archives driver and automatically unlinks assigned vehicle.
- **Access:** `manage_fleet`

---

## 8. Phase 2 — Customer Management (`/api/customers`)

### `GET /api/customers`
List transport customers/clients.
- **Query Params:** `page`, `limit`, `search`, `status`, `customerType`
- **Access:** Authenticated Workspace Member

### `POST /api/customers`
Create a customer profile.
- **Access:** Any role with `manage_customers` (Owner, Manager, Dispatcher, Accountant)
- **Request Body:**
```json
{
  "name": "Reliance Retail Logistics Ltd",
  "customerType": "CORPORATE",
  "contactPerson": "Sunil Verma",
  "phone": "+91 98111 22233",
  "email": "sunil.v@relianceretail.com",
  "taxId": "27AAACR1234F1Z5",
  "paymentTerms": "NET_30",
  "status": "ACTIVE"
}
```

### `GET /api/customers/:id`
Retrieve single customer profile.
- **Access:** Authenticated Workspace Member

### `PATCH /api/customers/:id`
Update customer profile.
- **Access:** `manage_customers`

### `DELETE /api/customers/:id`
Archives customer.
- **Access:** `manage_customers`

---

## 9. Phase 2 — Vehicle Maintenance Management (`/api/maintenance`)

### `GET /api/maintenance`
List maintenance logs and service history with vehicle and status filters.
- **Query Params:** `page`, `limit`, `vehicleId`, `status`, `serviceType`
- **Access:** Authenticated Workspace Member

### `POST /api/maintenance`
Create a maintenance log. Automatically synchronizes vehicle status to `IN_MAINTENANCE` if status is `SCHEDULED` or `IN_PROGRESS`, and updates vehicle odometer.
- **Access:** `manage_fleet`
- **Request Body:**
```json
{
  "vehicleId": "6aca990cb109a16aa66c42fd",
  "serviceType": "PREVENTIVE",
  "description": "40,000 km general service, engine oil & filter change",
  "serviceDate": "2026-10-10T00:00:00.000Z",
  "odometerReading": 45500,
  "serviceProvider": "Tata Authorized Workshop Pune",
  "partsCost": 3500,
  "laborCost": 1500,
  "status": "IN_PROGRESS"
}
```

### `PATCH /api/maintenance/:id`
Update service status. Returning to `COMPLETED` restores vehicle status to `ACTIVE`.
- **Access:** `manage_fleet`

### `DELETE /api/maintenance/:id`
Archive maintenance record.
- **Access:** `manage_fleet`

---

## 10. Phase 2 — Fuel Management (`/api/fuel`)

### `GET /api/fuel`
List fuel entries with vehicle and driver filters.
- **Query Params:** `page`, `limit`, `vehicleId`, `driverId`, `fuelType`
- **Access:** Authenticated Workspace Member

### `POST /api/fuel`
Log fuel fill-up. Automatically computes `totalCost = quantity * pricePerUnit` and updates vehicle odometer forward.
- **Access:** `manage_fleet`
- **Request Body:**
```json
{
  "vehicleId": "6aca990cb109a16aa66c42fd",
  "driverId": "6aca990cb109a16aa66c4310",
  "fuelDate": "2026-10-10T00:00:00.000Z",
  "fuelType": "DIESEL",
  "quantity": 120,
  "pricePerUnit": 92.50,
  "odometerReading": 46200,
  "stationName": "Indian Oil Corporation, Pune Highway"
}
```

### `GET /api/fuel/:id`
Retrieve single fuel log.
- **Access:** Authenticated Workspace Member

### `PATCH /api/fuel/:id`
Update fuel log.
- **Access:** `manage_fleet`

### `DELETE /api/fuel/:id`
Archive fuel record.
- **Access:** `manage_fleet`

---

## 11. Phase 2 — Operational Expense Management (`/api/expenses`)

### `GET /api/expenses`
List general business and vehicle expenses.
- **Query Params:** `page`, `limit`, `category`, `vehicleId`, `driverId`, `customerId`
- **Access:** Authenticated Workspace Member

### `POST /api/expenses`
Record an operational expense (tolls, parking, permits, repairs, administration).
- **Access:** Any role with `manage_expenses` (Owner, Manager, Accountant)
- **Request Body:**
```json
{
  "title": "Mumbai-Pune Expressway Toll",
  "category": "TOLLS",
  "expenseDate": "2026-10-10T00:00:00.000Z",
  "amount": 650,
  "currency": "INR",
  "vehicleId": "6aca990cb109a16aa66c42fd",
  "paymentMethod": "FASTAG",
  "vendor": "NHAI FASTag"
}
```

### `GET /api/expenses/:id`
Retrieve single expense entry.
- **Access:** Authenticated Workspace Member

### `PATCH /api/expenses/:id`
Update expense entry.
- **Access:** `manage_expenses`

### `DELETE /api/expenses/:id`
Archive expense entry.
- **Access:** `manage_expenses`

