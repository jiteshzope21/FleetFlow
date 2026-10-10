import { z } from 'zod';

export const updateCompanyProfileSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').max(100).optional(),
  email: z.string().email('Please enter a valid company email').toLowerCase().optional(),
  phone: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  businessType: z
    .enum(['LOGISTICS', 'FREIGHT_FORWARDER', 'TRUCKING', 'FLEET_OPERATOR', 'OTHER'])
    .optional(),
  settings: z
    .object({
      currency: z.string().min(1).max(5).optional(),
      timezone: z.string().optional(),
      dateFormat: z.string().optional(),
      distanceUnit: z.enum(['km', 'miles']).optional(),
      fuelUnit: z.enum(['liters', 'gallons']).optional(),
    })
    .optional(),
});

export type UpdateCompanyProfileInput = z.infer<typeof updateCompanyProfileSchema>;
