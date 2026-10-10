import { strict as assert } from 'assert';
import request from 'supertest';
import { app } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { ENV } from '../config/env.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { seedSuperAdminAccount } from '../scripts/seedSuperAdmin.js';

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

async function runSuperAdminLoginTests() {
  console.log('\n========================================================');
  console.log('🧪 FLEETFLOW TEST: SUPER ADMIN .ENV CREDENTIALS & LOGIN');
  console.log('========================================================\n');

  try {
    // 1. Connect to isolated database
    console.log('📦 Step 1: Connecting to isolated test database...');
    await connectDB('test-memory');
    await User.deleteMany({});
    await Company.deleteMany({});
    pass('Connected and initialized clean isolated test database');

    // 2. Verify account doesn't exist before seed
    console.log('\n🔍 Step 2: Verifying pre-seed state...');
    const preUser = await User.findOne({ email: ENV.SUPER_ADMIN_EMAIL });
    assert.equal(preUser, null, 'Super Admin should not exist before seeding');
    pass('Confirmed Super Admin does not exist before initialization');

    // 3. Test unseeded login returns 401
    console.log('\n⛔ Step 3: Testing login before seeding...');
    const unseededLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: ENV.SUPER_ADMIN_EMAIL,
        password: ENV.SUPER_ADMIN_PASSWORD,
      });
    assert.equal(unseededLogin.status, 401, 'Unseeded account must return 401');
    assert.equal(unseededLogin.body.success, false);
    pass('Unseeded login correctly rejected with 401 Unauthorized');

    // 4. Run seed procedure
    console.log('\n🌱 Step 4: Executing seedSuperAdminAccount()...');
    await seedSuperAdminAccount();
    const seededUser = await User.findOne({ email: ENV.SUPER_ADMIN_EMAIL });
    assert.ok(seededUser, 'Super Admin must exist in database after seeding');
    assert.equal(seededUser.role, 'SUPER_ADMIN', 'Role must be SUPER_ADMIN');
    assert.equal(seededUser.status, 'ACTIVE', 'Status must be ACTIVE');
    assert.equal(seededUser.companyId, null, 'Platform account must have null companyId');
    pass('Super Admin account created with correct role and status');

    // 5. Test login with exact .env credentials
    console.log('\n🔐 Step 5: Testing POST /api/auth/login with configured credentials...');
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: ENV.SUPER_ADMIN_EMAIL,
        password: ENV.SUPER_ADMIN_PASSWORD,
      });
    assert.equal(loginRes.status, 200, 'Login must succeed with 200 OK');
    assert.equal(loginRes.body.success, true);
    assert.ok(loginRes.body.data.accessToken, 'Must return accessToken');
    assert.equal(loginRes.body.data.user.role, 'SUPER_ADMIN', 'User role must be SUPER_ADMIN');
    assert.equal(loginRes.body.data.user.email, ENV.SUPER_ADMIN_EMAIL);
    const adminToken = loginRes.body.data.accessToken;
    pass('Super Admin login succeeded with 200 OK and valid JWT');

    // 6. Test accessing protected Super Admin endpoint
    console.log('\n🛡️ Step 6: Testing access to protected Super Admin endpoint...');
    const overviewRes = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(overviewRes.status, 200, 'Must allow Super Admin to access /api/admin/overview');
    assert.equal(overviewRes.body.success, true);
    assert.ok(overviewRes.body.data.companies, 'Must return overview data');
    pass('Issued token successfully accesses protected /api/admin/overview endpoint');

    // 7. Test email case insensitivity and trimming
    console.log('\n🔤 Step 7: Testing email case-insensitivity and whitespace trimming...');
    const mixedCaseLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: `  ${ENV.SUPER_ADMIN_EMAIL.toUpperCase()}  `,
        password: ENV.SUPER_ADMIN_PASSWORD,
      });
    assert.equal(mixedCaseLogin.status, 200, 'Login must succeed with mixed case and trimmed email');
    assert.equal(mixedCaseLogin.body.success, true);
    pass('Login succeeds with uppercase and padded email');

    // 8. Test wrong password rejection
    console.log('\n❌ Step 8: Testing rejection of incorrect password...');
    const badPassRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: ENV.SUPER_ADMIN_EMAIL,
        password: 'CompletelyWrongPassword123!',
      });
    assert.equal(badPassRes.status, 401, 'Wrong password must return 401');
    assert.equal(badPassRes.body.success, false);
    pass('Incorrect password correctly rejected with 401');

    // 9. Test unknown email rejection
    console.log('\n❓ Step 9: Testing rejection of unknown email...');
    const unknownEmailRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent_admin@fleetflow.io',
        password: ENV.SUPER_ADMIN_PASSWORD,
      });
    assert.equal(unknownEmailRes.status, 401, 'Unknown email must return 401');
    assert.equal(unknownEmailRes.body.success, false);
    pass('Unknown email correctly rejected with 401');

    // 10. Test idempotency of seed procedure
    console.log('\n🔄 Step 10: Testing seed idempotency...');
    await seedSuperAdminAccount();
    const reseededLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: ENV.SUPER_ADMIN_EMAIL,
        password: ENV.SUPER_ADMIN_PASSWORD,
      });
    assert.equal(reseededLogin.status, 200, 'Reseeded account must still log in cleanly');
    pass('Reseeding is idempotent and maintains valid credentials');

    // 11. Test that ordinary company user cannot access Super Admin endpoint
    console.log('\n🚫 Step 11: Testing tenant isolation barrier against company users...');
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Tenant Transport Ltd',
        companyEmail: 'info@tenanttransport.com',
        businessType: 'LOGISTICS',
        ownerName: 'Tenant Owner',
        ownerEmail: 'tenant_owner@transport.com',
        phone: '+1-555-888-9999',
        password: 'SecureCompanyPass2026!',
        confirmPassword: 'SecureCompanyPass2026!',
      });
    assert.equal(regRes.status, 201, `Registration should succeed with 201, got ${regRes.status}: ${JSON.stringify(regRes.body)}`);
    const tenantToken = regRes.body.data.accessToken;

    const forbiddenAdminCall = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${tenantToken}`);
    assert.equal(forbiddenAdminCall.status, 403, 'Tenant token must receive 403 Forbidden on admin APIs');
    pass('Company owner token cannot access Super Admin APIs (403 Forbidden)');

    console.log('\n========================================================');
    console.log(`🏁 SUPER ADMIN LOGIN RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('========================================================\n');

    await disconnectDB();
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    fail('Unexpected exception during Super Admin login tests', err);
    console.log(`\nResults: ${passed} PASSED | ${failed} FAILED`);
    try {
      await disconnectDB();
    } catch {}
    process.exit(1);
  }
}

runSuperAdminLoginTests();
