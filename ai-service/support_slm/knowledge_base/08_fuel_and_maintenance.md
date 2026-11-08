# Fuel Management and Vehicle Maintenance

## Fuel Logging and Telemetry
Fuel represents the largest variable operating expense in road freight transport. FleetFlow tracks refueling events per vehicle and driver:
- `vehicleId`: Target vehicle filled.
- `refuelingDate`: Date and time of fuel purchase.
- `quantity`: Fuel volume dispensed in Liters.
- `pricePerUnit`: Cost per Liter in INR (or configured currency).
- `totalCost`: Automatically validated as `quantity * pricePerUnit`.
- `odometer`: Current odometer reading at the fuel pump. Allows computing mileage (km per liter) between consecutive fill-ups.
- `fuelStation`: Pump name, highway location, or Fastag fuel point.
- `invoiceNumber`: Vendor fuel receipt number.

## Maintenance Management
FleetFlow tracks vehicle service work orders to maximize fleet uptime and prevent costly roadside breakdowns.

### Service Types
- `ROUTINE_SERVICE`: Scheduled preventative maintenance.
- `REPAIR`: Corrective mechanical or electrical repair.
- `INSPECTION`: Periodic roadworthiness or fitness certificate inspection.
- `TIRE_REPLACEMENT`: Tire rotation, retreading, or new tire installation.
- `OIL_CHANGE`: Engine oil and filter renewal.
- `BRAKE_SERVICE`: Brake pad/drum inspection and replacement.
- `ACCIDENT_REPAIR`: Body and structural collision damage repairs.
- `OTHER`: Auxiliary servicing.

### Maintenance Workflow and Vehicle Locking
1. Maintenance record created with status `SCHEDULED` or `IN_PROGRESS`.
2. Target vehicle's status is automatically set to `IN_MAINTENANCE`.
3. Vehicle is immediately locked from new trip dispatches to prevent unsafe dispatch.
4. Workshop logs `partsCost`, `laborCost`, and `totalCost`.
5. Upon marking the work order as `COMPLETED`, the vehicle status is automatically reverted to `ACTIVE`, immediately re-enabling it for dispatch.

