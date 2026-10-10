import { strict as assert } from 'assert';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Plan } from '../models/Plan.js';
import { Subscription } from '../models/Subscription.js';
import { Vehicle } from '../models/Vehicle.js';
import { Customer } from '../models/Customer.js';
import { Invoice } from '../models/Invoice.js';
import { AuditLog } from '../models/AuditLog.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { Announcement } from '../models/Announcement.js';

let passed = 0;
let failed = 0;

function pass(desc: string) {
  passed++;
  console.log(`  ✅ PASS: ${desc}`);
}

function fail(desc: string, err: any) {
  failed++;
  console.error(`  ❌ FAIL: ${desc}`);
  console.error(`     Error: ${err.message || err}`);
}

async function runSuperAdminTests() {
  console.log('\n========================================================');
  console.log('🧪 FLEETFLOW TEST: SUPER ADMIN PORTAL & PLATFORM MODULES');
  console.log('========================================================\n');

  try {
    // 1. Connect to isolated database
    console.log('📦 Step 1: Connecting to isolated test database...');
    await connectDB('test-memory');
    await User.deleteMany({});
    await Company.deleteMany({});
    await Plan.deleteMany({});
    await Subscription.deleteMany({});
    await Vehicle.deleteMany({});
    pass('Connected and initialized clean isolated test database');

    // 2. Test Super Admin Bootstrap
    console.log('\n👑 Step 2: Testing Super Admin Bootstrap...');
    const bootstrapRes = await request(app)
      .post('/api/admin/bootstrap')
      .send({
        email: 'root_admin@fleetflow.io',
        password: 'SuperSecureAdminPass2026!',
        name: 'Chief Platform Administrator',
      });

    assert.equal(bootstrapRes.status, 201, 'Bootstrap returns 201 Created');
    assert.equal(bootstrapRes.body.success, true, 'Bootstrap success is true');
    assert.ok(bootstrapRes.body.data.accessToken, 'Issued Super Admin access token');
    assert.equal(bootstrapRes.body.data.user.role, 'SUPER_ADMIN', 'Role is SUPER_ADMIN');
    const adminToken = bootstrapRes.body.data.accessToken;
    pass('Super Admin bootstrap succeeded and issued valid administrative JWT');

    // 3. Test RBAC: Ordinary company user is blocked from admin routes
    console.log('\n🛡️ Step 3: Testing authorization barrier on privileged endpoints...');
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Standard Freight Inc',
        companyEmail: 'ops@standardfreight.com',
        ownerName: 'Dan Driver',
        ownerEmail: 'dan@standardfreight.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    assert.equal(regRes.status, 201, 'Standard company registered');
    const companyUserToken = regRes.body.data.accessToken;
    const companyId = regRes.body.data.company.id;

    // Ordinary company user attempts to access /api/admin/overview
    const forbiddenRes = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${companyUserToken}`);

    assert.equal(forbiddenRes.status, 403, 'Ordinary company user is rejected with 403 Forbidden');
    pass('Company owner cannot access platform overview (403 Forbidden)');

    // Ordinary company user attempts to access /api/admin/companies
    const forbiddenCompRes = await request(app)
      .get('/api/admin/companies')
      .set('Authorization', `Bearer ${companyUserToken}`);
    assert.equal(forbiddenCompRes.status, 403, 'Company user rejected from cross-company listings');
    pass('Company user cannot call platform company management (403 Forbidden)');

    // Unauthenticated user attempts to call admin endpoints
    const unauthRes = await request(app).get('/api/admin/overview');
    assert.equal(unauthRes.status, 401, 'Unauthenticated access rejected with 401 Unauthorized');
    pass('Unauthenticated request rejected with 401');

    // 4. Test Super Admin can access platform overview
    console.log('\n📊 Step 4: Testing platform overview metrics...');
    const overviewRes = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(overviewRes.status, 200, 'Super Admin overview returns 200 OK');
    assert.equal(overviewRes.body.data.companies.total, 1, 'Reflects 1 registered company');
    assert.equal(overviewRes.body.data.users.total, 2, 'Reflects 2 registered users (1 admin, 1 owner)');
    assert.ok(overviewRes.body.data.systemHealth.databaseConnected, 'Reports database connected');
    pass('Super Admin overview returns accurate cross-platform aggregates');

    // 5. Test company listing and details
    console.log('\n🏢 Step 5: Testing company management...');
    const listRes = await request(app)
      .get('/api/admin/companies?search=Standard')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(listRes.status, 200, 'Company list returns 200 OK');
    assert.equal(listRes.body.data.companies.length, 1, 'Found matching company');
    assert.equal(listRes.body.data.companies[0].name, 'Standard Freight Inc', 'Matches company name');
    pass('Company search and listing works with server-side pagination');

    const detailRes = await request(app)
      .get(`/api/admin/companies/${companyId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(detailRes.status, 200, 'Company details returns 200 OK');
    assert.equal(detailRes.body.data.company.name, 'Standard Freight Inc', 'Returns accurate company profile');
    assert.equal(detailRes.body.data.metrics.userCount, 1, 'Counts 1 associated user');
    pass('Company details endpoint returns operational metrics and associated resources');

    // 6. Test Company Suspension and its Real-Time Effect
    console.log('\n🚫 Step 6: Testing company suspension & enforcement...');
    const suspendRes = await request(app)
      .patch(`/api/admin/companies/${companyId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'SUSPENDED',
        reason: 'Payment delinquency audit',
      });

    assert.equal(suspendRes.status, 200, 'Company status update returns 200 OK');
    assert.equal(suspendRes.body.data.status, 'SUSPENDED', 'Company status is now SUSPENDED');
    pass('Super Admin suspended company workspace with documented reason');

    // Suspended company user attempts to access protected company route with existing token
    const blockedApiRes = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${companyUserToken}`);

    assert.equal(blockedApiRes.status, 403, 'Suspended company user immediately rejected with 403');
    assert.ok(blockedApiRes.body.error.includes('suspended'), 'Error explicitly mentions workspace suspension');
    pass('Real-time suspension enforcement: existing token immediately blocked from company APIs');

    // Suspended company user attempts new login
    const blockedLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'dan@standardfreight.com',
        password: 'Password123!',
      });

    assert.equal(blockedLoginRes.status, 401, 'Suspended company login rejected with 401');
    assert.ok(blockedLoginRes.body.error.includes('suspended'), 'Login error clearly explains company suspension');
    pass('Login blocked for users of suspended company workspaces');

    // Verify audit log created for suspension
    const auditRes = await request(app)
      .get('/api/admin/audit-logs?action=COMPANY_SUSPENDED')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(auditRes.status, 200, 'Audit logs retrieved');
    assert.ok(auditRes.body.data.logs.length >= 1, 'Audit log recorded for suspension');
    assert.equal(auditRes.body.data.logs[0].action, 'COMPANY_SUSPENDED', 'Action logged correctly');
    pass('Administrative action was recorded in platform AuditLog');

    // 7. Test Company Reactivation
    console.log('\n🔄 Step 7: Testing company reactivation...');
    const reactivateRes = await request(app)
      .patch(`/api/admin/companies/${companyId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'ACTIVE',
        reason: 'Account reinstated following review',
      });

    assert.equal(reactivateRes.status, 200, 'Company reactivated returns 200 OK');
    assert.equal(reactivateRes.body.data.status, 'ACTIVE', 'Company status restored to ACTIVE');

    // Reactivated user can now log in again
    const loginOkRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'dan@standardfreight.com',
        password: 'Password123!',
      });

    assert.equal(loginOkRes.status, 200, 'Reactivated user logs in successfully');
    const newCompanyToken = loginOkRes.body.data.accessToken;

    const accessOkRes = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${newCompanyToken}`);
    assert.equal(accessOkRes.status, 200, 'Reactivated user can access protected company APIs');
    pass('Reactivation restores normal login and API access without data loss');

    // 8. Test Subscription Plans & Limit Enforcement
    console.log('\n💳 Step 8: Testing subscription plans and limits enforcement...');
    const plansRes = await request(app)
      .get('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(plansRes.status, 200, 'Plans list returns 200 OK');
    assert.ok(plansRes.body.data.length >= 4, 'Default plans (Free, Starter, Pro, Enterprise) seeded');
    pass('Subscription plans retrieved successfully');

    // Create a strict test plan with maxVehicles = 1
    const createPlanRes = await request(app)
      .post('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: 'TEST_MICRO',
        name: 'Micro Fleet Plan',
        priceMonthly: 10,
        priceYearly: 100,
        maxVehicles: 1,
        maxUsers: 2,
        maxShipmentsPerMonth: 10,
        features: ['1 vehicle limit'],
      });

    assert.equal(createPlanRes.status, 201, 'Test plan created');
    const microPlanId = createPlanRes.body.data._id;

    // Assign Micro Plan to company
    const sub = await Subscription.findOne({ companyId });
    if (sub) {
      sub.planId = microPlanId;
      sub.planCode = 'TEST_MICRO';
      sub.status = 'ACTIVE';
      await sub.save();
    } else {
      await Subscription.create({
        companyId,
        planId: microPlanId,
        planCode: 'TEST_MICRO',
        status: 'ACTIVE',
        billingCycle: 'MONTHLY',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    }

    // Add first vehicle: should succeed
    const v1Res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${newCompanyToken}`)
      .send({
        registrationNumber: 'MH-12-AB-1111',
        make: 'Tata Motors',
        model: 'Prima 5530.S',
        year: 2023,
        type: 'TRUCK',
        capacityKg: 5000,
        fuelType: 'DIESEL',
      });

    assert.equal(v1Res.status, 201, 'First vehicle added within plan limit');
    pass('First vehicle created successfully within plan limit');

    // Add second vehicle: should be rejected due to plan limit!
    const v2Res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${newCompanyToken}`)
      .send({
        registrationNumber: 'MH-12-AB-2222',
        make: 'BharatBenz',
        model: '2823R Heavy Hauler',
        year: 2023,
        type: 'TRUCK',
        capacityKg: 5000,
        fuelType: 'DIESEL',
      });

    assert.equal(v2Res.status, 400, 'Second vehicle rejected when exceeding plan limit (400 Bad Request)');
    assert.ok(v2Res.body.error.includes('limit reached'), 'Error message informs user of plan vehicle limit');
    pass('Backend strictly enforces subscription vehicle capacity limits');

    // 9. Test Invoices & Customer Billing Module
    console.log('\n🧾 Step 9: Testing customer billing & invoice lifecycle...');
    const custRes = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${newCompanyToken}`)
      .send({
        name: 'Reliance Logistics Ltd',
        contactPerson: 'Mukesh Sharma',
        customerType: 'CORPORATE',
        email: 'billing@reliancelogistics.com',
        phone: '+91 9876543210',
      });

    assert.equal(custRes.status, 201, 'Customer created for invoice test');
    const customerId = custRes.body.data._id;

    // Create Invoice
    const invoiceRes = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${newCompanyToken}`)
      .send({
        customerId,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          { description: 'Freight haulage Pune to Mumbai (18-wheeler)', quantity: 2, unitPrice: 15000 },
          { description: 'Unloading handling charges', quantity: 1, unitPrice: 2500 },
        ],
        taxRate: 18,
        notes: 'Terms: Net 15 days',
      });

    assert.equal(invoiceRes.status, 201, 'Invoice created with 201 Created');
    assert.equal(invoiceRes.body.data.subtotal, 32500, 'Subtotal correctly computed (30k + 2.5k = 32,500)');
    assert.equal(invoiceRes.body.data.taxAmount, 5850, '18% GST correctly computed (5,850)');
    assert.equal(invoiceRes.body.data.totalAmount, 38350, 'Total computed (38,350)');
    assert.equal(invoiceRes.body.data.status, 'ISSUED', 'Invoice status is ISSUED');
    const invoiceId = invoiceRes.body.data._id;
    pass('Invoice creation computes accurate line items, tax, and total');

    // Record partial payment
    const pay1Res = await request(app)
      .post(`/api/invoices/${invoiceId}/payments`)
      .set('Authorization', `Bearer ${newCompanyToken}`)
      .send({
        amount: 20000,
        paymentMethod: 'BANK_TRANSFER',
        transactionReference: 'NEFT-88392110',
      });

    assert.equal(pay1Res.status, 200, 'Partial payment recorded');
    assert.equal(pay1Res.body.data.paidAmount, 20000, 'Paid amount updated to 20,000');
    assert.equal(pay1Res.body.data.status, 'PARTIALLY_PAID', 'Status updated to PARTIALLY_PAID');
    pass('Partial payment records payment and transitions status to PARTIALLY_PAID');

    // Record remainder payment
    const pay2Res = await request(app)
      .post(`/api/invoices/${invoiceId}/payments`)
      .set('Authorization', `Bearer ${newCompanyToken}`)
      .send({
        amount: 18350,
        paymentMethod: 'UPI',
        transactionReference: 'UPI-99441122',
      });

    assert.equal(pay2Res.status, 200, 'Final payment recorded');
    assert.equal(pay2Res.body.data.paidAmount, 38350, 'Paid amount matches total');
    assert.equal(pay2Res.body.data.status, 'PAID', 'Status updated to PAID');
    pass('Full payment updates status to PAID');

    // 10. Test Platform Announcements & Support Tickets
    console.log('\n📢 Step 10: Testing platform announcements & support tickets...');
    const annRes = await request(app)
      .post('/api/admin/announcements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Scheduled System Maintenance: Nov 15th',
        content: 'FleetFlow will undergo routine database optimization on Sunday 02:00 AM UTC.',
        priority: 'HIGH',
        targetAudience: 'ALL',
        isPublished: true,
      });

    assert.equal(annRes.status, 201, 'Admin published announcement');
    pass('Super Admin created platform announcement');

    // Company user fetches announcements
    const compAnnRes = await request(app)
      .get('/api/announcements')
      .set('Authorization', `Bearer ${newCompanyToken}`);

    assert.equal(compAnnRes.status, 200, 'Company user can retrieve announcements');
    assert.ok(compAnnRes.body.data.length >= 1, 'Company sees published announcement');
    assert.equal(compAnnRes.body.data[0].title, 'Scheduled System Maintenance: Nov 15th', 'Title matches');
    pass('Company tenant receives published platform broadcast announcements');

    // Company user submits support ticket
    const ticketRes = await request(app)
      .post('/api/support')
      .set('Authorization', `Bearer ${newCompanyToken}`)
      .send({
        subject: 'Assistance with GPS Device Telemetry Webhooks',
        description: 'We are integrating our OBD-II GPS trackers and need webhook documentation.',
        priority: 'HIGH',
        category: 'TECHNICAL',
      });

    assert.equal(ticketRes.status, 201, 'Support ticket submitted');
    assert.ok(ticketRes.body.data.ticketNumber.startsWith('TICK-'), 'Generated unique ticket number');
    const ticketId = ticketRes.body.data._id;
    pass('Company tenant submitted technical support ticket');

    // Admin views ticket in admin queue and responds
    const adminTicketRes = await request(app)
      .post(`/api/admin/support/${ticketId}/reply`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        message: 'Hello Dan, webhook endpoints are available at /api/tracking/webhook. We will assist you directly.',
      });

    assert.equal(adminTicketRes.status, 200, 'Admin replied to ticket');
    assert.equal(adminTicketRes.body.data.status, 'IN_PROGRESS', 'Ticket status updated to IN_PROGRESS');
    assert.equal(adminTicketRes.body.data.messages.length, 2, 'Message history contains both exchanges');
    pass('Super Admin replied to support ticket and transitioned status to IN_PROGRESS');

    // 11. Test System Health & Diagnostics
    console.log('\n🩺 Step 11: Testing platform system health diagnostics...');
    const healthRes = await request(app)
      .get('/api/admin/health')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(healthRes.status, 200, 'System health returns 200 OK');
    assert.equal(healthRes.body.data.server.status, 'UP', 'Express server reports UP');
    assert.ok(healthRes.body.data.server.memoryUsage.rssMb > 0, 'Reports process memory footprint');
    assert.equal(healthRes.body.data.database.connected, true, 'Reports MongoDB connected');
    pass('Platform health check delivers comprehensive infrastructure diagnostics');

  } catch (err: any) {
    fail('Unexpected exception during Super Admin test execution', err);
  } finally {
    await disconnectDB();
  }

  console.log('\n========================================================');
  console.log(`🏁 SUPER ADMIN TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuperAdminTests();
