# FleetFlow — AI-Powered Transport & Fleet Management System
### Intelligent Multi-Tenant SaaS Platform for Modern Logistics

FleetFlow is an enterprise transport business operating system designed for logistics companies, commercial fleet operators, freight forwarders, and trucking carriers.

---

## 🚀 Fully Implemented Architecture & Features

### Phase 1: Core Foundation & Multi-Tenancy
- **Multi-Tenant SaaS Architecture:** Complete data isolation between transport companies at database and middleware layers.
- **Enterprise Authentication:** Salted bcrypt hashing, signed JWT bearer sessions, secure refresh token architecture, rate limiting, and password reset workflows.
- **Role-Based Access Control (RBAC):** Built-in support for 9 industry roles (`SUPER_ADMIN`, `COMPANY_OWNER`, `MANAGER`, `DISPATCHER`, `ACCOUNTANT`, `FLEET_MANAGER`, `MAINTENANCE_MANAGER`, `DRIVER`, `VIEWER`).
- **Company Profile & Localization:** Configurable settings for currency, timezone, distance units (km/miles), and fuel volume units (liters/gallons).
- **User & Team Management:** Scoped member listing, role assignment, search, filters, pagination, and account deactivation.

### Phase 2: Fleet & Resource Operations
- **Vehicle Fleet Registry:** Complete vehicle lifecycle, status management (`AVAILABLE`, `ASSIGNED`, `IN_MAINTENANCE`, `INACTIVE`), odometer tracking, and driver assignments.
- **Driver Profiles & Licensing:** License verification, expirations, contact details, and vehicle linking.
- **Customer CRM:** Company-scoped business accounts, shipping locations, contact people, and billing records.
- **Preventative Maintenance:** Work orders, cost tracking (parts & labor), and automatic vehicle status synchronization.
- **Fuel Logs & Mileage:** Detailed refueling receipts, price per liter, fuel station logging, and odometer advancement.
- **General Expense Management:** Tolls, permits, parking, and administrative expenses without double-counting trip costs.

### Phase 3: Complete Transport Operations
- **Shipment Order Management:** End-to-end customer cargo bookings, pickup/destination addresses, cargo categorization, weight/volume validation, and pricing.
- **Trip Planning & Atomic Dispatch:** Conflict-free trip assignment checking vehicle availability (prevents concurrent double-booking and blocks in-shop vehicles), driver availability, and pending shipments.
- **Trip Lifecycle:** Sequential status transitions (`PLANNED` → `ASSIGNED` → `IN_PROGRESS` → `COMPLETED` / `CANCELLED`), departure/arrival odometers, and automatic vehicle odometer updates.
- **Electronic Proof of Delivery (POD):** Delivery confirmation with recipient identity, POD tracking numbers, timestamps, and delivery notes.
- **Operational Financial Reports & Exports:** Live calculation of customer freight revenue, actual trip expenses, and gross operating margins. Company-scoped CSV data export with spreadsheet formula injection defense.

### Phase 4: AI Fleet Intelligence & Machine Learning
- **ML Trip Cost Predictor:** Trained Gradient Boosting Regressor (`scikit-learn`) achieving high predictive accuracy (**R² = 0.9952**, MAE: INR 1,143.40) on commercial haulage data.
- **Cost Component Breakdown & Explainability:** Decomposes predicted cost into fuel, tolls, driver pay, and maintenance reserve with confidence intervals and transparent reasoning.
- **Deterministic Zero-Downtime Fallback:** Built-in logistics physics estimator ensures core transport operations never fail even if the Python AI microservice is offline.
- **Fleet Telemetry Analytics:** Dynamic fuel economy averages (km/L), monthly fuel projections, eco-savings potential, and overdue maintenance alerts.
- **Proactive AI Recommendations:** Rule-backed operational recommendations with tenant-level dismissal and resolution tracking.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, React Router v6, React Hook Form, Zod, Axios.
- **Backend:** Node.js 20+, Express.js, TypeScript, Mongoose ODM, JWT, bcryptjs, Helmet, CORS, express-rate-limit.
- **AI Microservice:** Python 3.11, FastAPI, Uvicorn, scikit-learn, NumPy, Pandas, Joblib.
- **Database:** MongoDB Atlas (M0 Free Tier) with automated in-memory MongoDB fallback for testing and offline development.

---

## 📦 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or v20+)
- **npm** (v9+)
- **Python** (v3.10+ or v3.11+, for running the optional FastAPI AI service)
- (Optional) MongoDB Atlas Free Tier account ([Setup Guide](docs/MONGODB_SETUP.md))

### 2. Installation
Clone the repository and install all dependencies:
```bash
git clone https://github.com/jiteshzope21/FleetFlow.git
cd FleetFlow
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `MONGODB_URI` with your MongoDB Atlas connection string. (If left unset during local development or testing, an automated in-memory MongoDB instance will be used).

### 4. Running the Development Application
Start both the Express backend and the Vite frontend simultaneously with a single command from the project root:
```bash
npm run dev
```

- **Express Backend:** [http://localhost:5000](http://localhost:5000)
- **Vite Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

*(Optional) Start the FastAPI AI Microservice in a separate terminal:*
```bash
cd ai-service
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```
*Note: If the FastAPI service is not running, the application will automatically use its internal logistics regression estimator without error.*

### 5. Running the Test Suite
FleetFlow includes automated verification across all layers:
```bash
# Run all server test suites (env, DNS, lifecycle, Phase 1, Phase 2, Phase 3 & 4)
npm test

# Run individual test suites
npm run test:phase1 --workspace=server    # Multi-tenant Auth & RBAC
npm run test:phase2 --workspace=server    # Fleet, Fuel, Maintenance, Expenses
npm run test:phase3_4 --workspace=server  # Shipments, Dispatch, Reports, AI

# Run AI service unit tests
cd ai-service && python -m pytest test_ai.py
```

### 6. Production Build
Compile both frontend and backend for production:
```bash
npm run build
```

---

## 📖 Documentation
- [Architecture & Multi-Tenancy Specification](docs/ARCHITECTURE.md)
- [Complete API Documentation (Phases 1-4)](docs/API_DOCUMENTATION.md)
- [MongoDB Atlas Setup Guide](docs/MONGODB_SETUP.md)
- [Phase 1 Acceptance Verification Report](docs/PHASE_1_ACCEPTANCE.md)
