import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { Alert } from '../../components/ui/Alert.js';
import { api } from '../../lib/api.js';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setServerError(null);
      const res = await api.post('/auth/forgot-password', data);
      setSuccessMessage(res.data.message);
      if (res.data?.data?.devResetToken) {
        setDevToken(res.data.data.devResetToken);
      }
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Failed to process request.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to sign in</span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Reset password
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Enter your registered email address to receive password reset instructions.
        </p>
      </div>

      {serverError && (
        <Alert variant="error" title="Error">
          {serverError}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" title="Request Processed">
          {successMessage}
        </Alert>
      )}

      {devToken && (
        <Alert variant="info" title="Development Mode Helper">
          <p className="mb-2">Free SMTP email delivery is unconfigured. A direct reset token was generated:</p>
          <Link
            to={`/reset-password?token=${devToken}`}
            className="font-bold underline text-brand-600 dark:text-brand-400 break-all"
          >
            Click here to reset your password with token
          </Link>
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

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isSubmitting}
          leftIcon={<KeyRound className="w-4 h-4" />}
        >
          Send Reset Instructions
        </Button>
      </form>
    </div>
  );
};
