# AI Trip Cost Predictor and Machine Learning Intelligence

## AI Architecture
FleetFlow includes a dedicated Python FastAPI intelligence microservice running on port 8000 (`/predict/trip-cost`, `/insights/fuel`, `/insights/maintenance`, `/recommendations`).

## Trip Cost Predictor (`POST /api/ai/predict/trip-cost`)
The AI engine predicts route operating expenses and recommends quoting prices based on historical dispatch telemetry and physics drag modeling.

### Required Input Parameters
- `distance_km`: Trip distance in kilometers (must be strictly greater than 0).
- `cargo_weight_kg`: Payload cargo weight in kilograms (must be non-negative).
- `vehicle_type`: `TRUCK`, `TRAILER`, `VAN`, `TANKER`, `CONTAINER` (default: `TRUCK`).
- `fuel_type`: `DIESEL`, `PETROL`, `CNG`, `ELECTRIC` (default: `DIESEL`).
- `fuel_price_per_liter`: Current fuel price in INR (default: 92.50).

### Output Breakdown
- `predicted_cost`: Total estimated journey expense in INR (minimum floor 500 INR).
- `cost_breakdown`:
  - `fuel_cost`: Fuel consumed based on vehicle tare weight drag and cargo mass.
  - `toll_charges`: Highway toll plaza fees based on axle count and distance.
  - `driver_allowance`: Driver batta (base allowance + per-km wage).
  - `maintenance_reserves`: Wear-and-tear tire and brake depreciation reserve.
- `cost_per_km`: Average cost per kilometer.
- `confidence_interval`: Lower and upper bounds computed with root mean square error (RMSE).
- `explainability`: Natural language breakdown explaining how weight, vehicle aerodynamics, and distance contributed to the prediction.

## High-Availability Telemetry & Failover Fallback
- If the Python microservice is temporarily unreachable, the Node.js backend seamlessly falls back to an embedded deterministic physics formula.
- The user experience is uninterrupted, and the request duration and fallback usage are recorded in the `AITelemetry` collection for administrative auditing.

