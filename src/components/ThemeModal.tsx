import React from 'react';
import { X, Check, Sun, Moon, Sparkles, Palette, Heart, Waves, Cloud, Leaf } from 'lucide-react';

export type AppTheme = 
  | 'deep-stone' 
  | 'light-paper' 
  | 'soft-blush' 
  | 'calm-teal' 
  | 'misty-sky' 
  | 'sage-meadow';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
}

interface ThemeOption {
  id: AppTheme;
  name: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  canvasBg: string;
  cardBg: string;
  accentColor: string;
  tagColor: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'deep-stone',
    name: 'Deep Stone',
    category: 'Dark Mode',
    description: 'Obsidian canvas with warm amber highlights. Perfect for night sessions.',
    icon: <Moon className="h-4 w-4 text-amber-400" />,
    canvasBg: '#1c1917',
    cardBg: '#292524',
    accentColor: '#f59e0b',
    tagColor: 'text-amber-400',
  },
  {
    id: 'light-paper',
    name: 'Light Paper',
    category: 'Editorial Classic',
    description: 'Warm textured parchment with espresso ink for daytime clarity.',
    icon: <Sun className="h-4 w-4 text-amber-600" />,
    canvasBg: '#faf7f2',
    cardBg: '#ffffff',
    accentColor: '#d97706',
    tagColor: 'text-amber-600',
  },
  {
    id: 'soft-blush',
    name: 'Soft Blush',
    category: 'Gentle Pink',
    description: 'Calming petal rose canvas with delicate berry accents for serene journaling.',
    icon: <Heart className="h-4 w-4 text-rose-500" />,
    canvasBg: '#fdf5f6',
    cardBg: '#ffffff',
    accentColor: '#d94668',
    tagColor: 'text-rose-500',
  },
  {
    id: 'calm-teal',
    name: 'Calm Teal',
    category: 'Soothing Ocean',
    description: 'Tranquil sea-mist palette with deep slate tones for mental clarity.',
    icon: <Waves className="h-4 w-4 text-teal-600" />,
    canvasBg: '#f0f7f7',
    cardBg: '#ffffff',
    accentColor: '#0f766e',
    tagColor: 'text-teal-600',
  },
  {
    id: 'misty-sky',
    name: 'Misty Sky',
    category: 'Light Blue',
    description: 'Airy celestial sky tint with sapphire ink. Reduces ocular fatigue.',
    icon: <Cloud className="h-4 w-4 text-blue-500" />,
    canvasBg: '#f1f6fa',
    cardBg: '#ffffff',
    accentColor: '#2563eb',
    tagColor: 'text-blue-500',
  },
  {
    id: 'sage-meadow',
    name: 'Sage Meadow',
    category: 'Soft Green',
    description: 'Botanical herbal sage background with evergreen accents for grounding.',
    icon: <Leaf className="h-4 w-4 text-emerald-600" />,
    canvasBg: '#f2f6f3',
    cardBg: '#ffffff',
    accentColor: '#15803d',
    tagColor: 'text-emerald-600',
  },
];

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-stone-700 bg-stone-900 p-5 sm:p-7 shadow-2xl shadow-black/80 text-stone-100 transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-stone-100">
                Eye-Soothing Appearance & Themes
              </h2>
              <p className="text-xs text-stone-400">
                Choose a subtle, calming visual palette designed to reduce eye strain
              </p>
            </div>
          </div>
          <button
            id="btn-close-theme-modal"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Theme Cards Grid */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {THEME_OPTIONS.map((theme) => {
            const isSelected = currentTheme === theme.id;
            return (
              <button
                key={theme.id}
                id={`btn-select-theme-${theme.id}`}
                onClick={() => onSelectTheme(theme.id)}
                className={`group relative flex flex-col rounded-xl border p-3.5 text-left transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-stone-800 shadow-md shadow-amber-500/10 ring-2 ring-amber-500/30'
                    : 'border-stone-700/80 bg-stone-850/60 hover:border-stone-600 hover:bg-stone-800'
                }`}
              >
                {/* Active Indicator Badge */}
                {isSelected && (
                  <span className="absolute right-2.5 top-2.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-500 text-stone-950 font-bold text-[10px]">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-900 border border-stone-700">
                    {theme.icon}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-stone-100 block">{theme.name}</span>
                    <span className={`text-[9px] uppercase font-mono tracking-wider ${theme.tagColor}`}>
                      {theme.category}
                    </span>
                  </div>
                </div>

                {/* Visual Palette Preview */}
                <div className="rounded-lg border border-stone-700 bg-stone-950 p-2 space-y-1 mb-2.5">
                  <div className="flex items-center justify-between text-[9px] text-stone-400 font-mono">
                    <span>Canvas</span>
                    <span 
                      className="h-2.5 w-6 rounded border border-stone-700" 
                      style={{ backgroundColor: theme.canvasBg }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-stone-400 font-mono">
                    <span>Card</span>
                    <span 
                      className="h-2.5 w-6 rounded border border-stone-700" 
                      style={{ backgroundColor: theme.cardBg }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-stone-400 font-mono">
                    <span>Accent</span>
                    <span 
                      className="h-2.5 w-6 rounded" 
                      style={{ backgroundColor: theme.accentColor }}
                    />
                  </div>
                </div>

                <p className="text-[11px] text-stone-400 leading-relaxed line-clamp-2">
                  {theme.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Eye Strain & Calming Features Info */}
        <div className="mt-5 rounded-xl border border-stone-800 bg-stone-950/80 p-3.5 text-xs text-stone-400">
          <div className="flex items-center gap-2 font-mono text-[11px] text-stone-300 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Harmonious Color Science & CSS Engine</span>
          </div>
          <p className="text-[11px] leading-normal text-stone-400">
            All palettes are calibrated with low-saturation warm and cool undertones to eliminate blue-light harshness and prevent visual fatigue during extended journaling and synthesis.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            id="btn-done-theme-modal"
            onClick={onClose}
            className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-semibold text-stone-950 hover:bg-amber-400 transition active:scale-95 shadow-md"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
