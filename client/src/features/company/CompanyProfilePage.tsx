import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Settings,
  Save,
  CheckCircle2,
  Shield,
  Calendar,
  Globe,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Alert } from '../../components/ui/Alert.js';
import { Breadcrumbs } from '../../components/shared/Breadcrumbs.js';
import { api } from '../../lib/api.js';
import { formatDate } from '../../lib/utils.js';

const companyProfileSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid company email'),
  phone: z.string().optional(),
  businessType: z.enum(['LOGISTICS', 'FREIGHT_FORWARDER', 'TRUCKING', 'FLEET_OPERATOR', 'OTHER']),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }),
  settings: z.object({
    currency: z.string().min(1).max(5),
    timezone: z.string().min(1),
    dateFormat: z.string().min(1),
    distanceUnit: z.enum(['km', 'miles']),
    fuelUnit: z.enum(['liters', 'gallons']),
  }),
});

type CompanyProfileFormData = z.infer<typeof companyProfileSchema>;

export const CompanyProfilePage: React.FC = () => {
  const { user, company, updateCompanyState } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const canEdit = user?.role === 'COMPANY_OWNER' || user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CompanyProfileFormData>({
    resolver: zodResolver(companyProfileSchema),
  });

  useEffect(() => {
    if (company) {
      reset({
        name: company.name || '',
        email: company.email || '',
        phone: company.phone || '',
        businessType: (company.businessType as any) || 'LOGISTICS',
        address: {
          street: company.address?.street || '',
          city: company.address?.city || '',
          state: company.address?.state || '',
          zipCode: company.address?.zipCode || '',
          country: company.address?.country || 'USA',
        },
        settings: {
          currency: company.settings?.currency || 'USD',
          timezone: company.settings?.timezone || 'UTC',
          dateFormat: company.settings?.dateFormat || 'YYYY-MM-DD',
          distanceUnit: company.settings?.distanceUnit || 'km',
          fuelUnit: company.settings?.fuelUnit || 'liters',
        },
      });
    }
  }, [company, reset]);

  const onSubmit = async (data: CompanyProfileFormData) => {
    try {
      setServerError(null);
      setSuccessMessage(null);
      const res = await api.patch('/company/profile', data);
      if (res.data?.success) {
        updateCompanyState(res.data.data);
        setSuccessMessage('Company workspace profile updated successfully.');
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Failed to update company profile.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <Breadcrumbs items={[{ label: 'Company Profile & Settings' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Company Workspace Profile
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage your transport organization identity, operational units, and regional preferences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" size="md">
            {company?.status || 'ACTIVE'}
          </Badge>
          <Badge variant="primary" size="md">
            Tenant: {company?.slug}
          </Badge>
        </div>
      </div>

      {successMessage && (
        <Alert variant="success" title="Success">
          {successMessage}
        </Alert>
      )}

      {serverError && (
        <Alert variant="error" title="Update Error">
          {serverError}
        </Alert>
      )}

      {!canEdit && (
        <Alert variant="info" title="Read Only Access">
          Your role ({user?.role}) has view-only permissions for company profile settings. Only Company Owners and Managers can modify company settings.
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Identity Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <div>
                <CardTitle>Legal & Contact Information</CardTitle>
                <CardDescription>Primary identification details for your transport entity</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Company Legal Name"
                disabled={!canEdit}
                leftIcon={<Building2 className="w-4 h-4" />}
                error={errors.name?.message}
                {...register('name')}
              />

              <Input
                label="Official Business Email"
                type="email"
                disabled={!canEdit}
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Primary Phone Number"
                type="tel"
                disabled={!canEdit}
                leftIcon={<Phone className="w-4 h-4" />}
                error={errors.phone?.message}
                {...register('phone')}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Business Domain / Type
                </label>
                <select
                  disabled={!canEdit}
                  className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
                  {...register('businessType')}
                >
                  <option value="LOGISTICS">Logistics & Transportation</option>
                  <option value="FREIGHT_FORWARDER">Freight Forwarder</option>
                  <option value="TRUCKING">Trucking & Long Haul</option>
                  <option value="FLEET_OPERATOR">Commercial Fleet Operator</option>
                  <option value="OTHER">Other Transport Business</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Physical Address Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <div>
                <CardTitle>Headquarters Address</CardTitle>
                <CardDescription>Physical operating location used for shipment origins and invoices</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Street Address"
              placeholder="124 Logistics Way, Suite 400"
              disabled={!canEdit}
              error={errors.address?.street?.message}
              {...register('address.street')}
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input
                label="City"
                disabled={!canEdit}
                error={errors.address?.city?.message}
                {...register('address.city')}
              />
              <Input
                label="State / Province"
                disabled={!canEdit}
                error={errors.address?.state?.message}
                {...register('address.state')}
              />
              <Input
                label="Zip / Postal Code"
                disabled={!canEdit}
                error={errors.address?.zipCode?.message}
                {...register('address.zipCode')}
              />
              <Input
                label="Country"
                disabled={!canEdit}
                error={errors.address?.country?.message}
                {...register('address.country')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Operational Settings & Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <Settings className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <div>
                <CardTitle>Workspace Metrics & Units</CardTitle>
                <CardDescription>Configured standards for distance, fuel calculations, and currencies</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Billing Currency
                </label>
                <select
                  disabled={!canEdit}
                  className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
                  {...register('settings.currency')}
                >
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                  <option value="CAD">CAD ($ - Canadian Dollar)</option>
                  <option value="INR">INR (₹ - Indian Rupee)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Distance Measurement
                </label>
                <select
                  disabled={!canEdit}
                  className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
                  {...register('settings.distanceUnit')}
                >
                  <option value="km">Kilometers (km)</option>
                  <option value="miles">Miles (mi)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Fuel Measurement
                </label>
                <select
                  disabled={!canEdit}
                  className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
                  {...register('settings.fuelUnit')}
                >
                  <option value="liters">Liters (L)</option>
                  <option value="gallons">Gallons (gal)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Read-Only System Metadata Card */}
        <Card className="bg-slate-50/50 dark:bg-slate-900/50">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-slate-400" />
                <span>Tenant Slug: <strong className="text-slate-700 dark:text-slate-200">{company?.slug}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Registered: <strong className="text-slate-700 dark:text-slate-200">{formatDate(company?.createdAt)}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Multi-Tenant Data Isolation Active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {canEdit && (
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              size="lg"
              isLoading={isSubmitting}
              disabled={!isDirty}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Company Settings
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};
