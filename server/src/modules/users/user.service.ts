import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, IUser, UserRole } from '../../models/User.js';
import { CreateUserInput, UpdateUserInput, UserQueryInput } from './user.validator.js';
import { ENV } from '../../config/env.js';

export class UserService {
  static async getUsers(
    companyId: mongoose.Types.ObjectId,
    query: UserQueryInput
  ): Promise<{ users: IUser[]; total: number; page: number; totalPages: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: any = { companyId };

    if (query.role) {
      filter.role = query.role;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static async getUserById(
    companyId: mongoose.Types.ObjectId,
    userId: string
  ): Promise<IUser> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format.');
    }

    const user = await User.findOne({
      _id: new mongoose.Types.ObjectId(userId),
      companyId,
    }).select('-passwordHash');

    if (!user) {
      throw new Error('User not found in this company workspace.');
    }

    return user;
  }

  static async createUser(
    companyId: mongoose.Types.ObjectId,
    input: CreateUserInput
  ): Promise<IUser> {
    const existing = await User.findOne({ email: input.email });
    if (existing) {
      throw new Error('A user with this email address already exists.');
    }

    const passwordHash = await bcrypt.hash(input.password, ENV.BCRYPT_SALT_ROUNDS);

    const user = new User({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      companyId,
      phone: input.phone,
      status: 'ACTIVE',
    });

    await user.save();
    return user;
  }

  static async updateUser(
    companyId: mongoose.Types.ObjectId,
    currentUserId: string,
    targetUserId: string,
    input: UpdateUserInput
  ): Promise<IUser> {
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      throw new Error('Invalid user ID format.');
    }

    const targetUser = await User.findOne({
      _id: new mongoose.Types.ObjectId(targetUserId),
      companyId,
    });

    if (!targetUser) {
      throw new Error('User not found in this company workspace.');
    }

    // Protection: User cannot demote/elevate their own role
    if (currentUserId === targetUserId && input.role && input.role !== targetUser.role) {
      throw new Error('You cannot modify your own role.');
    }

    // Protection: Owner cannot be demoted or deactivated
    if (targetUser.role === 'COMPANY_OWNER' && currentUserId !== targetUserId) {
      throw new Error('Cannot modify the Company Owner profile.');
    }

    // Protection: Prevent self-deactivation
    if (currentUserId === targetUserId && input.status === 'INACTIVE') {
      throw new Error('You cannot deactivate your own account.');
    }

    if (input.name) targetUser.name = input.name;
    if (input.role) targetUser.role = input.role as UserRole;
    if (input.phone !== undefined) targetUser.phone = input.phone;
    if (input.status) targetUser.status = input.status;

    await targetUser.save();
    return targetUser;
  }

  static async updateStatus(
    companyId: mongoose.Types.ObjectId,
    currentUserId: string,
    targetUserId: string,
    status: 'ACTIVE' | 'INACTIVE'
  ): Promise<IUser> {
    if (currentUserId === targetUserId) {
      throw new Error('You cannot change your own account active status.');
    }

    return this.updateUser(companyId, currentUserId, targetUserId, { status });
  }
}
