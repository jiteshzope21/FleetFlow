/**
 * FleetFlow Port Diagnostics Tool
 * Checks port availability and identifies listening processes safely.
 */
const net = require('net');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Attempt to read PORT from root .env if available
function getTargetPort() {
  if (process.env.PORT) return parseInt(process.env.PORT, 10);
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/^PORT\s*=\s*(\d+)/m);
    if (match) return parseInt(match[1], 10);
  }
  return 5000;
}

const targetPort = getTargetPort();

function checkPortAvailability(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once('error', (err) => {
      resolve({ available: false, code: err.code });
    });
    server.once('listening', () => {
      server.close(() => {
        resolve({ available: true });
      });
    });
    server.listen({ port, exclusive: true });
  });
}

async function inspectPortWindows(port) {
  try {
    const netstatOut = execSync('netstat -ano -p tcp', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const lines = netstatOut.split('\n');
    const pids = new Set();

    for (const line of lines) {
      if (line.includes(`:${port}`) && line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid)) {
          pids.add(pid);
        }
      }
    }

    if (pids.size === 0) {
      return [];
    }

    const results = [];
    for (const pid of pids) {
      try {
        const psOut = execSync(
          `powershell -NoProfile -Command "Get-Process -Id ${pid} -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, Path | ConvertTo-Json"`,
          { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
        );
        const parsed = JSON.parse(psOut);
        results.push({
          pid,
          name: parsed.ProcessName || 'Unknown',
          path: parsed.Path || 'Unknown',
          isNode: (parsed.ProcessName || '').toLowerCase().includes('node'),
        });
      } catch {
        results.push({ pid, name: 'Unknown', path: 'Unknown', isNode: false });
      }
    }
    return results;
  } catch (err) {
    return [];
  }
}

async function main() {
  console.log('========================================================');
  console.log(`🔍 FleetFlow Port Diagnostics: Port ${targetPort}`);
  console.log('========================================================\n');

  const check = await checkPortAvailability(targetPort);

  if (check.available) {
    console.log(`✅ Port ${targetPort} is FREE and available for FleetFlow.`);
    console.log(`   You can start FleetFlow with: npm run dev\n`);
    process.exit(0);
  }

  console.log(`⚠️ Port ${targetPort} is CURRENTLY OCCUPIED (${check.code || 'IN_USE'}).\n`);

  if (process.platform === 'win32') {
    const processes = await inspectPortWindows(targetPort);
    if (processes.length > 0) {
      console.log('Listening process(es) identified:');
      for (const proc of processes) {
        console.log(`  - PID: ${proc.pid}`);
        console.log(`    Name: ${proc.name}`);
        console.log(`    Path: ${proc.path}`);
        console.log(`    Is Node.js process: ${proc.isNode ? 'YES (Likely FleetFlow)' : 'NO'}`);
        console.log('');
      }

      const nodeProcs = processes.filter((p) => p.isNode);
      if (nodeProcs.length > 0) {
        console.log('💡 Recovery recommendations:');
        console.log('   The occupying process is Node.js. If you have "npm run dev" running in another terminal,');
        console.log('   both frontend and backend are ALREADY active. You do not need to run another server.\n');
        console.log('   If this is an orphaned process from a previous session, you can safely stop it:');
        for (const p of nodeProcs) {
          console.log(`     PowerShell: Stop-Process -Id ${p.pid}`);
          console.log(`     Command Prompt: taskkill /PID ${p.pid} /F`);
        }
      } else {
        console.log('💡 Warning: The occupying process is NOT a Node.js process.');
        console.log('   Do NOT kill unrelated processes. Instead, configure a different port in your .env:');
        console.log(`     PORT=${targetPort + 1}`);
      }
    } else {
      console.log('Could not retrieve process details via netstat.');
      console.log('To inspect manually in PowerShell:');
      console.log(`  Get-NetTCPConnection -LocalPort ${targetPort} -State Listen | Format-Table`);
    }
  } else {
    console.log('To inspect the process on Unix/macOS:');
    console.log(`  lsof -i :${targetPort}`);
  }

  console.log('\n========================================================\n');
  process.exit(1);
}

main();
