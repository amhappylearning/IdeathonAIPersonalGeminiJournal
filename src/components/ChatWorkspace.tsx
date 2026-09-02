import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Lock, 
  Unlock, 
  Lightbulb, 
  Compass, 
  Cpu, 
  ShieldCheck, 
  Clock, 
  Layers, 
  HelpCircle,
  Copy,
  Check,
  Zap,
  Flame,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, JournalEntry, AIPersona, EntrySynthesis } from '../types';
import { SavedIndicator } from './SavedIndicator';

interface ChatWorkspaceProps {
  entry: JournalEntry;
  onUpdateEntry: (updated: Partial<JournalEntry>) => void;
  onSynthesize: () => void;
  isSynthesizing: boolean;
  onOpenVaultPassphrase: () => void;
  onToggleVaultLock: () => void;
  onOpenSparks: () => void;
  isSaving: boolean;
  lastSavedAt?: number | null;
  saveError?: string | null;
}

const PERSONAS: Array<{
  id: AIPersona;
  name: string;
  badge: string;
  icon: string;
  desc: string;
}> = [
  {
    id: 'reflective',
    name: 'Reflective Journal',
    badge: 'Empathetic & Insightful',
    icon: '🧘',
    desc: 'Unpacks feelings, illuminates recurring mental patterns, and offers gentle reframing.',
  },
  {
    id: 'brainstormer',
    name: 'Brainstorm Catalyst',
    badge: 'Creative & Lateral',
    icon: '💡',
    desc: 'High-energy partner to explore unconstrained ideas, analogies, and innovative angles.',
  },
  {
    id: 'socratic',
    name: 'Socratic Inquirer',
    badge: 'Probing & Clarifying',
    icon: '🏛️',
    desc: 'Asks deep, foundational questions to uncover hidden assumptions and core motives.',
  },
  {
    id: 'strategist',
    name: 'Executive Strategist',
    badge: 'Pragmatic & Leveraged',
    icon: '🎯',
    desc: 'Turns chaos into 80/20 execution sprints, prioritization matrices, and clear decisions.',
  },
  {
    id: 'stoic',
    name: 'Stoic Sage',
    badge: 'Calm & Grounded',
    icon: '🛡️',
    desc: 'Anchors you to the circle of control, resilience, and emotional equanimity.',
  },
];

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  entry,
  onUpdateEntry,
  onSynthesize,
  isSynthesizing,
  onOpenVaultPassphrase,
  onToggleVaultLock,
  onOpenSparks,
  isSaving,
  lastSavedAt = null,
  saveError = null,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [entry.messages, isSending]);

  // Adjust textarea height dynamically
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputMessage.trim();
    if (!clean || isSending) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: clean,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...entry.messages, userMsg];

    // Optimistically update entry messages and calculate title if first message
    const updatedTitle = entry.title === 'Untitled Reflection' && clean.length > 0
      ? clean.slice(0, 42) + (clean.length > 42 ? '...' : '')
      : entry.title;

    onUpdateEntry({
      messages: newMessages,
      title: updatedTitle,
      updatedAt: Date.now(),
    });

    setInputMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsSending(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          persona: entry.persona,
          userContext: entry.tags.length > 0 ? `Tags: ${entry.tags.join(', ')}` : '',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
      };

      onUpdateEntry({
        messages: [...newMessages, aiMsg],
        updatedAt: Date.now(),
      });
      setError(null);
    } catch (err: any) {
      console.error('Chat Error:', err);
      setError(err.message || 'Failed to communicate with Gemini API');
    } finally {
      setIsSending(false);
    }
  };

  const handleRetryLast = async () => {
    if (entry.messages.length === 0 || isSending) return;
    setError(null);
    setIsSending(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: entry.messages.map((m) => ({ role: m.role, content: m.content })),
          persona: entry.persona,
          userContext: entry.tags.length > 0 ? `Tags: ${entry.tags.join(', ')}` : '',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
      };

      onUpdateEntry({
        messages: [...entry.messages, aiMsg],
        updatedAt: Date.now(),
      });
      setError(null);
    } catch (err: any) {
      console.error('Retry Error:', err);
      setError(err.message || 'Failed to communicate with Gemini API');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activePersonaObj = PERSONAS.find((p) => p.id === entry.persona) || PERSONAS[0];

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden bg-stone-900">
      
      {/* Workspace Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 bg-stone-900/95 px-4 py-3 sm:px-6">
        
        {/* Title Input & Save Status */}
        <div className="flex flex-1 items-center gap-3 min-w-[200px]">
          <input
            id="input-entry-title"
            type="text"
            value={entry.title}
            onChange={(e) => onUpdateEntry({ title: e.target.value, updatedAt: Date.now() })}
            placeholder="Give your session a title..."
            className="flex-1 rounded-lg bg-transparent px-2 py-1 font-serif text-lg font-bold text-stone-100 placeholder-stone-600 focus:bg-stone-850 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
          />
          <SavedIndicator 
            isSaving={isSaving} 
            lastSavedAt={lastSavedAt} 
            saveError={saveError} 
          />
        </div>

        {/* Right Action Controls: Persona, Vault Lock, Synthesize */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Persona selector dropdown */}
          <div className="relative flex items-center">
            <select
              id="select-persona"
              value={entry.persona}
              onChange={(e) => onUpdateEntry({ persona: e.target.value as AIPersona, updatedAt: Date.now() })}
              className="rounded-lg border border-stone-700 bg-stone-800 py-1.5 pl-3 pr-8 text-xs font-medium text-amber-300 focus:border-amber-500 focus:outline-none"
            >
              {PERSONAS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Client-side Zero-Knowledge Vault Encryption Toggle */}
          <button
            id="btn-vault-lock-toggle"
            onClick={onToggleVaultLock}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              entry.isVaultEncrypted
                ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300 shadow-sm'
                : 'border-stone-700 bg-stone-800 text-stone-400 hover:border-stone-600 hover:text-stone-200'
            }`}
            title={entry.isVaultEncrypted ? 'Vault AES-GCM Encrypted' : 'Click to enable Zero-Knowledge Client Vault Encryption'}
          >
            {entry.isVaultEncrypted ? (
              <>
                <Lock className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Vault Encrypted</span>
              </>
            ) : (
              <>
                <Unlock className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Encrypt Vault</span>
              </>
            )}
          </button>

          {/* AI Auto-Summarize / Synthesize Button */}
          <button
            id="btn-trigger-synthesis"
            onClick={onSynthesize}
            disabled={isSynthesizing || entry.messages.length < 2}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-1.5 text-xs font-semibold text-stone-950 shadow-md transition hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            title="Automatically synthesize conversation into Executive Summary, Insights, and Action Steps"
          >
            <Sparkles className={`h-3.5 w-3.5 ${isSynthesizing ? 'animate-spin' : ''}`} />
            <span>{isSynthesizing ? 'Synthesizing...' : 'Auto-Synthesize'}</span>
          </button>

        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between border-b border-rose-500/30 bg-rose-950/40 px-4 py-2.5 text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-retry-chat"
              onClick={handleRetryLast}
              disabled={isSending}
              className="flex items-center gap-1 rounded bg-rose-500/20 px-2 py-1 text-[11px] font-medium text-rose-200 hover:bg-rose-500/30 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isSending ? 'animate-spin' : ''}`} />
              <span>Retry</span>
            </button>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200 px-1">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 space-y-6">
        
        {/* Welcome / Mode Framing Card */}
        {entry.messages.length === 0 && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-stone-800/80 bg-stone-925/90 p-6 text-center shadow-lg">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-2xl mb-4">
              {activePersonaObj.icon}
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-100">
              {activePersonaObj.name} Mode
            </h3>
            <p className="mt-1.5 text-xs text-amber-300 font-mono">
              {activePersonaObj.badge}
            </p>
            <p className="mt-3 text-sm text-stone-400 leading-relaxed max-w-md mx-auto">
              {activePersonaObj.desc}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={onOpenSparks}
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-950/30 px-3.5 py-2 text-xs font-medium text-amber-300 hover:border-amber-500/60 hover:bg-amber-900/40 transition"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Browse Prompts & Sparks</span>
              </button>
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {entry.messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${
                  isUser
                    ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                    : 'bg-stone-800 border-stone-700 text-stone-200 shadow-sm'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-amber-400" />}
              </div>

              {/* Message Content */}
              <div
                className={`group relative rounded-2xl px-4 py-3.5 text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-stone-800 text-stone-100 border border-stone-700/80 rounded-tr-xs'
                    : 'bg-stone-925 text-stone-200 border border-stone-800 rounded-tl-xs'
                }`}
              >
                <div className="markdown-body prose prose-invert prose-stone max-w-none text-sm leading-relaxed">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>

                {/* Message Meta & Copy */}
                <div className="mt-2 flex items-center justify-between gap-4 text-[10px] text-stone-500 pt-1 border-t border-stone-800/40">
                  <span className="font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={() => copyMessage(msg.id, msg.content)}
                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 hover:text-stone-300 transition"
                    title="Copy message"
                  >
                    {copiedId === msg.id ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isSending && (
          <div className="flex gap-3 max-w-3xl mr-auto">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-stone-800 border border-stone-700 text-amber-400">
              <Bot className="h-4 w-4 animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl border border-stone-800 bg-stone-925 px-4 py-3">
              <div className="h-2 w-2 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.3s]" />
              <div className="h-2 w-2 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.15s]" />
              <div className="h-2 w-2 rounded-full bg-amber-400 animate-bounce" />
              <span className="ml-2 text-xs text-stone-400 font-mono">Gemini is reasoning...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Footer */}
      <div className="border-t border-stone-800 bg-stone-925/90 p-4 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSendMessage} className="relative flex flex-col gap-2 rounded-2xl border border-stone-700/80 bg-stone-900/90 p-2 shadow-lg focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500">
            <textarea
              id="input-chat-message"
              ref={textareaRef}
              rows={1}
              value={inputMessage}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={`Reflect, brainstorm, or explore with Gemini (${activePersonaObj.name})... Press Enter to send.`}
              className="w-full resize-none bg-transparent px-3 py-1.5 text-sm text-stone-100 placeholder-stone-500 focus:outline-none"
            />

            <div className="flex items-center justify-between border-t border-stone-800/80 px-2 pt-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenSparks}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-stone-400 hover:bg-stone-800 hover:text-amber-300 transition"
                  title="Inspiration sparks"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Thought Sparks</span>
                </button>
                <span className="text-stone-600 hidden sm:inline">•</span>
                <span className="text-[11px] text-stone-500 hidden sm:inline">
                  Shift+Enter for newline
                </span>
              </div>

              <button
                id="btn-send-chat-message"
                type="submit"
                disabled={!inputMessage.trim() || isSending}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 font-semibold text-stone-950 transition hover:bg-amber-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Send</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
};
