import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Send, 
  AlertCircle, 
  X, 
  Layers, 
  Clock, 
  ExternalLink,
  RefreshCw,
  Bell,
  FilePlus,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MonthlyReminderConfig, UserProfile } from '../types';
import { 
  FRAMEWORKS, 
  sendMonthlyReminderEmailViaGmail, 
  generateReminderEmailHtml 
} from '../lib/gmailReminderService';
import { 
  getReminderConfig, 
  saveReminderConfig, 
  getCachedGoogleAccessToken, 
  signInWithGoogle 
} from '../lib/firebase';

interface MonthlyReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onCreateArchitectureJournal?: (promptQuestions: string[]) => void;
}

export const MonthlyReminderModal: React.FC<MonthlyReminderModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenAuth,
  onCreateArchitectureJournal,
}) => {
  const [enabled, setEnabled] = useState(true);
  const [recipientEmail, setRecipientEmail] = useState(user?.email || '');
  const [dayOfMonth, setDayOfMonth] = useState<number>(15);
  const [selectedFramework, setSelectedFramework] = useState<
    'architecture-planning' | 'swot' | 'okr' | 'eisenhower' | 'first-principles' | 'four-burners'
  >('architecture-planning');
  const [includeQuestions, setIncludeQuestions] = useState(true);
  
  // Status states
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'config' | 'preview'>('config');

  // Confirmation dialog state for explicit user approval before mutating/sending
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);

  // Load existing configuration from Firestore for authenticated user
  useEffect(() => {
    if (!isOpen) return;
    
    if (user?.email) {
      setRecipientEmail(user.email);
    }

    // Load local storage cached preferences first
    try {
      const raw = localStorage.getItem(`reminder_config_${user?.uid}`) || localStorage.getItem('local_monthly_reminder_config');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed) {
          setEnabled(parsed.enabled ?? true);
          if (parsed.recipientEmail) setRecipientEmail(parsed.recipientEmail);
          if (parsed.dayOfMonth) setDayOfMonth(parsed.dayOfMonth);
          if (parsed.strategicFramework) setSelectedFramework(parsed.strategicFramework);
          if (typeof parsed.includePromptQuestions === 'boolean') {
            setIncludeQuestions(parsed.includePromptQuestions);
          }
        }
      }
    } catch {}

    if (user?.uid && !user.uid.startsWith('local-guest-')) {
      setIsLoadingConfig(true);
      getReminderConfig(user.uid)
        .then((config) => {
          if (config) {
            setEnabled(config.enabled ?? true);
            if (config.recipientEmail && config.recipientEmail.includes('@')) {
              setRecipientEmail(config.recipientEmail);
            }
            if (config.dayOfMonth) setDayOfMonth(config.dayOfMonth);
            if (config.strategicFramework) setSelectedFramework(config.strategicFramework);
            if (typeof config.includePromptQuestions === 'boolean') {
              setIncludeQuestions(config.includePromptQuestions);
            }
          }
        })
        .catch(() => {
          // Gracefully continue with local defaults or cached config
        })
        .finally(() => setIsLoadingConfig(false));
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const currentFramework = FRAMEWORKS[selectedFramework] || FRAMEWORKS['swot'];

  const handleSaveSettings = async () => {
    setErrorMessage(null);
    setSendSuccessMsg(null);

    if (!recipientEmail || !recipientEmail.includes('@')) {
      setErrorMessage('Please enter a valid participant email address.');
      return;
    }

    const config: MonthlyReminderConfig = {
      enabled,
      recipientEmail: recipientEmail.trim(),
      dayOfMonth: Number(dayOfMonth) || 15,
      sendTime: '09:00',
      strategicFramework: selectedFramework,
      includePromptQuestions: includeQuestions,
      lastSentAt: Date.now(),
      lastSentStatus: 'configured',
    };

    if (user && !user.uid.startsWith('local-guest-')) {
      setIsSavingConfig(true);
      try {
        await saveReminderConfig(user.uid, config);
        setSendSuccessMsg('Preferences saved! You will receive reminders on the 15th of each month.');
        setTimeout(() => setSendSuccessMsg(null), 4000);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to save reminder preferences.');
      } finally {
        setIsSavingConfig(false);
      }
    } else {
      // Local session saving
      try {
        localStorage.setItem('local_monthly_reminder_config', JSON.stringify(config));
        setSendSuccessMsg('Reminder schedule saved for this participant session.');
        setTimeout(() => setSendSuccessMsg(null), 4000);
      } catch {}
    }
  };

  const handleSendReminderNow = async () => {
    setConfirmSendOpen(false);
    setErrorMessage(null);
    setSendSuccessMsg(null);
    setIsSendingTest(true);

    try {
      const result = await sendMonthlyReminderEmailViaGmail({
        recipientEmail: recipientEmail.trim(),
        frameworkKey: selectedFramework,
        dayOfMonth: 15,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to send reminder email.');
      } else {
        setSendSuccessMsg(`Reminder email successfully sent to ${recipientEmail} via Gmail (ID: ${result.messageId})!`);
        
        // Update lastSent in config
        if (user && !user.uid.startsWith('local-guest-')) {
          saveReminderConfig(user.uid, {
            enabled,
            recipientEmail: recipientEmail.trim(),
            dayOfMonth: 15,
            sendTime: '09:00',
            strategicFramework: selectedFramework,
            includePromptQuestions: includeQuestions,
            lastSentAt: Date.now(),
            lastSentStatus: `Sent via Gmail (${result.messageId})`,
          }).catch(console.error);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while communicating with Gmail.');
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-stone-700/80 bg-stone-900 shadow-2xl my-8"
      >
        {/* Header */}
        <div className="relative border-b border-stone-800 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 p-6 pb-4">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-inner">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-stone-100">
                  Monthly Strategic Journal Reminder
                </h3>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-medium text-amber-300 border border-amber-500/30">
                  15th of Every Month
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Automated Gmail notification delivering custom framework prompts directly to the participant.
              </p>
            </div>
          </div>

          {/* Tab navigation: Config vs Email Preview */}
          <div className="mt-4 flex gap-2 border-t border-stone-800/80 pt-3">
            <button
              onClick={() => setPreviewTab('config')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                previewTab === 'config'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                  : 'text-stone-400 hover:bg-stone-800 hover:text-stone-300'
              }`}
            >
              Configuration &amp; Schedule
            </button>
            <button
              onClick={() => setPreviewTab('preview')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                previewTab === 'preview'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                  : 'text-stone-400 hover:bg-stone-800 hover:text-stone-300'
              }`}
            >
              <span>Email Template Preview</span>
              <Sparkles className="h-3 w-3 text-amber-400" />
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {errorMessage && (
          <div className="m-6 mb-0 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {sendSuccessMsg && (
          <div className="m-6 mb-0 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-xs text-emerald-300">
            <Check className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <div className="flex-1">
              <span>{sendSuccessMsg}</span>
            </div>
            <button onClick={() => setSendSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {previewTab === 'config' ? (
            <>
              {/* Enable Switch */}
              <div className="flex items-center justify-between rounded-xl bg-stone-850 p-4 border border-stone-750">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-semibold text-stone-200">
                      Enable 15th-of-Month Notification
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Sends a strategic framework prompt to your registered Gmail address on the 15th.
                  </p>
                </div>
                <button
                  id="toggle-reminder-enabled"
                  type="button"
                  onClick={() => setEnabled(!enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enabled ? 'bg-amber-500' : 'bg-stone-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-stone-950 transition-transform ${
                      enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Recipient Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-amber-400" />
                  <span>Participant Registered Email</span>
                </label>
                <input
                  id="input-reminder-recipient"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="participant@example.com"
                  className="w-full rounded-xl border border-stone-700 bg-stone-850 px-3.5 py-2.5 text-sm text-stone-100 placeholder-stone-500 focus:border-amber-500/70 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
                <p className="text-[11px] text-stone-400">
                  Defaulted to your registered account ({user?.email || 'ankitamalik22@gmail.com'}).
                </p>
              </div>

              {/* Schedule Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-amber-400" />
                    <span>Cadence Day</span>
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-stone-700 bg-stone-850 px-3 py-2 text-sm text-stone-200">
                    <span className="font-mono text-amber-400 font-bold">15th</span>
                    <span className="text-xs text-stone-400">of every month (Midpoint Checkpoint)</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    <span>Dispatch Time</span>
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-stone-700 bg-stone-850 px-3 py-2 text-sm text-stone-200">
                    <span className="font-mono text-amber-400 font-bold">09:00 AM</span>
                    <span className="text-xs text-stone-400">Local Time</span>
                  </div>
                </div>
              </div>

              {/* Strategic Framework Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-amber-400" />
                  <span>Strategic Framework Focus</span>
                </label>
                
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { key: 'architecture-planning', name: 'Strategic Architectural Patterns & Meeting Synthesis', tag: 'Reflect Back, Brainstorm & Action Planning', recommended: true },
                    { key: 'swot', name: 'Strategic SWOT Analysis', tag: 'High-Leverage Audit', recommended: false },
                    { key: 'okr', name: 'OKR Progress Review', tag: 'Milestone Tracking', recommended: false },
                    { key: 'eisenhower', name: 'Eisenhower Matrix & Priority Focus', tag: 'Priority Optimization', recommended: false },
                    { key: 'first-principles', name: 'First-Principles Deconstruction', tag: 'Bedrock Reasoning', recommended: false },
                    { key: 'four-burners', name: 'Four Burners Theory', tag: 'Holistic Energy Audit', recommended: false },
                  ].map((fw) => (
                    <button
                      key={fw.key}
                      type="button"
                      onClick={() => setSelectedFramework(fw.key as any)}
                      className={`flex flex-col text-left p-3 rounded-xl border transition ${
                        selectedFramework === fw.key
                          ? 'border-amber-500/60 bg-amber-500/10 text-stone-100 shadow-sm ring-1 ring-amber-500/30'
                          : 'border-stone-750 bg-stone-850 text-stone-300 hover:border-stone-650 hover:bg-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs text-stone-100">{fw.name}</span>
                          {fw.recommended && (
                            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase text-amber-300 border border-amber-500/30">
                              Recommended
                            </span>
                          )}
                        </div>
                        {selectedFramework === fw.key && (
                          <Check className="h-3.5 w-3.5 text-amber-400" />
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-amber-400/80 mt-0.5">{fw.tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Guiding Questions Preview Card */}
              <div className="rounded-xl border border-stone-750 bg-stone-850/60 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-300">
                    {currentFramework.title}
                  </span>
                  <span className="text-[10px] text-stone-400">Included in Email &amp; Journal</span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  {currentFramework.description}
                </p>
                <div className="border-t border-stone-800 pt-2 space-y-1">
                  {currentFramework.guidingQuestions.map((q, i) => (
                    <div key={i} className="text-[11px] text-stone-400 flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold">&bull;</span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>

                {/* Direct quick action: Launch Architecture Journal Entry */}
                <div className="pt-2 border-t border-stone-800 flex justify-end">
                  <button
                    type="button"
                    id="btn-create-strategic-entry"
                    onClick={() => {
                      if (onCreateArchitectureJournal) {
                        onCreateArchitectureJournal(currentFramework.guidingQuestions);
                        onClose();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 px-3 py-1.5 text-xs text-amber-300 border border-amber-500/30 font-medium transition active:scale-95"
                  >
                    <FilePlus className="h-3.5 w-3.5 text-amber-400" />
                    <span>
                      {selectedFramework === 'architecture-planning' 
                        ? 'Start Strategic Architecture Journal Now' 
                        : 'Start Journal Entry with this Framework'
                      }
                    </span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Email HTML Visual Preview */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-400 px-1">
                <span>Subject: [15th of the Month] Strategic Journal Reminder: {currentFramework.title}</span>
                <span className="font-mono text-amber-400">To: {recipientEmail || 'participant@example.com'}</span>
              </div>
              <div className="rounded-xl border border-stone-700 bg-stone-950 p-4 space-y-4 shadow-inner text-stone-200">
                <div className="border-b border-stone-800 pb-3">
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-mono text-amber-300 font-semibold border border-amber-500/30">
                    Monthly Strategic Checkpoint &bull; 15th of the Month
                  </span>
                  <h4 className="font-serif text-base font-bold text-stone-100 mt-2">
                    Time for Your Monthly Strategic Journal
                  </h4>
                  <p className="text-xs text-stone-400 mt-1">
                    Greetings, {recipientEmail}! Today is the 15th — the midpoint of the month. Take 15 minutes to step back and calibrate.
                  </p>
                </div>

                <div className="rounded-lg bg-stone-900 border border-stone-800 p-3 space-y-2">
                  <h5 className="text-xs font-semibold text-amber-400">{currentFramework.title}</h5>
                  <p className="text-xs text-stone-300">{currentFramework.description}</p>
                  
                  <div className="space-y-1 pt-1">
                    <p className="text-[10px] font-mono uppercase text-amber-300/80 font-bold">Guiding Prompt Questions:</p>
                    {currentFramework.guidingQuestions.map((q, idx) => (
                      <div key={idx} className="text-xs text-stone-300 pl-2 border-l-2 border-amber-500/40">
                        {q}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center pt-2">
                  <span className="inline-block rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-stone-950 shadow-md">
                    Open Personal Gemini Journal &rarr;
                  </span>
                  <p className="text-[10px] text-stone-500 mt-1.5">
                    {currentFramework.actionPrompt}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-800 bg-stone-850 p-4 px-6">
          <div className="flex items-center gap-2">
            <button
              id="btn-trigger-test-email"
              type="button"
              onClick={() => setConfirmSendOpen(true)}
              disabled={isSendingTest || isSavingConfig}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20 active:scale-95 disabled:opacity-50"
              title="Send a sample reminder to your Gmail immediately"
            >
              {isSendingTest ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-400" />
                  <span>Sending via Gmail...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 text-amber-400" />
                  <span>Send Reminder Email Now</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-750 px-4 py-2 text-xs font-medium text-stone-300 hover:bg-stone-800 transition"
            >
              Close
            </button>
            <button
              id="btn-save-reminder-settings"
              type="button"
              onClick={handleSaveSettings}
              disabled={isSavingConfig}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-stone-950 shadow-md transition hover:from-amber-400 hover:to-amber-500 active:scale-95 disabled:opacity-50"
            >
              {isSavingConfig ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-stone-950" />
                  <span>Saving Schedule...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 text-stone-950" />
                  <span>Save 15th-of-Month Schedule</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Mandatory User Confirmation Dialog before triggering email dispatch */}
      <AnimatePresence>
        {confirmSendOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-stone-700 bg-stone-900 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-serif text-base font-bold text-stone-100">
                    Confirm Email Dispatch
                  </h4>
                  <p className="text-xs text-stone-400">
                    Verify sending reminder via your authorized Gmail account
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-stone-850 p-3.5 text-xs text-stone-300 border border-stone-750 space-y-2">
                <p>
                  You are about to dispatch a strategic framework reminder to:
                </p>
                <div className="font-mono text-amber-300 font-semibold bg-stone-900 p-2 rounded-lg border border-stone-800 truncate">
                  {recipientEmail || user?.email}
                </div>
                <div className="text-[11px] text-stone-400">
                  <strong>Framework:</strong> {currentFramework.title}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmSendOpen(false)}
                  className="rounded-xl border border-stone-750 px-4 py-2 text-xs font-medium text-stone-300 hover:bg-stone-800 transition"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-send-reminder"
                  type="button"
                  onClick={handleSendReminderNow}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-stone-950 shadow hover:bg-amber-400 transition active:scale-95"
                >
                  <Send className="h-3.5 w-3.5 text-stone-950" />
                  <span>Confirm &amp; Send</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
