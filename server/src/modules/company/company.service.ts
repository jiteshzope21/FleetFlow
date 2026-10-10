import mongoose from 'mongoose';
import { Company, ICompany } from '../../models/Company.js';
import { UpdateCompanyProfileInput } from './company.validator.js';

export class CompanyService {
  static async getProfile(companyId: mongoose.Types.ObjectId): Promise<ICompany> {
    const company = await Company.findById(companyId);
    if (!company) {
      throw new Error('Company not found.');
    }
    return company;
  }

  static async updateProfile(
    companyId: mongoose.Types.ObjectId,
    input: UpdateCompanyProfileInput
  ): Promise<ICompany> {
    const company = await Company.findById(companyId);
    if (!company) {
      throw new Error('Company not found.');
    }

    if (input.name) company.name = input.name;
    if (input.email) company.email = input.email;
    if (input.phone !== undefined) company.phone = input.phone;
    if (input.businessType) company.businessType = input.businessType;

    if (input.address) {
      company.address = {
        ...company.address,
        ...input.address,
      };
    }

    if (input.settings) {
      company.settings = {
        ...company.settings,
        ...input.settings,
      };
    }

    await company.save();
    return company;
  }
}
