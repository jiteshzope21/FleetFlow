import mongoose from 'mongoose';
import { Invoice, IInvoice } from '../../models/Invoice.js';
import { Customer } from '../../models/Customer.js';
import { Trip } from '../../models/Trip.js';
import { Shipment } from '../../models/Shipment.js';

export class InvoiceService {
  static async createInvoice(companyId: mongoose.Types.ObjectId, input: any): Promise<IInvoice> {
    if (!mongoose.Types.ObjectId.isValid(input.customerId)) {
      throw new Error('Invalid customer ID.');
    }

    const customer = await Customer.findOne({ _id: input.customerId, companyId });
    if (!customer) {
      throw new Error('Customer not found in your company.');
    }

    // Calculate subtotal, tax and total
    let subtotal = 0;
    const computedItems = input.items.map((it: any) => {
      const amount = Math.round(it.quantity * it.unitPrice * 100) / 100;
      subtotal += amount;
      return {
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        amount,
      };
    });

    const taxRate = Number(input.taxRate) || 0;
    const taxAmount = Math.round((subtotal * (taxRate / 100)) * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    // Generate unique invoice number: INV-<timestamp-suffix>
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${randomSuffix}`;

    const invoice = new Invoice({
      invoiceNumber,
      companyId,
      customerId: customer._id,
      tripId: input.tripId && mongoose.Types.ObjectId.isValid(input.tripId) ? input.tripId : undefined,
      shipmentId: input.shipmentId && mongoose.Types.ObjectId.isValid(input.shipmentId) ? input.shipmentId : undefined,
      dueDate: new Date(input.dueDate),
      items: computedItems,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      paidAmount: 0,
      status: 'ISSUED',
      notes: input.notes,
    });

    await invoice.save();
    return invoice;
  }

  static async getInvoices(companyId: mongoose.Types.ObjectId, query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { companyId };
    if (query.status) filter.status = query.status;
    if (query.customerId && mongoose.Types.ObjectId.isValid(query.customerId)) {
      filter.customerId = query.customerId;
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('customerId', 'name companyName email phone')
        .populate('tripId', 'tripNumber status route')
        .populate('shipmentId', 'shipmentNumber origin destination')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Invoice.countDocuments(filter),
    ]);

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getInvoiceById(companyId: mongoose.Types.ObjectId, id: string): Promise<IInvoice> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid invoice ID format.');

    const invoice = await Invoice.findOne({ _id: id, companyId })
      .populate('customerId')
      .populate('tripId')
      .populate('shipmentId');

    if (!invoice) throw new Error('Invoice not found.');
    return invoice;
  }

  static async recordPayment(companyId: mongoose.Types.ObjectId, id: string, input: any): Promise<IInvoice> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid invoice ID format.');

    const invoice = await Invoice.findOne({ _id: id, companyId });
    if (!invoice) throw new Error('Invoice not found.');

    const paymentAmount = Number(input.amount);
    if (paymentAmount <= 0) throw new Error('Payment amount must be greater than zero.');

    invoice.paymentRecords.push({
      amount: paymentAmount,
      paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
      paymentMethod: input.paymentMethod || 'BANK_TRANSFER',
      transactionReference: input.transactionReference,
      notes: input.notes,
    });

    invoice.paidAmount = Math.round((invoice.paidAmount + paymentAmount) * 100) / 100;

    if (invoice.paidAmount >= invoice.totalAmount) {
      invoice.status = 'PAID';
    } else if (invoice.paidAmount > 0) {
      invoice.status = 'PARTIALLY_PAID';
    }

    await invoice.save();
    return invoice;
  }
}
