import net from 'net';

/**
 * Check whether a TCP port is available on the local machine.
 */
export function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();

    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
        resolve(false);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close(() => {
        resolve(true);
      });
    });

    server.listen({ port, exclusive: true });
  });
}

/**
 * Formats a clean, actionable port conflict error message.
 */
export function formatPortConflictMessage(port: number): string {
  return [
    `================================================================================`,
    `❌ [FleetFlow Startup Error] Port ${port} is already in use by another process.`,
    `================================================================================`,
    `The backend server cannot bind to port ${port} because another listener exists.`,
    ``,
    `Possible causes:`,
    `  1. "npm run dev" was executed in another terminal tab.`,
    `     (Running "npm run dev" ALREADY starts both the backend and frontend simultaneously.)`,
    `  2. An orphaned FleetFlow server process remains active from an earlier run.`,
    `  3. Another local service or application is occupying port ${port}.`,
    ``,
    `Safe resolution steps:`,
    `  - Check what process is occupying port ${port}:`,
    `      npm run port:check`,
    `  - If an old FleetFlow Node process is occupying it, stop it safely:`,
    `      PowerShell: Stop-Process -Id <PID>`,
    `      Command Prompt: taskkill /PID <PID> /F`,
    `  - Or configure a different port in your root .env file:`,
    `      PORT=5001`,
    `================================================================================`,
  ].join('\n');
}
