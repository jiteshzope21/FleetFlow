import request from 'supertest';
import { app } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';

async function runAcceptanceTests() {
  console.log('========================================================');
  console.log('🧪 FLEETFLOW PHASE 1 - AUTOMATED ACCEPTANCE TEST SUITE');
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
    // 1. Initialize DB
    console.log('📦 Step 1: Connecting to Database...');
    await connectDB('test-memory');
    await User.deleteMany({});
    await Company.deleteMany({});
    console.log('   Database cleaned and ready for testing.\n');

    // 2. Health Check
    console.log('🩺 Step 2: Testing Health Endpoint...');
    const healthRes = await request(app).get('/api/health');
    assert(healthRes.status === 200, 'GET /api/health returns 200 OK');
    assert(healthRes.body.data?.database?.connected === true, 'Database status reports connected: true');
    console.log('');

    // 3. Register Company A
    console.log('🏢 Step 3: Registering Company A (Apex Freight Logistics)...');
    const compARes = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Apex Freight Logistics',
        companyEmail: 'contact@apexfreight.com',
        ownerName: 'Alice Walker',
        ownerEmail: 'alice@apexfreight.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    assert(compARes.status === 201, 'POST /api/auth/register returns 201 Created for Company A');
    assert(!!compARes.body.data.accessToken, 'Issued valid access token for Company A owner');
    assert(compARes.body.data.user.role === 'COMPANY_OWNER', 'Owner is assigned COMPANY_OWNER role');
    assert(!compARes.body.data.user.passwordHash, 'Password hash is excluded from response');

    const tokenA = compARes.body.data.accessToken;
    const compAId = compARes.body.data.company.id;
    const userAId = compARes.body.data.user.id;

    // Check DB directly to verify password hashing
    const storedUserA = await User.findById(userAId);
    assert(storedUserA?.passwordHash !== 'Password123!', 'Password is stored as a secure bcrypt hash');
    assert(storedUserA?.passwordHash?.startsWith('$2'), 'Hash format matches bcrypt algorithm');
    console.log('');

    // 4. Duplicate Registration Rejection
    console.log('🛡️ Step 4: Testing Duplicate Account Rejection...');
    const dupRes = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Another Freight',
        companyEmail: 'other@apexfreight.com',
        ownerName: 'Alice Duplicate',
        ownerEmail: 'alice@apexfreight.com', // Duplicate
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
    assert(dupRes.status === 400, 'Duplicate owner email registration returns 400 Bad Request');
    console.log('');

    // 5. Register Company B (Blue Dart Haulage)
    console.log('🏢 Step 5: Registering Company B (Blue Dart Haulage)...');
    const compBRes = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Blue Dart Haulage',
        companyEmail: 'ops@bluedart.com',
        ownerName: 'Bob Vance',
        ownerEmail: 'bob@bluedart.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    assert(compBRes.status === 201, 'POST /api/auth/register returns 201 Created for Company B');
    const tokenB = compBRes.body.data.accessToken;
    const compBId = compBRes.body.data.company.id;
    console.log('');

    // 6. Login Testing
    console.log('🔑 Step 6: Testing Login...');
    const loginFailRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@apexfreight.com', password: 'WrongPassword99!' });
    assert(loginFailRes.status === 401, 'Invalid password returns 401 Unauthorized');

    const loginOkRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@apexfreight.com', password: 'Password123!' });
    assert(loginOkRes.status === 200, 'Valid credentials return 200 OK');
    assert(!!loginOkRes.body.data.accessToken, 'Login returns new access token');
    console.log('');

    // 7. GET /api/auth/me
    console.log('👤 Step 7: Testing GET /api/auth/me...');
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenA}`);
    assert(meRes.status === 200, 'GET /api/auth/me returns 200 OK');
    assert(meRes.body.data.company.name === 'Apex Freight Logistics', 'Company info matches authenticated session');
    assert(meRes.body.data.user.email === 'alice@apexfreight.com', 'User info matches authenticated session');
    console.log('');

    // 8. Tenant Isolation Verification
    console.log('🔒 Step 8: Strict Multi-Tenant Isolation Testing...');
    // Company A fetches own profile
    const profileARes = await request(app)
      .get('/api/company/profile')
      .set('Authorization', `Bearer ${tokenA}`);
    assert(profileARes.body.data.name === 'Apex Freight Logistics', 'Company A receives its own profile');

    // Company B fetches own profile
    const profileBRes = await request(app)
      .get('/api/company/profile')
      .set('Authorization', `Bearer ${tokenB}`);
    assert(profileBRes.body.data.name === 'Blue Dart Haulage', 'Company B receives its own profile');

    // Update Company A profile
    const updateARes = await request(app)
      .patch('/api/company/profile')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ phone: '+1-555-0199', settings: { currency: 'EUR' } });
    assert(updateARes.status === 200, 'Company A can update its own profile');
    assert(updateARes.body.data.settings.currency === 'EUR', 'Company A currency updated to EUR');

    // Verify Company B was unaffected
    const checkBRes = await request(app)
      .get('/api/company/profile')
      .set('Authorization', `Bearer ${tokenB}`);
    assert(checkBRes.body.data.settings.currency === 'USD', 'Company B settings remained untouched (isolated)');
    console.log('');

    // 9. User Management and Tenant Isolation on Users
    console.log('👥 Step 9: User Management & Tenant Isolation on Users...');
    // Company A creates a Dispatcher and a Viewer
    const createDispatcherRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'David Dispatcher',
        email: 'david@apexfreight.com',
        role: 'DISPATCHER',
        password: 'Password123!',
      });
    assert(createDispatcherRes.status === 201, 'Company A owner creates DISPATCHER user');

    const createViewerRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Victor Viewer',
        email: 'victor@apexfreight.com',
        role: 'VIEWER',
        password: 'Password123!',
      });
    assert(createViewerRes.status === 201, 'Company A owner creates VIEWER user');
    const viewerId = createViewerRes.body.data._id;

    // Company B lists users - should NOT see Company A's users
    const usersBRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${tokenB}`);
    assert(usersBRes.body.data.length === 1, 'Company B only sees 1 user (Bob Vance)');
    assert(usersBRes.body.data[0].email === 'bob@bluedart.com', 'Company B list does not leak Company A users');

    // Company A lists users - should see Alice, David, Victor
    const usersARes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${tokenA}`);
    assert(usersARes.body.data.length === 3, 'Company A sees all 3 of its own users');

    // Cross-tenant user access attempt: Company B tries to view Company A's user by ID
    const crossTenantGet = await request(app)
      .get(`/api/users/${viewerId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    assert(crossTenantGet.status === 404, 'Cross-tenant GET /api/users/:id is blocked with 404 Not Found');

    // Cross-tenant user update attempt: Company B tries to update Company A's user
    const crossTenantPatch = await request(app)
      .patch(`/api/users/${viewerId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Hacked Name' });
    assert(crossTenantPatch.status === 400 || crossTenantPatch.status === 404, 'Cross-tenant PATCH is blocked');
    console.log('');

    // 10. Role-Based Access Control
    console.log('🛡️ Step 10: Role-Based Access Control (RBAC)...');
    // Log in as Victor (VIEWER)
    const viewerLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'victor@apexfreight.com', password: 'Password123!' });
    const viewerToken = viewerLoginRes.body.data.accessToken;

    // Viewer tries to create another user -> MUST be Forbidden (403)
    const viewerCreateAttempt = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        name: 'Illegal User',
        email: 'illegal@apexfreight.com',
        role: 'DRIVER',
        password: 'Password123!',
      });
    assert(viewerCreateAttempt.status === 403, 'VIEWER cannot create users (403 Forbidden)');

    // Viewer tries to update company profile -> MUST be Forbidden (403)
    const viewerUpdateProfile = await request(app)
      .patch('/api/company/profile')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ name: 'Hacked Company' });
    assert(viewerUpdateProfile.status === 403, 'VIEWER cannot update company profile (403 Forbidden)');

    // Company Owner tries to create a SUPER_ADMIN -> MUST be rejected (400)
    const createSuperAdminAttempt = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Fake Admin',
        email: 'fakeadmin@apexfreight.com',
        role: 'SUPER_ADMIN',
        password: 'Password123!',
      });
    assert(createSuperAdminAttempt.status === 400, 'Company Owner cannot create SUPER_ADMIN role');
    console.log('');

    // 11. User Status Deactivation & Session Invalidation
    console.log('🚫 Step 11: User Deactivation...');
    const deactivateRes = await request(app)
      .patch(`/api/users/${viewerId}/status`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'INACTIVE' });
    assert(deactivateRes.status === 200, 'Company owner can deactivate user account');

    // Deactivated user tries to log in -> MUST be rejected
    const inactiveLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'victor@apexfreight.com', password: 'Password123!' });
    assert(inactiveLoginRes.status === 401, 'Deactivated user cannot log in');

    // Deactivated user's existing token is rejected on protected routes
    const inactiveTokenCall = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${viewerToken}`);
    assert(inactiveTokenCall.status === 403, 'Deactivated user access token is rejected on protected routes');
    console.log('');

    // 12. Dashboard Foundation Testing
    console.log('📊 Step 12: Dashboard Overview & Real Metrics...');
    const dashRes = await request(app)
      .get('/api/dashboard/overview')
      .set('Authorization', `Bearer ${tokenA}`);
    assert(dashRes.status === 200, 'GET /api/dashboard/overview returns 200 OK');
    assert(dashRes.body.data.team.totalMembers === 3, 'Overview calculates actual total users count (3)');
    assert(dashRes.body.data.team.activeMembers === 2, 'Overview calculates actual active users count (2)');
    assert(dashRes.body.data.fleet.totalVehicles === 0, 'Fleet reports 0 and honestly notes Phase 2 availability');

    const activityRes = await request(app)
      .get('/api/dashboard/activity')
      .set('Authorization', `Bearer ${tokenA}`);
    assert(activityRes.status === 200, 'GET /api/dashboard/activity returns 200 OK');
    assert(activityRes.body.data.length >= 2, 'Recent activity returns actual database events');
    console.log('');

    // 13. Password Reset Behavior & Transparency Check
    console.log('🔒 Step 13: Password Reset Transparency & Token Verification...');
    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'alice@apexfreight.com' });
    assert(forgotRes.status === 200, 'POST /api/auth/forgot-password returns 200 OK');
    assert(forgotRes.body.data.emailDelivered === false, 'Explicitly reports emailDelivered: false (no false delivery claims)');
    assert(!!forgotRes.body.data.devResetToken, 'Generates devResetToken for verification');

    const resetTokenVal = forgotRes.body.data.devResetToken;
    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: resetTokenVal,
        password: 'NewPassword999!',
        confirmPassword: 'NewPassword999!',
      });
    assert(resetRes.status === 200, 'POST /api/auth/reset-password succeeds with valid token');

    // Login with new password
    const newLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@apexfreight.com', password: 'NewPassword999!' });
    assert(newLoginRes.status === 200, 'Can log in with new password');

    // Old password fails
    const oldLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@apexfreight.com', password: 'Password123!' });
    assert(oldLoginRes.status === 401, 'Old password is no longer accepted');
    console.log('');

    // 14. Accurate Database Storage Reporting
    console.log('💾 Step 14: Verifying Accurate DB Storage Reporting in /api/health...');
    const checkStorageRes = await request(app).get('/api/health');
    assert(checkStorageRes.body.data?.database?.storageType === 'in_memory_ephemeral', 'Health check transparently reports ephemeral in-memory storage');
    assert(checkStorageRes.body.data?.database?.isPersistent === false, 'Reports isPersistent: false when using ephemeral in-memory database');
    console.log('');

    console.log('========================================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('========================================================\n');

    await disconnectDB();

    if (failed > 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (err: any) {
    console.error('Fatal test error:', err);
    await disconnectDB();
    process.exit(1);
  }
}

runAcceptanceTests();
