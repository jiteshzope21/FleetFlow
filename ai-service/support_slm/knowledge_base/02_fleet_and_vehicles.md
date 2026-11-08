# Fleet and Vehicle Management

## Vehicle Inventory
FleetFlow enables fleet operators to register, monitor, and manage transport vehicles with real-time operational status and compliance tracking.

## Supported Vehicle Types
FleetFlow supports 6 vehicle classifications:
- `TRUCK`: Medium to heavy commercial goods carriers.
- `TRAILER`: Multi-axle articulated freight trailers.
- `VAN`: Light commercial vehicles for intra-city distribution and parcel delivery.
- `TANKER`: Specialized liquid/gas bulk carriers.
- `CONTAINER`: Intermodal standardized container carriers.
- `OTHER`: Customized or specialty transport equipment.

## Supported Fuel Types
- `DIESEL`: Standard commercial transport fuel.
- `PETROL`: Gasoline for light utility vehicles.
- `CNG`: Compressed Natural Gas for urban eco-distribution.
- `ELECTRIC`: Battery Electric Vehicles (EV) with zero tailpipe emissions.
- `HYBRID`: Dual fuel / hybrid powertrains.
- `LNG`: Liquefied Natural Gas for long-haul heavy haulage.

## Operational Vehicle Statuses
Vehicles transition between 3 primary statuses:
1. `ACTIVE`: Vehicle is available for trip scheduling, dispatch, or currently on active road missions.
2. `IN_MAINTENANCE`: Vehicle is currently undergoing scheduled servicing or mechanical repair. **Important:** The system automatically blocks vehicles in this status from new trip dispatches to prevent dispatching unroadworthy units.
3. `INACTIVE`: Decommissioned or temporarily sidelined vehicles.

## Vehicle Registration Rules & Constraints
- `registrationNumber`: Must be unique per company. Trimmed and converted to uppercase automatically (e.g., `MH12AB1234`).
- `year`: Must be between 1980 and current year + 2.
- `currentOdometer`: Non-negative numeric value in kilometers. Automatically updated when trips are completed.
- `assignedDriverId`: Bidirectional link between vehicle and driver. Assigning a driver to a vehicle automatically synchronizes the driver's profile with this vehicle.
- Document compliance tracking:
  - `insuranceExpiryDate`: Policy validity date.
  - `registrationExpiryDate`: State road transport permit expiry.
  - `pollutionExpiryDate`: PUC (Pollution Under Control) certificate expiry.
- Plan limits: Adding a vehicle checks the company's active subscription plan (`maxVehicles`). If the vehicle limit is exceeded, the server returns HTTP 403 with plan upgrade instructions.

