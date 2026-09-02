/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  signOut, 
  mapFirebaseUser, 
  subscribeToUserJournals, 
  saveJournalEntry, 
  deleteJournalEntry, 
  toggleFavoriteJournal 
} from './lib/firebase';
import { encryptJournalData, decryptJournalData } from './lib/cryptoVault';
import { exportJournalToPDF } from './lib/pdfExport';
import { JournalEntry, UserProfile, AIPersona } from './types';
import { Navbar } from './components/Navbar';
import { JournalSidebar } from './components/JournalSidebar';
import { ChatWorkspace } from './components/ChatWorkspace';
import { SynthesisView } from './components/SynthesisView';
import { AuthModal } from './components/AuthModal';
import { SecurityConsoleModal } from './components/SecurityConsoleModal';
import { PromptSparksModal } from './components/PromptSparksModal';
import { VaultPassphraseModal } from './components/VaultPassphraseModal';
import { MonthlyReminderModal } from './components/MonthlyReminderModal';
import { ThemeModal, AppTheme } from './components/ThemeModal';
import { LandingPage } from './components/LandingPage';
import { SavedIndicator } from './components/SavedIndicator';
import { 
  MessageSquare, 
  Sparkles, 
  Columns, 
  Menu, 
  ShieldCheck, 
  PlusCircle, 
  Lock,
  Compass
} from 'lucide-react';

function createNewSession(userId: string, persona: AIPersona = 'reflective'): JournalEntry {
  return {
    id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId,
    title: 'Untitled Reflection',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    persona,
    messages: [],
    tags: [],
    favorite: false,
    wordCount: 0,
    isVaultEncrypted: false,
    actionItemsCompleted: {},
  };
}

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(() => Date.now());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // View state: 'split' | 'chat' | 'synthesis'
  const [viewMode, setViewMode] = useState<'split' | 'chat' | 'synthesis'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [sparksModalOpen, setSparksModalOpen] = useState(false);
  const [monthlyReminderModalOpen, setMonthlyReminderModalOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      return (localStorage.getItem('personal_gemini_theme') as AppTheme) || 'deep-stone';
    } catch {
      return 'deep-stone';
    }
  });
  const [isPrintingPDF, setIsPrintingPDF] = useState(false);
  const [vaultModal, setVaultModal] = useState<{
    isOpen: boolean;
    mode: 'encrypt' | 'decrypt';
    targetEntry?: JournalEntry;
  }>({
    isOpen: false,
    mode: 'encrypt',
  });

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('personal_gemini_theme', theme);
    } catch (e) {
      console.error('Failed to save theme in localStorage', e);
    }
  }, [theme]);

  // Track Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const mapped = mapFirebaseUser(firebaseUser);
      setUser(mapped);
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to user's isolated Firestore collection or local storage for guests
  useEffect(() => {
    if (!user) {
      // Load local guest entries from localStorage
      try {
        const stored = localStorage.getItem('personal_gemini_guest_entries');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setEntries(parsed);
            setActiveEntry(parsed[0]);
          } else {
            const initialGuest = createNewSession('guest-session');
            setEntries([initialGuest]);
            setActiveEntry(initialGuest);
          }
        } else {
          const initialGuest = createNewSession('guest-session');
          setEntries([initialGuest]);
          setActiveEntry(initialGuest);
        }
      } catch {
        const initialGuest = createNewSession('guest-session');
        setEntries([initialGuest]);
        setActiveEntry(initialGuest);
      }
      setIsLoadingEntries(false);
      return;
    }

    if (user.uid.startsWith('local-guest-')) {
      setIsLoadingEntries(false);
      return;
    }

    setIsLoadingEntries(true);
    const unsubscribe = subscribeToUserJournals(
      user.uid,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        setIsLoadingEntries(false);

        // If no active entry, select first or initialize new
        setActiveEntry((curr) => {
          if (!curr || curr.userId !== user.uid) {
            if (fetchedEntries.length > 0) return fetchedEntries[0];
            return createNewSession(user.uid);
          }
          // Update matching active entry if changed
          const match = fetchedEntries.find((e) => e.id === curr.id);
          return match || curr;
        });
      },
      (err) => {
        console.error('Firestore Error:', err);
        setIsLoadingEntries(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Handle creating a brand new session
  const handleNewEntry = useCallback(() => {
    const currentUserId = user?.uid || 'guest-session';
    const newEntry = createNewSession(currentUserId);
    setActiveEntry(newEntry);
    setViewMode('chat');
    setSidebarOpen(false);

    if (user && !user.uid.startsWith('local-guest-')) {
      saveJournalEntry(newEntry).catch(console.error);
    } else {
      setEntries((prev) => {
        const next = [newEntry, ...prev.filter((e) => e.id !== newEntry.id)];
        try {
          localStorage.setItem('personal_gemini_guest_entries', JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  }, [user]);

  // Handler to create a dedicated Strategic Planning & Architecture journal entry
  const handleCreateStrategicArchitectureEntry = useCallback(
    async (questions?: string[]) => {
      const currentUserId = user?.uid || 'guest-session';
      const initialStrategicQuestions = questions || [
        'What key technical requirements, constraints, and trade-offs surfaced in your latest stakeholder and team meetings?',
        'Which architectural patterns (e.g., event-driven, CQRS, zero-trust security, hexagonal, micro-frontends) best address the scale and bottlenecks discussed?',
        'What are the concrete next set of actions, technical spikes, and proof-of-concepts needed to validate the architecture?',
        'How do these architectural decisions align with the long-term product roadmap and team execution velocity?'
      ];

      const newEntry: JournalEntry = {
        id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: currentUserId,
        title: `Strategic Architecture Planning & Meeting Synthesis — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        persona: 'strategist',
        messages: [
          {
            id: `msg-${Date.now()}-ai`,
            role: 'assistant',
            content: `### 🏛️ Strategic Architecture Planning & Meeting Synthesis\n\nWelcome! Let's reflect on your latest meeting discussions, brainstorm optimal architectural patterns, and crystallize high-leverage technical actions.\n\nHere are guiding questions for our session:\n${initialStrategicQuestions.map(q => `- **${q}**`).join('\n')}\n\n**To get started**: What were the most critical insights, constraints, or decisions from your latest meeting?`,
            timestamp: new Date().toISOString(),
          },
        ],
        tags: ['Architecture', 'Strategic Planning', 'Meeting Synthesis'],
        favorite: false,
        wordCount: 0,
        isVaultEncrypted: false,
        actionItemsCompleted: {},
      };

      setActiveEntry(newEntry);
      setViewMode('chat');
      setSidebarOpen(false);

      if (user && !user.uid.startsWith('local-guest-')) {
        setEntries((prev) => [newEntry, ...prev.filter((e) => e.id !== newEntry.id)]);
        saveJournalEntry(newEntry).catch(console.error);
      } else {
        setEntries((prev) => {
          const next = [newEntry, ...prev.filter((e) => e.id !== newEntry.id)];
          try {
            localStorage.setItem('personal_gemini_guest_entries', JSON.stringify(next));
          } catch {}
          return next;
        });
      }
    },
    [user]
  );

  // Handle selecting an entry from the sidebar
  const handleSelectEntry = useCallback((entry: JournalEntry) => {
    if (entry.isVaultEncrypted && entry.encryptedPayload) {
      // Prompt for passphrase to decrypt
      setVaultModal({
        isOpen: true,
        mode: 'decrypt',
        targetEntry: entry,
      });
    } else {
      setActiveEntry(entry);
      if (entry.synthesis) {
        setViewMode('split');
      } else {
        setViewMode('chat');
      }
    }
  }, []);

  // Update active entry and persist to Firestore or localStorage
  const handleUpdateEntry = useCallback(
    async (partial: Partial<JournalEntry>) => {
      if (!activeEntry) return;

      const updated: JournalEntry = {
        ...activeEntry,
        ...partial,
        userId: user?.uid || activeEntry.userId || 'guest-session',
        updatedAt: Date.now(),
      };

      setActiveEntry(updated);

      if (user && !user.uid.startsWith('local-guest-')) {
        setIsSaving(true);
        setSaveError(null);
        try {
          // If vault encrypted, ensure we encrypt payload before saving
          await saveJournalEntry(updated);
          setLastSavedAt(Date.now());
        } catch (err: any) {
          console.error('Failed to save to Firestore:', err);
          setSaveError(err?.message || 'Failed to sync with Firestore');
        } finally {
          setIsSaving(false);
        }
      } else {
        // Persist to local storage for guests
        setEntries((prev) => {
          const index = prev.findIndex((e) => e.id === updated.id);
          const next = index >= 0 ? prev.map((e) => (e.id === updated.id ? updated : e)) : [updated, ...prev];
          try {
            localStorage.setItem('personal_gemini_guest_entries', JSON.stringify(next));
          } catch {}
          return next;
        });
        setLastSavedAt(Date.now());
      }
    },
    [activeEntry, user]
  );

  // Trigger Automatic AI Synthesis & Summarization
  const handleSynthesize = useCallback(async () => {
    if (!activeEntry || activeEntry.messages.length === 0 || isSynthesizing) return;

    setIsSynthesizing(true);
    try {
      const res = await fetch('/api/gemini/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: activeEntry.messages,
          title: activeEntry.title,
          persona: activeEntry.persona,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to synthesize journal session');
      }

      const data = await res.json();
      if (data.success && data.synthesis) {
        const updatedTitle = data.synthesis.title || activeEntry.title;
        const updatedTags = Array.from(new Set([...(activeEntry.tags || []), ...(data.synthesis.tags || [])]));

        const updated: JournalEntry = {
          ...activeEntry,
          title: updatedTitle,
          synthesis: {
            ...data.synthesis,
            synthesizedAt: new Date().toISOString(),
          },
          tags: updatedTags,
          updatedAt: Date.now(),
        };

        setActiveEntry(updated);
        setViewMode('split');

        if (user && !user.uid.startsWith('local-guest-')) {
          setIsSaving(true);
          try {
            await saveJournalEntry(updated);
            setLastSavedAt(Date.now());
          } finally {
            setIsSaving(false);
          }
        } else {
          setLastSavedAt(Date.now());
        }
      }
    } catch (err: any) {
      console.error('Synthesis Error:', err);
      alert(`Synthesis error: ${err.message}`);
    } finally {
      setIsSynthesizing(false);
    }
  }, [activeEntry, isSynthesizing, user]);

  // Handle action item toggle check
  const handleToggleActionItem = useCallback(
    async (itemText: string) => {
      if (!activeEntry) return;
      const currentCompleted = { ...(activeEntry.actionItemsCompleted || {}) };
      currentCompleted[itemText] = !currentCompleted[itemText];

      const updated = {
        ...activeEntry,
        actionItemsCompleted: currentCompleted,
        updatedAt: Date.now(),
      };
      setActiveEntry(updated);

      if (user && !user.uid.startsWith('local-guest-')) {
        setIsSaving(true);
        try {
          await saveJournalEntry(updated);
          setLastSavedAt(Date.now());
        } catch (err) {
          console.error('Action item save error:', err);
        } finally {
          setIsSaving(false);
        }
      } else {
        setLastSavedAt(Date.now());
      }
    },
    [activeEntry, user]
  );

  // Delete an entry from Firestore or localStorage
  const handleDeleteEntry = useCallback(
    async (id: string) => {
      if (user && !user.uid.startsWith('local-guest-')) {
        try {
          await deleteJournalEntry(user.uid, id);
        } catch (err) {
          console.error('Delete Error:', err);
        }
      } else {
        setEntries((prev) => {
          const remaining = prev.filter((e) => e.id !== id);
          try {
            localStorage.setItem('personal_gemini_guest_entries', JSON.stringify(remaining));
          } catch {}
          return remaining;
        });
      }
      if (activeEntry?.id === id) {
        const remaining = entries.filter((e) => e.id !== id);
        if (remaining.length > 0) {
          setActiveEntry(remaining[0]);
        } else {
          handleNewEntry();
        }
      }
    },
    [user, activeEntry, entries, handleNewEntry]
  );

  // Toggle favorite
  const handleToggleFavorite = useCallback(
    async (id: string, current: boolean) => {
      if (user && !user.uid.startsWith('local-guest-')) {
        await toggleFavoriteJournal(user.uid, id, current);
      } else {
        setEntries((prev) => {
          const next = prev.map((e) => (e.id === id ? { ...e, favorite: !current } : e));
          try {
            localStorage.setItem('personal_gemini_guest_entries', JSON.stringify(next));
          } catch {}
          return next;
        });
        if (activeEntry?.id === id) {
          setActiveEntry((prev) => (prev ? { ...prev, favorite: !current } : null));
        }
      }
    },
    [user, activeEntry]
  );

  // Client-Side Vault Encryption confirm
  const handleVaultPassphraseConfirm = async (passphrase: string) => {
    if (vaultModal.mode === 'encrypt' && activeEntry) {
      try {
        const payloadToEncrypt = {
          messages: activeEntry.messages,
          synthesis: activeEntry.synthesis,
        };
        const ciphertext = await encryptJournalData(payloadToEncrypt, passphrase);

        const updated: JournalEntry = {
          ...activeEntry,
          isVaultEncrypted: true,
          encryptedPayload: ciphertext,
          updatedAt: Date.now(),
        };

        setActiveEntry(updated);
        setVaultModal({ isOpen: false, mode: 'encrypt' });

        if (user) {
          await saveJournalEntry(updated);
        }
      } catch (err: any) {
        alert(`Encryption failed: ${err.message}`);
      }
    } else if (vaultModal.mode === 'decrypt' && vaultModal.targetEntry) {
      try {
        const decrypted = await decryptJournalData(
          vaultModal.targetEntry.encryptedPayload || '',
          passphrase
        );

        const unlockedEntry: JournalEntry = {
          ...vaultModal.targetEntry,
          messages: decrypted.messages || [],
          synthesis: decrypted.synthesis || undefined,
        };

        setActiveEntry(unlockedEntry);
        setVaultModal({ isOpen: false, mode: 'decrypt' });
        if (unlockedEntry.synthesis) {
          setViewMode('split');
        } else {
          setViewMode('chat');
        }
      } catch (err: any) {
        alert(err.message || 'Incorrect passphrase');
      }
    }
  };

  // Spark selection from modal
  const handleSelectSparkPrompt = (sparkText: string) => {
    if (!activeEntry) return;
    const userMsg = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: sparkText,
      timestamp: new Date().toISOString(),
    };
    const updatedMessages = [...activeEntry.messages, userMsg];
    handleUpdateEntry({
      messages: updatedMessages,
      title: activeEntry.title === 'Untitled Reflection' ? sparkText.slice(0, 40) + '...' : activeEntry.title,
    });
  };

  // Export current entry & synthesis to Printable PDF
  const handleExportCurrentEntry = async () => {
    if (!activeEntry) return;
    setIsPrintingPDF(true);
    await exportJournalToPDF(activeEntry);
    setIsPrintingPDF(false);
  };

  const vaultLockedCount = entries.filter((e) => e.isVaultEncrypted).length;

  // If user is not signed in and auth has initialized, show Landing Page with Sign In prompt
  if (authInitialized && !user) {
    return (
      <div className="flex min-h-screen w-screen flex-col bg-stone-900 font-sans text-stone-100">
        <LandingPage
          onOpenAuthModal={() => setAuthModalOpen(true)}
          onContinueGuest={() => {
            const guestUser: UserProfile = {
              uid: `local-guest-${Date.now().toString(36)}`,
              email: null,
              displayName: 'Guest Explorer (Sandbox)',
              photoURL: null,
              isAnonymous: true,
            };
            setUser(guestUser);
          }}
          onOpenThemeModal={() => setThemeModalOpen(true)}
        />

        {/* Auth Modal on Landing Page */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onContinueLocalGuest={() => {
            const guestUser: UserProfile = {
              uid: `local-guest-${Date.now().toString(36)}`,
              email: null,
              displayName: 'Guest Explorer (Sandbox)',
              photoURL: null,
              isAnonymous: true,
            };
            setUser(guestUser);
            setAuthModalOpen(false);
          }}
        />

        <ThemeModal
          isOpen={themeModalOpen}
          onClose={() => setThemeModalOpen(false)}
          currentTheme={theme}
          onSelectTheme={(selected) => setTheme(selected)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-stone-900 font-sans text-stone-100">
      
      {/* Top Navbar */}
      <Navbar
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onSignOut={() => signOut(auth)}
        onNewEntry={handleNewEntry}
        onOpenSecurityModal={() => setSecurityModalOpen(true)}
        onOpenSparks={() => setSparksModalOpen(true)}
        onOpenMonthlyReminder={() => setMonthlyReminderModalOpen(true)}
        vaultLockedCount={vaultLockedCount}
        currentTheme={theme}
        onOpenThemeModal={() => setThemeModalOpen(true)}
        onExportPDF={handleExportCurrentEntry}
        isPrintingPDF={isPrintingPDF}
        hasActiveEntry={!!activeEntry}
      />

      {/* Main Layout Area */}
      <div className="relative flex flex-1 overflow-hidden">
        
        {/* Isolated Firestore Journal Sidebar */}
        <JournalSidebar
          entries={entries}
          activeEntryId={activeEntry?.id || null}
          onSelectEntry={handleSelectEntry}
          onNewEntry={handleNewEntry}
          onDeleteEntry={handleDeleteEntry}
          onToggleFavorite={handleToggleFavorite}
          isLoading={isLoadingEntries}
          isOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />

        {/* Center Workspace & Synthesis Panels */}
        <main className="relative flex flex-1 flex-col overflow-hidden bg-stone-900">
          
          {/* Sub-Header Toolbar (View toggles & Mobile menu) */}
          <div className="flex h-11 items-center justify-between border-b border-stone-800 bg-stone-925/80 px-4 text-xs">
            <div className="flex items-center gap-2">
              <button
                id="btn-toggle-mobile-sidebar"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-md p-1.5 text-stone-400 hover:bg-stone-800 hover:text-stone-200 md:hidden"
                title="Toggle Archive Sidebar"
              >
                <Menu className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1.5 text-stone-400 font-mono text-[11px]">
                <span className="hidden sm:inline">Path:</span>
                <span className="rounded bg-stone-850 px-2 py-0.5 text-amber-300/90 border border-stone-800">
                  /users/{user?.uid ? user.uid.substring(0, 8) + '...' : 'local'}/journals/{activeEntry?.id?.substring(0, 8) || 'new'}
                </span>
                <SavedIndicator
                  isSaving={isSaving}
                  lastSavedAt={lastSavedAt}
                  saveError={saveError}
                  compact
                  className="ml-2 hidden sm:inline-flex"
                />
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 rounded-lg bg-stone-950 p-0.5 border border-stone-800">
              <button
                id="btn-view-chat"
                onClick={() => setViewMode('chat')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition ${
                  viewMode === 'chat'
                    ? 'bg-stone-800 text-amber-300 font-semibold shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Dialogue Workspace View"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Dialogue</span>
              </button>

              {activeEntry?.synthesis && (
                <button
                  id="btn-view-synthesis"
                  onClick={() => setViewMode('synthesis')}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition ${
                    viewMode === 'synthesis'
                      ? 'bg-stone-800 text-amber-300 font-semibold shadow'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title="AI Synthesis Summary View"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Synthesis</span>
                </button>
              )}

              {activeEntry?.synthesis && (
                <button
                  id="btn-view-split"
                  onClick={() => setViewMode('split')}
                  className={`hidden md:flex items-center gap-1 rounded-md px-2.5 py-1 transition ${
                    viewMode === 'split'
                      ? 'bg-stone-800 text-amber-300 font-semibold shadow'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title="Side-by-side Dialogue & Synthesis"
                >
                  <Columns className="h-3.5 w-3.5" />
                  <span>Split View</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Workspace View Rendering */}
          <div className="flex flex-1 overflow-hidden">
            {activeEntry ? (
              <>
                {/* Chat Column */}
                {(viewMode === 'chat' || viewMode === 'split') && (
                  <div className={`flex flex-col h-full overflow-hidden ${
                    viewMode === 'split' ? 'w-full md:w-1/2 border-r border-stone-800' : 'w-full'
                  }`}>
                    <ChatWorkspace
                      entry={activeEntry}
                      onUpdateEntry={handleUpdateEntry}
                      onSynthesize={handleSynthesize}
                      isSynthesizing={isSynthesizing}
                      onOpenVaultPassphrase={() => setVaultModal({ isOpen: true, mode: 'encrypt' })}
                      onToggleVaultLock={() => {
                        if (activeEntry.isVaultEncrypted) {
                          // Already encrypted
                          alert('This reflection is protected with AES-GCM Vault Encryption.');
                        } else {
                          setVaultModal({ isOpen: true, mode: 'encrypt' });
                        }
                      }}
                      onOpenSparks={() => setSparksModalOpen(true)}
                      isSaving={isSaving}
                      lastSavedAt={lastSavedAt}
                      saveError={saveError}
                    />
                  </div>
                )}

                {/* Synthesis Column */}
                {activeEntry.synthesis && (viewMode === 'synthesis' || viewMode === 'split') && (
                  <div className={`flex flex-col h-full overflow-y-auto p-4 sm:p-6 ${
                    viewMode === 'split' ? 'w-full md:w-1/2 bg-stone-925/40' : 'w-full max-w-5xl mx-auto'
                  }`}>
                    <SynthesisView
                      synthesis={activeEntry.synthesis}
                      entry={activeEntry}
                      onToggleActionItem={handleToggleActionItem}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-stone-500">
                <Compass className="h-12 w-12 text-stone-700 mb-3" />
                <h3 className="font-serif text-lg font-bold text-stone-300">
                  Welcome to Personal Gemini Journal
                </h3>
                <p className="mt-1 text-xs text-stone-500 max-w-sm">
                  Sign in to persist reflections in your private, isolated Cloud Firestore vault.
                </p>
                <button
                  onClick={handleNewEntry}
                  className="mt-4 flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-stone-950 hover:bg-amber-400 shadow-md transition"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Start New Reflection</span>
                </button>
              </div>
            )}
          </div>

        </main>
      </div>

      {/* MODALS */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onContinueLocalGuest={() => {
          const guestUser: UserProfile = {
            uid: `local-guest-${Date.now().toString(36)}`,
            email: null,
            displayName: 'Guest Journaler (Local Sandbox)',
            photoURL: null,
            isAnonymous: true,
          };
          setUser(guestUser);
          setAuthModalOpen(false);
        }}
      />

      <SecurityConsoleModal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
        user={user}
      />

      <PromptSparksModal
        isOpen={sparksModalOpen}
        onClose={() => setSparksModalOpen(false)}
        onSelectSpark={handleSelectSparkPrompt}
      />

      <VaultPassphraseModal
        isOpen={vaultModal.isOpen}
        onClose={() => setVaultModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleVaultPassphraseConfirm}
        mode={vaultModal.mode}
        title={vaultModal.mode === 'encrypt' ? 'Secure Entry with AES-GCM-256' : 'Unlock Encrypted Vault Entry'}
      />

      <MonthlyReminderModal
        isOpen={monthlyReminderModalOpen}
        onClose={() => setMonthlyReminderModalOpen(false)}
        user={user}
        onCreateArchitectureJournal={handleCreateStrategicArchitectureEntry}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      <ThemeModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
        currentTheme={theme}
        onSelectTheme={(selected) => setTheme(selected)}
      />

    </div>
  );
}
