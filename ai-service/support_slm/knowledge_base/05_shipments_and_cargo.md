# Shipment Booking and Cargo Management

## Freight Shipment Overview
Shipments represent individual customer cargo orders requiring transport between pickup origin and destination addresses.

## Cargo Classifications
- `GENERAL`: Standard palletized or packaged freight.
- `FRAGILE`: High-care goods requiring shock-free handling.
- `PERISHABLE`: Temperature-sensitive consumables, produce, or pharmaceuticals.
- `HAZARDOUS`: Regulated dangerous goods (flammables, chemicals) requiring safety placards.
- `LIQUID`: Bulk liquid tanker cargo.
- `HEAVY_MACHINERY`: Oversized industrial equipment or break-bulk cargo.
- `PARCEL`: Small parcels, express courier packages, or e-commerce cartons.
- `OTHER`: Uncategorized specialized freight.

## Shipment Priority Levels
- `STANDARD`: Normal operational transit schedule.
- `HIGH`: Prioritized dispatch with expedited loading.
- `URGENT`: Critical priority dispatch with direct, non-stop routing.

## Shipment Lifecycle States
A shipment progresses through the following sequential states:
1. `PENDING`: Newly created shipment awaiting trip assignment or resource allocation.
2. `ASSIGNED`: Linked to a scheduled trip with assigned vehicle and driver.
3. `PICKED_UP`: Cargo loaded at origin and dispatch departed.
4. `IN_TRANSIT`: Freight is on the road toward destination.
5. `DELIVERED`: Successfully arrived at consignee destination with delivery confirmation / POD recorded.
6. `CANCELLED`: Shipment aborted prior to transit.

## Shipment Pricing Fields
- `estimatedCost`: Internal operating cost estimated using route distance and vehicle overhead (or via the AI Trip Cost Predictor).
- `agreedPrice`: Contractual freight rate billed to the customer.
- Revenue Margin = `agreedPrice - estimatedCost`.
- Monthly quota: Shipment creation respects `maxShipmentsPerMonth` defined by the company's active subscription tier.

