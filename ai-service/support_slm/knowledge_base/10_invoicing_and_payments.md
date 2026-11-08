# Invoicing, Billing and Payment Collection

## Invoicing Module Overview
FleetFlow allows transport companies to generate formal commercial invoices for shippers and customers based on completed shipments or contract terms.

## Invoice Structure
- `invoiceNumber`: Unique alphanumeric identifier (e.g., `INV-2026-001`).
- `customerId`: Bill-to customer entity.
- `tripId` / `shipmentId`: Optional linkages linking invoice directly to underlying operational trips.
- `items`: Itemized line items containing description, quantity, unit price, and subtotal.
- `taxRate` and `taxAmount`: Applied tax (such as 5% or 18% GST).
- `totalAmount`: `subtotal + taxAmount`.
- `paidAmount`: Cumulative payments received.
- `status`:
  - `DRAFT`: Preliminary draft before issuance.
  - `ISSUED`: Finalized invoice transmitted to customer.
  - `PARTIALLY_PAID`: Customer made partial milestone payment.
  - `PAID`: Balance completely settled (`paidAmount == totalAmount`).
  - `OVERDUE`: Due date passed without full payment.
  - `CANCELLED`: Voided invoice.

## Payment Recording Rules & Protections
- Recording a payment (`POST /api/invoices/:id/payments`):
  - Requires `amount`, `paymentDate`, `paymentMethod` (`BANK_TRANSFER`, `CHEQUE`, `CASH`, `UPI`, `CREDIT_CARD`), and optional `transactionReference`.
- **Overpayment Protection:** If a recorded payment exceeds the remaining outstanding balance (`totalAmount - paidAmount`), the server rejects it with HTTP 400: *"Payment exceeds remaining balance"*.
- **Double Payment Guard:** Rejects payments on already settled `PAID` invoices.

