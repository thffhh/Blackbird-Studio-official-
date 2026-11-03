
import React, { useState } from 'react';
import {
  ShieldCheck,
  LogIn,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { memberLogin } from '../../services/api.ts';

export default function MemberLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await memberLogin({
        email: email.trim().toLowerCase(),
        password
      });

      // The backend creates a secure HttpOnly session cookie.
      window.location.href = '/member/dashboard';
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to sign in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#08080a] text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-amber-300 text-sm mb-7 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to BlackBird Studio
        </a>

        <div className="rounded-2xl border border-amber-500/20 bg-[#101014] p-6 sm:p-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-amber-400" />
            </div>
          </div>

          <div className="text-center mb-7">
            <p className="text-amber-400 text-xs font-bold tracking-[0.25em] uppercase mb-2">
              BlackBird Studio
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Member Login
            </h1>
            <p className="text-zinc-400 text-sm mt-2">
              Sign in to access your member account.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 flex gap-2 text-sm text-red-300"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="member-email"
                className="block text-sm text-zinc-300 mb-2"
              >
                Email Address
              </label>
              <input
                id="member-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-zinc-700 bg-black/40 px-4 py-3 text-white outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="member-password"
                className="block text-sm text-zinc-300 mb-2"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="member-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-zinc-700 bg-black/40 px-4 py-3 pr-12 text-white outline-none focus:border-amber-500 transition-colors"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-300"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-xs leading-relaxed text-zinc-400">
                Only administrator-approved member accounts can access the
                dashboard.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 py-3.5 font-bold text-black flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-400 mt-6">
            Don't have an account?{' '}
            <a
              href="/member/register"
              className="text-amber-400 hover:text-amber-300 font-semibold"
            >
              Register Now
            </a>
          </p>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          © {new Date().getFullYear()} BlackBird Studio. All rights reserved.
        </p>
      </div>
    </main>
  );
}
