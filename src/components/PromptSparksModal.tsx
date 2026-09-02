import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Brain, 
  Shield, 
  Target, 
  Heart, 
  Flame, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { SparkPrompt } from '../types';
import { CURATED_SPARKS } from '../lib/sparksData';

interface PromptSparksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSpark: (promptText: string) => void;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'All Sparks' },
  { id: 'Stoic Clarity', label: 'Stoic Clarity' },
  { id: 'Creative Brainstorming', label: 'Brainstorming' },
  { id: 'Strategic Planning', label: 'Strategy' },
  { id: 'Deep Reflection', label: 'Deep Reflection' },
];

export const PromptSparksModal: React.FC<PromptSparksModalProps> = ({
  isOpen,
  onClose,
  onSelectSpark,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dynamicSparks, setDynamicSparks] = useState<SparkPrompt[]>(CURATED_SPARKS);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerateFreshSparks = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/gemini/sparks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selectedCategory }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sparks && Array.isArray(data.sparks)) {
          setDynamicSparks((prev) => [...data.sparks, ...prev]);
        }
      }
    } catch (err) {
      console.error('Failed to generate sparks:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredSparks = selectedCategory === 'all'
    ? dynamicSparks
    : dynamicSparks.filter((s) => s.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  const getIcon = (type: string) => {
    switch (type) {
      case 'brain': return <Brain className="h-4 w-4 text-purple-400" />;
      case 'shield': return <Shield className="h-4 w-4 text-blue-400" />;
      case 'target': return <Target className="h-4 w-4 text-emerald-400" />;
      case 'heart': return <Heart className="h-4 w-4 text-rose-400" />;
      default: return <Sparkles className="h-4 w-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-stone-750 bg-stone-900 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 bg-stone-925 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-stone-100">
                Prompt Sparks & Stoic Catalysts
              </h3>
              <p className="text-xs text-stone-400">
                Ignite your journal session or deep brainstorm with curated thought starters
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Bar & Fresh AI Generation */}
        <div className="flex items-center justify-between border-b border-stone-800 bg-stone-950 px-5 py-2.5 gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-1">
            {CATEGORY_TABS.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-lg px-2.5 py-1 font-medium transition whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-stone-800 text-amber-300 border border-stone-700'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            id="btn-generate-fresh-sparks"
            onClick={handleGenerateFreshSparks}
            disabled={isGenerating}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-900/40 transition whitespace-nowrap disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>AI Fresh Sparks</span>
          </button>
        </div>

        {/* Sparks List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {filteredSparks.map((spark, idx) => (
            <div
              key={spark.id || idx}
              onClick={() => {
                onSelectSpark(spark.promptText);
                onClose();
              }}
              className="group flex flex-col gap-2 rounded-xl border border-stone-800 bg-stone-925 p-4 cursor-pointer transition hover:border-amber-500/50 hover:bg-stone-850 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-stone-800">
                    {getIcon(spark.iconType)}
                  </div>
                  <span className="text-xs font-bold text-stone-200 group-hover:text-amber-300 transition">
                    {spark.headline}
                  </span>
                </div>
                <span className="rounded bg-stone-800 px-2 py-0.5 text-[10px] font-medium text-stone-400">
                  {spark.category}
                </span>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed pl-8">
                {spark.promptText}
              </p>

              <div className="flex items-center justify-end text-[11px] text-amber-400 opacity-0 group-hover:opacity-100 transition pt-1">
                <span>Start reflection with this spark →</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
