import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Download, 
  Copy, 
  Check, 
  Layers, 
  Target, 
  Lightbulb, 
  FileText, 
  Shield, 
  Share2, 
  Printer,
  Compass
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { EntrySynthesis, JournalEntry } from '../types';
import { computeSHA256Checksum } from '../lib/cryptoVault';
import { exportJournalToPDF } from '../lib/pdfExport';

interface SynthesisViewProps {
  synthesis: EntrySynthesis;
  entry: JournalEntry;
  onToggleActionItem: (itemText: string) => void;
}

export const SynthesisView: React.FC<SynthesisViewProps> = ({
  synthesis,
  entry,
  onToggleActionItem,
}) => {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const completedMap = entry.actionItemsCompleted || {};

  const handlePrintPDF = async () => {
    setIsPrinting(true);
    await exportJournalToPDF(entry);
    setIsPrinting(false);
  };

  const handleCopyDigest = async () => {
    const text = `# ${synthesis.title}
Date: ${new Date(entry.createdAt).toLocaleDateString()}
Mode: ${entry.persona.toUpperCase()}

## Executive Summary
${synthesis.summaryMarkdown}

## Key Epiphanies & Insights
${synthesis.keyInsights.map((ins) => `* ${ins}`).join('\n')}

## Actionable Next Steps
${synthesis.actionItems.map((act) => `[${completedMap[act] ? 'x' : ' '}] ${act}`).join('\n')}

## Sentiment & Cognitive Arc
* Starting State: ${synthesis.sentimentTrajectory.startMood}
* Shift: ${synthesis.sentimentTrajectory.arc}
* Ending State: ${synthesis.sentimentTrajectory.endMood}

Tags: ${synthesis.tags.join(', ')}
`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const text = `# ${synthesis.title}
*Date:* ${new Date(entry.createdAt).toISOString()}
*Persona:* ${entry.persona}
*Firestore Path:* /users/${entry.userId}/journals/${entry.id}

---

## 🧭 Executive Summary
${synthesis.summaryMarkdown}

---

## 💡 Breakthrough Insights
${synthesis.keyInsights.map((ins) => `- **${ins}**`).join('\n')}

---

## 🎯 Action Items & Commitments
${synthesis.actionItems.map((act) => `- [${completedMap[act] ? 'x' : ' '}] ${act}`).join('\n')}

---

## 📈 Emotional & Cognitive Trajectory
- **Initial Tone:** ${synthesis.sentimentTrajectory.startMood}
- **Cognitive Arc:** ${synthesis.sentimentTrajectory.arc}
- **Resolution:** ${synthesis.sentimentTrajectory.endMood}

---

## 💬 Full Multi-Turn Transcript
${entry.messages.map((m) => `### ${m.role === 'user' ? '👤 User' : '✨ Gemini'}\n${m.content}\n`).join('\n---\n')}
`;

    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${synthesis.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-digest.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSecureJSON = async () => {
    setExporting(true);
    try {
      const rawPayload = JSON.stringify(entry, null, 2);
      const sha256 = await computeSHA256Checksum(rawPayload);

      const exportObject = {
        meta: {
          app: 'Personal Gemini Journal',
          version: '1.0.0-PROD',
          exportedAt: new Date().toISOString(),
          sha256Checksum: sha256,
          securityDirectives: 'Phase 1 & 2 STRIDE Verified',
        },
        entry,
      };

      const blob = new Blob([JSON.stringify(exportObject, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `journal-vault-${entry.id.substring(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 rounded-2xl border border-stone-800 bg-stone-900/90 p-6 shadow-xl">
      
      {/* Header with Title and Export Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
              <Sparkles className="h-3 w-3" />
              AI Automated Synthesis
            </span>
            <span className="text-xs text-stone-500 font-mono">
              {new Date(synthesis.synthesizedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-stone-100">
            {synthesis.title}
          </h2>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-copy-synthesis-digest"
            onClick={handleCopyDigest}
            className="flex items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-800 px-3 py-1.5 text-xs font-medium text-stone-300 hover:border-stone-600 hover:bg-stone-750 transition"
            title="Copy formatted markdown digest"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            id="btn-export-markdown"
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-800 px-3 py-1.5 text-xs font-medium text-stone-300 hover:border-stone-600 hover:bg-stone-750 transition"
            title="Download formatted Markdown file"
          >
            <FileText className="h-3.5 w-3.5 text-amber-400" />
            <span>Markdown</span>
          </button>

          <button
            id="btn-export-pdf"
            onClick={handlePrintPDF}
            disabled={isPrinting}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-1.5 text-xs font-medium text-amber-300 hover:border-amber-500/60 hover:bg-amber-900/30 active:scale-95 transition"
            title="Export / Print formatted PDF digest"
          >
            <Printer className="h-3.5 w-3.5 text-amber-400" />
            <span>{isPrinting ? 'Preparing PDF...' : 'Printable PDF'}</span>
          </button>

          <button
            id="btn-export-signed-json"
            onClick={handleExportSecureJSON}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:border-emerald-500/60 hover:bg-emerald-900/40 transition"
            title="Download SHA-256 verified JSON backup"
          >
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span>Vault Backup</span>
          </button>
        </div>
      </div>

      {/* Sentiment & Cognitive Trajectory Bar */}
      {synthesis.sentimentTrajectory && (
        <div className="rounded-xl border border-stone-800 bg-stone-950/70 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Compass className="h-4 w-4 text-amber-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Cognitive & Emotional Arc
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <div className="rounded-lg bg-stone-900/90 border border-stone-800 p-3">
              <span className="text-[10px] font-mono uppercase text-stone-500 block mb-0.5">Initial State</span>
              <p className="text-xs font-semibold text-stone-300">{synthesis.sentimentTrajectory.startMood}</p>
            </div>

            <div className="flex flex-col items-center justify-center text-center px-2 py-1">
              <ArrowRight className="h-4 w-4 text-amber-400 mb-1 hidden md:block" />
              <p className="text-[11px] text-stone-400 italic font-serif leading-tight">
                "{synthesis.sentimentTrajectory.arc}"
              </p>
            </div>

            <div className="rounded-lg bg-emerald-950/30 border border-emerald-500/20 p-3">
              <span className="text-[10px] font-mono uppercase text-emerald-400 block mb-0.5">Synthesized Resolution</span>
              <p className="text-xs font-semibold text-emerald-200">{synthesis.sentimentTrajectory.endMood}</p>
            </div>
          </div>
        </div>
      )}

      {/* Executive Summary Markdown */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-amber-400" />
          Executive Reflection Summary
        </h4>
        <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-5 text-sm text-stone-200 leading-relaxed prose prose-invert prose-stone max-w-none">
          <div className="markdown-body space-y-3">
            <ReactMarkdown>{synthesis.summaryMarkdown}</ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Two Column: Insights & Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Breakthrough Key Insights */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
            Breakthrough Insights ({synthesis.keyInsights?.length || 0})
          </h4>
          <div className="space-y-2">
            {synthesis.keyInsights?.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-xl border border-stone-800 bg-stone-950/60 p-3.5 text-xs text-stone-200 leading-relaxed transition hover:border-stone-700"
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 font-mono text-[11px] font-bold mt-0.5">
                  {idx + 1}
                </div>
                <p className="flex-1 font-medium">{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items with Interactive Checkboxes */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-emerald-400" />
            Actionable Next Steps ({synthesis.actionItems?.length || 0})
          </h4>
          <div className="space-y-2">
            {synthesis.actionItems?.map((action, idx) => {
              const isChecked = Boolean(completedMap[action]);
              return (
                <div
                  key={idx}
                  onClick={() => onToggleActionItem(action)}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-xs leading-relaxed cursor-pointer transition ${
                    isChecked
                      ? 'border-emerald-500/30 bg-emerald-950/20 text-stone-400 line-through'
                      : 'border-stone-800 bg-stone-950/60 text-stone-200 hover:border-emerald-500/40 hover:bg-stone-900'
                  }`}
                >
                  <button
                    type="button"
                    className="shrink-0 mt-0.5 text-emerald-400 transition"
                  >
                    {isChecked ? (
                      <CheckCircle2 className="h-4 w-4 fill-emerald-500/20 text-emerald-400" />
                    ) : (
                      <Circle className="h-4 w-4 text-stone-500" />
                    )}
                  </button>
                  <span className="flex-1 font-medium select-none">{action}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Mind Map / Thematic Nodes (Original Feature Enhancement) */}
      {synthesis.mindMapNodes && synthesis.mindMapNodes.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-purple-400" />
            Thematic Mind Map & Topic Nodes
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {synthesis.mindMapNodes.map((node, i) => (
              <div
                key={i}
                className="rounded-xl border border-stone-800 bg-stone-950/70 p-4 space-y-2 transition hover:border-purple-500/30 hover:bg-stone-900/60"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-400" />
                  <h5 className="font-semibold text-xs text-purple-300">
                    {node.category}
                  </h5>
                </div>
                <ul className="space-y-1.5 pl-3 border-l border-stone-800 text-[11px] text-stone-400">
                  {node.points.map((pt, pIdx) => (
                    <li key={pIdx} className="leading-snug">
                      • {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags footer */}
      {synthesis.tags && synthesis.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-stone-800/80">
          <span className="text-xs text-stone-500 font-mono">Tags:</span>
          {synthesis.tags.map((tag, idx) => (
            <span
              key={idx}
              className="rounded-lg bg-stone-800 px-2.5 py-1 text-xs font-medium text-stone-300 border border-stone-700"
            >
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      )}

    </div>
  );
};
