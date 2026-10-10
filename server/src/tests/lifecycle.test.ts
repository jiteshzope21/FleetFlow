import net from 'net';
import { spawn } from 'child_process';
import path from 'path';
import { isPortAvailable, formatPortConflictMessage } from '../utils/port.js';
import { connectDB, disconnectDB, checkDBHealth } from '../config/db.js';

async function runLifecycleTests() {
  console.log('========================================================');
  console.log('🧪 FLEETFLOW TEST: SERVER LIFECYCLE & PORT MANAGEMENT');
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
    // Test 1: Port Availability Detection
    // ----------------------------------------------------
    console.log('🔍 Step 1: Testing Port Availability Detection...');
    const testPort = 59871;

    const initiallyAvailable = await isPortAvailable(testPort);
    assert(initiallyAvailable === true, `isPortAvailable detects unused port ${testPort} as free`);

    // Occupy the port with a temporary TCP socket
    const tempServer = net.createServer();
    await new Promise<void>((resolve) => tempServer.listen({ port: testPort, exclusive: true }, () => resolve()));

    const occupiedCheck = await isPortAvailable(testPort);
    assert(occupiedCheck === false, `isPortAvailable detects actively bound port ${testPort} as occupied`);

    // Release the port
    await new Promise<void>((resolve) => tempServer.close(() => resolve()));

    const releasedCheck = await isPortAvailable(testPort);
    assert(releasedCheck === true, `isPortAvailable detects released port ${testPort} as free again`);
    console.log('');

    // ----------------------------------------------------
    // Test 2: Conflict Message Content & Diagnostics
    // ----------------------------------------------------
    console.log('📋 Step 2: Testing Actionable Conflict Message Formatting...');
    const message = formatPortConflictMessage(5000);
    assert(message.includes('Port 5000 is already in use'), 'Message explicitly names the occupied port');
    assert(message.includes('npm run dev'), 'Message clarifies that npm run dev starts both frontend and backend');
    assert(message.includes('npm run port:check'), 'Message directs user to port diagnostics tool');
    assert(message.includes('Stop-Process'), 'Message provides safe PowerShell recovery syntax');
    assert(message.includes('PORT=5001'), 'Message suggests configuring alternative PORT in .env');
    console.log('');

    // ----------------------------------------------------
    // Test 3: Subprocess Conflict Handling (Clean Exit without crash)
    // ----------------------------------------------------
    console.log('🛡️ Step 3: Verifying Subprocess Conflict Handling without Unhandled Crash...');
    const conflictPort = 59872;
    const blockerServer = net.createServer();
    await new Promise<void>((resolve) => blockerServer.listen({ port: conflictPort, exclusive: true }, () => resolve()));

    // Spawn server process with PORT=conflictPort from server workspace directory
    const child = spawn(
      'npx',
      ['tsx', 'src/server.ts'],
      {
        cwd: path.resolve(__dirname, '../../'),
        env: {
          ...process.env,
          PORT: String(conflictPort),
          MONGODB_URI: 'mongodb://invalid-host-do-not-connect:27017/test',
        },
        shell: true,
      }
    );

    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (d) => { stdout += d.toString(); });
    child.stderr?.on('data', (d) => { stderr += d.toString(); });

    const exitCode = await new Promise<number>((resolve) => {
      child.on('close', (code) => resolve(code ?? 0));
    });

    await new Promise<void>((resolve) => blockerServer.close(() => resolve()));

    assert(exitCode === 1, 'Server process exits with code 1 upon port conflict');
    assert(
      stderr.includes(`Port ${conflictPort} is already in use`) || stdout.includes(`Port ${conflictPort} is already in use`),
      'Output contains clear diagnostic port conflict message'
    );
    assert(
      !stderr.includes('Error: listen EADDRINUSE') && !stdout.includes('Error: listen EADDRINUSE'),
      'Output does NOT emit raw unhandled EADDRINUSE crash dump'
    );
    assert(
      !stdout.includes('Connected to persistent MongoDB'),
      'Server does NOT attempt or claim database connection before port verification'
    );
    console.log('');

    // ----------------------------------------------------
    // Test 4: Graceful Shutdown & DB Disconnection
    // ----------------------------------------------------
    console.log('🔄 Step 4: Testing Graceful Shutdown and DB Disconnection...');
    await connectDB('test-memory');
    const preHealth = checkDBHealth();
    assert(preHealth.isConnected === true, 'Database connected prior to shutdown');

    await disconnectDB();
    const postHealth = checkDBHealth();
    assert(postHealth.isConnected === false, 'Database disconnected cleanly after disconnectDB()');
    assert(postHealth.state === 'disconnected', 'Database state is reported as disconnected');
    console.log('');

  } catch (err: any) {
    console.error('Unexpected test error:', err);
    failed++;
  }

  console.log('========================================================');
  console.log(`🏁 LIFECYCLE TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runLifecycleTests();
