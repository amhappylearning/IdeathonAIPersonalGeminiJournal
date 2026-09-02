import { JournalEntry } from '../types';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function exportJournalToPDF(entry: JournalEntry): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const synthesis = entry.synthesis;
      const title = escapeHtml(synthesis?.title || entry.title || 'Personal Gemini Reflection');
      const dateFormatted = new Date(entry.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const timeFormatted = synthesis?.synthesizedAt 
        ? new Date(synthesis.synthesizedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : new Date(entry.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      const completedMap = entry.actionItemsCompleted || {};

      const summaryHtml = synthesis?.summaryMarkdown
        ? synthesis.summaryMarkdown
            .split('\n\n')
            .map((para) => `<p>${escapeHtml(para)}</p>`)
            .join('')
        : '<p><em>No AI synthesis generated yet for this session. Below is the multi-turn reflection transcript.</em></p>';

      const insightsHtml = synthesis?.keyInsights && synthesis.keyInsights.length > 0
        ? synthesis.keyInsights
            .map(
              (ins) => `
              <li class="insight-item">
                <span class="bullet">✦</span>
                <span>${escapeHtml(ins)}</span>
              </li>`
            )
            .join('')
        : '';

      const actionsHtml = synthesis?.actionItems && synthesis.actionItems.length > 0
        ? synthesis.actionItems
            .map((act) => {
              const isDone = !!completedMap[act];
              return `
              <li class="action-item ${isDone ? 'done' : ''}">
                <span class="checkbox">${isDone ? '✓' : ''}</span>
                <span class="action-text">${escapeHtml(act)}</span>
              </li>`;
            })
            .join('')
        : '';

      const tagsHtml = (synthesis?.tags || entry.tags || [])
        .map((tag) => `<span class="tag">#${escapeHtml(tag)}</span>`)
        .join('');

      const messagesHtml = (entry.messages || [])
        .map((m) => {
          const isUser = m.role === 'user';
          return `
          <div class="msg ${isUser ? 'msg-user' : 'msg-gemini'}">
            <div class="msg-author">${isUser ? '👤 User Reflection' : '✨ Gemini Response'}</div>
            <div class="msg-content">${escapeHtml(m.content)}</div>
          </div>`;
        })
        .join('');

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} - Printable PDF Digest</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 1.6cm 1.4cm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1c1917;
      background: #ffffff;
      margin: 0;
      padding: 0;
      line-height: 1.6;
      font-size: 13px;
    }
    .header {
      border-bottom: 2px solid #e7e5e4;
      padding-bottom: 14px;
      margin-bottom: 20px;
    }
    .badge {
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 24px;
      font-weight: 700;
      color: #0c0a09;
      margin: 0 0 8px 0;
      line-height: 1.25;
    }
    .meta-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      background: #fafaf9;
      border: 1px solid #f5f5f4;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 11px;
      color: #78716c;
      margin-top: 8px;
    }
    .meta-item strong {
      color: #44403c;
      font-weight: 600;
    }
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .section-heading {
      font-size: 11.5px;
      font-weight: 700;
      color: #44403c;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin: 0 0 8px 0;
      border-bottom: 1px solid #f0eeee;
      padding-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .summary-box {
      background: #fafaf9;
      border-left: 3.5px solid #d97706;
      padding: 12px 14px;
      border-radius: 0 6px 6px 0;
      font-size: 13px;
      color: #292524;
      line-height: 1.65;
    }
    .summary-box p {
      margin: 0 0 8px 0;
    }
    .summary-box p:last-child {
      margin-bottom: 0;
    }
    .insights-list, .actions-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .insight-item {
      padding: 7px 11px;
      margin-bottom: 6px;
      background: #fefce8;
      border: 1px solid #fef08a;
      border-radius: 6px;
      font-size: 12px;
      color: #713f12;
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .bullet {
      color: #d97706;
      font-weight: bold;
    }
    .action-item {
      padding: 7px 11px;
      margin-bottom: 6px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      font-size: 12px;
      color: #14532d;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .action-item.done {
      background: #fafaf9;
      border-color: #e7e5e4;
      color: #78716c;
      text-decoration: line-through;
    }
    .checkbox {
      width: 14px;
      height: 14px;
      border: 1.5px solid #16a34a;
      border-radius: 3px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      color: #16a34a;
      flex-shrink: 0;
    }
    .arc-grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr 1fr;
      gap: 8px;
      background: #fafaf9;
      border: 1px solid #e7e5e4;
      padding: 10px;
      border-radius: 6px;
      text-align: center;
    }
    .arc-label {
      font-size: 9px;
      text-transform: uppercase;
      color: #78716c;
      font-weight: 700;
      margin-bottom: 3px;
    }
    .arc-val {
      font-size: 11.5px;
      font-weight: 600;
      color: #1c1917;
    }
    .arc-middle {
      font-size: 11px;
      font-style: italic;
      color: #b45309;
      font-family: 'Playfair Display', Georgia, serif;
    }
    .tags {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-top: 6px;
    }
    .tag {
      font-size: 10px;
      background: #f5f5f4;
      color: #57534e;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #e7e5e4;
      font-family: 'JetBrains Mono', monospace;
    }
    .transcript-section {
      margin-top: 24px;
      border-top: 1.5px solid #e7e5e4;
      padding-top: 16px;
    }
    .msg {
      margin-bottom: 10px;
      padding: 9px 12px;
      border-radius: 6px;
      page-break-inside: avoid;
    }
    .msg-user {
      background: #f5f5f4;
      border-left: 3.5px solid #78716c;
    }
    .msg-gemini {
      background: #fafaf9;
      border-left: 3.5px solid #f59e0b;
    }
    .msg-author {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #57534e;
      margin-bottom: 3px;
    }
    .msg-content {
      font-size: 12px;
      white-space: pre-wrap;
      color: #292524;
      line-height: 1.5;
    }
    .footer {
      margin-top: 30px;
      border-top: 1px solid #e7e5e4;
      padding-top: 10px;
      font-size: 9.5px;
      color: #a8a29e;
      display: flex;
      justify-content: space-between;
      font-family: 'JetBrains Mono', monospace;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="badge">AI Personal Journal & Synthesis Digest</div>
    <h1>${title}</h1>
    <div class="meta-bar">
      <div class="meta-item"><strong>Date:</strong> ${dateFormatted}</div>
      <div class="meta-item"><strong>Persona:</strong> ${escapeHtml((entry.persona || 'reflective').toUpperCase())}</div>
      <div class="meta-item"><strong>Time:</strong> ${timeFormatted}</div>
      <div class="meta-item"><strong>ID:</strong> ${escapeHtml(entry.id ? entry.id.substring(0, 12) : 'Session')}</div>
    </div>
  </div>

  ${synthesis ? `
  <div class="section">
    <div class="section-heading">🧭 Executive Summary</div>
    <div class="summary-box">
      ${summaryHtml}
    </div>
  </div>` : ''}

  ${insightsHtml ? `
  <div class="section">
    <div class="section-heading">💡 Breakthrough Insights & Epiphanies</div>
    <ul class="insights-list">
      ${insightsHtml}
    </ul>
  </div>` : ''}

  ${actionsHtml ? `
  <div class="section">
    <div class="section-heading">🎯 Action Items & Next Commitments</div>
    <ul class="actions-list">
      ${actionsHtml}
    </ul>
  </div>` : ''}

  ${synthesis?.sentimentTrajectory ? `
  <div class="section">
    <div class="section-heading">📈 Cognitive & Emotional Arc</div>
    <div class="arc-grid">
      <div>
        <div class="arc-label">Initial State</div>
        <div class="arc-val">${escapeHtml(synthesis.sentimentTrajectory.startMood)}</div>
      </div>
      <div>
        <div class="arc-label">Cognitive Shift</div>
        <div class="arc-middle">"${escapeHtml(synthesis.sentimentTrajectory.arc)}"</div>
      </div>
      <div>
        <div class="arc-label">Synthesized Resolution</div>
        <div class="arc-val">${escapeHtml(synthesis.sentimentTrajectory.endMood)}</div>
      </div>
    </div>
  </div>` : ''}

  ${tagsHtml ? `
  <div class="section">
    <div class="section-heading">🏷️ Key Themes & Tags</div>
    <div class="tags">${tagsHtml}</div>
  </div>` : ''}

  ${messagesHtml ? `
  <div class="section transcript-section">
    <div class="section-heading">💬 Multi-Turn Dialogue Transcript (${entry.messages?.length || 0} messages)</div>
    ${messagesHtml}
  </div>` : ''}

  <div class="footer">
    <span>Personal Gemini Journal • Exported for Print/PDF</span>
    <span>Secure Cloud Firestore Vault</span>
  </div>
</body>
</html>`;

      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(html);
        frameDoc.close();

        setTimeout(() => {
          if (printFrame.contentWindow) {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
          }
          setTimeout(() => {
            if (document.body.contains(printFrame)) {
              document.body.removeChild(printFrame);
            }
            resolve(true);
          }, 1500);
        }, 350);
      } else {
        resolve(false);
      }
    } catch (err) {
      console.error('Print Error:', err);
      resolve(false);
    }
  });
}
