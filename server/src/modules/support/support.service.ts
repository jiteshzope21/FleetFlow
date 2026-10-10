import mongoose from 'mongoose';
import { SupportTicket, ISupportTicket } from '../../models/SupportTicket.js';
import { IUser } from '../../models/User.js';

export class SupportService {
  static async getCompanyTickets(companyId: mongoose.Types.ObjectId) {
    return SupportTicket.find({ companyId })
      .sort({ updatedAt: -1 })
      .lean();
  }

  static async getTicketById(companyId: mongoose.Types.ObjectId, id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid ticket ID.');
    const ticket = await SupportTicket.findOne({ _id: id, companyId });
    if (!ticket) throw new Error('Ticket not found.');
    return ticket;
  }

  static async createTicket(
    companyId: mongoose.Types.ObjectId,
    user: IUser,
    input: { subject: string; description: string; priority?: string; category?: string }
  ): Promise<ISupportTicket> {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `TICK-${Date.now().toString().slice(-5)}-${randomSuffix}`;

    const ticket = new SupportTicket({
      ticketNumber,
      companyId,
      userId: user._id,
      subject: input.subject.trim(),
      description: input.description.trim(),
      priority: input.priority || 'MEDIUM',
      category: input.category || 'GENERAL',
      status: 'OPEN',
      messages: [
        {
          senderId: user._id as any,
          senderName: user.name,
          senderRole: user.role,
          message: input.description.trim(),
          createdAt: new Date(),
        },
      ],
    });

    await ticket.save();
    return ticket;
  }

  static async replyTicket(
    companyId: mongoose.Types.ObjectId,
    ticketId: string,
    message: string,
    user: IUser
  ): Promise<ISupportTicket> {
    if (!mongoose.Types.ObjectId.isValid(ticketId)) throw new Error('Invalid ticket ID.');
    const ticket = await SupportTicket.findOne({ _id: ticketId, companyId });
    if (!ticket) throw new Error('Ticket not found.');

    ticket.messages.push({
      senderId: user._id as any,
      senderName: user.name,
      senderRole: user.role,
      message: message.trim(),
      createdAt: new Date(),
    });

    if (ticket.status === 'RESOLVED') {
      ticket.status = 'OPEN'; // Re-open if customer replies to resolved ticket
    }

    await ticket.save();
    return ticket;
  }
}
