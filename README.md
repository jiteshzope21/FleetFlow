# FleetFlow — AI-Powered Transport & Fleet Management System
### Intelligent Multi-Tenant SaaS Platform for Modern Logistics

FleetFlow is a complete transport business operating system designed for logistics companies, commercial fleet operators, freight forwarders, and trucking carriers.

---

## 🚀 Phase 1 Foundation: Delivered Features

- **Multi-Tenant SaaS Architecture:** Complete data isolation between transport companies at database and middleware layers.
- **Enterprise Authentication:** Salted bcrypt hashing, signed JWT bearer sessions, secure refresh token architecture, rate limiting, and reset workflows.
- **Role-Based Access Control (RBAC):** Built-in support for 9 industry roles (`SUPER_ADMIN`, `COMPANY_OWNER`, `MANAGER`, `DISPATCHER`, `ACCOUNTANT`, `FLEET_MANAGER`, `MAINTENANCE_MANAGER`, `DRIVER`, `VIEWER`).
- **Company Workspace & Profile Management:** Custom settings for currency, timezone, distance units (km/miles), and fuel volume units (liters/gallons).
- **User & Team Management:** Scoped member listing, role assignment, search, filters, pagination, and account deactivation.
- **Real-Time Operational Dashboard:** Metrics computed strictly from live database records (no hardcoded figures), audit activity feeds, and honest Phase 2/3 roadmap indicators.
- **Modern Responsive UI/UX:** React 18, Vite, TypeScript, Tailwind CSS, Lucide icons, and light/dark theme persistence.
- **Database Connectivity:** MongoDB Atlas Free Tier with live `/api/health` monitoring and dev/test in-memory fallback.

---

## 🛠️ Technology Stack (100% Free & Open-Source)

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, React Router v6, TanStack Query, React Hook Form, Zod, Axios.
- **Backend:** Node.js 20+, Express.js, TypeScript, Mongoose ODM, JWT, bcryptjs, Helmet, CORS, express-rate-limit.
- **Database:** MongoDB Atlas (M0 Free Tier).

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js (v18 or v20+)
- npm (v9+)
- (Optional) MongoDB Atlas Free Tier account ([Setup Guide](docs/MONGODB_SETUP.md))

### 2. Installation
Clone the repository and install all dependencies:
```bash
git clone <repo-url>
cd "DPD PROJ"
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `MONGODB_URI` with your MongoDB Atlas connection string. (If left unset during local development or testing, an automated in-memory MongoDB instance will be used).

### 4. Running the Application
Run both backend API and frontend client concurrently:
```bash
npm run dev
```
- **Frontend Client:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 5. Running Automated Acceptance Tests
Run the 40-check automated integration and tenant isolation test suite:
```bash
npm run server:test
```

### 6. Production Build
Compile both frontend and backend for production:
```bash
npm run build
```

---

## 📖 Documentation
- [Architecture & Multi-Tenancy Specification](docs/ARCHITECTURE.md)
- [Complete API Documentation](docs/API_DOCUMENTATION.md)
- [MongoDB Atlas Free Tier Setup Guide](docs/MONGODB_SETUP.md)
- [Phase 1 Acceptance Verification Report](docs/PHASE_1_ACCEPTANCE.md)

---

## 🗺️ Roadmap
- **Phase 1 (Complete):** Foundation, Authentication, Core Platform, Multi-Tenancy & Dashboard Base.
- **Phase 2 (Upcoming):** Fleet Management, Vehicle Telemetry, Maintenance Schedules & Driver Assignment.
- **Phase 3:** Shipments, FastAPI AI Cost Prediction, Routing/Maps, Invoicing & Financial Reports.
- **Phase 4:** SaaS Subscriptions, Super Admin Portal, Security Hardening & Free-Tier Cloud Deployment.
