import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Zap,
  Building2,
  ShieldCheck,
  TrendingUp,
  Truck,
  Users,
  Package,
  ArrowRight,
  RefreshCw,
  Download,
  Receipt,
  Check,
  HelpCircle,
  FileText,
  Lock,
  ChevronRight,
  Calendar,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { subscriptionService, PurchaseSubscriptionPayload } from '../../services/subscription.service.js';
import {
  ISubscriptionDetailsResponse,
  ISubscriptionPlan,
  ISubscriptionPayment,
} from '../../types/index.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Alert } from '../../components/ui/Alert.js';
import { Modal } from '../../components/ui/Modal.js';
import { Breadcrumbs } from '../../components/shared/Breadcrumbs.js';
import { formatDate } from '../../lib/utils.js';

export const CompanySubscriptionPage: React.FC = () => {
  const { user, company } = useAuth();
  const [data, setData] = useState<ISubscriptionDetailsResponse | null>(null);
  const [plans, setPlans] = useState<ISubscriptionPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Billing Cycle Toggle for Plans catalog (MONTHLY vs YEARLY)
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  // Checkout Modal State
  const [selectedPlanForPurchase, setSelectedPlanForPurchase] = useState<ISubscriptionPlan | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'SIMULATED_GATEWAY'>('CREDIT_CARD');
  const [cardholderName, setCardholderName] = useState<string>(user?.name || '');
  const [cardNumber, setCardNumber] = useState<string>('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvc, setCardCvc] = useState<string>('888');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Auto-renew toggle state & Cancel modal
  const [isTogglingRenew, setIsTogglingRenew] = useState<boolean>(false);
  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Receipt Modal State
  const [receiptModalOpen, setReceiptModalOpen] = useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ISubscriptionPayment | null>(null);

  const isOwner = user?.role === 'COMPANY_OWNER' || user?.role === 'SUPER_ADMIN';

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [subDetails, availablePlans] = await Promise.all([
        subscriptionService.getCurrent(),
        subscriptionService.getPlans(),
      ]);
      setData(subDetails);
      setPlans(availablePlans);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCheckout = (plan: ISubscriptionPlan) => {
    setSelectedPlanForPurchase(plan);
    setPurchaseError(null);
    setCheckoutModalOpen(true);
  };

  const fillSandboxDetails = () => {
    setCardholderName(user?.name || 'Company Owner');
    setCardNumber('4000 1234 5678 9010');
    setCardExpiry('08/29');
    setCardCvc('321');
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForPurchase) return;

    try {
      setIsProcessingPayment(true);
      setPurchaseError(null);

      const payload: PurchaseSubscriptionPayload = {
        planId: selectedPlanForPurchase._id,
        billingCycle,
        paymentMethod,
        paymentDetails: {
          cardholderName,
          cardNumberLast4: cardNumber.replace(/\D/g, '').slice(-4) || '4242',
          cardBrand: 'Visa Business',
        },
      };

      const res = await subscriptionService.purchase(payload);
      setCheckoutModalOpen(false);
      setSuccessBanner(res.message || 'Subscription successfully activated!');
      setSelectedReceipt(res.receipt);
      setReceiptModalOpen(true);
      await fetchData();
    } catch (err: any) {
      setPurchaseError(err.response?.data?.error || err.message || 'Payment processing failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    if (!data?.subscription) return;
    try {
      setIsTogglingRenew(true);
      const nextVal = !data.subscription.autoRenew;
      await subscriptionService.toggleAutoRenew(nextVal);
      setSuccessBanner(`Auto-renewal has been ${nextVal ? 'enabled' : 'disabled'}.`);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to update auto-renewal.');
    } finally {
      setIsTogglingRenew(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setIsCancelling(true);
      await subscriptionService.cancel(cancelReason);
      setCancelModalOpen(false);
      setSuccessBanner('Auto-renewal cancelled. Your plan remains active until the end of this billing cycle.');
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to cancel subscription.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Workspace', href: '/company/profile' },
            { label: 'Subscription & Plans' },
          ]}
        />
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Loading subscription & carrier quota information...
          </p>
        </div>
      </div>
    );
  }

  const currentPlan = data?.plan;
  const currentSub = data?.subscription;
  const usage = data?.usage || { vehiclesCount: 0, usersCount: 0, shipmentsCountThisMonth: 0 };
  const limits = data?.limits || { maxVehicles: 5, maxUsers: 3, maxShipmentsPerMonth: 50 };

  const vehiclePct = Math.min(100, Math.round((usage.vehiclesCount / (limits.maxVehicles || 1)) * 100));
  const userPct = Math.min(100, Math.round((usage.usersCount / (limits.maxUsers || 1)) * 100));
  const shipmentPct = Math.min(100, Math.round((usage.shipmentsCountThisMonth / (limits.maxShipmentsPerMonth || 1)) * 100));

  return (
    <div className="space-y-8 pb-12">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Workspace', href: '/company/profile' },
          { label: 'Subscription & Plans' },
        ]}
      />

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/20">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Subscription & Carrier Quotas
                {currentSub?.status === 'TRIAL' ? (
                  <Badge variant="warning" size="sm">Trial Period</Badge>
                ) : currentSub?.status === 'ACTIVE' ? (
                  <Badge variant="success" size="sm">Active Tier</Badge>
                ) : (
                  <Badge variant="danger" size="sm">{currentSub?.status}</Badge>
                )}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage your carrier workspace tier, vehicle capacity, live dispatch allowances, and payment invoices.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          {isOwner && currentSub && (
            <Button
              variant={currentSub.autoRenew ? 'secondary' : 'primary'}
              size="sm"
              isLoading={isTogglingRenew}
              onClick={handleToggleAutoRenew}
            >
              {currentSub.autoRenew ? 'Disable Auto-Renew' : 'Enable Auto-Renew'}
            </Button>
          )}
        </div>
      </div>

      {/* Alert Notices */}
      {successBanner && (
        <Alert variant="success" title="Success" onClose={() => setSuccessBanner(null)}>
          {successBanner}
        </Alert>
      )}

      {error && (
        <Alert variant="error" title="Error">
          {error}
        </Alert>
      )}

      {!isOwner && (
        <Alert variant="warning" title="Restricted Billing Permissions">
          You are viewing the workspace subscription in read-only mode. Only the <strong>Company Owner</strong> can purchase or modify subscription plans and payment methods.
        </Alert>
      )}

      {/* Trial Countdown Banner */}
      {currentSub?.status === 'TRIAL' && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-indigo-500/10 border border-amber-300 dark:border-amber-700/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Free Trial Active &bull; {data?.daysRemaining ?? 14} Days Remaining
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                You are currently experiencing the FleetFlow carrier suite on a 14-day free trial. Your trial expires on{' '}
                <span className="font-semibold">{currentSub?.trialEndsAt ? formatDate(currentSub.trialEndsAt) : 'the scheduled date'}</span>.
                Upgrade today to guarantee uninterrupted vehicle tracking, AI analytics, and dispatching.
              </p>
            </div>
          </div>
          {isOwner && (
            <Button
              variant="primary"
              className="shrink-0 font-bold"
              onClick={() => {
                const growthPlan = plans.find((p) => p.code === 'STARTER') || plans[1] || plans[0];
                if (growthPlan) openCheckout(growthPlan);
              }}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Upgrade Now
            </Button>
          )}
        </div>
      )}

      {/* Current Plan & Quota Usage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan Overview Card */}
        <Card className="lg:col-span-1 shadow-md border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-500" />
                Active Plan Tier
              </CardTitle>
              <Badge variant={currentSub?.status === 'ACTIVE' ? 'success' : 'primary'} size="sm">
                {currentPlan?.code || 'STARTER'}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Contracted workspace billing specifications
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {currentPlan?.name || 'Growth Carrier'}
                </span>
                <span className="text-lg font-extrabold text-brand-600 dark:text-brand-400">
                  ${currentSub?.billingCycle === 'YEARLY' ? currentPlan?.priceYearly : currentPlan?.priceMonthly || 0}
                  <span className="text-xs font-medium text-slate-400">
                    /{currentSub?.billingCycle === 'YEARLY' ? 'year' : 'mo'}
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {currentPlan?.description || 'Operational multi-vehicle transport management.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Billing Cycle:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">
                  {currentSub?.billingCycle || 'MONTHLY'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Current Period End:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {currentSub?.endDate ? formatDate(currentSub.endDate) : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Auto-Renewal:</span>
                <span className={`font-bold ${currentSub?.autoRenew ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                  {currentSub?.autoRenew ? 'Active (Automatic)' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Included Tier Features */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
                Included Capabilities
              </span>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {(currentPlan?.features && currentPlan.features.length > 0
                  ? currentPlan.features
                  : [
                      'Vehicle inventory & status telemetry',
                      'Driver assignment & trip scheduling',
                      'Automated fuel & expense records',
                      'Customer freight invoices',
                    ]
                ).map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="leading-tight">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {isOwner && currentSub?.status === 'ACTIVE' && currentSub?.autoRenew && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(true)}
                  className="text-[11px] text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-semibold hover:underline"
                >
                  Cancel Plan Auto-Renewal
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Capacity Quota Meters */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-md border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Live Resource Quotas & Usage
                </CardTitle>
                <span className="text-xs text-slate-400">Real-time database enforcement</span>
              </div>
              <CardDescription className="text-xs">
                Resource utilization across your carrier company workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-6">
              {/* Vehicles Meter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <Truck className="w-4 h-4 text-brand-500" />
                    Fleet Vehicles Active
                  </span>
                  <span className="text-slate-900 dark:text-white">
                    <span className="font-bold text-sm">{usage.vehiclesCount}</span> / {limits.maxVehicles} allowed ({vehiclePct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      vehiclePct >= 90
                        ? 'bg-rose-500'
                        : vehiclePct >= 70
                        ? 'bg-amber-500'
                        : 'bg-brand-500'
                    }`}
                    style={{ width: `${vehiclePct}%` }}
                  />
                </div>
                {vehiclePct >= 80 && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    ⚠️ You are approaching your vehicle limit ({limits.maxVehicles - usage.vehiclesCount} slots remaining). Upgrade your tier to register additional trucks.
                  </p>
                )}
              </div>

              {/* Users & Team Meter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <Users className="w-4 h-4 text-indigo-500" />
                    Dispatchers & Team Members
                  </span>
                  <span className="text-slate-900 dark:text-white">
                    <span className="font-bold text-sm">{usage.usersCount}</span> / {limits.maxUsers} seats ({userPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      userPct >= 90
                        ? 'bg-rose-500'
                        : userPct >= 70
                        ? 'bg-amber-500'
                        : 'bg-indigo-500'
                    }`}
                    style={{ width: `${userPct}%` }}
                  />
                </div>
              </div>

              {/* Monthly Shipments Meter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <Package className="w-4 h-4 text-emerald-500" />
                    Shipments Created This Month
                  </span>
                  <span className="text-slate-900 dark:text-white">
                    <span className="font-bold text-sm">{usage.shipmentsCountThisMonth}</span> / {limits.maxShipmentsPerMonth} shipments ({shipmentPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      shipmentPct >= 90
                        ? 'bg-rose-500'
                        : shipmentPct >= 70
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${shipmentPct}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade Quick Tip Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-slate-800/80 dark:to-slate-800/40 border border-brand-100 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Need unlimited dispatching or dedicated telematics API?
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Higher tiers unlock predictive maintenance and enterprise AI regression modules.
                </p>
              </div>
            </div>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 text-xs font-bold"
                onClick={() => {
                  const targetPlan = plans.find((p) => p.code === 'PROFESSIONAL') || plans[plans.length - 1];
                  if (targetPlan) openCheckout(targetPlan);
                }}
              >
                Explore Enterprise
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Available Plans Selector Catalog */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Available Subscription Tiers
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select the plan that matches your transport fleet size and logistics complexity.
            </p>
          </div>

          {/* Billing Cycle Switcher */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                billingCycle === 'MONTHLY'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('YEARLY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'YEARLY'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold">
                Save ~17%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p) => {
            const isCurrent = currentSub?.planCode === p.code || currentPlan?._id === p._id;
            const price = billingCycle === 'YEARLY' ? p.priceYearly : p.priceMonthly;

            return (
              <div
                key={p._id}
                className={`relative flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 p-6 border transition-all duration-200 ${
                  isCurrent
                    ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-lg shadow-brand-500/10'
                    : p.isPopular
                    ? 'border-amber-400 dark:border-amber-500/60 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Popular or Current Badge */}
                {isCurrent ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                    Current Workspace Tier
                  </span>
                ) : p.isPopular ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                    Most Popular Choice
                  </span>
                ) : null}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">{p.name}</h3>
                    <Badge variant="secondary" size="sm">{p.code}</Badge>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[36px] line-clamp-2 mb-4">
                    {p.description}
                  </p>

                  <div className="mb-5 pb-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        ${price}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        /{billingCycle === 'YEARLY' ? 'year' : 'month'}
                      </span>
                    </div>
                    {billingCycle === 'YEARLY' && price > 0 && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                        ${Math.round(price / 12)}/month billed annually
                      </p>
                    )}
                  </div>

                  {/* Quotas Specs */}
                  <div className="space-y-2 mb-5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" /> Fleet Capacity:
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {p.maxVehicles >= 500 ? 'Unlimited' : `${p.maxVehicles} Vehicles`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> User Logins:
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {p.maxUsers >= 100 ? 'Unlimited' : `${p.maxUsers} Users`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5" /> Monthly Shipments:
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {p.maxShipmentsPerMonth.toLocaleString()} / mo
                      </span>
                    </div>
                  </div>

                  {/* Feature checklist */}
                  <div className="space-y-1.5 mb-6 text-xs text-slate-600 dark:text-slate-300">
                    {p.features?.map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-tight">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Purchase Action Button */}
                <div>
                  {isCurrent ? (
                    <Button variant="secondary" className="w-full text-xs font-bold" disabled>
                      Active Plan
                    </Button>
                  ) : (
                    <Button
                      variant={p.isPopular ? 'primary' : 'outline'}
                      className="w-full text-xs font-bold"
                      disabled={!isOwner}
                      onClick={() => openCheckout(p)}
                    >
                      {currentSub?.status === 'TRIAL'
                        ? `Upgrade to ${p.name}`
                        : `Switch to ${p.name}`}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subscription Billing & Invoice Payment History */}
      <Card className="shadow-md border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="w-4 h-4 text-brand-500" />
              Subscription Invoices & Payment Records
            </CardTitle>
            <span className="text-xs text-slate-400">Digital tax invoice archives</span>
          </div>
          <CardDescription className="text-xs">
            Download receipts and review transaction records for workspace plan purchases.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 p-0">
          {!currentSub?.payments || currentSub.payments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 italic">
              No subscription payment receipts recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Invoice #</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Plan / Description</th>
                    <th className="px-5 py-3">Billing Cycle</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Payment Method</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentSub.payments.map((pmt, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {pmt.invoiceNumber}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {formatDate(pmt.paidAt)}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                        {pmt.planName}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 capitalize">
                        {pmt.billingCycle.toLowerCase()}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                        ${pmt.amount.toFixed(2)} {pmt.currency}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 uppercase text-[11px]">
                        {pmt.paymentMethod.replace('_', ' ')}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="success" size="sm">
                          {pmt.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedReceipt(pmt);
                            setReceiptModalOpen(true);
                          }}
                          leftIcon={<FileText className="w-3.5 h-3.5" />}
                        >
                          View Receipt
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checkout / Purchase Modal */}
      <Modal
        isOpen={checkoutModalOpen}
        onClose={() => !isProcessingPayment && setCheckoutModalOpen(false)}
        title="Upgrade Carrier Subscription"
        description="Complete payment to instantly upgrade capacity and unlock new dispatching features."
        maxWidth="lg"
      >
        {selectedPlanForPurchase && (
          <form onSubmit={handlePurchaseSubmit} className="space-y-5 text-xs">
            {purchaseError && (
              <Alert variant="error" title="Checkout Error">
                {purchaseError}
              </Alert>
            )}

            {/* Order Summary Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {selectedPlanForPurchase.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 capitalize">
                    {billingCycle.toLowerCase()} billing cycle &bull; {selectedPlanForPurchase.maxVehicles} vehicles allowed
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-brand-600 dark:text-brand-400">
                    ${billingCycle === 'YEARLY' ? selectedPlanForPurchase.priceYearly : selectedPlanForPurchase.priceMonthly}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-normal">
                    {billingCycle === 'YEARLY' ? 'per year' : 'per month'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>${billingCycle === 'YEARLY' ? selectedPlanForPurchase.priceYearly : selectedPlanForPurchase.priceMonthly}.00</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Sales Tax / VAT (0%)</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>Total Due Today</span>
                <span className="text-brand-600 dark:text-brand-400">
                  ${billingCycle === 'YEARLY' ? selectedPlanForPurchase.priceYearly : selectedPlanForPurchase.priceMonthly}.00 USD
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2">
                Select Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CREDIT_CARD')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                    paymentMethod === 'CREDIT_CARD'
                      ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 font-bold ring-1 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <CreditCard className="w-4 h-4 shrink-0 text-brand-500" />
                  <div>
                    <span className="block text-xs font-bold leading-none">Credit Card</span>
                    <span className="text-[10px] text-slate-400">Visa, Mastercard, Amex</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                    paymentMethod === 'BANK_TRANSFER'
                      ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 font-bold ring-1 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0 text-indigo-500" />
                  <div>
                    <span className="block text-xs font-bold leading-none">Corporate Wire</span>
                    <span className="text-[10px] text-slate-400">ACH / Swift simulation</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Card Inputs */}
            {paymentMethod === 'CREDIT_CARD' ? (
              <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Cardholder & Billing Info
                  </span>
                  <button
                    type="button"
                    onClick={fillSandboxDetails}
                    className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline font-bold"
                  >
                    ⚡ Auto-Fill Sandbox Card
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Name on Card</label>
                  <input
                    type="text"
                    required
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 pl-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-brand-500"
                      placeholder="4242 4242 4242 4242"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-brand-500"
                      placeholder="12/28"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">CVC / Security Code</label>
                    <input
                      type="text"
                      required
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-brand-500"
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 text-slate-700 dark:text-slate-300 space-y-1.5">
                <p className="font-bold text-xs text-indigo-900 dark:text-indigo-300">
                  Instant Wire Transfer Simulation
                </p>
                <p className="text-[11px] leading-relaxed">
                  Clicking purchase below simulates automated corporate bank verification and instantly activates your tier with generated transaction ID.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCheckoutModalOpen(false)}
                disabled={isProcessingPayment}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isProcessingPayment}
                leftIcon={<Lock className="w-3.5 h-3.5" />}
              >
                {isProcessingPayment ? 'Authorizing Payment...' : `Authorize & Pay $${billingCycle === 'YEARLY' ? selectedPlanForPurchase.priceYearly : selectedPlanForPurchase.priceMonthly}`}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Digital Receipt / Tax Invoice Modal */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Subscription Payment Receipt"
        description="Official payment receipt and carrier service tax invoice"
        maxWidth="md"
      >
        {selectedReceipt && (
          <div className="space-y-5 text-xs text-slate-700 dark:text-slate-300">
            {/* Header / Receipt Stamp */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  FleetFlow <span className="text-[10px] text-brand-500 uppercase">SaaS</span>
                </span>
                <p className="text-[10px] text-slate-400">Carrier Cloud Platform & Logistics AI</p>
              </div>
              <div className="text-right">
                <Badge variant="success" size="sm">PAID &bull; SUCCEEDED</Badge>
                <p className="text-[10px] font-mono text-slate-400 mt-1">
                  {selectedReceipt.invoiceNumber}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400 text-[10px] block">Customer Organization:</span>
                <span className="font-bold text-slate-900 dark:text-white">{company?.name || 'Carrier Workspace'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Date of Payment:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatDate(selectedReceipt.paidAt)}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Payment Method:</span>
                <span className="font-bold text-slate-900 dark:text-white uppercase">{selectedReceipt.paymentMethod.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Transaction Reference:</span>
                <span className="font-mono text-slate-900 dark:text-white text-[10px]">{selectedReceipt.transactionReference}</span>
              </div>
            </div>

            {/* Line items table */}
            <table className="w-full border-t border-b border-slate-200 dark:border-slate-800 py-2">
              <thead>
                <tr className="text-slate-400 text-[10px] uppercase font-bold text-left">
                  <th className="py-1.5">Description</th>
                  <th className="py-1.5 text-center">Cycle</th>
                  <th className="py-1.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                    {selectedReceipt.planName}
                  </td>
                  <td className="py-2.5 text-center capitalize">
                    {selectedReceipt.billingCycle.toLowerCase()}
                  </td>
                  <td className="py-2.5 text-right font-black text-slate-900 dark:text-white">
                    ${selectedReceipt.amount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="font-black text-slate-900 dark:text-white">
                  <td colSpan={2} className="pt-2 text-right">Total Paid:</td>
                  <td className="pt-2 text-right text-brand-600 dark:text-brand-400">
                    ${selectedReceipt.amount.toFixed(2)} {selectedReceipt.currency}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-slate-400">
                Thank you for powering your logistics fleet with FleetFlow.
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Print / Save PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Auto-Renewal Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Auto-Renewal"
        description="Are you sure you want to stop automatic subscription renewal?"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            If you cancel auto-renewal, your workspace will maintain full access to all tier features until the end of your paid cycle ({currentSub?.endDate ? formatDate(currentSub.endDate) : 'current period'}). After that, limits will adjust to the Free Starter tier.
          </p>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1">
              Feedback or reason for cancelling (optional):
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Tell us what we could improve..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="ghost" onClick={() => setCancelModalOpen(false)}>
              Keep My Subscription
            </Button>
            <Button
              variant="danger"
              isLoading={isCancelling}
              onClick={handleCancelSubscription}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
