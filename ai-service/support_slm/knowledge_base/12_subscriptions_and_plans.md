# Subscription Plans and Capacity Restrictions

## Subscription Tiers
FleetFlow is a subscription-based multi-tenant platform with 4 tiered service plans:
1. `FREE` / `TRIAL`:
   - 14-day free trial assigned upon new company registration.
   - Max Vehicles: 5
   - Max Users: 3
   - Max Shipments Per Month: 50
2. `STARTER`:
   - Small fleet operators.
   - Price: $49/month or $490/year.
   - Max Vehicles: 10
   - Max Users: 5
   - Max Shipments Per Month: 150
3. `PROFESSIONAL`:
   - Growing transport businesses.
   - Price: $149/month or $1,490/year.
   - Max Vehicles: 30
   - Max Users: 15
   - Max Shipments Per Month: 600
4. `ENTERPRISE`:
   - Large logistics carriers and 3PL enterprises.
   - Price: $399/month or $3,990/year.
   - Max Vehicles: Unlimited (or 500)
   - Max Users: Unlimited (or 100)
   - Max Shipments Per Month: Unlimited (or 10,000)

## Plan Restriction Enforcement
- When a company attempts to create a new vehicle, user, or shipment, the backend checks current count against the active plan limits.
- If the limit has been reached, creation is blocked with HTTP 403: *"Plan limit reached. Please upgrade your subscription."*
- Company Owners can navigate to **Company Settings > Subscription** (`/company/subscription`) to view usage meters, compare plans, and upgrade or toggle auto-renew.

