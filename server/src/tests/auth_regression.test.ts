import request from 'supertest';
import { app } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';

async function runAuthRegressionSuite() {
  console.log('========================================================');
  console.log('🧪 FLEETFLOW TEST: AUTHENTICATION REGRESSION & DIAGNOSTICS');
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

  // Connect to isolated in-memory test database
  console.log('📦 Step 1: Connecting to isolated test database...');
  await connectDB('test-memory');
  await User.deleteMany({});
  await Company.deleteMany({});

  // 1. Valid registration
  console.log('\n📝 Step 2: Testing valid company registration...');
  const validRegPayload = {
    companyName: 'Apex Transport Co',
    companyEmail: 'ops@apextransport.com',
    companyPhone: '+91 98765 43210',
    businessType: 'LOGISTICS',
    ownerName: 'Apex Owner',
    ownerEmail: 'apex_owner@example.com',
    password: 'ValidPassword123!',
    confirmPassword: 'ValidPassword123!',
  };

  const regRes = await request(app)
    .post('/api/auth/register')
    .send(validRegPayload);

  assert(regRes.status === 201, 'POST /api/auth/register returns 201 Created');
  assert(regRes.body.success === true, 'Response body contains success: true');
  assert(Boolean(regRes.body.data.accessToken), 'Response contains accessToken');
  assert(regRes.body.data.user.email === 'apex_owner@example.com', 'User email returned correctly');
  assert(regRes.body.data.user.role === 'COMPANY_OWNER', 'User role assigned as COMPANY_OWNER');
  assert(Boolean(regRes.body.data.company.id || regRes.body.data.company._id), 'Company ID returned');

  // Verify DB persistence
  const savedUser = await User.findOne({ email: 'apex_owner@example.com' });
  assert(Boolean(savedUser), 'User is persisted in database');
  assert(savedUser?.passwordHash.startsWith('$2a$'), 'Password is encrypted as bcrypt hash, not plaintext');
  assert(!savedUser?.passwordHash.includes('ValidPassword123!'), 'Plaintext password is not stored');

  // 2. Duplicate registration rejection
  console.log('\n🚫 Step 3: Testing duplicate registration handling...');
  const dupRes = await request(app)
    .post('/api/auth/register')
    .send({
      ...validRegPayload,
      companyName: 'Another Company Name',
    });

  assert(dupRes.status === 409 || dupRes.status === 400, 'Duplicate email registration returns 409 or 400');
  assert(dupRes.body.success === false, 'Duplicate response success is false');
  assert(
    dupRes.body.error?.toLowerCase().includes('already exists'),
    `Descriptive error returned: "${dupRes.body.error}"`
  );

  // 3. Validation errors
  console.log('\n🔍 Step 4: Testing request validation rejections...');
  const invalidPwdRes = await request(app)
    .post('/api/auth/register')
    .send({
      ...validRegPayload,
      ownerEmail: 'different_email@example.com',
      password: 'weak',
      confirmPassword: 'weak',
    });

  assert(invalidPwdRes.status === 400, 'Weak password rejected with 400 Bad Request');
  assert(Boolean(invalidPwdRes.body.errors?.password), 'Field-specific error returned for password');

  const mismatchedPwdRes = await request(app)
    .post('/api/auth/register')
    .send({
      ...validRegPayload,
      ownerEmail: 'different_email2@example.com',
      password: 'ValidPassword123!',
      confirmPassword: 'DifferentPassword123!',
    });

  assert(mismatchedPwdRes.status === 400, 'Mismatched passwords rejected with 400 Bad Request');

  // 4. Login with valid credentials
  console.log('\n🔐 Step 5: Testing login workflow...');
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'apex_owner@example.com',
      password: 'ValidPassword123!',
    });

  assert(loginRes.status === 200, 'POST /api/auth/login returns 200 OK');
  assert(Boolean(loginRes.body.data.accessToken), 'Login returns accessToken');
  assert(loginRes.body.data.user.email === 'apex_owner@example.com', 'Login returns authenticated user');

  // 5. Login with mixed case email (normalization test)
  console.log('\n🔤 Step 6: Testing email case-insensitivity on login...');
  const mixedCaseLoginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: '  APEX_OWNER@EXAMPLE.COM  ',
      password: 'ValidPassword123!',
    });

  assert(mixedCaseLoginRes.status === 200, 'Login succeeds with mixed-case and whitespace-padded email');

  // 6. Login with invalid password
  console.log('\n⛔ Step 7: Testing rejection of invalid credentials...');
  const badPwdRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'apex_owner@example.com',
      password: 'IncorrectPassword999!',
    });

  assert(badPwdRes.status === 401, 'Incorrect password rejected with 401 Unauthorized');
  assert(badPwdRes.body.error === 'Invalid email or password.', 'Returns safe non-disclosing error');

  // 7. Login with nonexistent email
  const nonExistentRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'nobody_here@example.com',
      password: 'Password123!',
    });

  assert(nonExistentRes.status === 401, 'Nonexistent email rejected with 401 Unauthorized');

  // 8. Authenticated protected route (/api/auth/me)
  console.log('\n🛡️ Step 8: Testing protected session verification...');
  const token = loginRes.body.data.accessToken;
  const meRes = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);

  assert(meRes.status === 200, 'GET /api/auth/me returns 200 with Bearer token');
  assert(meRes.body.data.user.email === 'apex_owner@example.com', 'Session resolves correct user');
  assert(Boolean(meRes.body.data.company), 'Session resolves associated company workspace');

  // Cleanup
  await disconnectDB();

  console.log('\n========================================================');
  console.log(`🏁 AUTH REGRESSION RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthRegressionSuite().catch((err) => {
  console.error('Test suite runner crashed:', err);
  process.exit(1);
});
