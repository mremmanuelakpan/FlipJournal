import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { signUpUser, signInUser, resetPasswordForEmail, AuthUser } from '../services/storage';

import { Theme } from '../types/journal';
import { getTheme } from '../utils/theme';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
  theme?: Theme;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess, theme = 'forest' }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const themeConfig = getTheme(theme);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!email.trim() || !password || !displayName.trim()) {
          setErrorMsg('Please complete all required fields.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Password should be at least 6 characters long.');
          setLoading(false);
          return;
        }

        const res = await signUpUser(email, password, displayName);
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.user) {
          onAuthSuccess(res.user);
          onClose();
        }
      } else if (mode === 'signin') {
        if (!email.trim() || !password) {
          setErrorMsg('Please provide both email and password.');
          setLoading(false);
          return;
        }

        const res = await signInUser(email, password);
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.user) {
          onAuthSuccess(res.user);
          onClose();
        }
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          setErrorMsg('Please enter your email address.');
          setLoading(false);
          return;
        }

        const res = await resetPasswordForEmail(email);
        setSuccessMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div
        className="border-2 border-[#c5a66a]/70 rounded-2xl max-w-md w-full p-6 sm:p-8 text-stone-200 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] relative transition-all duration-500 overflow-hidden"
        style={themeConfig.bookCoverStyle}
      >
        {/* Embossed inner gold frame accent matching book cover */}
        <div className="absolute inset-1.5 sm:inset-2 rounded-xl border border-[#c5a66a]/30 pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#dfc187]/80 hover:text-white transition-colors p-1.5 z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-[#c5a66a]/50 bg-black/30 mb-2">
            <Sparkles className="w-5 h-5 text-[#dfc187]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-amber-100 uppercase tracking-wider">
            {mode === 'signin' && 'Sign in to Flip Journal'}
            {mode === 'signup' && 'Create Your Flip Journal'}
            {mode === 'forgot' && 'Account Recovery'}
          </h2>
          <p className="font-cormorant italic text-sm text-[#f3e5c8]/90 mt-1">
            by Emmanuel Akpan · Private, secure & RLS protected
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded bg-rose-950/80 border border-rose-700/60 text-rose-200 text-xs">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 text-xs">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs uppercase font-cinzel text-[#dfc187] mb-1">
                Your Name / Pen Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full bg-black/40 border border-stone-600 rounded px-3 py-2 pl-9 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-[#dfc187]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase font-cinzel text-[#dfc187] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-black/40 border border-stone-600 rounded px-3 py-2 pl-9 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-[#dfc187]"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs uppercase font-cinzel text-[#dfc187]">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-[#dfc187]/80 hover:text-white underline cursor-pointer"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-stone-600 rounded px-3 py-2 pl-9 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-[#dfc187]"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded text-xs font-cinzel font-semibold tracking-wider text-stone-900 bg-gradient-to-r from-[#dfc187] via-[#c5a66a] to-[#dfc187] hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span>Processing…</span>
            ) : (
              <>
                <span>
                  {mode === 'signin' && 'Open My Journal'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Send Reset Instructions'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-stone-700/60 text-center text-xs text-stone-400">
          {mode === 'signin' ? (
            <p>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-[#dfc187] font-semibold hover:underline cursor-pointer"
              >
                Create one now
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-[#dfc187] font-semibold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
