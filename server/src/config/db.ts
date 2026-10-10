import mongoose from 'mongoose';
import { ENV } from './env.js';
import { logger } from '../utils/logger.js';

let inMemoryServer: any = null;

export async function connectDB(customUri?: string): Promise<string> {
  const uri = customUri || ENV.MONGODB_URI;

  if (uri) {
    try {
      logger.info(`Connecting to MongoDB at: ${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      logger.info('Connected to MongoDB successfully.');
      return uri;
    } catch (err: any) {
      logger.warn(`Could not connect to configured MongoDB URI (${err.message}).`);
      if (ENV.NODE_ENV === 'production') {
        throw new Error(`Production database connection failed: ${err.message}`);
      }
      logger.info('Falling back to MongoMemoryServer for development / testing...');
    }
  } else {
    logger.info('No MONGODB_URI configured. Starting in-memory MongoDB fallback...');
  }

  // Fallback to in-memory MongoDB for seamless development/testing without pre-configured Atlas
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    inMemoryServer = await MongoMemoryServer.create();
    const memUri = inMemoryServer.getUri();
    await mongoose.connect(memUri);
    logger.info(`Connected to in-memory MongoDB instance: ${memUri}`);
    return memUri;
  } catch (memErr: any) {
    logger.error('Failed to initialize in-memory MongoDB:', memErr);
    throw memErr;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (inMemoryServer) {
    await inMemoryServer.stop();
    inMemoryServer = null;
  }
}

export function checkDBHealth(): { isConnected: boolean; state: string; host?: string } {
  const stateCode = mongoose.connection.readyState;
  const stateNames: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return {
    isConnected: stateCode === 1,
    state: stateNames[stateCode] || 'unknown',
    host: mongoose.connection.host || undefined,
  };
}
