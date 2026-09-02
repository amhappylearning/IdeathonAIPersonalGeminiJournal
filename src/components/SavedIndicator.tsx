import React, { useState, useEffect } from 'react';
import { Check, RefreshCw, Cloud, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SavedIndicatorProps {
  isSaving: boolean;
  lastSavedAt: number | null;
  saveError?: string | null;
  className?: string;
  compact?: boolean;
}

export const SavedIndicator: React.FC<SavedIndicatorProps> = ({
  isSaving,
  lastSavedAt,
  saveError = null,
  className = '',
  compact = false,
}) => {
  const [justSaved, setJustSaved] = useState(false);
  const [timeAgoText, setTimeAgoText] = useState<string>('Saved');

  // Trigger brief 'just saved' pulse whenever isSaving changes from true to false with a valid timestamp
  useEffect(() => {
    if (!isSaving && lastSavedAt) {
      setJustSaved(true);
      const timer = setTimeout(() => {
        setJustSaved(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isSaving, lastSavedAt]);

  // Update relative time string
  useEffect(() => {
    if (!lastSavedAt) {
      setTimeAgoText('Saved');
      return;
    }

    const updateRelativeTime = () => {
      const diffSec = Math.floor((Date.now() - lastSavedAt) / 1000);
      if (diffSec < 5) {
        setTimeAgoText('Saved just now');
      } else if (diffSec < 60) {
        setTimeAgoText(`Saved ${diffSec}s ago`);
      } else {
        const date = new Date(lastSavedAt);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setTimeAgoText(`Saved at ${timeStr}`);
      }
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 5000);
    return () => clearInterval(interval);
  }, [lastSavedAt]);

  if (saveError) {
    return (
      <div 
        id="status-firestore-error"
        className={`inline-flex items-center gap-1.5 rounded-md bg-rose-950/40 px-2 py-0.5 text-[11px] font-mono text-rose-300 border border-rose-500/30 ${className}`}
        title={`Sync error: ${saveError}`}
      >
        <AlertCircle className="h-3 w-3 text-rose-400 shrink-0" />
        <span>Sync Error</span>
      </div>
    );
  }

  return (
    <div 
      id="status-firestore-saved-indicator"
      className={`inline-flex items-center gap-1.5 select-none transition-all duration-200 ${className}`}
      title={lastSavedAt ? `Synchronized to Firestore (${new Date(lastSavedAt).toLocaleString()})` : 'Firestore sync ready'}
    >
      <AnimatePresence mode="wait">
        {isSaving ? (
          <motion.div
            key="saving"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-mono text-amber-300 border border-amber-500/25"
          >
            <RefreshCw className="h-2.5 w-2.5 animate-spin text-amber-400 shrink-0" />
            <span>{compact ? 'Syncing...' : 'Syncing to Firestore...'}</span>
          </motion.div>
        ) : (
          <motion.div
            key="saved"
            initial={{ opacity: 0, y: 1 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-mono transition-colors duration-300 ${
              justSaved 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10' 
                : 'bg-stone-850/70 text-stone-400 border border-stone-750 hover:text-stone-300'
            }`}
          >
            <motion.span
              animate={justSaved ? { scale: [1, 1.25, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center"
            >
              <Check className={`h-3 w-3 shrink-0 ${justSaved ? 'text-emerald-400' : 'text-emerald-500/80'}`} />
            </motion.span>
            <span className="whitespace-nowrap">
              {compact ? (justSaved ? 'Saved' : timeAgoText) : timeAgoText}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
