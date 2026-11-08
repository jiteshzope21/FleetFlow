# Reports, Analytics and Data Exports

## Operational and Financial Summary (`GET /api/reports/summary`)
FleetFlow calculates real-time operational and financial health metrics per company:
- `totalShipments`: Count of all booked freight orders.
- `deliveredShipments`: Count of successfully completed consignments.
- `totalTrips`: Aggregate dispatch missions.
- `completedTrips`: Fully concluded trips.
- `revenue`: Sum of `agreedPrice` across delivered shipments.
- `operationalCost`: Sum of fuel, maintenance, driver batta, and toll expenses across completed trips.
- `grossProfit`: `revenue - operationalCost`.
- `marginPercent`: `(grossProfit / revenue) * 100`.

## CSV Data Exports
FleetFlow provides direct CSV export endpoints for external spreadsheet analysis, tax filing, and auditing:
- `GET /api/reports/export/shipments`: Exports shipment records including dates, customer, weight, agreed price, and status.
- `GET /api/reports/export/trips`: Exports trip records including start/end odometers, distance, vehicle, driver, and cost breakdown.

