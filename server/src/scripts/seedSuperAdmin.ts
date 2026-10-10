import '../config/dns.js';
import { ENV } from '../config/env.js';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { AdminService } from '../modules/admin/admin.service.js';
import { logger } from '../utils/logger.js';

export async function seedSuperAdminAccount(): Promise<void> {
  const email = (ENV.SUPER_ADMIN_EMAIL || 'superadmin@fleetflow.local').toLowerCase().trim();
  const password = ENV.SUPER_ADMIN_PASSWORD || 'FleetFlowAdmin2026!';
  const name = (ENV.SUPER_ADMIN_NAME || 'FleetFlow Platform Admin').trim();

  // Ensure default plans exist
  try {
    await AdminService.seedDefaultPlans();
  } catch (planErr) {
    logger.warn('Failed to seed default plans during admin seed:', planErr);
  }

  const existing = await User.findOne({ email }).select('+passwordHash');
  if (existing) {
    const isMatch = await bcrypt.compare(password, existing.passwordHash);
    let updated = false;

    if (!isMatch) {
      existing.passwordHash = await bcrypt.hash(password, ENV.BCRYPT_SALT_ROUNDS);
      updated = true;
    }
    if (existing.role !== 'SUPER_ADMIN') {
      existing.role = 'SUPER_ADMIN';
      updated = true;
    }
    if (existing.status !== 'ACTIVE') {
      existing.status = 'ACTIVE';
      updated = true;
    }
    if (existing.companyId !== null && existing.companyId !== undefined) {
      existing.companyId = null;
      updated = true;
    }

    if (updated) {
      await existing.save();
      logger.info(`Super Admin credentials synchronized and verified! Email: ${email}`);
    } else {
      logger.info(`Super Admin verified and active with current credentials. Email: ${email}`);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, ENV.BCRYPT_SALT_ROUNDS);
  const superAdmin = new User({
    name,
    email,
    passwordHash,
    role: 'SUPER_ADMIN',
    companyId: null, // Platform-level account
    status: 'ACTIVE',
  });

  await superAdmin.save();
  logger.info(`Super Admin initialized successfully! Email: ${email}`);
}

async function runCli() {
  try {
    await connectDB();
    await seedSuperAdminAccount();
    await disconnectDB();
    process.exit(0);
  } catch (err: any) {
    logger.error('Failed to seed Super Admin:', err);
    await disconnectDB();
    process.exit(1);
  }
}

// Execute if run directly from CLI
if (process.argv[1]?.includes('seedSuperAdmin')) {
  runCli();
}
