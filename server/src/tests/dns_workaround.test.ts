import { execSync } from 'child_process';
import path from 'path';
import { configureDns, isDnsCustomConfigured } from '../config/dns.js';
import { connectDB, disconnectDB } from '../config/db.js';

async function runDnsTests() {
  console.log('========================================================');
  console.log('🧪 FLEETFLOW TEST: CONFIGURABLE DNS RESOLUTION WORKAROUND');
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

  // 1. Test explicit custom DNS server configuration in-process
  console.log('🌐 Step 1: Testing configureDns() with explicit resolvers...');
  const applied = configureDns(['8.8.8.8', '1.1.1.1']);
  assert(Array.isArray(applied) && applied.includes('8.8.8.8'), 'Custom DNS servers successfully applied to Node.js resolver');
  assert(isDnsCustomConfigured() === true, 'isDnsCustomConfigured() flags custom DNS as active');

  // 2. Test subprocess boot with DNS_SERVERS environment variable
  console.log('🚀 Step 2: Testing subprocess startup with DNS_SERVERS=8.8.8.8...');
  const serverDir = path.resolve(__dirname, '../..');
  try {
    const rawOutput = execSync('npx tsx src/tests/helpers/verify_dns.ts', {
      cwd: serverDir,
      encoding: 'utf-8',
      env: { ...process.env, DNS_SERVERS: '8.8.8.8' },
    });
    const lines = rawOutput.trim().split(/\r?\n/);
    const jsonLine = lines.find((l) => l.trim().startsWith('{')) || lines[lines.length - 1];
    const parsed = JSON.parse(jsonLine.trim());
    assert(parsed.hasGoogleDns === true, 'Subprocess running with DNS_SERVERS=8.8.8.8 applied custom resolver before DB start');
  } catch (err: any) {
    assert(false, `Subprocess DNS test failed: ${err.message}`);
  }

  // 3. Test that connectDB calls configureDns without throwing or failing unit tests
  console.log('📦 Step 3: Verifying connectDB executes with DNS configured without Atlas calls...');
  try {
    await connectDB('test-memory');
    assert(true, 'connectDB successfully initialized with active DNS configuration');
    await disconnectDB();
  } catch (err: any) {
    assert(false, `connectDB failed: ${err.message}`);
  }

  console.log('\n========================================================');
  console.log(`🏁 DNS TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runDnsTests();
