# Troubleshooting Common Operational and Technical Issues

## Common Error Messages and Resolutions

### 1. HTTP 400: "Vehicle/Driver is already assigned to an active trip"
- **Cause:** Attempting to assign a vehicle or driver that is already linked to a trip currently in `ASSIGNED` or `IN_PROGRESS` status.
- **Resolution:** Navigate to **Trips** (`/trips`), locate the active trip for that vehicle/driver, and either complete the trip or remove the assignment before dispatching a new journey.

### 2. HTTP 400: "Cannot dispatch vehicle currently in maintenance"
- **Cause:** The vehicle's status is `IN_MAINTENANCE` due to an active service or repair work order.
- **Resolution:** Navigate to **Maintenance** (`/maintenance`), locate the open work order, verify with workshop personnel that repairs are finished, and mark the service status as `COMPLETED`. The vehicle status will automatically revert to `ACTIVE`.

### 3. HTTP 400: "Payment exceeds remaining balance"
- **Cause:** Attempting to record a payment amount greater than `invoice.totalAmount - invoice.paidAmount`.
- **Resolution:** Verify the outstanding balance on the invoice details card and enter an amount less than or equal to the remaining balance.

### 4. HTTP 403: "Plan limit reached. Please upgrade your subscription"
- **Cause:** Reached maximum allowable vehicles, users, or monthly shipments for current tier (`FREE`: 5 vehicles, `STARTER`: 10, `PROFESSIONAL`: 30).
- **Resolution:** Company Owner should go to **Company Settings > Subscription** (`/company/subscription`) and upgrade to a higher tier.

### 5. HTTP 401 / 403: "Invalid token" or "Session expired"
- **Cause:** JWT token has expired or user account status is `INACTIVE`.
- **Resolution:** Re-authenticate at `/login`. If the issue persists, contact the company owner to verify your account status.

### 6. HTTP 404: "Resource not found" when accessing valid record ID
- **Cause:** Strict multi-tenant data isolation. The resource belongs to another company workspace or has been archived.
- **Resolution:** Verify you are logged into the correct company account. You cannot access data belonging to another carrier.

### 7. AI Trip Cost Estimator returning fallback values
- **Cause:** Python AI service port 8000 unreachable or restarting.
- **Resolution:** The system automatically switches to the built-in deterministic physics calculation without interrupting your quote workflow. Once the Python service resumes, model inference re-engages automatically.

