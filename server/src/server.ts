import './config/dns.js';
import { app } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { ENV } from './config/env.js';
import { logger } from './utils/logger.js';
import { isPortAvailable, formatPortConflictMessage } from './utils/port.js';

let isShuttingDown = false;

async function bootstrap() {
  try {
    // 1. Pre-flight check: Verify port availability before attempting DB connection
    const portOpen = await isPortAvailable(ENV.PORT);
    if (!portOpen) {
      console.error(formatPortConflictMessage(ENV.PORT));
      process.exit(1);
    }

    // 2. Connect to database (MongoDB Atlas or Dev fallback)
    await connectDB();

    // 3. Start HTTP server
    const server = app.listen(ENV.PORT, () => {
      logger.info(`FleetFlow Server is listening on port ${ENV.PORT} [${ENV.NODE_ENV}]`);
      logger.info(`Health check: http://localhost:${ENV.PORT}/api/health`);
    });

    // Handle runtime socket errors (e.g. race conditions or EADDRINUSE)
    server.on('error', async (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(formatPortConflictMessage(ENV.PORT));
      } else {
        logger.error('FleetFlow Server encountered an error:', err);
      }
      try {
        await disconnectDB();
      } catch {
        // ignore during exit
      }
      process.exit(1);
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      logger.info(`Received ${signal}. Shutting down FleetFlow server gracefully...`);

      const forceExitTimer = setTimeout(() => {
        logger.warn('Graceful shutdown timed out after 5s. Forcing exit.');
        process.exit(1);
      }, 5000);
      forceExitTimer.unref();

      server.close(async (closeErr) => {
        if (closeErr) {
          logger.error('Error closing HTTP server:', closeErr);
        } else {
          logger.info('HTTP server listener closed.');
        }

        try {
          await disconnectDB();
          logger.info('Database connection closed cleanly.');
        } catch (dbErr) {
          logger.error('Error closing database connection:', dbErr);
        }

        clearTimeout(forceExitTimer);
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2'));
  } catch (err: any) {
    logger.error('Failed to start FleetFlow server:', err);
    try {
      await disconnectDB();
    } catch {
      // ignore during failure
    }
    process.exit(1);
  }
}

bootstrap();
