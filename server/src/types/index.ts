import { IUser, UserRole } from '../models/User.js';
import mongoose from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      companyId?: mongoose.Types.ObjectId;
    }
  }
}

export interface AuthUserPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string | null;
  status: string;
}
