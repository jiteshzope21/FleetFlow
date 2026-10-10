import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
// Directory of this config module
const currentDir = __dirname;

// Candidate paths for .env in order of priority:
// 1. Process current working directory .env
// 2. Parent directory of CWD (e.g. when run from workspace folder 'server/')
// 3. Server workspace root (2 levels up from server/src/config or server/dist/config)
// 4. Project repository root (3 levels up from server/src/config or server/dist/config)
const candidateEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(currentDir, '../../.env'),
  path.resolve(currentDir, '../../../.env'),
];

// Load existing .env files without overwriting pre-existing process.env variables
// (dotenv.config() by default preserves existing process.env variables supplied by the deployment environment)
const loadedPaths = new Set<string>();
for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath) && !loadedPaths.has(envPath)) {
    dotenv.config({ path: envPath });
    loadedPaths.add(envPath);
  }
}

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'fleetflow_dev_jwt_secret_key_needs_min_32_chars!',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fleetflow_dev_refresh_jwt_secret_min_32_chars!',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  DNS_SERVERS: process.env.DNS_SERVERS || '',
  ADMIN_SETUP_SECRET: process.env.ADMIN_SETUP_SECRET || 'FleetFlowSuperSecretSetupToken2026!',
  SUPER_ADMIN_EMAIL: (process.env.SUPER_ADMIN_EMAIL || 'superadmin@fleetflow.local').toLowerCase().trim(),
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD || 'FleetFlowAdmin2026!',
  SUPER_ADMIN_NAME: (process.env.SUPER_ADMIN_NAME || 'FleetFlow Platform Admin').trim(),
};
