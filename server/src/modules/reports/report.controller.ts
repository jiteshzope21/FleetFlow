import { Request, Response } from 'express';
import { ReportService } from './report.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export class ReportController {
  static async getSummary(req: Request, res: Response) {
    try {
      if (!req.user?.companyId) {
        return errorResponse(res, 'Tenant context required', 400);
      }
      const data = await ReportService.getOperationalSummary(req.user.companyId);
      return successResponse(res, data, 'Operational summary report generated successfully');
    } catch (err: any) {
      return errorResponse(res, err.message || 'Failed to generate summary report', err.statusCode || 400);
    }
  }

  static async exportShipments(req: Request, res: Response) {
    try {
      if (!req.user?.companyId) {
        return errorResponse(res, 'Tenant context required', 400);
      }
      const csvData = await ReportService.exportShipmentsCsv(req.user.companyId);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="shipments-report.csv"');
      return res.status(200).send(csvData);
    } catch (err: any) {
      return errorResponse(res, err.message || 'Failed to export shipments CSV', err.statusCode || 400);
    }
  }

  static async exportTrips(req: Request, res: Response) {
    try {
      if (!req.user?.companyId) {
        return errorResponse(res, 'Tenant context required', 400);
      }
      const csvData = await ReportService.exportTripsCsv(req.user.companyId);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="trips-report.csv"');
      return res.status(200).send(csvData);
    } catch (err: any) {
      return errorResponse(res, err.message || 'Failed to export trips CSV', err.statusCode || 400);
    }
  }
}
