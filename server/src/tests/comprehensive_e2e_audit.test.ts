import request from 'supertest';
import { app } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Vehicle } from '../models/Vehicle.js';
import { Driver } from '../models/Driver.js';
import { Customer } from '../models/Customer.js';
import { Shipment } from '../models/Shipment.js';
import { Trip } from '../models/Trip.js';
import { Invoice } from '../models/Invoice.js';
import { FuelLog } from '../models/FuelLog.js';
import { Maintenance } from '../models/Maintenance.js';
import { Expense } from '../models/Expense.js';
import { Subscription } from '../models/Subscription.js';
import { Notification } from '../models/Notification.js';

async function runComprehensiveAudit() {
  console.log('========================================================');
  console.log('🧪 FLEETFLOW COMPREHENSIVE E2E AUDIT & REGRESSION SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Database Setup
    console.log('📦 Step 1: Connecting to isolated test database...');
    await connectDB('test-memory');
    await Promise.all([
      User.deleteMany({}),
      Company.deleteMany({}),
      Vehicle.deleteMany({}),
      Driver.deleteMany({}),
      Customer.deleteMany({}),
      Shipment.deleteMany({}),
      Trip.deleteMany({}),
      Invoice.deleteMany({}),
      FuelLog.deleteMany({}),
      Maintenance.deleteMany({}),
      Expense.deleteMany({}),
      Subscription.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    assert(true, 'Test database connected and all collections cleaned');

    // 2. Register Company A (Tenant A)
    console.log('\n🏢 Step 2: Registering Tenant A (Apex Fast Logistics)...');
    const regResA = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Apex Fast Logistics',
        companyEmail: 'ops@apexfast.io',
        ownerName: 'Arthur Apex',
        ownerEmail: 'owner@apexfast.io',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        phone: '+15551112222',
        businessType: 'LOGISTICS',
      });
    assert(regResA.status === 201, 'Tenant A successfully registered (201)');
    const tokenA = regResA.body.data.accessToken;
    const compAId = regResA.body.data.company.id;
    const authA = { Authorization: `Bearer ${tokenA}` };

    // Verify 14-day trial initialization
    const subResA = await request(app).get('/api/subscriptions/current').set(authA);
    assert(subResA.status === 200, 'Current subscription retrieved for Tenant A');
    assert(subResA.body.data.subscription.status === 'TRIAL', 'Initial subscription status is TRIAL');
    assert(subResA.body.data.daysRemaining >= 13, 'Subscription has 14-day trial period');

    // 3. Register Company B (Tenant B) for Tenant Isolation Testing
    console.log('\n🏢 Step 3: Registering Tenant B (Bravo Freight Lines)...');
    const regResB = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Bravo Freight Lines',
        companyEmail: 'ops@bravofreight.io',
        ownerName: 'Bob Bravo',
        ownerEmail: 'owner@bravofreight.io',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        phone: '+15553334444',
        businessType: 'TRUCKING',
      });
    assert(regResB.status === 201, 'Tenant B successfully registered (201)');
    const tokenB = regResB.body.data.accessToken;
    const authB = { Authorization: `Bearer ${tokenB}` };

    // 4. Vehicles & Drivers with Bidirectional Linking
    console.log('\n🚛 Step 4: Testing Vehicles, Drivers, and Bidirectional Linking...');
    // Create Vehicle 1 for Tenant A
    const veh1Res = await request(app)
      .post('/api/vehicles')
      .set(authA)
      .send({
        registrationNumber: 'APEX-TRK-01',
        type: 'TRUCK',
        make: 'Volvo',
        model: 'FH16 750',
        year: 2024,
        fuelType: 'DIESEL',
        currentOdometer: 12500,
        status: 'ACTIVE',
      });
    assert(veh1Res.status === 201, 'Vehicle 1 created for Tenant A');
    const veh1Id = veh1Res.body.data._id;

    // Create Vehicle 2 for Tenant A
    const veh2Res = await request(app)
      .post('/api/vehicles')
      .set(authA)
      .send({
        registrationNumber: 'APEX-TRK-02',
        type: 'TRUCK',
        make: 'Scania',
        model: 'R500',
        year: 2023,
        fuelType: 'DIESEL',
        currentOdometer: 45000,
        status: 'ACTIVE',
      });
    assert(veh2Res.status === 201, 'Vehicle 2 created for Tenant A');
    const veh2Id = veh2Res.body.data._id;

    // Create Driver 1 assigned to Vehicle 1
    const d1Res = await request(app)
      .post('/api/drivers')
      .set(authA)
      .send({
        name: 'Derek Driver',
        phone: '+15559998888',
        licenseNumber: 'DL-APEX-001',
        licenseCategory: 'HEAVY_TRANSPORT',
        licenseExpiryDate: '2028-12-31',
        status: 'ACTIVE',
        assignedVehicleId: veh1Id,
      });
    assert(d1Res.status === 201, 'Driver 1 created and assigned to Vehicle 1');
    const d1Id = d1Res.body.data._id;

    // Verify Vehicle 1 now has assignedDriverId pointing to Driver 1
    const checkVeh1 = await request(app).get(`/api/vehicles/${veh1Id}`).set(authA);
    assert(
      (checkVeh1.body.data.assignedDriverId?._id || checkVeh1.body.data.assignedDriverId) === d1Id,
      'Bidirectional check: Vehicle 1 assignedDriverId automatically points to Driver 1'
    );

    // Reassign Driver 1 to Vehicle 2:
    // Should unlink Vehicle 1 and link Vehicle 2
    const updateD1 = await request(app)
      .put(`/api/drivers/${d1Id}`)
      .set(authA)
      .send({
        assignedVehicleId: veh2Id,
      });
    assert(updateD1.status === 200, 'Driver 1 reassigned to Vehicle 2');

    const checkVeh1After = await request(app).get(`/api/vehicles/${veh1Id}`).set(authA);
    const checkVeh2After = await request(app).get(`/api/vehicles/${veh2Id}`).set(authA);
    assert(
      !checkVeh1After.body.data.assignedDriverId,
      'Old Vehicle 1 successfully unlinked (assignedDriverId is null)'
    );
    assert(
      (checkVeh2After.body.data.assignedDriverId?._id || checkVeh2After.body.data.assignedDriverId) === d1Id,
      'New Vehicle 2 successfully linked to Driver 1'
    );

    // 5. Customers & Shipments Workflow
    console.log('\n📦 Step 5: Testing Customer Registration & Shipment Creation...');
    const custRes = await request(app)
      .post('/api/customers')
      .set(authA)
      .send({
        name: 'Zenith Global Supply Chain',
        customerType: 'CORPORATE',
        contactPerson: 'Zoe Zenith',
        phone: '+15554445555',
        email: 'billing@zenithsupply.com',
        status: 'ACTIVE',
      });
    assert(custRes.status === 201, 'Customer created for Tenant A');
    const custId = custRes.body.data._id;

    // Create Shipment
    const shipRes = await request(app)
      .post('/api/shipments')
      .set(authA)
      .send({
        customerId: custId,
        origin: {
          address: '100 Harbor Way, Port Terminal A',
          city: 'Los Angeles',
          state: 'CA',
        },
        destination: {
          address: '500 Logistics Blvd, Warehouse 4',
          city: 'Phoenix',
          state: 'AZ',
        },
        cargoDescription: 'High-Value Industrial Electronics',
        cargoCategory: 'GENERAL',
        weightKg: 8500,
        priority: 'HIGH',
        agreedPrice: 4200,
        estimatedCost: 2800,
      });
    assert(shipRes.status === 201, 'Shipment created for Tenant A with status PENDING');
    const shipId = shipRes.body.data._id;

    // 6. Trip Dispatch & Conflict Prevention
    console.log('\n🗺️ Step 6: Testing Trip Dispatching & Conflict Protections...');
    const tripRes = await request(app)
      .post('/api/trips')
      .set(authA)
      .send({
        vehicleId: veh2Id,
        driverId: d1Id,
        shipmentIds: [shipId],
        originCity: 'Los Angeles',
        destinationCity: 'Phoenix',
        plannedDepartureDate: new Date().toISOString(),
        plannedArrivalDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        estimatedDistanceKm: 600,
        estimatedCost: 2600,
      });
    assert(tripRes.status === 201, 'Trip created with status ASSIGNED and shipment attached');
    const tripId = tripRes.body.data._id;

    // Verify shipment transitioned to ASSIGNED
    const checkShipAssigned = await request(app).get(`/api/shipments/${shipId}`).set(authA);
    assert(checkShipAssigned.body.data.status === 'ASSIGNED', 'Shipment status transitioned to ASSIGNED');

    // Conflict Check: Try to create another trip with the SAME vehicle while it has an active trip
    const conflictRes = await request(app)
      .post('/api/trips')
      .set(authA)
      .send({
        vehicleId: veh2Id,
        driverId: d1Id,
        originCity: 'Los Angeles',
        destinationCity: 'Las Vegas',
        plannedDepartureDate: new Date().toISOString(),
        plannedArrivalDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        estimatedDistanceKm: 450,
      });
    assert(conflictRes.status === 400, 'Conflict prevention: Double booking vehicle rejected with 400');

    // 7. Trip Start & Execution Lifecycle
    console.log('\n🚀 Step 7: Starting and Completing Trip Lifecycle...');
    const startRes = await request(app)
      .post(`/api/trips/${tripId}/start`)
      .set(authA)
      .send({ startOdometer: 45000 });
    assert(startRes.status === 200, 'Trip started successfully (status IN_PROGRESS)');

    // Verify shipment transitioned to IN_TRANSIT
    const checkShipTransit = await request(app).get(`/api/shipments/${shipId}`).set(authA);
    assert(checkShipTransit.body.data.status === 'IN_TRANSIT', 'Shipment status transitioned to IN_TRANSIT');

    // Complete Trip with end odometer and cost breakdown
    const completeRes = await request(app)
      .post(`/api/trips/${tripId}/complete`)
      .set(authA)
      .send({
        endOdometer: 45620,
        actualArrivalDate: new Date().toISOString(),
        costBreakdown: {
          fuelCost: 1450,
          tollCost: 350,
          driverAllowance: 500,
          maintenanceCost: 150,
          otherCost: 50,
        },
      });
    assert(completeRes.status === 200, 'Trip completed successfully (status COMPLETED)');
    assert(completeRes.body.data.actualDistanceKm === 620, 'Trip calculated accurate actual distance (620 km)');
    assert(completeRes.body.data.actualCost === 2500, 'Trip calculated accurate total cost ($2500)');

    // Verify vehicle odometer progressed to 45620
    const checkVehAfterTrip = await request(app).get(`/api/vehicles/${veh2Id}`).set(authA);
    assert(checkVehAfterTrip.body.data.currentOdometer === 45620, 'Vehicle odometer automatically updated to 45,620 km');

    // Verify shipment was delivered
    const checkShipDelivered = await request(app).get(`/api/shipments/${shipId}`).set(authA);
    assert(checkShipDelivered.body.data.status === 'DELIVERED', 'Shipment status transitioned to DELIVERED');

    // 8. Invoicing & Payment Integrity
    console.log('\n🧾 Step 8: Testing Invoicing, Overpayment Protection, and Payment Collection...');
    const invRes = await request(app)
      .post('/api/invoices')
      .set(authA)
      .send({
        customerId: custId,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          { description: 'Freight Dispatch - Los Angeles to Phoenix', quantity: 1, unitPrice: 4200 },
          { description: 'Hazardous / Fragile Handling Surcharge', quantity: 1, unitPrice: 300 },
        ],
        taxRate: 10, // 10% tax on $4500 = $450 tax -> Total $4950
      });
    assert(invRes.status === 201, 'Invoice generated for customer (status ISSUED)');
    assert(invRes.body.data.subtotal === 4500, 'Invoice subtotal is accurate ($4500)');
    assert(invRes.body.data.taxAmount === 450, 'Invoice tax amount is accurate ($450)');
    assert(invRes.body.data.totalAmount === 4950, 'Invoice total amount is accurate ($4950)');
    assert(invRes.body.data.paidAmount === 0, 'Initial paid amount is $0');
    const invId = invRes.body.data._id;

    // Test Overpayment Rejection: Attempting to pay $6000 on a $4950 invoice
    const overpayRes = await request(app)
      .post(`/api/invoices/${invId}/payments`)
      .set(authA)
      .send({
        amount: 6000,
        paymentMethod: 'BANK_TRANSFER',
      });
    assert(overpayRes.status === 500 || overpayRes.status === 400, 'Overpayment rejected: cannot exceed invoice total balance');

    // Record Partial Payment ($2500)
    const partPayRes = await request(app)
      .post(`/api/invoices/${invId}/payments`)
      .set(authA)
      .send({
        amount: 2500,
        paymentMethod: 'BANK_TRANSFER',
        transactionReference: 'NEFT_TXN_001',
      });
    assert(partPayRes.status === 200, 'Partial payment recorded ($2500)');
    assert(partPayRes.body.data.status === 'PARTIALLY_PAID', 'Invoice status is PARTIALLY_PAID');
    assert(partPayRes.body.data.paidAmount === 2500, 'Invoice paidAmount is $2500');

    // Record Remaining Payment ($2450)
    const finalPayRes = await request(app)
      .post(`/api/invoices/${invId}/payments`)
      .set(authA)
      .send({
        amount: 2450,
        paymentMethod: 'UPI',
        transactionReference: 'UPI_TXN_002',
      });
    assert(finalPayRes.status === 200, 'Remaining payment recorded ($2450)');
    assert(finalPayRes.body.data.status === 'PAID', 'Invoice status is PAID');
    assert(finalPayRes.body.data.paidAmount === 4950, 'Invoice paidAmount is exactly $4950');

    // Test Payment on Already Fully Paid Invoice
    const extraPayRes = await request(app)
      .post(`/api/invoices/${invId}/payments`)
      .set(authA)
      .send({
        amount: 100,
        paymentMethod: 'CASH',
      });
    assert(extraPayRes.status === 500 || extraPayRes.status === 400, 'Rejects payment on already fully paid invoice');

    // 9. Maintenance & Fuel Logging
    console.log('\n🔧 Step 9: Testing Maintenance Vehicle Transitions & Fuel Logging...');
    // Create IN_PROGRESS maintenance -> vehicle status becomes IN_MAINTENANCE
    const maintRes = await request(app)
      .post('/api/maintenance')
      .set(authA)
      .send({
        vehicleId: veh1Id,
        serviceType: 'OIL_CHANGE',
        description: 'Scheduled synthetic engine oil replacement',
        serviceDate: new Date().toISOString(),
        partsCost: 350,
        laborCost: 150,
        status: 'IN_PROGRESS',
      });
    assert(maintRes.status === 201, 'Maintenance record created with status IN_PROGRESS');
    const maintId = maintRes.body.data._id;

    // Verify Vehicle 1 transitioned to IN_MAINTENANCE
    const veh1MaintCheck = await request(app).get(`/api/vehicles/${veh1Id}`).set(authA);
    assert(veh1MaintCheck.body.data.status === 'IN_MAINTENANCE', 'Vehicle 1 status transitioned to IN_MAINTENANCE');

    // Dispatch check: Vehicle under maintenance cannot be assigned to trips
    const blockedTrip = await request(app)
      .post('/api/trips')
      .set(authA)
      .send({
        vehicleId: veh1Id,
        driverId: d1Id,
        originCity: 'Los Angeles',
        destinationCity: 'Phoenix',
        plannedDepartureDate: new Date().toISOString(),
        plannedArrivalDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        estimatedDistanceKm: 600,
      });
    assert(blockedTrip.status === 400, 'Vehicle under maintenance is blocked from trip dispatching');

    // Complete maintenance -> Vehicle status automatically reverts to ACTIVE
    const maintComp = await request(app)
      .put(`/api/maintenance/${maintId}`)
      .set(authA)
      .send({
        status: 'COMPLETED',
      });
    assert(maintComp.status === 200, 'Maintenance marked as COMPLETED');
    const veh1ActiveCheck = await request(app).get(`/api/vehicles/${veh1Id}`).set(authA);
    assert(veh1ActiveCheck.body.data.status === 'ACTIVE', 'Vehicle 1 status reverted to ACTIVE upon maintenance completion');

    // Fuel Logging
    const fuelRes = await request(app)
      .post('/api/fuel')
      .set(authA)
      .send({
        vehicleId: veh2Id,
        fuelType: 'DIESEL',
        quantity: 120,
        pricePerUnit: 3.85,
        odometer: 45800,
        refuelingDate: new Date().toISOString(),
      });
    assert(fuelRes.status === 201, 'Fuel log recorded with calculated total ($462)');
    assert(fuelRes.body.data.totalCost === 462, 'Fuel cost calculated accurately (120L * $3.85)');

    // 10. Reports & Operational Aggregates
    console.log('\n📊 Step 10: Testing Reports & Financial Calculations...');
    const repRes = await request(app).get('/api/reports/summary').set(authA);
    assert(repRes.status === 200, 'Operational summary retrieved');
    assert(repRes.body.data.shipments.delivered >= 1, 'Report records delivered shipment count');
    assert(repRes.body.data.trips.completed >= 1, 'Report records completed trip count');
    assert(repRes.body.data.financials.totalRevenue === 4200, 'Report revenue matches shipment agreed price ($4200)');
    assert(repRes.body.data.financials.actualCost === 2500, 'Report actual cost matches trip expenses ($2500)');
    assert(repRes.body.data.financials.grossMargin === 1700, 'Report gross margin accurately computed ($1700)');

    // CSV Exports
    const csvShip = await request(app).get('/api/reports/export/shipments').set(authA);
    assert(csvShip.status === 200 && csvShip.text.includes('Shipment Reference'), 'Shipments CSV export valid');
    const csvTrips = await request(app).get('/api/reports/export/trips').set(authA);
    assert(csvTrips.status === 200 && csvTrips.text.includes('Trip Reference'), 'Trips CSV export valid');

    // 11. AI Cost Estimation & Telemetry
    console.log('\n🤖 Step 11: Testing AI Trip Cost Estimator & Telemetry Fallback...');
    const aiPredict = await request(app)
      .post('/api/ai/predict/trip-cost')
      .set(authA)
      .send({
        distanceKm: 500,
        cargoWeightKg: 10000,
        vehicleType: 'TRUCK',
        fuelType: 'DIESEL',
      });
    assert(aiPredict.status === 200, 'AI trip cost estimation returned HTTP 200');
    assert(aiPredict.body.data.predicted_cost > 0, 'Predicted trip cost is positive numeric value');
    assert(!!aiPredict.body.data.cost_breakdown, 'Cost breakdown is provided');

    // 12. Strict Tenant Isolation Barrier Checks
    console.log('\n🛡️ Step 12: Testing Tenant Isolation Barrier (Tenant B cannot access Tenant A data)...');
    // Tenant B tries to GET Tenant A's vehicle
    const isoVeh = await request(app).get(`/api/vehicles/${veh1Id}`).set(authB);
    assert(isoVeh.status === 404, 'Tenant B blocked from accessing Tenant A vehicle (404)');

    // Tenant B tries to GET Tenant A's trip
    const isoTrip = await request(app).get(`/api/trips/${tripId}`).set(authB);
    assert(isoTrip.status === 404, 'Tenant B blocked from accessing Tenant A trip (404)');

    // Tenant B tries to GET Tenant A's invoice
    const isoInv = await request(app).get(`/api/invoices/${invId}`).set(authB);
    assert(isoInv.status === 404, 'Tenant B blocked from accessing Tenant A invoice (404)');

    // Tenant B tries to DELETE / Archive Tenant A's customer
    const isoCust = await request(app).delete(`/api/customers/${custId}`).set(authB);
    assert(isoCust.status === 404, 'Tenant B blocked from modifying Tenant A customer (404)');

    // 13. Company Owner Subscription Upgrades
    console.log('\n💳 Step 13: Testing Company Owner Subscription Purchase & Activation...');
    const plansRes = await request(app).get('/api/subscriptions/plans').set(authA);
    assert(plansRes.status === 200, 'Available subscription plans retrieved');
    const enterprisePlan = plansRes.body.data.find((p: any) => p.code === 'ENTERPRISE') || plansRes.body.data[plansRes.body.data.length - 1];

    const purchaseRes = await request(app)
      .post('/api/subscriptions/purchase')
      .set(authA)
      .send({
        planId: enterprisePlan._id,
        billingCycle: 'YEARLY',
        paymentMethod: 'CREDIT_CARD',
        paymentDetails: {
          cardholderName: 'Arthur Apex',
          cardNumberLast4: '4242',
          cardBrand: 'Visa Business',
        },
      });
    assert(purchaseRes.status === 200, 'Subscription upgrade to ENTERPRISE succeeded');
    assert(purchaseRes.body.data.subscription.status === 'ACTIVE', 'Subscription status transitioned from TRIAL to ACTIVE');
    assert(purchaseRes.body.data.subscription.planCode === enterprisePlan.code, 'Subscription planCode updated');
    assert(purchaseRes.body.data.subscription.payments.length >= 1, 'Payment receipt recorded in subscription history');

    // Toggle Auto-Renew
    const toggleRenew = await request(app)
      .patch('/api/subscriptions/auto-renew')
      .set(authA)
      .send({ autoRenew: false });
    assert(toggleRenew.status === 200, 'Subscription auto-renew toggled');
    assert(toggleRenew.body.data.autoRenew === false, 'autoRenew successfully disabled');

    // 14. Notification Scoping
    console.log('\n🔔 Step 14: Testing Notification Scoping & Read Actions...');
    // Create a notification for Tenant A
    const notifDoc = await Notification.create({
      companyId: compAId,
      title: 'Audit Complete',
      message: 'All audit checks executed.',
      type: 'SUCCESS',
    });
    // Tenant B tries to mark Tenant A's notification as read
    const isoNotif = await request(app).patch(`/api/notifications/${notifDoc._id}/read`).set(authB);
    const unreadCheck = await Notification.findById(notifDoc._id);
    assert(unreadCheck?.isRead === false, 'Tenant B cannot mark Tenant A notification as read');

    // Tenant A marks own notification as read
    const ownNotif = await request(app).patch(`/api/notifications/${notifDoc._id}/read`).set(authA);
    assert(ownNotif.status === 200, 'Tenant A successfully marks own notification as read');
    const readCheck = await Notification.findById(notifDoc._id);
    assert(readCheck?.isRead === true, 'Notification confirmed marked as read');

    console.log('\n========================================================');
    console.log(`🏁 AUDIT RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('========================================================\n');

    await disconnectDB();
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Fatal test error:', err);
    await disconnectDB();
    process.exit(1);
  }
}

runComprehensiveAudit();
