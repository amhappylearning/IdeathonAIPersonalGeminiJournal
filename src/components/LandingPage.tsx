import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  Compass, 
  Database, 
  KeyRound, 
  ArrowRight, 
  BookOpen, 
  Layers, 
  Cpu,
  Brain,
  MessageSquare,
  FileCheck2,
  CheckCircle2
} from 'lucide-react';
import { auth, googleProvider, signInWithPopup } from '../lib/firebase';

interface LandingPageProps {
  onOpenAuthModal: () => void;
  onContinueGuest: () => void;
  onOpenThemeModal?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onOpenAuthModal, 
  onContinueGuest 
}) => {
  const [loadingGoogle, setLoadingGoogle] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setLoadingGoogle(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Landing Google Auth Error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-stone-900 text-stone-100 overflow-y-auto selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-stone-800 bg-stone-900/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="font-serif text-base font-bold text-stone-100 tracking-tight flex items-center gap-2">
              Personal Gemini Journal
              <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-300 font-normal">
                Enterprise v1.0
              </span>
            </h1>
            <p className="text-[11px] text-stone-400 hidden sm:block">
              Isolated Firestore Persistence & Multi-Turn Gemini AI Brainstorming
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-landing-top-signin"
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 rounded-xl border border-stone-700 bg-stone-800/80 px-3.5 py-1.5 text-xs font-medium text-stone-200 hover:border-stone-500 hover:bg-stone-750 transition"
          >
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            <span>Sign In</span>
          </button>
          <button
            id="btn-landing-top-google"
            onClick={handleGoogleSignIn}
            disabled={loadingGoogle}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-1.5 text-xs font-semibold text-stone-950 hover:from-amber-400 hover:to-amber-500 shadow transition disabled:opacity-50"
          >
            <span>Get Started</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Main Hero & Content Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16 max-w-6xl mx-auto w-full">
        
        {/* Security Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs text-amber-300 mb-6">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
          <span className="font-mono text-[11px]">Strict Multi-Tenant Firestore Isolation · Secret Manager Backed</span>
        </div>

        {/* Hero Title & Description */}
        <div className="text-center max-w-3xl mb-10">
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-stone-100 leading-tight">
            Your Private Thought Sanctuary & <span className="text-amber-400">Gemini AI Partner</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-stone-300 leading-relaxed max-w-2xl mx-auto">
            Engage in multi-turn intellectual dialogues, brainstorm breakthroughs, and receive automated structured syntheses. All interactions are cryptographically scoped to your private Firestore collection.
          </p>
        </div>

        {/* Auth CTA Box */}
        <div className="w-full max-w-md rounded-2xl border border-stone-700/80 bg-stone-925/80 p-6 sm:p-7 shadow-2xl backdrop-blur-md mb-12">
          
          <div className="text-center mb-5">
            <h3 className="font-serif text-lg font-bold text-stone-100">
              Sign In to Your Private Dashboard
            </h3>
            <p className="text-xs text-stone-400 mt-1">
              Secure authentication via Google or verified credentials
            </p>
          </div>

          {authError && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
              {authError}
            </div>
          )}

          {/* Primary Action: Google Sign In */}
          <button
            id="btn-hero-google-signin"
            onClick={handleGoogleSignIn}
            disabled={loadingGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-stone-600 bg-stone-800 py-3 px-4 text-sm font-medium text-stone-100 shadow-md transition hover:border-amber-500/50 hover:bg-stone-750 active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
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
            <span>{loadingGoogle ? 'Authenticating...' : 'Continue with Google'}</span>
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-800" />
            </div>
            <span className="relative bg-stone-925 px-3 text-[11px] font-mono uppercase text-stone-500">
              or options
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              id="btn-hero-email-signin"
              onClick={onOpenAuthModal}
              className="flex items-center justify-center gap-2 rounded-xl border border-stone-700 bg-stone-850/70 py-2 px-3 text-xs font-medium text-stone-300 hover:border-stone-500 hover:bg-stone-800 transition"
            >
              <KeyRound className="h-3.5 w-3.5 text-stone-400" />
              <span>Email / Password</span>
            </button>

            <button
              id="btn-hero-sandbox-mode"
              onClick={onContinueGuest}
              className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-stone-700 bg-stone-850/40 py-2 px-3 text-xs font-medium text-amber-300 hover:border-amber-500/50 hover:bg-stone-800/60 transition"
            >
              <Compass className="h-3.5 w-3.5 text-amber-400" />
              <span>Explore Sandbox</span>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-800/80 text-center">
            <p className="text-[11px] text-stone-500">
              Protected by default-deny Firestore Security Rules & Firebase ID tokens
            </p>
          </div>

        </div>

        {/* Core Tech Stack & Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          
          <div className="rounded-xl border border-stone-800 bg-stone-925/50 p-5 flex flex-col justify-between">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <h4 className="font-serif text-sm font-bold text-stone-200">Firebase Authentication</h4>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Secure OAuth identity with Google Sign-In. Zero plaintext credential exposure on the server.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              <span>Cryptographic User Scoping</span>
            </div>
          </div>

          <div className="rounded-xl border border-stone-800 bg-stone-925/50 p-5 flex flex-col justify-between">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 mb-3">
                <Database className="h-4.5 w-4.5" />
              </div>
              <h4 className="font-serif text-sm font-bold text-stone-200">Cloud Firestore Storage</h4>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Entries are strictly isolated to <code className="text-amber-300 font-mono">/users/{'{uid}'}/entries</code>. Cross-tenant reads are blocked.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              <span>Real-Time Cloud Persistence</span>
            </div>
          </div>

          <div className="rounded-xl border border-stone-800 bg-stone-925/50 p-5 flex flex-col justify-between">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 mb-3">
                <Brain className="h-4.5 w-4.5" />
              </div>
              <h4 className="font-serif text-sm font-bold text-stone-200">Gemini AI Processing</h4>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Multi-turn brainstorming with configurable intellectual personas, emotional intelligence, and reflection loops.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              <span>Adaptive Reasoning Models</span>
            </div>
          </div>

          <div className="rounded-xl border border-stone-800 bg-stone-925/50 p-5 flex flex-col justify-between">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3">
                <FileCheck2 className="h-4.5 w-4.5" />
              </div>
              <h4 className="font-serif text-sm font-bold text-stone-200">Automated AI Synthesis</h4>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Transforms conversations into core takeaways, sentiment trajectory arcs, and actionable task checklists.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              <span>Structured Executive Summaries</span>
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800 bg-stone-950/60 px-4 py-4 text-center text-xs text-stone-500">
        <p>
          Personal Gemini Journal · Backed by Google Cloud Secret Manager & Firebase Isolation
        </p>
      </footer>

    </div>
  );
};
