import mongoose from 'mongoose';
import { Customer, ICustomer } from '../../models/Customer.js';
import { CreateCustomerInput, UpdateCustomerInput, CustomerQueryInput } from './customer.validator.js';

export class CustomerService {
  static async getCustomers(companyId: mongoose.Types.ObjectId, query: CustomerQueryInput) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      companyId,
      isArchived: false,
    };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.customerType) {
      filter.customerType = query.customerType;
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { contactPerson: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
      ];
    }

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Customer.countDocuments(filter),
    ]);

    return {
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getCustomerById(companyId: mongoose.Types.ObjectId, id: string): Promise<ICustomer> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid customer ID format.');
    }

    const customer = await Customer.findOne({
      _id: id,
      companyId,
      isArchived: false,
    });

    if (!customer) {
      throw new Error('Customer not found.');
    }

    return customer;
  }

  static async createCustomer(companyId: mongoose.Types.ObjectId, input: CreateCustomerInput): Promise<ICustomer> {
    const name = input.name.trim();

    // Check duplicate customer name within tenant
    const existing = await Customer.findOne({
      companyId,
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      isArchived: false,
    });

    if (existing) {
      throw new Error(`Customer with name "${name}" already exists in your workspace.`);
    }

    const formatAddress = (addr?: any) => {
      if (!addr) return undefined;
      return {
        street: addr.street || undefined,
        city: addr.city || undefined,
        state: addr.state || undefined,
        postalCode: addr.postalCode || undefined,
        country: addr.country || undefined,
      };
    };

    const customer = new Customer({
      companyId,
      name,
      customerType: input.customerType,
      contactPerson: input.contactPerson,
      phone: input.phone,
      email: input.email || undefined,
      billingAddress: formatAddress(input.billingAddress),
      shippingAddress: formatAddress(input.shippingAddress),
      taxId: input.taxId || undefined,
      paymentTerms: input.paymentTerms,
      status: input.status,
      notes: input.notes || undefined,
      isArchived: false,
    });

    await customer.save();
    return customer;
  }

  static async updateCustomer(
    companyId: mongoose.Types.ObjectId,
    id: string,
    input: UpdateCustomerInput
  ): Promise<ICustomer> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid customer ID format.');
    }

    const customer = await Customer.findOne({
      _id: id,
      companyId,
      isArchived: false,
    });

    if (!customer) {
      throw new Error('Customer not found.');
    }

    if (input.name) {
      const name = input.name.trim();
      if (name.toLowerCase() !== customer.name.toLowerCase()) {
        const existing = await Customer.findOne({
          companyId,
          name: { $regex: new RegExp(`^${name}$`, 'i') },
          isArchived: false,
          _id: { $ne: customer._id },
        });
        if (existing) {
          throw new Error(`Customer with name "${name}" already exists in your workspace.`);
        }
        customer.name = name;
      }
    }

    const formatAddress = (addr?: any) => {
      if (!addr) return undefined;
      return {
        street: addr.street || undefined,
        city: addr.city || undefined,
        state: addr.state || undefined,
        postalCode: addr.postalCode || undefined,
        country: addr.country || undefined,
      };
    };

    if (input.customerType) customer.customerType = input.customerType;
    if (input.contactPerson) customer.contactPerson = input.contactPerson;
    if (input.phone) customer.phone = input.phone;
    if (input.email !== undefined) customer.email = input.email || undefined;
    if (input.billingAddress !== undefined) customer.billingAddress = formatAddress(input.billingAddress);
    if (input.shippingAddress !== undefined) customer.shippingAddress = formatAddress(input.shippingAddress);
    if (input.taxId !== undefined) customer.taxId = input.taxId || undefined;
    if (input.paymentTerms) customer.paymentTerms = input.paymentTerms;
    if (input.status) customer.status = input.status;
    if (input.notes !== undefined) customer.notes = input.notes || undefined;

    await customer.save();
    return customer;
  }

  static async archiveCustomer(companyId: mongoose.Types.ObjectId, id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid customer ID format.');
    }

    const customer = await Customer.findOne({
      _id: id,
      companyId,
      isArchived: false,
    });

    if (!customer) {
      throw new Error('Customer not found.');
    }

    customer.isArchived = true;
    customer.status = 'INACTIVE';
    await customer.save();
  }
}
