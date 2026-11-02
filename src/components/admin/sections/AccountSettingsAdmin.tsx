import React, { useState } from 'react';
import { adminChangePassword, adminUpdateSupabaseConfig, adminResetDefaults } from '../../../services/api.ts';
import { 
  KeyRound, 
  Database, 
  RotateCcw, 
  Check, 
  Lock, 
  ShieldCheck, 
  ExternalLink,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface AccountSettingsAdminProps {
  supabaseConfig?: {
    supabaseUrl: string;
    supabaseAnonKey: string;
    isEnabled: boolean;
  };
  onRefreshData: () => Promise<void>;
}

export const AccountSettingsAdmin: React.FC<AccountSettingsAdminProps> = ({
  supabaseConfig,
  onRefreshData
}) => {
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Supabase config state
  const [supabaseUrl, setSupabaseUrl] = useState(supabaseConfig?.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(supabaseConfig?.supabaseAnonKey || '');
  const [isSupabaseEnabled, setIsSupabaseEnabled] = useState(supabaseConfig?.isEnabled || false);
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [supabaseMsg, setSupabaseMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reset defaults state
  const [isResetting, setIsResetting] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    try {
      setPasswordLoading(true);
      await adminChangePassword(currentPassword, newPassword);
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSupabaseLoading(true);
      await adminUpdateSupabaseConfig({
        supabaseUrl: supabaseUrl.trim(),
        supabaseAnonKey: supabaseAnonKey.trim(),
        isEnabled: isSupabaseEnabled
      });
      setSupabaseMsg({ type: 'success', text: 'Supabase configuration saved!' });
    } catch (err: any) {
      setSupabaseMsg({ type: 'error', text: err.message || 'Failed to save configuration.' });
    } finally {
      setSupabaseLoading(false);
    }
  };

  const handleResetDefaults = async () => {
    const confirm = window.confirm(
      'Are you sure you want to reset all studio data, members, projects, and settings to original defaults? This will erase custom additions.'
    );
    if (!confirm) return;

    try {
      setIsResetting(true);
      await adminResetDefaults();
      await onRefreshData();
      alert('Studio website data reset to defaults successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to reset defaults');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      
      {/* Header */}
      <div className="pb-6 border-b border-zinc-800">
        <h2 className="text-xl sm:text-2xl font-heading font-black text-white uppercase tracking-wider">
          Account & Security Settings
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Manage administrator login security, external database connectors, and system reset utilities.
        </p>
      </div>

      {/* Change Password Card */}
      <div className="p-6 rounded-2xl bg-[#101015] border border-zinc-800 space-y-5">
        <div className="flex items-center gap-2 text-sm font-heading font-bold text-white uppercase tracking-wider">
          <KeyRound className="w-4 h-4 text-amber-400" />
          <span>Change Administrator Password</span>
        </div>

        {passwordMsg && (
          <div className={`p-3 rounded-xl text-xs font-medium ${
            passwordMsg.type === 'success' 
              ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300' 
              : 'bg-rose-950/60 border border-rose-500/50 text-rose-300'
          }`}>
            {passwordMsg.text}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
              New Password (min 6 characters)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            <span>Update Password</span>
          </button>
        </form>
      </div>

      {/* External Supabase Database Integration Card */}
      <div className="p-6 rounded-2xl bg-[#101015] border border-zinc-800 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-heading font-bold text-white uppercase tracking-wider">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Supabase Cloud Integration (Optional)</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-semibold uppercase">
            Built-in + Cloud Ready
          </span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed font-light">
          BlackBird Studio runs on an autonomous high-performance backend with persistent JSON disk storage. If you have an external Supabase PostgreSQL project with Supabase Auth & Storage, enter your Project URL and Anon API key below to link cloud synchronization.
        </p>

        {supabaseMsg && (
          <div className={`p-3 rounded-xl text-xs font-medium ${
            supabaseMsg.type === 'success' 
              ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300' 
              : 'bg-rose-950/60 border border-rose-500/50 text-rose-300'
          }`}>
            {supabaseMsg.text}
          </div>
        )}

        <form onSubmit={handleSaveSupabaseConfig} className="space-y-4 max-w-lg">
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
              Supabase Project URL
            </label>
            <input
              type="url"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-zinc-300 mb-1.5 block">
              Supabase Public Anon Key
            </label>
            <input
              type="text"
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          <div className="flex items-center pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isSupabaseEnabled}
                onChange={(e) => setIsSupabaseEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500"
              />
              <span className="text-xs text-zinc-200">
                Activate Supabase Sync Mode
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={supabaseLoading}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border border-zinc-700"
          >
            {supabaseLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Supabase Configuration</span>
          </button>
        </form>
      </div>

      {/* Danger Zone: Reset Defaults */}
      <div className="p-6 rounded-2xl bg-rose-950/15 border border-rose-500/30 space-y-4">
        <div className="flex items-center gap-2 text-sm font-heading font-bold text-rose-400 uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4" />
          <span>Danger Zone: Studio Reset</span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed font-light">
          Reset all members, projects, applications, and settings to the default BlackBird Studio seed data. Use this if you want to restore the clean state.
        </p>

        <button
          type="button"
          onClick={handleResetDefaults}
          disabled={isResetting}
          className="px-4 py-2 rounded-xl bg-rose-900/60 hover:bg-rose-700 text-rose-200 text-xs font-semibold uppercase tracking-wider border border-rose-700/60 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isResetting ? 'Resetting Data...' : 'Reset All Studio Data to Defaults'}</span>
        </button>
      </div>

    </div>
  );
};
