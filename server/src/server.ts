import './config/dns.js';
import { app } from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  try {
    // Connect to database (MongoDB Atlas or Dev fallback)
    await connectDB();

    const server = app.listen(ENV.PORT, () => {
      logger.info(`FleetFlow Server is listening on port ${ENV.PORT} [${ENV.NODE_ENV}]`);
      logger.info(`Health check: http://localhost:${ENV.PORT}/api/health`);
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err: any) {
    logger.error('Failed to start FleetFlow server:', err);
    process.exit(1);
  }
}

bootstrap();
