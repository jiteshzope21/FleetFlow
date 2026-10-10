import { execSync } from 'child_process';
import path from 'path';
import { ENV } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';

async function runRegressionTests() {
  console.log('========================================================');
  console.log('🧪 FLEETFLOW REGRESSION TEST: ENVIRONMENT & STARTUP PATH');
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

  // 1. Verify in-process loading of root .env from server config
  console.log('📁 Step 1: Testing server workspace CWD startup path...');
  assert(Boolean(ENV.MONGODB_URI), 'Root .env is discovered and loaded when CWD is server workspace');

  // Also test in a fresh spawned process executing in server directory
  const serverDir = path.resolve(__dirname, '../..');
  try {
    const rawOutput = execSync('npx tsx src/tests/helpers/verify_env.ts', {
      cwd: serverDir,
      encoding: 'utf-8',
    });
    const parsed = JSON.parse(rawOutput.trim());
    assert(parsed.hasMongoUri === true, 'Subprocess running in server/ workspace discovers root .env');
  } catch (err: any) {
    assert(false, `Subprocess failed to discover root .env: ${err.message}`);
  }

  // 2. Verify deployment environment variable preservation (no overwrite)
  console.log('🌐 Step 2: Testing preservation of deployment environment variables...');
  try {
    const rawOutput = execSync('npx tsx src/tests/helpers/verify_env.ts', {
      cwd: serverDir,
      encoding: 'utf-8',
      env: { ...process.env, PORT: '9999' },
    });
    const parsed = JSON.parse(rawOutput.trim());
    assert(parsed.port === 9999, 'Deployment environment variables take precedence and are not overwritten');
  } catch (err: any) {
    assert(false, `Deployment variable was overwritten: ${err.message}`);
  }

  // 3. Verify strict rejection of failing MONGODB_URI (no silent in-memory fallback)
  console.log('🛡️ Step 3: Verifying no silent in-memory fallback on connection failure...');
  try {
    await connectDB('mongodb://test-user:secret-password@invalid-host-test:27017/test');
    assert(false, 'connectDB must throw when MONGODB_URI fails to connect');
  } catch (err: any) {
    assert(true, 'connectDB throws explicit error on connection failure without silent fallback');
    assert(!err.message.includes('secret-password'), 'Credentials/passwords are sanitized and not leaked in error message');
  }

  console.log('\n========================================================');
  console.log(`🏁 REGRESSION TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================\n');

  await disconnectDB();

  if (failed > 0) {
    process.exit(1);
  }
}

runRegressionTests();
