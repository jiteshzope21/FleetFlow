import request from 'supertest';
import { app } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Vehicle } from '../models/Vehicle.js';
import { Driver } from '../models/Driver.js';
import { Customer } from '../models/Customer.js';
import { Maintenance } from '../models/Maintenance.js';
import { FuelLog } from '../models/FuelLog.js';
import { Expense } from '../models/Expense.js';

async function runPhase2Tests() {
  console.log('========================================================');
  console.log('🧪 FLEETFLOW PHASE 2 - AUTOMATED ACCEPTANCE TEST SUITE');
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
    // ----------------------------------------------------
    // Step 1: Clean in-memory test environment setup
    // ----------------------------------------------------
    console.log('📦 Step 1: Preparing Isolated Test Environment...');
    await connectDB('test-memory');
    await Promise.all([
      User.deleteMany({}),
      Company.deleteMany({}),
      Vehicle.deleteMany({}),
      Driver.deleteMany({}),
      Customer.deleteMany({}),
      Maintenance.deleteMany({}),
      FuelLog.deleteMany({}),
      Expense.deleteMany({}),
    ]);
    console.log('   Test database initialized and clean.\n');

    // ----------------------------------------------------
    // Step 2: Register Company A & Company B for Tenant Isolation
    // ----------------------------------------------------
    console.log('🏢 Step 2: Registering Company A and Company B...');
    const compARes = await request(app).post('/api/auth/register').send({
      companyName: 'Apex Logistics Corp',
      companyEmail: 'admin@apexlogistics.com',
      ownerName: 'Arthur Dent',
      ownerEmail: 'arthur@apexlogistics.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });
    const tokenA = compARes.body.data.accessToken;

    const compBRes = await request(app).post('/api/auth/register').send({
      companyName: 'Beacon Freight Services',
      companyEmail: 'admin@beaconfreight.com',
      ownerName: 'Ford Prefect',
      ownerEmail: 'ford@beaconfreight.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });
    const tokenB = compBRes.body.data.accessToken;

    // Create a VIEWER user for Company A to test RBAC
    const viewerRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Trillian Astra (Viewer)',
        email: 'trillian@apexlogistics.com',
        password: 'Password123!',
        role: 'VIEWER',
      });
    const viewerTokenRes = await request(app).post('/api/auth/login').send({
      email: 'trillian@apexlogistics.com',
      password: 'Password123!',
    });
    const tokenViewer = viewerTokenRes.body.data.accessToken;

    assert(!!tokenA && !!tokenB && !!tokenViewer, 'Company A owner, Company B owner, and Viewer tokens issued');
    console.log('');

    // ----------------------------------------------------
    // Step 3: Vehicle Management CRUD & Tenant Isolation
    // ----------------------------------------------------
    console.log('🚛 Step 3: Testing Vehicle Management...');
    const createVehRes = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        registrationNumber: 'MH12AB1234',
        type: 'TRUCK',
        make: 'Tata Motors',
        model: 'Prima 5530.S',
        year: 2022,
        fuelType: 'DIESEL',
        currentOdometer: 45000,
        status: 'ACTIVE',
      });

    assert(createVehRes.status === 201, 'POST /api/vehicles creates vehicle for Company A (201)');
    assert(createVehRes.body.data.registrationNumber === 'MH12AB1234', 'Vehicle registration number stored uppercase');
    const vehicleAId = createVehRes.body.data._id;

    // Duplicate registration check
    const dupVehRes = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        registrationNumber: 'mh12ab1234',
        make: 'Tata Motors',
        model: 'Prima',
        year: 2023,
      });
    assert(dupVehRes.status === 400, 'Rejects duplicate registration number within same tenant');

    // Tenant isolation: Company B cannot see Company A's vehicle
    const compBVehicles = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${tokenB}`);
    assert(compBVehicles.body.data.vehicles.length === 0, 'Company B cannot see Company A vehicles');

    const compBGetVehA = await request(app)
      .get(`/api/vehicles/${vehicleAId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    assert(compBGetVehA.status === 404, 'Cross-tenant GET /api/vehicles/:id blocked with 404');

    // Update vehicle
    const updateVehRes = await request(app)
      .patch(`/api/vehicles/${vehicleAId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ currentOdometer: 48500 });
    assert(updateVehRes.status === 200 && updateVehRes.body.data.currentOdometer === 48500, 'PATCH /api/vehicles updates odometer');
    console.log('');

    // ----------------------------------------------------
    // Step 4: Driver Management & Vehicle Assignment
    // ----------------------------------------------------
    console.log('👤 Step 4: Testing Driver Management & Vehicle Assignment...');
    const createDriverRes = await request(app)
      .post('/api/drivers')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Rajesh Kumar',
        phone: '+91 9876543210',
        email: 'rajesh.driver@apexlogistics.com',
        licenseNumber: 'MH12-20150012345',
        licenseCategory: 'HMV / Heavy Transport',
        licenseExpiryDate: '2027-12-31',
        status: 'ACTIVE',
        assignedVehicleId: vehicleAId,
      });

    assert(createDriverRes.status === 201, 'POST /api/drivers creates driver with vehicle assignment');
    const driverAId = createDriverRes.body.data._id;

    // Verify two-way sync on vehicle
    const refreshedVeh = await request(app)
      .get(`/api/vehicles/${vehicleAId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    assert(refreshedVeh.body.data.assignedDriverId?._id === driverAId, 'Vehicle assignedDriverId is synced with driver');

    // Cross-tenant assignment attempt: Company B tries to assign Company A vehicle to B driver
    const compBDriver = await request(app)
      .post('/api/drivers')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Suresh Patel',
        phone: '+91 9123456789',
        licenseNumber: 'GJ01-20180099999',
        licenseCategory: 'HMV',
        licenseExpiryDate: '2028-05-15',
        assignedVehicleId: vehicleAId, // Belongs to Company A!
      });
    assert(compBDriver.status === 400, 'Cross-tenant vehicle assignment to driver is rejected (400)');
    console.log('');

    // ----------------------------------------------------
    // Step 5: Customer Management
    // ----------------------------------------------------
    console.log('🤝 Step 5: Testing Customer Management...');
    const createCustRes = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Reliance Retail Logistics',
        customerType: 'CORPORATE',
        contactPerson: 'Sunil Sharma',
        phone: '+91 9822001122',
        email: 'supplychain@relianceretail.example',
        taxId: '27AABCR1234M1Z5',
        paymentTerms: 'NET 30',
        status: 'ACTIVE',
      });

    assert(createCustRes.status === 201, 'POST /api/customers creates customer for Company A');
    const customerAId = createCustRes.body.data._id;

    // Duplicate customer check
    const dupCust = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Reliance Retail Logistics',
        contactPerson: 'Sunil',
        phone: '+91 9999999999',
      });
    assert(dupCust.status === 400, 'Rejects duplicate customer name within company');

    // Tenant isolation on customers
    const compBCustomers = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${tokenB}`);
    assert(compBCustomers.body.data.customers.length === 0, 'Company B cannot see Company A customers');
    console.log('');

    // ----------------------------------------------------
    // Step 6: Vehicle Maintenance Management
    // ----------------------------------------------------
    console.log('🔧 Step 6: Testing Vehicle Maintenance Management...');
    const createMaintRes = await request(app)
      .post('/api/maintenance')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        vehicleId: vehicleAId,
        serviceType: 'OIL_CHANGE',
        description: 'Scheduled engine oil and filter replacement',
        serviceDate: '2026-10-10',
        odometerAtService: 49000,
        partsCost: 3500,
        laborCost: 1500,
        status: 'IN_PROGRESS',
      });

    assert(createMaintRes.status === 201, 'POST /api/maintenance creates record');
    assert(createMaintRes.body.data.totalCost === 5000, 'Calculates totalCost (parts + labor = 5000)');
    const maintId = createMaintRes.body.data._id;

    // Verify vehicle status transitioned to IN_MAINTENANCE and odometer updated
    const vehDuringMaint = await request(app)
      .get(`/api/vehicles/${vehicleAId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    assert(vehDuringMaint.body.data.status === 'IN_MAINTENANCE', 'Vehicle status automatically set to IN_MAINTENANCE');
    assert(vehDuringMaint.body.data.currentOdometer === 49000, 'Vehicle odometer updated to service odometer reading');

    // Complete maintenance -> transitions vehicle back to ACTIVE
    await request(app)
      .patch(`/api/maintenance/${maintId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'COMPLETED' });

    const vehAfterMaint = await request(app)
      .get(`/api/vehicles/${vehicleAId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    assert(vehAfterMaint.body.data.status === 'ACTIVE', 'Vehicle status automatically returned to ACTIVE upon completion');
    console.log('');

    // ----------------------------------------------------
    // Step 7: Fuel Management
    // ----------------------------------------------------
    console.log('⛽ Step 7: Testing Fuel Management...');
    const createFuelRes = await request(app)
      .post('/api/fuel')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        vehicleId: vehicleAId,
        driverId: driverAId,
        refuelingDate: '2026-10-10',
        fuelType: 'DIESEL',
        quantity: 120,
        pricePerUnit: 92.5,
        odometer: 49500,
        fuelStation: 'Indian Oil Highway Plaza',
      });

    assert(createFuelRes.status === 201, 'POST /api/fuel logs fuel transaction');
    assert(createFuelRes.body.data.totalCost === 11100, 'Auto-computes totalCost = 120 * 92.5 = 11100');

    // Vehicle odometer updated
    const vehAfterFuel = await request(app)
      .get(`/api/vehicles/${vehicleAId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    assert(vehAfterFuel.body.data.currentOdometer === 49500, 'Vehicle odometer updated to fuel log odometer');

    // Cross-tenant fuel logging rejected
    const compBFuel = await request(app)
      .post('/api/fuel')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        vehicleId: vehicleAId, // Belongs to Company A
        quantity: 50,
        pricePerUnit: 90,
        odometer: 50000,
      });
    assert(compBFuel.status === 400, 'Cross-tenant fuel logging on other company vehicle blocked (400)');
    console.log('');

    // ----------------------------------------------------
    // Step 8: Expense Management
    // ----------------------------------------------------
    console.log('💳 Step 8: Testing Expense Management...');
    const createExpRes = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Mumbai-Pune Expressway FASTag Toll',
        category: 'TOLLS',
        amount: 650,
        currency: 'INR',
        vehicleId: vehicleAId,
        driverId: driverAId,
        vendor: 'National Highways Authority of India',
        paymentMethod: 'UPI',
      });

    assert(createExpRes.status === 201, 'POST /api/expenses creates operational expense');

    const expListRes = await request(app)
      .get('/api/expenses')
      .set('Authorization', `Bearer ${tokenA}`);
    assert(expListRes.body.data.summary.totalAmount === 650, 'Expense summary computes correct total');
    assert(expListRes.body.data.summary.categorySummary.TOLLS === 650, 'Category breakdown computes correct category sum');
    console.log('');

    // ----------------------------------------------------
    // Step 9: Role-Based Access Control (RBAC) Enforcement
    // ----------------------------------------------------
    console.log('🛡️ Step 9: Testing RBAC Enforcement with VIEWER Role...');
    // Viewer CAN read
    const viewerGetVehicles = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${tokenViewer}`);
    assert(viewerGetVehicles.status === 200, 'VIEWER role can read vehicles (200 OK)');

    const viewerGetFuel = await request(app)
      .get('/api/fuel')
      .set('Authorization', `Bearer ${tokenViewer}`);
    assert(viewerGetFuel.status === 200, 'VIEWER role can read fuel logs (200 OK)');

    // Viewer CANNOT mutate
    const viewerPostVehicle = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${tokenViewer}`)
      .send({ registrationNumber: 'MH12XX9999', make: 'Eicher', model: 'Pro', year: 2021 });
    assert(viewerPostVehicle.status === 403, 'VIEWER role cannot create vehicle (403 Forbidden)');

    const viewerPostExpense = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${tokenViewer}`)
      .send({ title: 'Illegal expense', amount: 500 });
    assert(viewerPostExpense.status === 403, 'VIEWER role cannot create expense (403 Forbidden)');
    console.log('');

    // ----------------------------------------------------
    // Step 10: Real Dashboard Metrics Integration
    // ----------------------------------------------------
    console.log('📊 Step 10: Testing Real Dashboard Live Metrics Integration...');
    const dashRes = await request(app)
      .get('/api/dashboard/overview')
      .set('Authorization', `Bearer ${tokenA}`);

    assert(dashRes.status === 200, 'GET /api/dashboard/overview returns 200 OK');
    assert(dashRes.body.data.fleet.totalVehicles === 1, 'Dashboard calculates actual stored vehicles count (1)');
    assert(dashRes.body.data.fleet.activeVehicles === 1, 'Dashboard calculates actual active vehicles count (1)');
    assert(dashRes.body.data.drivers.totalDrivers === 1, 'Dashboard calculates actual total drivers count (1)');
    assert(dashRes.body.data.customers.totalCustomers === 1, 'Dashboard calculates actual customers count (1)');
    assert(dashRes.body.data.fuel.totalCost === 11100, 'Dashboard calculates real fuel expenditure (₹11,100)');
    assert(dashRes.body.data.maintenance.expenditure === 5000, 'Dashboard calculates real maintenance expenditure (₹5,000)');
    assert(dashRes.body.data.expenses.generalExpense === 650, 'Dashboard calculates real general operating expenses (₹650)');
    assert(dashRes.body.data.expenses.totalOperatingCost === 16750, 'Dashboard calculates total operating cost without double counting (₹16,750)');

    const actRes = await request(app)
      .get('/api/dashboard/activity')
      .set('Authorization', `Bearer ${tokenA}`);
    assert(actRes.status === 200, 'GET /api/dashboard/activity returns 200 OK');
    assert(actRes.body.data.length >= 4, 'Activity feed aggregates real database events across collections');
    console.log('');

  } catch (err: any) {
    console.error('Unexpected test error in Phase 2 test suite:', err);
    failed++;
  } finally {
    await disconnectDB();
  }

  console.log('========================================================');
  console.log(`🏁 PHASE 2 ACCEPTANCE RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase2Tests();
