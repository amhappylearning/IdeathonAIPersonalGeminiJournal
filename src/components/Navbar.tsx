import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  PlusCircle, 
  Lock, 
  LogOut, 
  LogIn, 
  User, 
  FileText,
  Terminal,
  Palette,
  Sun,
  Moon,
  Printer,
  Bell,
  Mail
} from 'lucide-react';
import { UserProfile } from '../types';
import { AppTheme } from './ThemeModal';

interface NavbarProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onNewEntry: () => void;
  onOpenSecurityModal: () => void;
  onOpenSparks: () => void;
  onOpenMonthlyReminder?: () => void;
  vaultLockedCount: number;
  currentTheme?: AppTheme;
  onOpenThemeModal: () => void;
  onExportPDF?: () => void;
  isPrintingPDF?: boolean;
  hasActiveEntry?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenAuth,
  onSignOut,
  onNewEntry,
  onOpenSecurityModal,
  onOpenSparks,
  onOpenMonthlyReminder,
  vaultLockedCount,
  currentTheme = 'deep-stone',
  onOpenThemeModal,
  onExportPDF,
  isPrintingPDF = false,
  hasActiveEntry = true,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-800 bg-stone-900/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand & Security Constitution Badge */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-400 shadow-inner">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold tracking-tight text-stone-100">
                Personal Gemini Journal
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3" />
                Zero-Leakage
              </span>
            </div>
            <p className="hidden text-xs text-stone-400 md:block">
              Authenticated • Multi-Turn Gemini • Isolated Cloud Firestore
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Theme Settings Button */}
          <button
            id="btn-open-theme-modal"
            onClick={onOpenThemeModal}
            className="flex items-center gap-1.5 rounded-lg border border-stone-700/80 bg-stone-800/80 px-2.5 py-2 text-xs font-medium text-stone-300 transition-colors hover:border-amber-500/40 hover:bg-stone-700 hover:text-amber-300"
            title={`Theme: ${currentTheme.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} (Click to change)`}
          >
            <Palette className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden lg:inline">
              {currentTheme === 'deep-stone'
                ? 'Deep Stone'
                : currentTheme === 'light-paper'
                ? 'Light Paper'
                : currentTheme === 'soft-blush'
                ? 'Soft Blush'
                : currentTheme === 'calm-teal'
                ? 'Calm Teal'
                : currentTheme === 'misty-sky'
                ? 'Misty Sky'
                : 'Sage Meadow'}
            </span>
          </button>

          {/* Remainders Email Button (Immediately after Themes button with Bell & Gmail logo) */}
          <button
            id="btn-monthly-reminder-config"
            onClick={onOpenMonthlyReminder}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-stone-900 to-amber-950/30 px-3 py-2 text-xs font-medium text-amber-300 shadow-sm transition-all hover:border-amber-500/70 hover:bg-amber-900/40 active:scale-95"
            title="Configure and send Reminders Email for strategic planning, meeting reflections & architecture patterns"
          >
            <Bell className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="#EA4335" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 6L12 13L2 6" stroke="#EA4335" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 18L9 12" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 18L15 12" stroke="#34A853" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 13.5L12 15L14 13.5" stroke="#FBBC05" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-semibold whitespace-nowrap">Remainders Email</span>
          </button>

          {/* Export to Printable PDF Button (Next to Theme Change) */}
          {onExportPDF && (
            <button
              id="btn-navbar-export-pdf"
              onClick={onExportPDF}
              disabled={isPrintingPDF || !hasActiveEntry}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-950/20 px-2.5 py-2 text-xs font-medium text-amber-300 transition-colors hover:border-amber-500/60 hover:bg-amber-900/30 hover:text-amber-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Export active journal entry and synthesis to printable PDF"
            >
              <Printer className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">{isPrintingPDF ? 'Preparing...' : 'Printable PDF'}</span>
            </button>
          )}

          {/* Prompt Sparks Inspiration */}
          <button
            id="btn-sparks-gallery"
            onClick={onOpenSparks}
            className="flex items-center gap-1.5 rounded-lg border border-stone-700/80 bg-stone-800/80 px-3 py-2 text-xs font-medium text-stone-300 transition-colors hover:border-amber-500/40 hover:bg-stone-700 hover:text-amber-300"
            title="Explore Inspiration Sparks & Stoic Prompts"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden md:inline">Sparks</span>
          </button>

          {/* Security Constitution & Audit Console */}
          <button
            id="btn-security-console"
            onClick={onOpenSecurityModal}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-xs font-medium text-emerald-300 transition-colors hover:border-emerald-500/60 hover:bg-emerald-900/40"
            title="Open Security Constitution & Live Audit Console"
          >
            <Terminal className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Security Constitution</span>
          </button>

          {/* New Entry Button */}
          <button
            id="btn-new-journal-entry"
            onClick={onNewEntry}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-2 text-xs font-semibold text-stone-950 shadow-md transition hover:from-amber-400 hover:to-amber-500 active:scale-95"
          >
            <PlusCircle className="h-4 w-4 text-stone-950" />
            <span>New Entry</span>
          </button>

          {/* User Profile / Auth Button */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-stone-800">
              <div 
                className="flex items-center gap-2 rounded-lg bg-stone-800/80 px-2.5 py-1.5 border border-stone-700/60"
                title={`User ID: ${user.uid} (Deterministic Isolation)`}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="h-6 w-6 rounded-full border border-stone-600 object-cover"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold">
                    {user.displayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <span className="max-w-[100px] truncate text-xs font-medium text-stone-200 hidden sm:inline">
                  {user.displayName || 'Authenticated'}
                </span>
                {user.isAnonymous && (
                  <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[10px] font-mono text-amber-300">
                    Guest
                  </span>
                )}
              </div>

              <button
                id="btn-user-signout"
                onClick={onSignOut}
                className="rounded-lg p-2 text-stone-400 hover:bg-stone-800 hover:text-rose-400 transition"
                title="Sign out securely"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              id="btn-open-auth-modal"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-800 px-3.5 py-2 text-xs font-medium text-stone-200 transition hover:border-stone-600 hover:bg-stone-700"
            >
              <LogIn className="h-4 w-4 text-amber-400" />
              <span>Sign In</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
