import { Request, Response } from 'express';
import { ChatService } from './chat.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export class ChatController {
  static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.companyId!;
      const user = req.user!;
      const { message, conversationId } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        errorResponse(res, 'Message text is required.', 400);
        return;
      }

      const result = await ChatService.sendMessage({
        companyId,
        user,
        message: message.trim(),
        conversationId,
      });

      successResponse(res, result, 'Message processed successfully', 200);
    } catch (err: any) {
      console.error('[ChatController] sendMessage error:', err);
      errorResponse(res, err.message || 'Failed to process chat message', 500);
    }
  }

  static async getConversations(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.companyId!;
      const user = req.user!;

      const conversations = await ChatService.getConversations(companyId, user._id as any);
      successResponse(res, conversations, 'Conversations retrieved', 200);
    } catch (err: any) {
      errorResponse(res, err.message || 'Failed to retrieve conversations', 500);
    }
  }

  static async getConversationById(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.companyId!;
      const user = req.user!;
      const { id } = req.params;

      const conversation = await ChatService.getConversationById(companyId, user._id as any, id);
      successResponse(res, conversation, 'Conversation details retrieved', 200);
    } catch (err: any) {
      errorResponse(res, err.message || 'Failed to retrieve conversation', 404);
    }
  }

  static async deleteConversation(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.companyId!;
      const user = req.user!;
      const { id } = req.params;

      const deleted = await ChatService.deleteConversation(companyId, user._id as any, id);
      successResponse(res, { deleted }, 'Conversation deleted', 200);
    } catch (err: any) {
      errorResponse(res, err.message || 'Failed to delete conversation', 400);
    }
  }

  static async escalate(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.companyId!;
      const user = req.user!;
      const { conversationId, subject, priority, category } = req.body;

      if (!conversationId || !subject) {
        errorResponse(res, 'conversationId and subject are required for escalation.', 400);
        return;
      }

      const ticket = await ChatService.escalateToTicket(companyId, user, conversationId, {
        subject,
        priority,
        category,
      });

      successResponse(res, ticket, 'Conversation successfully escalated to support ticket', 201);
    } catch (err: any) {
      errorResponse(res, err.message || 'Failed to escalate conversation', 500);
    }
  }

  static async getModelInfo(_req: Request, res: Response): Promise<void> {
    try {
      const info = await ChatService.getModelInfo();
      successResponse(res, info, 'Model information retrieved', 200);
    } catch (err: any) {
      errorResponse(res, err.message || 'Failed to get model info', 500);
    }
  }
}
