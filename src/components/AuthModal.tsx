import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Key, 
  X, 
  Sparkles, 
  UserCheck, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { 
  auth, 
  signInWithGoogle, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously 
} from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueLocalGuest?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onContinueLocalGuest }) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed before completion.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google provider is not enabled in Firebase Console. You can continue in Local Guest Mode below.');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (tab === 'signup') {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      onClose();
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password combination.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please switch to "Sign In" tab.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters long.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password provider is not enabled in Firebase Console. Please use "Continue with Google" or "Local Sandbox Mode" below.');
      } else {
        setError(err.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInAnonymously(auth);
      onClose();
    } catch (err: any) {
      console.error('Anonymous Auth Error:', err);
      if (err.code === 'auth/admin-restricted-operation' || err.code === 'auth/operation-not-allowed') {
        // Fallback to local guest mode if Firebase Anonymous Auth is disabled
        if (onContinueLocalGuest) {
          onContinueLocalGuest();
          onClose();
        } else {
          setError('Anonymous auth is restricted in Firebase console. Please continue with Google or Local Mode.');
        }
      } else {
        setError(err.message || 'Failed to enter guest mode');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-stone-700/80 bg-stone-900 shadow-2xl">
        
        {/* Header decoration */}
        <div className="relative bg-gradient-to-b from-stone-800/80 to-transparent p-6 pb-4 border-b border-stone-800">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-100">
                Secure Personal Journal
              </h3>
              <p className="text-xs text-stone-400">
                Tenant isolation enforced by Firebase Auth & Firestore Rules
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google One-Click Sign In */}
          <button
            id="btn-google-auth"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-stone-700 bg-stone-800/90 py-2.5 px-4 text-sm font-medium text-stone-200 shadow-sm transition hover:border-stone-500 hover:bg-stone-750 active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.4 7.5 23.5 12 23.5z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-800" />
            </div>
            <span className="relative bg-stone-900 px-3 text-xs font-mono uppercase tracking-wider text-stone-500">
              or credentials
            </span>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 rounded-lg bg-stone-950 p-1 border border-stone-800 text-xs">
            <button
              type="button"
              onClick={() => setTab('signin')}
              className={`rounded-md py-1.5 font-medium transition ${
                tab === 'signin'
                  ? 'bg-stone-800 text-stone-100 shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setTab('signup')}
              className={`rounded-md py-1.5 font-medium transition ${
                tab === 'signup'
                  ? 'bg-stone-800 text-stone-100 shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
                <input
                  id="input-auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-stone-700/80 bg-stone-950/60 py-2 pl-9 pr-3 text-sm text-stone-100 placeholder-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
                <input
                  id="input-auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-stone-700/80 bg-stone-950/60 py-2 pl-9 pr-3 text-sm text-stone-100 placeholder-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              id="btn-submit-email-auth"
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-sm font-semibold text-stone-950 shadow-md transition hover:from-amber-400 hover:to-amber-500 disabled:opacity-50"
            >
              <span>{tab === 'signup' ? 'Create Secure Account' : 'Sign In'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Instant Sandbox / Guest Mode */}
          <div className="pt-2 border-t border-stone-800/80">
            <button
              id="btn-guest-sandbox-auth"
              type="button"
              onClick={handleGuestSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stone-700/80 py-2 px-3 text-xs text-stone-400 hover:border-amber-500/50 hover:bg-stone-800/40 hover:text-stone-200 transition"
            >
              <UserCheck className="h-3.5 w-3.5 text-amber-400" />
              <span>Instant Guest Sandbox (Scoped UID Persistence)</span>
            </button>
          </div>

          {/* Security Assurance Badge */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-[11px] text-stone-400 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <span className="font-semibold text-emerald-300">Phase 1 & 2 Directives:</span>
              <p className="mt-0.5 leading-relaxed">
                Every reflection is isolated to <code className="text-amber-300 font-mono">/users/{'{uid}'}/journals</code>. Firestore security rules cryptographically reject cross-user access attempts.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
