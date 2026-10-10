# MongoDB Atlas Free Tier Setup Guide

FleetFlow requires a persistent database connection to MongoDB Atlas (M0 Free Tier). This guide details how to create your cluster, configure credentials, and connect FleetFlow.

---

## 1. Create a Free MongoDB Atlas Account
1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Sign up or log into your account.
3. Select **Deploy a database** -> Choose **M0 Free Tier** (Shared RAM, 512 MB Storage).
4. Select your preferred Cloud Provider (AWS, GCP, or Azure) and nearest region.
5. Click **Create Deployment**.

---

## 2. Configure Database Security & User
1. Under **Database Access** in the left sidebar:
   - Click **Add New Database User**.
   - Authentication Method: **Password**.
   - Username: `fleetflow_admin` (or custom name).
   - Password: Choose a secure password (avoid special characters like `@` or `:` or URL-encode them).
   - Database User Privileges: **Read and write to any database**.
   - Click **Add User**.

2. Under **Network Access** in the left sidebar:
   - Click **Add IP Address**.
   - To allow local development, select **Allow Access from Anywhere** (`0.0.0.0/0`) or add your current workstation IP address.
   - Click **Confirm**.

---

## 3. Retrieve Your Connection String
1. Return to **Database** -> Click **Connect** on your cluster.
2. Select **Drivers** -> Driver: **Node.js** (Version 5.5 or later).
3. Copy the connection URI:
   ```text
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/fleetflow?retryWrites=true&w=majority
   ```
4. Replace `<username>` and `<password>` with your database user credentials.
5. Append `/fleetflow` after the host domain to specify the database namespace.

---

## 4. Configure FleetFlow Environment
Create or edit `.env` in the root of the project:
```env
MONGODB_URI=mongodb+srv://fleetflow_admin:YourPassword123@cluster0.abcde.mongodb.net/fleetflow?retryWrites=true&w=majority
```

---

## 5. Verify Database Connectivity
1. Start the FleetFlow server:
   ```bash
   npm run server:dev
   ```
2. Check terminal output:
   ```text
   [INFO] Connecting to MongoDB at: mongodb+srv://***:***@cluster0.abcde.mongodb.net/fleetflow...
   [INFO] Connected to MongoDB successfully.
   ```
3. Query the health check endpoint:
   ```bash
   curl http://localhost:5000/api/health
   ```
   The response will confirm:
   ```json
   {
     "success": true,
     "data": {
       "status": "healthy",
       "database": {
         "status": "connected",
         "connected": true
       }
     }
   }
   ```
