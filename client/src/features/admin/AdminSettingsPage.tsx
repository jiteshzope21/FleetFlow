import React, { useEffect, useState } from 'react';
import { Sliders, RefreshCw, Save, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { adminService } from '../../services/admin.service.js';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any>({
    maintenanceMode: false,
    allowSelfRegistration: true,
    defaultTrialDays: 14,
    supportEmail: 'support@fleetflow.io',
    enforcePlanLimits: true,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await adminService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await adminService.updateSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Platform Master Governance Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global SaaS controls, tenant onboarding policies, and system runtime flags.
          </p>
        </div>
        <button
          onClick={fetchSettings}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-rose-500 mb-2" />
          <p className="text-xs">Loading platform settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {savedSuccess && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Settings updated and recorded in administrative audit log.
            </div>
          )}

          {/* Registration & Trial Policies */}
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Onboarding & Trial Lifecycle
            </h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800/80 cursor-pointer text-xs">
                <div>
                  <p className="font-bold text-white">Enable Self-Service Company Registration</p>
                  <p className="text-[11px] text-slate-400">
                    Allows new carriers to sign up and provision workspaces from /register.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowSelfRegistration ?? true}
                  onChange={(e) => setSettings({ ...settings, allowSelfRegistration: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-rose-600 h-4 w-4"
                />
              </label>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1.5 text-xs">
                <label className="block text-slate-300 font-bold">Default Trial Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={settings.defaultTrialDays ?? 14}
                  onChange={(e) => setSettings({ ...settings, defaultTrialDays: Number(e.target.value) })}
                  className="w-full sm:w-48 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>
          </div>

          {/* Commercial & Capacity Controls */}
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Capacity Enforcement & Support
            </h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800/80 cursor-pointer text-xs">
                <div>
                  <p className="font-bold text-white">Strict Backend Plan Limits Enforcement</p>
                  <p className="text-[11px] text-slate-400">
                    Blocks carriers from exceeding vehicle and team user quotas defined in their tier.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enforcePlanLimits ?? true}
                  onChange={(e) => setSettings({ ...settings, enforcePlanLimits: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-rose-600 h-4 w-4"
                />
              </label>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1.5 text-xs">
                <label className="block text-slate-300 font-bold">Platform Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail || 'support@fleetflow.io'}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full sm:w-80 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Platform Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
