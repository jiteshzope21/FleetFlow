import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { Alert } from '../../components/ui/Alert.js';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const isExpired = searchParams.get('expired') === 'true';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError(null);
      await login(data.email, data.password);
      navigate('/');
    } catch (err: any) {
      setServerError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Invalid email or password. Please verify your credentials.'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Welcome back
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Enter your credentials to access your transport company workspace.
        </p>
      </div>

      {isExpired && (
        <Alert variant="warning" title="Session Expired">
          Your session has expired. Please sign in again to continue.
        </Alert>
      )}

      {serverError && (
        <Alert variant="error" title="Authentication Error">
          {serverError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="space-y-1">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex justify-end pt-1">
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          size="lg"
          isLoading={isSubmitting}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign In to Workspace
        </Button>
      </form>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Don't have a workspace yet?{' '}
          <Link
            to="/register"
            className="font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors"
          >
            Register Transport Company
          </Link>
        </p>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-2">
        <Shield className="w-3.5 h-3.5 text-slate-400" />
        <span>Protected by enterprise multi-tenant isolation</span>
      </div>
    </div>
  );
};
