import { Request, Response } from 'express';
import { UserService } from './user.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export class UserController {
  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }

      const result = await UserService.getUsers(req.companyId, req.query as any);
      successResponse(res, result.users, undefined, 200, {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      });
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }

  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }

      const user = await UserService.getUserById(req.companyId, req.params.id);
      successResponse(res, user);
    } catch (err: any) {
      errorResponse(res, err.message, 404);
    }
  }

  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }

      const user = await UserService.createUser(req.companyId, req.body);
      successResponse(res, user, 'User created successfully.', 201);
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }

  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId || !req.user) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }

      const user = await UserService.updateUser(
        req.companyId,
        req.user._id.toString(),
        req.params.id,
        req.body
      );
      successResponse(res, user, 'User updated successfully.');
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }

  static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!req.companyId || !req.user) {
        errorResponse(res, 'Company context required.', 403);
        return;
      }

      const user = await UserService.updateStatus(
        req.companyId,
        req.user._id.toString(),
        req.params.id,
        req.body.status
      );
      successResponse(res, user, `User marked as ${req.body.status}.`);
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  }
}
