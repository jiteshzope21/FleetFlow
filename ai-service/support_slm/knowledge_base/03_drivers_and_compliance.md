# Driver Management and Compliance

## Driver Profiles
FleetFlow tracks transport drivers with compliance data, contact records, emergency contacts, and vehicle assignments.

## Driver Statuses
- `ACTIVE`: Available for dispatch or currently operating assigned trips.
- `INACTIVE`: Inactive or former employee. Cannot be assigned to new trips.
- `ON_LEAVE`: Driver is currently on approved leave. Cannot be assigned to new trips.

## Compliance Fields & Validation
- `licenseNumber`: Heavy Motor Vehicle (HMV) or commercial transport driving license number. Unique per driver profile.
- `licenseCategory`: Commercial license endorsement (default: `HMV / Heavy Transport`).
- `licenseExpiryDate`: Mandatory expiration date. The platform alerts operators prior to license expiration to avoid regulatory penalties and impoundments.
- `phone`: Primary mobile contact for dispatch and emergency notifications.
- `emergencyContact`: Name, phone, and relationship for safety assurance.

## Bidirectional Vehicle Assignment Logic
- When a driver is assigned to a vehicle, the vehicle's `assignedDriverId` field is automatically updated.
- If the driver was previously assigned to a different vehicle, that older vehicle is automatically unlinked (`assignedDriverId = null`).
- If another driver was previously assigned to the target vehicle, that driver's vehicle link is cleaned up automatically to prevent double-assignment conflicts.

