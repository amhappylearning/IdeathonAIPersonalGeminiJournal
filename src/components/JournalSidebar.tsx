import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Star, 
  Lock, 
  Trash2, 
  Sparkles, 
  Plus, 
  Calendar, 
  Layers,
  ChevronRight,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { JournalEntry, AIPersona } from '../types';

interface JournalSidebarProps {
  entries: JournalEntry[];
  activeEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (id: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  isLoading: boolean;
  isOpen: boolean;
  onCloseMobile: () => void;
}

const PERSONA_BADGES: Record<AIPersona, { label: string; color: string }> = {
  reflective: { label: 'Reflective', color: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  brainstormer: { label: 'Brainstorm', color: 'bg-purple-500/10 text-purple-300 border-purple-500/20' },
  socratic: { label: 'Socratic', color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' },
  strategist: { label: 'Strategist', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  stoic: { label: 'Stoic Sage', color: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
};

export const JournalSidebar: React.FC<JournalSidebarProps> = ({
  entries,
  activeEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  onToggleFavorite,
  isLoading,
  isOpen,
  onCloseMobile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  const filteredEntries = entries.filter((entry) => {
    if (onlyFavorites && !entry.favorite) return false;
    if (selectedPersona !== 'all' && entry.persona !== selectedPersona) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTitle = entry.title?.toLowerCase().includes(q);
      const matchTag = entry.tags?.some((t) => t.toLowerCase().includes(q));
      const matchContent = entry.messages?.some((m) => m.content?.toLowerCase().includes(q));
      return matchTitle || matchTag || matchContent;
    }
    return true;
  });

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-80 flex-col border-r border-stone-800 bg-stone-925 pt-16 transition-transform duration-200 md:static md:w-84 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header & Search */}
        <div className="p-4 border-b border-stone-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-400" />
              <h2 className="font-serif text-sm font-bold text-stone-200">
                Firestore Archive
              </h2>
              <span className="rounded-full bg-stone-800 px-2 py-0.5 text-[11px] font-mono text-stone-400">
                {entries.length}
              </span>
            </div>

            <button
              id="btn-sidebar-new-entry"
              onClick={onNewEntry}
              className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition"
              title="Create new journal session"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-500" />
            <input
              id="input-search-journals"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reflections, tags, insights..."
              className="w-full rounded-lg border border-stone-800 bg-stone-900/90 py-1.5 pl-8 pr-3 text-xs text-stone-200 placeholder-stone-600 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center justify-between gap-1 text-[11px] pt-1">
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 transition border ${
                onlyFavorites
                  ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                  : 'border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-300'
              }`}
            >
              <Star className={`h-3 w-3 ${onlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>Starred</span>
            </button>

            <select
              value={selectedPersona}
              onChange={(e) => setSelectedPersona(e.target.value)}
              className="rounded-md border border-stone-800 bg-stone-900 px-2 py-1 text-[11px] text-stone-300 focus:border-amber-500 focus:outline-none"
            >
              <option value="all">All Modes</option>
              <option value="reflective">Reflective</option>
              <option value="brainstormer">Brainstorm</option>
              <option value="socratic">Socratic</option>
              <option value="strategist">Strategist</option>
              <option value="stoic">Stoic</option>
            </select>
          </div>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-stone-500 text-xs">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mb-2" />
              <span>Syncing encrypted Firestore documents...</span>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-800 p-6 text-center text-stone-500">
              <BookOpen className="mx-auto h-8 w-8 text-stone-700 mb-2" />
              <p className="text-xs font-medium text-stone-400">No reflections found</p>
              <p className="mt-1 text-[11px] text-stone-600">
                {searchTerm || onlyFavorites || selectedPersona !== 'all'
                  ? 'Try clearing filters'
                  : 'Start your first brainstorm or reflective session'}
              </p>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const isActive = entry.id === activeEntryId;
              const personaInfo = PERSONA_BADGES[entry.persona] || PERSONA_BADGES.reflective;
              const hasSynthesis = Boolean(entry.synthesis);

              return (
                <div
                  key={entry.id}
                  id={`journal-item-${entry.id}`}
                  onClick={() => {
                    onSelectEntry(entry);
                    onCloseMobile();
                  }}
                  className={`group relative flex cursor-pointer flex-col gap-1.5 rounded-xl border p-3 transition ${
                    isActive
                      ? 'border-amber-500/50 bg-stone-850 shadow-md ring-1 ring-amber-500/20'
                      : 'border-stone-800/80 bg-stone-900/60 hover:border-stone-700 hover:bg-stone-850/60'
                  }`}
                >
                  {/* Card Top Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium border ${personaInfo.color}`}>
                        {personaInfo.label}
                      </span>
                      {entry.isVaultEncrypted && (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400 border border-emerald-500/20" title="Client-Side AES-GCM Encrypted Vault">
                          <Lock className="h-2.5 w-2.5" />
                          Vault
                        </span>
                      )}
                      {hasSynthesis && (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300 border border-amber-500/20" title="AI Synthesized">
                          <Sparkles className="h-2.5 w-2.5" />
                          Summary
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(entry.id, Boolean(entry.favorite));
                        }}
                        className="rounded p-1 text-stone-500 hover:text-amber-400 transition"
                        title={entry.favorite ? 'Unstar' : 'Star entry'}
                      >
                        <Star
                          className={`h-3.5 w-3.5 ${
                            entry.favorite ? 'fill-amber-400 text-amber-400' : ''
                          }`}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEntryToDelete(entry.id);
                        }}
                        className="rounded p-1 text-stone-600 hover:text-rose-400 transition"
                        title="Delete from Firestore"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="font-serif text-sm font-semibold text-stone-100 line-clamp-1">
                    {entry.title || 'Untitled Reflection'}
                  </h4>

                  {/* Excerpt / Summary */}
                  {entry.synthesis?.summaryMarkdown ? (
                    <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                      {entry.synthesis.summaryMarkdown.replace(/[#*`_]/g, '')}
                    </p>
                  ) : (
                    <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                      {entry.messages[entry.messages.length - 1]?.content || 'Empty dialogue...'}
                    </p>
                  )}

                  {/* Card Bottom Meta */}
                  <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-stone-800/40">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="h-2.5 w-2.5" />
                      {formatDate(entry.updatedAt)}
                    </span>
                    <span className="font-mono">
                      {entry.messages.length} msgs • {entry.wordCount || 0} words
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {entryToDelete && (
          <div className="p-4 bg-rose-950/40 border-t border-rose-500/30 text-xs">
            <p className="text-rose-200 font-medium mb-2">Delete this reflection permanently from Cloud Firestore?</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onDeleteEntry(entryToDelete);
                  setEntryToDelete(null);
                }}
                className="flex-1 rounded-md bg-rose-600 px-2 py-1 font-semibold text-white hover:bg-rose-500"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setEntryToDelete(null)}
                className="rounded-md border border-stone-700 px-2 py-1 text-stone-400 hover:bg-stone-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
