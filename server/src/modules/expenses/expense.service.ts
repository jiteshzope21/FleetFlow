import mongoose from 'mongoose';
import { Expense, IExpense } from '../../models/Expense.js';
import { Vehicle } from '../../models/Vehicle.js';
import { Driver } from '../../models/Driver.js';
import { Customer } from '../../models/Customer.js';
import { CreateExpenseInput, UpdateExpenseInput, ExpenseQueryInput } from './expense.validator.js';

export class ExpenseService {
  static async getExpenses(companyId: mongoose.Types.ObjectId, query: ExpenseQueryInput) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      companyId,
      isArchived: false,
    };

    if (query.category) {
      filter.category = query.category;
    }

    if (query.vehicleId && mongoose.Types.ObjectId.isValid(query.vehicleId)) {
      filter.vehicleId = new mongoose.Types.ObjectId(query.vehicleId);
    }

    if (query.driverId && mongoose.Types.ObjectId.isValid(query.driverId)) {
      filter.driverId = new mongoose.Types.ObjectId(query.driverId);
    }

    if (query.customerId && mongoose.Types.ObjectId.isValid(query.customerId)) {
      filter.customerId = new mongoose.Types.ObjectId(query.customerId);
    }

    const [expenses, total, categoryBreakdown, grandTotalResult] = await Promise.all([
      Expense.find(filter)
        .populate('vehicleId', 'registrationNumber make model')
        .populate('driverId', 'name phone')
        .populate('customerId', 'name contactPerson')
        .sort({ expenseDate: -1 })
        .skip(skip)
        .limit(limit),
      Expense.countDocuments(filter),
      Expense.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$category',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      Expense.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const categorySummary: Record<string, number> = {};
    categoryBreakdown.forEach((c) => {
      categorySummary[c._id] = c.totalAmount;
    });

    return {
      expenses,
      summary: {
        totalAmount: grandTotalResult[0]?.totalAmount || 0,
        categorySummary,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getExpenseById(companyId: mongoose.Types.ObjectId, id: string): Promise<IExpense> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid expense ID format.');
    }

    const expense = await Expense.findOne({
      _id: id,
      companyId,
      isArchived: false,
    })
      .populate('vehicleId', 'registrationNumber make model')
      .populate('driverId', 'name phone')
      .populate('customerId', 'name contactPerson');

    if (!expense) {
      throw new Error('Expense record not found.');
    }

    return expense;
  }

  static async createExpense(companyId: mongoose.Types.ObjectId, input: CreateExpenseInput): Promise<IExpense> {
    // Validate cross-tenant entity references
    let vehicleObjectId: mongoose.Types.ObjectId | null = null;
    if (input.vehicleId) {
      if (!mongoose.Types.ObjectId.isValid(input.vehicleId)) {
        throw new Error('Invalid vehicle ID format.');
      }
      const vehicle = await Vehicle.findOne({
        _id: input.vehicleId,
        companyId,
        isArchived: false,
      });
      if (!vehicle) {
        throw new Error('Referenced vehicle not found in your fleet.');
      }
      vehicleObjectId = vehicle._id as mongoose.Types.ObjectId;
    }

    let driverObjectId: mongoose.Types.ObjectId | null = null;
    if (input.driverId) {
      if (!mongoose.Types.ObjectId.isValid(input.driverId)) {
        throw new Error('Invalid driver ID format.');
      }
      const driver = await Driver.findOne({
        _id: input.driverId,
        companyId,
        isArchived: false,
      });
      if (!driver) {
        throw new Error('Referenced driver not found in your company.');
      }
      driverObjectId = driver._id as mongoose.Types.ObjectId;
    }

    let customerObjectId: mongoose.Types.ObjectId | null = null;
    if (input.customerId) {
      if (!mongoose.Types.ObjectId.isValid(input.customerId)) {
        throw new Error('Invalid customer ID format.');
      }
      const customer = await Customer.findOne({
        _id: input.customerId,
        companyId,
        isArchived: false,
      });
      if (!customer) {
        throw new Error('Referenced customer not found in your workspace.');
      }
      customerObjectId = customer._id as mongoose.Types.ObjectId;
    }

    const expense = new Expense({
      companyId,
      title: input.title,
      category: input.category,
      expenseDate: input.expenseDate ? new Date(input.expenseDate) : new Date(),
      amount: Number(input.amount),
      currency: input.currency || 'INR',
      vehicleId: vehicleObjectId,
      driverId: driverObjectId,
      customerId: customerObjectId,
      vendor: input.vendor || undefined,
      paymentMethod: input.paymentMethod,
      referenceNumber: input.referenceNumber || undefined,
      notes: input.notes || undefined,
      isArchived: false,
    });

    await expense.save();
    return expense;
  }

  static async updateExpense(
    companyId: mongoose.Types.ObjectId,
    id: string,
    input: UpdateExpenseInput
  ): Promise<IExpense> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid expense ID format.');
    }

    const expense = await Expense.findOne({
      _id: id,
      companyId,
      isArchived: false,
    });

    if (!expense) {
      throw new Error('Expense record not found.');
    }

    if (input.vehicleId !== undefined) {
      if (input.vehicleId) {
        const vehicle = await Vehicle.findOne({
          _id: input.vehicleId,
          companyId,
          isArchived: false,
        });
        if (!vehicle) {
          throw new Error('Referenced vehicle not found in your fleet.');
        }
        expense.vehicleId = vehicle._id as mongoose.Types.ObjectId;
      } else {
        expense.vehicleId = null;
      }
    }

    if (input.driverId !== undefined) {
      if (input.driverId) {
        const driver = await Driver.findOne({
          _id: input.driverId,
          companyId,
          isArchived: false,
        });
        if (!driver) {
          throw new Error('Referenced driver not found in your company.');
        }
        expense.driverId = driver._id as mongoose.Types.ObjectId;
      } else {
        expense.driverId = null;
      }
    }

    if (input.customerId !== undefined) {
      if (input.customerId) {
        const customer = await Customer.findOne({
          _id: input.customerId,
          companyId,
          isArchived: false,
        });
        if (!customer) {
          throw new Error('Referenced customer not found in your workspace.');
        }
        expense.customerId = customer._id as mongoose.Types.ObjectId;
      } else {
        expense.customerId = null;
      }
    }

    if (input.title) expense.title = input.title;
    if (input.category) expense.category = input.category;
    if (input.expenseDate) expense.expenseDate = new Date(input.expenseDate);
    if (input.amount !== undefined) expense.amount = Number(input.amount);
    if (input.currency) expense.currency = input.currency;
    if (input.vendor !== undefined) expense.vendor = input.vendor || undefined;
    if (input.paymentMethod) expense.paymentMethod = input.paymentMethod;
    if (input.referenceNumber !== undefined) expense.referenceNumber = input.referenceNumber || undefined;
    if (input.notes !== undefined) expense.notes = input.notes || undefined;

    await expense.save();
    return expense;
  }

  static async archiveExpense(companyId: mongoose.Types.ObjectId, id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid expense ID format.');
    }

    const expense = await Expense.findOne({
      _id: id,
      companyId,
      isArchived: false,
    });

    if (!expense) {
      throw new Error('Expense record not found.');
    }

    expense.isArchived = true;
    await expense.save();
  }
}
