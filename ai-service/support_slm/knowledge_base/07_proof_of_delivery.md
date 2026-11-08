# Proof of Delivery (POD) and Delivery Confirmation

## Proof of Delivery (POD) Overview
Proof of Delivery verifies that cargo has been handed over to the authorized consignee in acceptable condition, concluding freight liability and triggering invoice eligibility.

## POD Data Points
When completing a trip or updating shipment status to `DELIVERED`, FleetFlow captures:
- `deliveredAt`: Precise timestamp of physical delivery.
- `recipientName`: Name of consignee or dock receiving manager.
- `recipientPhone`: Contact number of receiving signatory.
- `notes`: Delivery comments, dock number, or package seal condition.
- `podNumber`: Unique paper or electronic delivery acknowledgement number (also known in Indian logistics as the signed *bilty* / *pauti* receipt number).

## Operational Workflow
1. Driver or dispatcher navigates to **Trips** or **Shipments** page.
2. Selects the active trip or in-transit shipment.
3. Enters delivery confirmation details and end odometer reading.
4. System automatically transitions shipment status to `DELIVERED`.
5. An invoice can now be generated directly from the completed shipment or trip.

