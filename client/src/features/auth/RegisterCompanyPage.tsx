import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, User, Mail, Lock, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { Alert } from '../../components/ui/Alert.js';

const registerCompanySchema = z
  .object({
    companyName: z.string().min(2, 'Company name must be at least 2 characters'),
    companyEmail: z.string().email('Please enter a valid company email'),
    companyPhone: z.string().optional(),
    businessType: z.enum(['LOGISTICS', 'FREIGHT_FORWARDER', 'TRUCKING', 'FLEET_OPERATOR', 'OTHER']),
    ownerName: z.string().min(2, 'Owner full name must be at least 2 characters'),
    ownerEmail: z.string().email('Please enter a valid personal email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
      .regex(/[0-9]/, 'Password must include at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerCompanySchema>;

export const RegisterCompanyPage: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerCompanySchema),
    defaultValues: {
      businessType: 'LOGISTICS',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setServerError(null);
      await registerAuth(data);
      navigate('/');
    } catch (err: any) {
      setServerError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Failed to register company workspace. Please verify details.'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Register Company Workspace
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Create an isolated SaaS workspace for your fleet business in seconds.
        </p>
      </div>

      {serverError && (
        <Alert variant="error" title="Registration Error">
          {serverError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Section 1: Company Information */}
        <div className="space-y-3.5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Building2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Company Information
            </h3>
          </div>

          <Input
            label="Company Legal Name"
            placeholder="e.g. Apex Freight Logistics Inc."
            leftIcon={<Building2 className="w-4 h-4" />}
            error={errors.companyName?.message}
            {...register('companyName')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Company Email"
              type="email"
              placeholder="ops@apexfreight.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.companyEmail?.message}
              {...register('companyEmail')}
            />

            <Input
              label="Company Phone (Optional)"
              type="tel"
              placeholder="+1-555-0199"
              leftIcon={<Phone className="w-4 h-4" />}
              error={errors.companyPhone?.message}
              {...register('companyPhone')}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Business Type
            </label>
            <select
              className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
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

        {/* Section 2: Owner Account Information */}
        <div className="space-y-3.5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <User className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Workspace Administrator (Owner)
            </h3>
          </div>

          <Input
            label="Owner Full Name"
            placeholder="Alice Walker"
            leftIcon={<User className="w-4 h-4" />}
            error={errors.ownerName?.message}
            {...register('ownerName')}
          />

          <Input
            label="Owner Email Address"
            type="email"
            placeholder="alice@apexfreight.com"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.ownerEmail?.message}
            {...register('ownerEmail')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isSubmitting}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Activate Company Workspace
        </Button>
      </form>

      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Already registered?{' '}
          <Link
            to="/login"
            className="font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors"
          >
            Sign In to Existing Workspace
          </Link>
        </p>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Owner account automatically granted COMPANY_OWNER role</span>
      </div>
    </div>
  );
};
