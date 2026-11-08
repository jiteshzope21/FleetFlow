import mongoose from 'mongoose';
import fetch, { AbortError } from 'node-fetch';
import { ChatConversation, IChatConversation } from '../../models/ChatConversation.js';
import { SupportTicket } from '../../models/SupportTicket.js';
import { IUser } from '../../models/User.js';
import { Company } from '../../models/Company.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export interface SendMessageParams {
  companyId: mongoose.Types.ObjectId;
  user: IUser;
  message: string;
  conversationId?: string;
}

export class ChatService {
  /**
   * Send a query to the Domain-Specific SLM + RAG inference service
   */
  static async sendMessage(params: SendMessageParams) {
    const { companyId, user, message, conversationId } = params;

    // 1. Resolve or create conversation
    let conv: any = null;
    if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
      conv = await ChatConversation.findOne({ _id: conversationId, companyId, userId: user._id });
    }

    if (!conv) {
      const title = message.length > 50 ? `${message.slice(0, 47)}...` : message;
      conv = new ChatConversation({
        companyId,
        userId: user._id,
        userRole: user.role,
        title,
        messages: [],
      });
    }

    // Get company details for workspace context
    let companyName = 'FleetFlow Workspace';
    try {
      const comp = await Company.findById(companyId).select('name').lean();
      if (comp?.name) companyName = comp.name;
    } catch {
      // ignore
    }

    // Format previous turns for context
    const history = conv.messages.slice(-6).map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    // Record user message
    conv.messages.push({
      role: 'user',
      content: message.trim(),
      createdAt: new Date(),
    });

    // 2. Call FastAPI SLM Inference Service
    let aiResponse = {
      response: '',
      model_status: 'FINE_TUNED_SLM_WITH_RAG',
      has_lora: true,
      rag_sources: [] as any[],
      latency_ms: 0,
      should_escalate: false,
      escalation_metadata: null as any,
      suggested_followups: [
        'How do I schedule a trip?',
        'How do I add a new vehicle?',
        'Where can I view fuel economy analytics?',
      ],
    };

    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(`${AI_SERVICE_URL}/support/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          history,
          user_role: user.role,
          company_name: companyName,
          company_id: companyId.toString(),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = (await res.json()) as any;
        aiResponse = {
          response: data.response,
          model_status: data.model_status || 'FINE_TUNED_SLM_WITH_RAG',
          has_lora: data.has_lora ?? true,
          rag_sources: data.rag_sources || [],
          latency_ms: data.latency_ms || Date.now() - startTime,
          should_escalate: data.should_escalate || false,
          escalation_metadata: data.escalation_metadata || null,
          suggested_followups: data.suggested_followups || [],
        };
      } else {
        throw new Error(`AI service returned HTTP ${res.status}`);
      }
    } catch (err: any) {
      console.warn(`[ChatService] AI service fallback activated: ${err.message}`);
      aiResponse.latency_ms = Date.now() - startTime;
      aiResponse.model_status = 'EMBEDDED_KNOWLEDGE_FALLBACK';
      aiResponse.has_lora = false;
      aiResponse.should_escalate = true;
      aiResponse.escalation_metadata = {
        category: 'TECHNICAL',
        priority: 'HIGH',
        suggested_subject: message.slice(0, 80),
      };

      // Intelligent deterministic fallback based on message keywords
      const lower = message.toLowerCase();
      if (lower.includes('vehicle') || lower.includes('truck')) {
        aiResponse.response =
          'To manage fleet vehicles in FleetFlow, navigate to **Vehicles** (`/vehicles`). You can add new vehicles with registration numbers, track document expiries (insurance, PUC), and assign drivers. Vehicles in maintenance are automatically locked from trip dispatches.';
        aiResponse.rag_sources = [{ source: '02_fleet_and_vehicles.md', header: 'Vehicle Inventory', score: 0.85 }];
      } else if (lower.includes('trip') || lower.includes('dispatch')) {
        aiResponse.response =
          'To schedule and dispatch a trip, navigate to **Trips** (`/trips`) and click "+ New Trip". Assign an active vehicle, driver, and pending shipments. Enter start odometer at departure (`IN_PROGRESS`) and end odometer at delivery (`COMPLETED`).';
        aiResponse.rag_sources = [{ source: '06_trips_and_dispatch.md', header: 'Trip Dispatching', score: 0.88 }];
      } else if (lower.includes('invoice') || lower.includes('payment')) {
        aiResponse.response =
          'Customer invoices are managed on **Invoices** (`/invoices`). You can generate invoices from delivered shipments, record partial payments, and track outstanding balances. Note that payments exceeding the remaining balance will be rejected.';
        aiResponse.rag_sources = [{ source: '10_invoicing_and_payments.md', header: 'Invoicing & Payments', score: 0.86 }];
      } else {
        aiResponse.response =
          'Welcome to FleetFlow AI Support. I can guide you through managing vehicles (`/vehicles`), dispatching trips (`/trips`), booking shipments (`/shipments`), logging fuel and maintenance (`/fuel`, `/maintenance`), and client billing (`/invoices`). If you need human assistance, you can open a support ticket on `/support`.';
      }
    }

    // Record assistant response
    conv.messages.push({
      role: 'assistant',
      content: aiResponse.response,
      ragSources: aiResponse.rag_sources,
      modelStatus: aiResponse.model_status,
      latencyMs: aiResponse.latency_ms,
      createdAt: new Date(),
    });

    await conv.save();

    return {
      conversationId: conv._id,
      title: conv.title,
      response: aiResponse.response,
      modelStatus: aiResponse.model_status,
      hasLora: aiResponse.has_lora,
      ragSources: aiResponse.rag_sources,
      latencyMs: aiResponse.latency_ms,
      shouldEscalate: aiResponse.should_escalate,
      escalationMetadata: aiResponse.escalation_metadata,
      suggestedFollowups: aiResponse.suggested_followups,
      messages: conv.messages,
    };
  }

  /**
   * Retrieve conversation threads for the authenticated user and company
   */
  static async getConversations(companyId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId) {
    return ChatConversation.find({ companyId, userId })
      .select('_id title userRole updatedAt createdAt escalatedTicketId messages')
      .slice('messages', -1) // only get last message for preview
      .sort({ updatedAt: -1 })
      .lean();
  }

  /**
   * Retrieve a specific conversation with all messages
   */
  static async getConversationById(
    companyId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    conversationId: string
  ) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new Error('Invalid conversation ID.');
    }
    const conv = await ChatConversation.findOne({ _id: conversationId, companyId, userId }).lean();
    if (!conv) throw new Error('Conversation not found.');
    return conv;
  }

  /**
   * Delete a conversation thread safely
   */
  static async deleteConversation(
    companyId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    conversationId: string
  ) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new Error('Invalid conversation ID.');
    }
    const res = await ChatConversation.deleteOne({ _id: conversationId, companyId, userId });
    return res.deletedCount > 0;
  }

  /**
   * Escalate conversation thread to human support by creating a real SupportTicket
   */
  static async escalateToTicket(
    companyId: mongoose.Types.ObjectId,
    user: IUser,
    conversationId: string,
    input: { subject: string; priority?: string; category?: string }
  ) {
    const conv = await this.getConversationById(companyId, user._id as any, conversationId);

    // Format conversation history into transcript
    const transcript = conv.messages
      .map((m: any) => `[${m.role.toUpperCase()}] ${m.content}`)
      .join('\n\n');

    const fullDescription = `${input.subject}\n\n--- AI CHAT CONVERSATION TRANSCRIPT ---\n${transcript}`;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `TICK-${Date.now().toString().slice(-5)}-${randomSuffix}`;

    const ticket = new SupportTicket({
      ticketNumber,
      companyId,
      userId: user._id,
      subject: input.subject.trim(),
      description: fullDescription,
      priority: input.priority || 'HIGH',
      category: input.category || 'TECHNICAL',
      status: 'OPEN',
      messages: [
        {
          senderId: user._id as any,
          senderName: user.name,
          senderRole: user.role,
          message: fullDescription,
          createdAt: new Date(),
        },
      ],
    });

    await ticket.save();

    // Link ticket to conversation
    await ChatConversation.updateOne({ _id: conv._id }, { escalatedTicketId: ticket._id });

    return ticket;
  }

  /**
   * Check model status from FastAPI service
   */
  static async getModelInfo() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${AI_SERVICE_URL}/support/model-info`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }

    return {
      status: 'offline',
      base_model: 'Qwen/Qwen2.5-1.5B-Instruct',
      active_mode: 'EMBEDDED_KNOWLEDGE_FALLBACK',
      has_lora: false,
      rag_chunks: 58,
    };
  }
}

