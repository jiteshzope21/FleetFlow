# Support Tickets, Incident Reporting and Human Escalation

## Support Ticketing Module
When an operational, billing, or technical issue cannot be resolved through automated self-service, FleetFlow features an integrated support ticket escalation system.

## Ticket Schema & Properties
- `ticketNumber`: Auto-generated unique tracking ID formatted as `TICK-<timestamp_suffix>-<random_code>` (e.g., `TICK-42100-3841`).
- `subject`: Short summary of the inquiry (maximum 200 characters).
- `description`: Detailed statement of the issue or incident.
- `priority`:
  - `LOW`: General inquiries or non-critical configuration questions.
  - `MEDIUM`: Standard operational assistance.
  - `HIGH`: Degraded functionality impacting daily operations.
  - `URGENT`: Blocker preventing vehicle dispatch, invoicing, or fleet tracking.
- `status`:
  - `OPEN`: Newly filed ticket awaiting operator response.
  - `IN_PROGRESS`: Assigned support engineer or Super Admin is actively investigating.
  - `RESOLVED`: Solution provided to carrier.
  - `CLOSED`: Inquiry finalized and closed. If a user posts a new reply to a `RESOLVED` ticket, the ticket status automatically re-opens to `OPEN`.
- `category`:
  - `BILLING`: Subscription, invoice, or payment disputes.
  - `TECHNICAL`: System bugs, API errors, or integration problems.
  - `FEATURE_REQUEST`: Feedback and capability suggestions.
  - `GENERAL`: Operational guidance and onboarding assistance.

## Human Escalation Workflow
- Users can create tickets on the **Customer Support** page (`/support`) or directly escalate an ongoing conversation from the AI Chatbot assistant.
- Super Admins review carrier tickets in the Super Admin Portal (`/admin/support`) and submit threaded replies that appear directly in the user's ticket thread.

