# Customer Directory and Directory Management

## Customer Management
FleetFlow maintains an address book and commercial profile for every client entity (shippers, consignors, freight forwarders, and retail clients).

## Customer Classifications
- `CORPORATE`: Contractual enterprise shippers with ongoing high-volume accounts and negotiated payment terms.
- `FORWARDER`: Third-party freight forwarders and logistics aggregators.
- `RETAIL`: Occasional or walk-in transport clients.
- `INDIVIDUAL`: Personal consignment shippers.

## Key Customer Fields
- `name`: Legal business or individual name.
- `contactPerson`: Primary logistics contact or dispatch manager.
- `phone` and `email`: Communication channels for consignment notifications and invoice dispatch.
- `taxId`: GSTIN (Goods and Services Tax Identification Number in India) or Corporate Tax ID for invoicing compliance.
- `billingAddress` and `shippingAddress`: Structured addresses including street, city, state, postal code, and country.
- `paymentTerms`: Commercial payment agreement (e.g., Net 15, Net 30, Cash on Delivery).
- `status`: `ACTIVE` or `INACTIVE`. Only active customers can be selected when creating new shipments.

