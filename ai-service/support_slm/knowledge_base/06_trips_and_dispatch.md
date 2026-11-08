# Trip Dispatching, Scheduling and Tracking

## Trip Concept
A Trip represents the actual physical road mission executed by a vehicle and driver. A single trip can carry one or multiple freight shipments between origin and destination with intermediate route waypoints.

## Trip Lifecycle State Machine
A trip transitions through defined operational statuses:
1. `DRAFT`: Preliminary route draft, stops being compiled.
2. `PLANNED`: Routing finalized, departure and arrival windows scheduled.
3. `ASSIGNED`: Vehicle and driver assigned to the trip. Associated shipments transition to `ASSIGNED`.
4. `IN_PROGRESS`: Trip started by operator or driver (`POST /api/trips/:id/start`). Start odometer recorded. Associated shipments transition to `IN_TRANSIT`.
5. `COMPLETED`: Trip concluded at final destination (`POST /api/trips/:id/complete`). End odometer and actual expenses recorded. Associated shipments transition to `DELIVERED`.
6. `CANCELLED`: Trip aborted. Releases assigned vehicle and driver back to available status.

## Concurrency-Safe Dispatch Protection
To prevent double-booking:
- When a trip is scheduled or dispatched, FleetFlow executes atomic checks on both `vehicleId` and `driverId`.
- If a vehicle or driver is already assigned to another `IN_PROGRESS` or active `ASSIGNED` trip, the request is rejected with HTTP 400: *"Vehicle/Driver is already assigned to an active trip"*.
- If a vehicle is in `IN_MAINTENANCE` status, dispatch is blocked with HTTP 400: *"Cannot dispatch vehicle currently in maintenance"*.

## Odometer Synchronization & Actual Mileage
- When a trip completes, `endOdometer - startOdometer` is computed as `actualDistanceKm`.
- The assigned vehicle's `currentOdometer` is automatically updated to `endOdometer`.
- This ensures maintenance intervals (such as 10,000 km oil service alerts) remain strictly synchronized with actual road wear.

