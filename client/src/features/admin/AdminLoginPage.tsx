import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, KeyRound, Eye, EyeOff, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { adminService } from '../../services/admin.service.js';

export const AdminLoginPage: React.FC = () => {
  const { login, logout, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Bootstrap Mode State
  const [showBootstrap, setShowBootstrap] = useState(false);
  const [bootstrapName, setBootstrapName] = useState('Chief Platform Administrator');
  const [bootstrapSecret, setBootstrapSecret] = useState('');
  const [showBootstrapSecret, setShowBootstrapSecret] = useState(false);

  // Auto-redirect if already authenticated as Super Admin
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      navigate('/admin');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const loggedUser = await login(email.trim(), password);
      if (loggedUser && loggedUser.role !== 'SUPER_ADMIN') {
        // Reject ordinary company users trying to use admin login
        await logout();
        setError('Access Denied: This account does not possess Super Administrator privileges. Please use the carrier workspace login.');
        return;
      }

      navigate('/admin');
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Administrative authentication failed. Please verify credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await adminService.bootstrapAdmin({
        email: email.trim(),
        password,
        name: bootstrapName.trim(),
        setupSecret: bootstrapSecret.trim() || undefined,
      });

      localStorage.setItem('fleetflow_token', res.accessToken);
      // Hard reload to refresh full session and load admin console
      window.location.href = '/admin';
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          'Super Admin bootstrap failed. Please verify the setup secret key.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-rose-500 selection:text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 via-amber-600 to-indigo-600 text-white shadow-xl shadow-rose-950/50">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            FleetFlow Platform Administration
          </h1>
          <p className="text-xs text-slate-400">
            Restricted platform administration portal. Authorized personnel only.
          </p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-bold">Access Denied</p>
                <p className="mt-0.5 text-[11px] leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {!showBootstrap ? (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                  Administrator Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="admin@fleetflow.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                  Master Security Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-rose-950/40"
              >
                {loading ? 'Authenticating...' : 'Sign In to Platform Console'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <Link to="/login" className="hover:text-slate-300 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Carrier Workspace Login</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setShowBootstrap(true);
                  }}
                  className="hover:text-rose-400 text-slate-400 font-medium"
                >
                  Bootstrap Admin?
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleBootstrap} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[11px] leading-relaxed">
                <KeyRound className="w-4 h-4 inline mr-1.5 text-amber-400" />
                Initialize primary Super Admin identity if no administrative account exists.
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Administrator Full Name</label>
                <input
                  type="text"
                  required
                  value={bootstrapName}
                  onChange={(e) => setBootstrapName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Administrative Email</label>
                <input
                  type="email"
                  required
                  placeholder="admin@fleetflow.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Create Secure Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Setup Secret Key <span className="text-slate-500 font-normal">(required if admin exists)</span>
                </label>
                <div className="relative">
                  <input
                    type={showBootstrapSecret ? 'text' : 'password'}
                    placeholder="ADMIN_SETUP_SECRET from .env"
                    value={bootstrapSecret}
                    onChange={(e) => setBootstrapSecret(e.target.value)}
                    className="w-full p-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBootstrapSecret(!showBootstrapSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showBootstrapSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setShowBootstrap(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
                >
                  Back to Sign In
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors disabled:opacity-50"
                >
                  {loading ? 'Bootstrapping...' : 'Initialize Root Admin'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-600">
          FleetFlow AI-Powered Transport & Fleet Management Platform &bull; v1.0.0
        </p>
      </div>
    </div>
  );
};
