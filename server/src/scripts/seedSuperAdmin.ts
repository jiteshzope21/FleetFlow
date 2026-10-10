import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';

async function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@fleetflow.local';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'FleetFlowAdmin2026!';
  const name = process.env.SUPER_ADMIN_NAME || 'FleetFlow Platform Admin';

  try {
    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      logger.info(`Super Admin already exists with email: ${email}`);
      await disconnectDB();
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 10);
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
    await disconnectDB();
    process.exit(0);
  } catch (err: any) {
    logger.error('Failed to seed Super Admin:', err);
    await disconnectDB();
    process.exit(1);
  }
}

seedSuperAdmin();
