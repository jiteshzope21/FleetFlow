import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessageSource {
  source: string;
  header: string;
  score: number;
}

export interface IChatMessage {
  _id?: mongoose.Types.ObjectId;
  role: 'user' | 'assistant' | 'system';
  content: string;
  ragSources?: IChatMessageSource[];
  modelStatus?: string;
  latencyMs?: number;
  createdAt: Date;
}

export interface IChatConversation extends Document {
  companyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  userRole: string;
  messages: IChatMessage[];
  escalatedTicketId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSourceSchema = new Schema<IChatMessageSource>(
  {
    source: { type: String, required: true },
    header: { type: String, required: true },
    score: { type: Number, required: true },
  },
  { _id: false }
);

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    ragSources: [ChatMessageSourceSchema],
    modelStatus: { type: String, default: 'FINE_TUNED_SLM_WITH_RAG' },
    latencyMs: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ChatConversationSchema = new Schema<IChatConversation>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Support Conversation',
      maxlength: 120,
    },
    userRole: {
      type: String,
      required: true,
    },
    messages: [ChatMessageSchema],
    escalatedTicketId: {
      type: Schema.Types.ObjectId,
      ref: 'SupportTicket',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast tenant and user thread retrieval
ChatConversationSchema.index({ companyId: 1, userId: 1, updatedAt: -1 });

export const ChatConversation = mongoose.model<IChatConversation>('ChatConversation', ChatConversationSchema);

