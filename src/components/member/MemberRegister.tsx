
import React, { useState } from 'react';
import { Link, ShieldCheck, UserPlus, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { memberRegister } from '../../services/api.ts';

export default function MemberRegister() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password.length < 12) {
      setError('Password must contain at least 12 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const result = await memberRegister({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password
      });

      if (result.success) {
        setRegistered(true);
      } else {
        setError(result.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#08080a] text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <a href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-amber-300 text-sm mb-7 transition-colors">
          <ArrowLeft size={16} />
          Back to BlackBird Studio
        </a>

        <div className="rounded-2xl border border-amber-500/20 bg-[#101014] p-6 sm:p-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-center justify-center">
              <UserPlus className="w-7 h-7 text-amber-400" />
            </div>
          </div>

          {!registered ? (
            <>
              <div className="text-center mb-7">
                <p className="text-amber-400 text-xs font-bold tracking-[0.25em] uppercase mb-2">
                  BlackBird Studio
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold">Create Your Account</h1>
                <p className="text-zinc-400 text-sm mt-2">
                  Join our creative community and build your voice acting portfolio.
                </p>
              </div>

              {error && (
                <div role="alert" className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 flex gap-2 text-sm text-red-300">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm text-zinc-300 mb-2">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    maxLength={120}
                    autoComplete="name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-lg border border-zinc-700 bg-black/40 px-4 py-3 text-white outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm text-zinc-300 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
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
                  <label htmlFor="password" className="block text-sm text-zinc-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={12}
                      maxLength={128}
                      autoComplete="new-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="At least 12 characters"
                      className="w-full rounded-lg border border-zinc-700 bg-black/40 px-4 py-3 pr-12 text-white outline-none focus:border-amber-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-300"
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Use at least 12 characters.
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm text-zinc-300 mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Enter your password again"
                    className="w-full rounded-lg border border-zinc-700 bg-black/40 px-4 py-3 text-white outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                  <p className="text-xs leading-relaxed text-zinc-400">
                    Your account will be reviewed by the studio administration.
                    You can access the member dashboard after approval.
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
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Create Account
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-zinc-400 mt-6">
                Already have an account?{' '}
                <a href="/member/login" className="text-amber-400 hover:text-amber-300 font-semibold">
                  Member Login
                </a>
              </p>
            </>
          ) : (
            <div className="text-center py-5">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-5" />
              <p className="text-amber-400 text-xs font-bold tracking-[0.2em] uppercase mb-2">
                Registration Complete
              </p>
              <h1 className="text-2xl font-bold mb-3">Application Submitted!</h1>
              <p className="text-zinc-400 text-sm leading-relaxed mb-5">
                Your member account has been created successfully. It is now waiting for administrator approval.
              </p>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-left mb-6">
                <p className="text-sm text-amber-300 font-semibold mb-1">What's next?</p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  The studio administration will review your registration. Once approved, you can log in and access your member dashboard.
                </p>
              </div>
              <a
                href="/member/login"
                className="block w-full rounded-lg bg-amber-500 py-3 font-bold text-black hover:bg-amber-400 transition-colors"
              >
                Continue to Member Login
              </a>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          © {new Date().getFullYear()} BlackBird Studio. All rights reserved.
        </p>
      </div>
    </main>
  );
}
