import assert from 'node:assert';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { Company } from '../models/Company.js';
import { User } from '../models/User.js';
import { Vehicle } from '../models/Vehicle.js';
import { Driver } from '../models/Driver.js';
import { Customer } from '../models/Customer.js';
import { Shipment } from '../models/Shipment.js';
import { Trip } from '../models/Trip.js';

let passedCount = 0;
let failedCount = 0;

function assertTest(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failedCount++;
    throw new Error(`Assertion failed: ${testName}`);
  }
}

async function runPhase3And4Tests() {
  console.log('\n========================================================');
  console.log('🧪 FLEETFLOW PHASE 3 & PHASE 4 - ACCEPTANCE TEST SUITE');
  console.log('========================================================\n');

  try {
    console.log('📦 Step 1: Connecting to Isolated Database...');
    await connectDB('test-memory');
    await Promise.all([
      Company.deleteMany({}),
      User.deleteMany({}),
      Vehicle.deleteMany({}),
      Driver.deleteMany({}),
      Customer.deleteMany({}),
      Shipment.deleteMany({}),
      Trip.deleteMany({}),
    ]);
    console.log('   Database cleaned.\n');

    console.log('🏢 Step 2: Registering Tenants & Initializing Operational Fleet...');
    // Company A
    const regResA = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Apex Logistics India',
        companyEmail: 'contact@apexlogistics.in',
        companyPhone: '+91 98765 00001',
        businessType: 'LOGISTICS',
        ownerName: 'Alice Sharma',
        ownerEmail: 'alice@apexlogistics.in',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
    const tokenA = regResA.body.data.accessToken;

    // Company B (Tenant isolation competitor)
    const regResB = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Bharat Freight Carriers',
        companyEmail: 'contact@bharatfreight.in',
        companyPhone: '+91 98765 00002',
        businessType: 'TRUCKING',
        ownerName: 'Bharat Patel',
        ownerEmail: 'bharat@bharatfreight.in',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
    const tokenB = regResB.body.data.accessToken;

    // Create Vehicle for Company A
    const vResA = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        registrationNumber: 'MH12AB1234',
        type: 'TRUCK',
        make: 'Tata Motors',
        model: 'Prima 4028',
        year: 2023,
        fuelType: 'DIESEL',
        currentOdometer: 50000,
        status: 'ACTIVE',
      });
    const vehicleAId = vResA.body.data._id;

    // Create Vehicle 2 for Company A (In Maintenance to test conflict prevention)
    const vMaintRes = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        registrationNumber: 'MH12CD5678',
        type: 'TRAILER',
        make: 'BharatBenz',
        model: '3528C',
        year: 2022,
        fuelType: 'DIESEL',
        currentOdometer: 85000,
        status: 'IN_MAINTENANCE',
      });
    const vehicleMaintId = vMaintRes.body.data._id;

    // Create Driver for Company A
    const dResA = await request(app)
      .post('/api/drivers')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Ramesh Yadav',
        phone: '+91 98220 12345',
        licenseNumber: 'MH12-2021-0098765',
        licenseCategory: 'HEAVY_GOODS',
        licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'ACTIVE',
      });
    const driverAId = dResA.body.data._id;

    // Create Customer for Company A
    const cResA = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Tata Steel Tubes Ltd',
        customerType: 'CORPORATE',
        contactPerson: 'Vikas Roy',
        phone: '+91 98330 55555',
        email: 'vikas.roy@tatasteel.com',
        status: 'ACTIVE',
      });
    const customerAId = cResA.body.data._id;

    // Create Customer for Company B
    const cResB = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Reliance Retail Ltd',
        customerType: 'CORPORATE',
        contactPerson: 'Anil Ambani',
        phone: '+91 98440 66666',
        email: 'anil@reliance.com',
        status: 'ACTIVE',
      });
    const customerBId = cResB.body.data._id;

    assertTest(vResA.status === 201 && dResA.status === 201 && cResA.status === 201, 'Phase 1 & 2 baseline resources provisioned for testing');

    console.log('\n📦 Step 3: Phase 3 — Testing Shipment Orders...');
    // 3.1 Create valid shipment
    const shipRes1 = await request(app)
      .post('/api/shipments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        shipmentNumber: 'SHP-MH-001',
        customerId: customerAId,
        origin: {
          address: 'Jamshedpur Steel Yard',
          city: 'Jamshedpur',
          state: 'Jharkhand',
        },
        destination: {
          address: 'Pune Auto Cluster',
          city: 'Pune',
          state: 'Maharashtra',
        },
        cargoDescription: 'Heavy Structural Steel Beams',
        cargoCategory: 'HEAVY_MACHINERY',
        weightKg: 14000,
        agreedPrice: 75000,
        estimatedCost: 48000,
        priority: 'HIGH',
      });
    assertTest(shipRes1.status === 201, 'POST /api/shipments creates shipment (201 Created)');
    assertTest(shipRes1.body.data.shipmentNumber === 'SHP-MH-001', 'Shipment reference saved correctly');
    assertTest(shipRes1.body.data.status === 'PENDING', 'Initial shipment status is PENDING');
    const shipment1Id = shipRes1.body.data._id;

    // 3.2 Cross-tenant customer assignment block
    const crossCustRes = await request(app)
      .post('/api/shipments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        customerId: customerBId, // Company B's customer
        origin: { address: 'Plot 1', city: 'Mumbai' },
        destination: { address: 'Plot 2', city: 'Delhi' },
        cargoDescription: 'Electronics',
        weightKg: 2000,
        agreedPrice: 30000,
      });
    assertTest(crossCustRes.status === 400, 'Cross-tenant customer reference rejected with 400 Bad Request');

    // 3.3 List shipments & Tenant isolation
    const listShipB = await request(app)
      .get('/api/shipments')
      .set('Authorization', `Bearer ${tokenB}`);
    assertTest(listShipB.status === 200 && listShipB.body.data.shipments.length === 0, 'Company B cannot see Company A shipments (Tenant Isolation verified)');

    // 3.4 Create second shipment for trip
    const shipRes2 = await request(app)
      .post('/api/shipments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        shipmentNumber: 'SHP-MH-002',
        customerId: customerAId,
        origin: { address: 'Ranchi Industrial Area', city: 'Ranchi' },
        destination: { address: 'Mumbai Port Trust', city: 'Mumbai' },
        cargoDescription: 'Industrial Wire Coils',
        weightKg: 8000,
        agreedPrice: 45000,
        estimatedCost: 32000,
      });
    const shipment2Id = shipRes2.body.data._id;

    console.log('\n🚛 Step 4: Phase 3 — Testing Trip Dispatch, Conflict Checking & Lifecycle...');
    // 4.1 Reject dispatch with vehicle in maintenance
    const maintDispatch = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        vehicleId: vehicleMaintId, // IN_MAINTENANCE
        driverId: driverAId,
        shipmentIds: [shipment1Id],
        originCity: 'Jamshedpur',
        destinationCity: 'Pune',
        plannedDepartureDate: new Date(Date.now() + 3600000).toISOString(),
        plannedArrivalDate: new Date(Date.now() + 86400000).toISOString(),
        estimatedDistanceKm: 1450,
      });
    assertTest(maintDispatch.status === 400, 'Dispatch rejects vehicle currently in maintenance (400 Bad Request)');

    // 4.2 Dispatch valid trip
    const tripRes1 = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        tripNumber: 'TRP-2026-001',
        vehicleId: vehicleAId,
        driverId: driverAId,
        shipmentIds: [shipment1Id, shipment2Id],
        originCity: 'Jamshedpur',
        destinationCity: 'Pune',
        stops: [
          { stopNumber: 1, locationName: 'Nagpur Bypass Fuel Halt', city: 'Nagpur', type: 'WAYPOINT' },
        ],
        plannedDepartureDate: new Date().toISOString(),
        plannedArrivalDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        estimatedDistanceKm: 1550,
        estimatedCost: 45000,
      });
    assertTest(tripRes1.status === 201, 'POST /api/trips creates and dispatches trip (201 Created)');
    assertTest(tripRes1.body.data.status === 'ASSIGNED', 'Trip status set to ASSIGNED');
    const trip1Id = tripRes1.body.data._id;

    // Verify linked shipments updated to ASSIGNED
    const checkShip1 = await request(app)
      .get(`/api/shipments/${shipment1Id}`)
      .set('Authorization', `Bearer ${tokenA}`);
    assertTest(checkShip1.body.data.status === 'ASSIGNED', 'Associated shipments transitioned to ASSIGNED');

    // 4.3 Conflict check: Attempt double-booking same vehicle
    const doubleBookVehicle = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        vehicleId: vehicleAId, // already in trip TRP-2026-001
        driverId: driverAId,
        originCity: 'Mumbai',
        destinationCity: 'Delhi',
        plannedDepartureDate: new Date().toISOString(),
        plannedArrivalDate: new Date(Date.now() + 86400000).toISOString(),
        estimatedDistanceKm: 1400,
      });
    assertTest(doubleBookVehicle.status === 400, 'Conflict Prevention: Rejects concurrent dispatch of already assigned vehicle');

    // 4.4 Start Trip
    const startTripRes = await request(app)
      .post(`/api/trips/${trip1Id}/start`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ startOdometer: 50000 });
    assertTest(startTripRes.status === 200 && startTripRes.body.data.status === 'IN_PROGRESS', 'POST /api/trips/:id/start moves trip to IN_PROGRESS');

    const checkShipTransit = await request(app)
      .get(`/api/shipments/${shipment1Id}`)
      .set('Authorization', `Bearer ${tokenA}`);
    assertTest(checkShipTransit.body.data.status === 'IN_TRANSIT', 'Associated shipments transitioned to IN_TRANSIT');

    // 4.5 Confirm Proof of Delivery on Shipment 1
    const podRes = await request(app)
      .post(`/api/shipments/${shipment1Id}/confirm-delivery`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        recipientName: 'Santosh More (Site Manager)',
        recipientPhone: '+91 98222 33333',
        podNumber: 'POD-PUNE-9988',
        notes: 'Delivered in sound condition, unloading completed.',
      });
    assertTest(podRes.status === 200, 'POST /api/shipments/:id/confirm-delivery confirms POD');
    assertTest(podRes.body.data.status === 'DELIVERED', 'Shipment status updated to DELIVERED');
    assertTest(podRes.body.data.deliveryConfirmation.podNumber === 'POD-PUNE-9988', 'POD reference saved');

    // 4.6 Complete Trip with End Odometer & Cost Breakdown
    const completeTripRes = await request(app)
      .post(`/api/trips/${trip1Id}/complete`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        endOdometer: 51580,
        costBreakdown: {
          fuelCost: 24500,
          tollCost: 6800,
          driverAllowance: 5200,
          maintenanceCost: 3500,
        },
        notes: 'Arrived on schedule.',
      });
    assertTest(completeTripRes.status === 200, 'POST /api/trips/:id/complete finishes trip');
    assertTest(completeTripRes.body.data.status === 'COMPLETED', 'Trip status set to COMPLETED');
    assertTest(completeTripRes.body.data.actualDistanceKm === 1580, 'Actual trip distance correctly calculated (51,580 - 50,000 = 1,580 km)');
    assertTest(completeTripRes.body.data.actualCost === 40000, 'Actual trip cost computed from cost breakdown (24.5k + 6.8k + 5.2k + 3.5k = 40k)');

    // 4.7 Verify Vehicle Odometer was synchronized forward
    const checkVehicleOdo = await request(app)
      .get(`/api/vehicles/${vehicleAId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    assertTest(checkVehicleOdo.body.data.currentOdometer === 51580, 'Vehicle current odometer automatically advanced forward to 51,580 km');

    console.log('\n📊 Step 5: Phase 3 — Testing Operational Reports & CSV Exports...');
    // 5.1 Operational Summary Report
    const repRes = await request(app)
      .get('/api/reports/summary')
      .set('Authorization', `Bearer ${tokenA}`);
    assertTest(repRes.status === 200, 'GET /api/reports/summary returns operational financial report');
    assertTest(repRes.body.data.financials.totalRevenue === 120000, 'Report calculates total customer revenue (75k + 45k = 120,000 INR)');
    assertTest(repRes.body.data.financials.actualCost === 40000, 'Report calculates actual trip expenses (40,000 INR)');
    assertTest(repRes.body.data.financials.grossMargin === 80000, 'Report calculates accurate gross operating margin (120k - 40k = 80,000 INR)');

    // 5.2 CSV Shipments Export
    const csvShipRes = await request(app)
      .get('/api/reports/export/shipments')
      .set('Authorization', `Bearer ${tokenA}`);
    assertTest(csvShipRes.status === 200 && csvShipRes.headers['content-type'].includes('text/csv'), 'GET /api/reports/export/shipments streams CSV report');
    assertTest(csvShipRes.text.includes('SHP-MH-001') && csvShipRes.text.includes('Tata Steel Tubes Ltd'), 'CSV contains real database records');

    // 5.3 CSV Trips Export
    const csvTripRes = await request(app)
      .get('/api/reports/export/trips')
      .set('Authorization', `Bearer ${tokenA}`);
    assertTest(csvTripRes.status === 200 && csvTripRes.text.includes('TRP-2026-001'), 'GET /api/reports/export/trips streams trip records CSV');

    console.log('\n🤖 Step 6: Phase 4 — Testing AI Fleet Intelligence & Cost Prediction...');
    // 6.1 AI Health
    const aiHealth = await request(app)
      .get('/api/ai/health')
      .set('Authorization', `Bearer ${tokenA}`);
    assertTest(aiHealth.status === 200, 'GET /api/ai/health responds 200 OK');
    assertTest(aiHealth.body.data.metrics.r2_score > 0.90, 'AI Service reports verified model metrics (R² > 0.90)');

    // 6.2 Trip Cost Predictor
    const aiPredict = await request(app)
      .post('/api/ai/predict-trip-cost')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        distanceKm: 650,
        cargoWeightKg: 15000,
        vehicleType: 'TRUCK',
        fuelType: 'DIESEL',
        fuelPricePerLiter: 92.5,
      });
    assertTest(aiPredict.status === 200, 'POST /api/ai/predict-trip-cost generates prediction (200 OK)');
    assertTest(aiPredict.body.data.predicted_cost > 5000, 'Generates realistic trip cost estimate');
    assertTest(aiPredict.body.data.cost_breakdown.fuel_cost > 0, 'Provides explainable fuel cost component');
    assertTest(aiPredict.body.data.cost_breakdown.toll_charges > 0, 'Provides explainable toll charges component');
    assertTest(aiPredict.body.data.confidence_interval.lower_bound > 0, 'Provides uncertainty confidence interval');

    // 6.3 AI Fleet Insights
    const aiInsights = await request(app)
      .get('/api/ai/insights')
      .set('Authorization', `Bearer ${tokenA}`);
    assertTest(aiInsights.status === 200, 'GET /api/ai/insights returns multi-dimensional fleet insights');
    assertTest('operational' in aiInsights.body.data && 'fuel' in aiInsights.body.data && 'maintenance' in aiInsights.body.data, 'Insights contain operational, fuel, and maintenance vectors');

    // 6.4 AI Actionable Recommendations & Dismissal
    const aiRecs = await request(app)
      .get('/api/ai/recommendations')
      .set('Authorization', `Bearer ${tokenA}`);
    assertTest(aiRecs.status === 200, 'GET /api/ai/recommendations retrieves actionable suggestions');
    assertTest(aiRecs.body.data.recommendations.length > 0, 'AI generates data-backed recommendations');

    const firstRecId = aiRecs.body.data.recommendations[0].id;
    const dismissRes = await request(app)
      .patch(`/api/ai/recommendations/${firstRecId}/dismiss`)
      .set('Authorization', `Bearer ${tokenA}`);
    assertTest(dismissRes.status === 200, 'PATCH /api/ai/recommendations/:id/dismiss dismisses recommendation');

    const aiRecsAfter = await request(app)
      .get('/api/ai/recommendations')
      .set('Authorization', `Bearer ${tokenA}`);
    assertTest(!aiRecsAfter.body.data.recommendations.some((r: any) => r.id === firstRecId), 'Dismissed recommendation is removed from active recommendations');

    console.log('\n📈 Step 7: Phase 3 & 4 Dashboard Integration...');
    const dashRes = await request(app)
      .get('/api/dashboard/overview')
      .set('Authorization', `Bearer ${tokenA}`);
    assertTest(dashRes.status === 200, 'GET /api/dashboard/overview returns 200 OK');
    assertTest(dashRes.body.data.trips.totalTrips === 1, 'Dashboard reflects stored total trips (1)');
    assertTest(dashRes.body.data.trips.completedTrips === 1, 'Dashboard reflects stored completed trips (1)');
    assertTest(dashRes.body.data.shipments.totalShipments === 2, 'Dashboard reflects stored total shipments (2)');

    console.log('\n========================================================');
    console.log(`🏁 PHASE 3 & 4 ACCEPTANCE RESULTS: ${passedCount} PASSED | ${failedCount} FAILED`);
    console.log('========================================================\n');
  } finally {
    await disconnectDB();
  }
}

runPhase3And4Tests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
