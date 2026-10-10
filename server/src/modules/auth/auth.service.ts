import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Company, ICompany } from '../../models/Company.js';
import { User, IUser } from '../../models/User.js';
import { PasswordResetToken } from '../../models/PasswordResetToken.js';
import { ENV } from '../../config/env.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt.js';
import { RegisterCompanyInput, LoginInput, ResetPasswordInput } from './auth.validator.js';
import { logger } from '../../utils/logger.js';

export class AuthService {
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static async registerCompany(input: RegisterCompanyInput): Promise<{
    user: Partial<IUser>;
    company: Partial<ICompany>;
    accessToken: string;
    refreshToken: string;
  }> {
    const ownerEmail = input.ownerEmail.toLowerCase().trim();
    const companyEmail = input.companyEmail.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await User.findOne({ email: ownerEmail });
    if (existingUser) {
      throw new Error('An account with this owner email address already exists.');
    }

    // Generate unique slug
    let baseSlug = this.generateSlug(input.companyName);
    if (!baseSlug) baseSlug = 'company';
    let slug = baseSlug;
    let counter = 1;
    while (await Company.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, ENV.BCRYPT_SALT_ROUNDS);

    // Create Company
    const company = new Company({
      name: input.companyName.trim(),
      slug,
      email: companyEmail,
      phone: input.companyPhone ? input.companyPhone.trim() : undefined,
      address: input.companyAddress,
      businessType: input.businessType,
      status: 'ACTIVE',
    });
    await company.save();

    try {
      // Create Owner User
      const user = new User({
        name: input.ownerName.trim(),
        email: ownerEmail,
        passwordHash,
        role: 'COMPANY_OWNER',
        companyId: company._id,
        status: 'ACTIVE',
        lastLoginAt: new Date(),
      });
      await user.save();

      // Link ownerId on Company
      company.ownerId = user._id as any;
      await company.save();

      // Generate tokens
      const tokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        companyId: company._id.toString(),
      };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      return {
        user: {
          id: user._id.toString() as any,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: company._id as any,
          status: user.status,
        },
        company: {
          id: company._id.toString() as any,
          name: company.name,
          slug: company.slug,
          email: company.email,
          businessType: company.businessType,
          status: company.status,
        },
        accessToken,
        refreshToken,
      };
    } catch (userErr: any) {
      // Rollback: delete orphaned company document if user creation failed
      try {
        await Company.findByIdAndDelete(company._id);
        logger.info(`Rolled back orphaned company ${company._id} due to user creation error`);
      } catch (cleanupErr) {
        logger.error('Failed to cleanup company after registration failure:', cleanupErr);
      }
      throw userErr;
    }
  }

  static async login(input: LoginInput): Promise<{
    user: Partial<IUser>;
    company: Partial<ICompany> | null;
    accessToken: string;
    refreshToken: string;
  }> {
    // Find user by email
    const normalizedEmail = (input.email || '').toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('This account is inactive. Please contact support or your administrator.');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    user.lastLoginAt = new Date();
    await user.save();

    let company: ICompany | null = null;
    if (user.companyId) {
      company = await Company.findById(user.companyId);
      if (company && company.status === 'SUSPENDED') {
        throw new Error('Your company workspace is currently suspended. Please contact platform support.');
      }
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      companyId: company ? company._id.toString() : null,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        id: user._id.toString() as any,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
      },
      company: company
        ? {
            id: company._id.toString() as any,
            name: company.name,
            slug: company.slug,
            email: company.email,
            businessType: company.businessType,
            status: company.status,
            settings: company.settings,
          }
        : null,
      accessToken,
      refreshToken,
    };
  }

  static async forgotPassword(email: string): Promise<{ message: string; devResetToken?: string; emailDelivered: boolean }> {
    const user = await User.findOne({ email });
    if (!user) {
      // Do not disclose whether email exists
      return {
        message: 'Password reset request processed. Email delivery is currently unconfigured in this environment.',
        emailDelivered: false,
      };
    }

    // Invalidate existing active tokens
    await PasswordResetToken.updateMany({ userId: user._id, used: false }, { used: true });

    // Generate secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const resetToken = new PasswordResetToken({
      userId: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
      used: false,
    });
    await resetToken.save();

    // Log dev link in development mode
    if (ENV.NODE_ENV !== 'production') {
      logger.info(`[DEV] Password Reset Token for ${email}: ${rawToken}`);
      logger.info(`[DEV] Reset Link: ${ENV.CLIENT_URL}/reset-password?token=${rawToken}`);
    }

    return {
      message: 'Password reset token generated. Email service is unconfigured; please use the provided reset token.',
      devResetToken: ENV.NODE_ENV !== 'production' ? rawToken : undefined,
      emailDelivered: false,
    };
  }

  static async resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    const tokenHash = crypto.createHash('sha256').update(input.token).digest('hex');

    const record = await PasswordResetToken.findOne({
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      throw new Error('Password reset token is invalid or has expired.');
    }

    const user = await User.findById(record.userId);
    if (!user) {
      throw new Error('User not found.');
    }

    user.passwordHash = await bcrypt.hash(input.password, ENV.BCRYPT_SALT_ROUNDS);
    await user.save();

    record.used = true;
    await record.save();

    return { message: 'Password has been successfully reset. You may now log in.' };
  }
}
