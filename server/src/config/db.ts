import mongoose from 'mongoose';
import { ENV } from './env.js';
import { logger } from '../utils/logger.js';

let inMemoryServer: any = null;
let activeStorageType: 'mongodb_atlas_persistent' | 'in_memory_ephemeral' | 'disconnected' = 'disconnected';

export async function connectDB(customUri?: string): Promise<string> {
  const uri = customUri || ENV.MONGODB_URI;

  // 1. If an external/Atlas URI is explicitly configured, connect to it strictly
  if (uri && uri !== 'test-memory') {
    try {
      const sanitizedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
      logger.info(`Connecting to MongoDB at: ${sanitizedUri}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      activeStorageType = 'mongodb_atlas_persistent';
      logger.info('Connected to persistent MongoDB (Atlas/External) successfully.');
      return uri;
    } catch (err: any) {
      activeStorageType = 'disconnected';
      logger.error(`Failed to connect to configured MONGODB_URI: ${err.message}`);
      // MANDATORY REQUIREMENT: Do NOT silently switch to in-memory database when MONGODB_URI is provided!
      throw new Error(
        `Failed to connect to configured MongoDB URI (${err.message}). Verify IP access list in MongoDB Atlas, database credentials, and network connectivity.`
      );
    }
  }

  // 2. If NO URI is configured, accurately log and use ephemeral in-memory storage for testing/development
  logger.info('No external MONGODB_URI configured. Starting ephemeral in-memory database fallback for development/testing...');
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    inMemoryServer = await MongoMemoryServer.create();
    const memUri = inMemoryServer.getUri();
    await mongoose.connect(memUri);
    activeStorageType = 'in_memory_ephemeral';
    logger.warn(`Connected to ephemeral in-memory MongoDB: ${memUri}. Note: Data will NOT persist across server restarts.`);
    return memUri;
  } catch (memErr: any) {
    activeStorageType = 'disconnected';
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
  activeStorageType = 'disconnected';
}

export interface DBHealthInfo {
  isConnected: boolean;
  state: string;
  storageType: 'mongodb_atlas_persistent' | 'in_memory_ephemeral' | 'disconnected';
  isPersistent: boolean;
  host?: string;
}

export function checkDBHealth(): DBHealthInfo {
  const stateCode = mongoose.connection.readyState;
  const stateNames: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const isConnected = stateCode === 1;
  const storage = isConnected ? activeStorageType : 'disconnected';

  return {
    isConnected,
    state: stateNames[stateCode] || 'unknown',
    storageType: storage,
    isPersistent: storage === 'mongodb_atlas_persistent',
    host: mongoose.connection.host || undefined,
  };
}
