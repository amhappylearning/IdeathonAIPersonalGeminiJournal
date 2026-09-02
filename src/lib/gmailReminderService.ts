import { getCachedGoogleAccessToken, signInWithGoogle } from './firebase';

export interface StrategicEmailReminderPayload {
  recipientEmail: string;
  frameworkName: string;
  dayOfMonth: number;
  frameworkDetails: {
    title: string;
    description: string;
    guidingQuestions: string[];
    actionPrompt: string;
  };
}

/**
 * Builds an RFC 2822 formatted raw email string encoded in base64url for Gmail API
 */
function createRawEmail(to: string, subject: string, htmlBody: string): string {
  const boundary = `__PersonalGeminiJournalBoundary_${Date.now()}__`;
  
  const emailLines = [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    'Your Monthly Strategic Framework & Journaling Reminder from Personal Gemini Journal.',
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody,
    '',
    `--${boundary}--`,
  ];

  const rawMessage = emailLines.join('\r\n');
  // Base64url encoding (replace + with -, / with _, and remove padding =)
  const base64Encoded = btoa(unescape(encodeURIComponent(rawMessage)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return base64Encoded;
}

/**
 * Framework descriptions & reflective prompts for strategic journaling
 */
export const FRAMEWORKS: Record<
  string,
  { title: string; description: string; guidingQuestions: string[]; actionPrompt: string }
> = {
  'architecture-planning': {
    title: 'Strategic Architecture Planning & Meeting Synthesis',
    description: 'Reflect back on discussions from the latest meetings, brainstorm architectural patterns, and take decisive next actions for system architecture and technical execution.',
    guidingQuestions: [
      'What key technical requirements, constraints, and trade-offs surfaced in your latest meetings?',
      'Which architectural patterns (e.g., event-driven, CQRS, zero-trust, micro-frontends, hexagonal) best address the scale and bottlenecks discussed?',
      'What are the concrete next set of actions, technical spikes, and proof-of-concepts needed to validate the architecture?',
      'How do these architectural decisions align with the long-term product roadmap and team execution velocity?',
    ],
    actionPrompt: 'Open your Personal Gemini Journal and use the "Strategist" persona to brainstorm architectural patterns and next action steps.',
  },
  swot: {
    title: 'Strategic SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats)',
    description: 'A structural audit of internal advantages and external landscape shifts to re-align your vision for the coming month.',
    guidingQuestions: [
      'What core strengths or high-leverage assets propelled you forward this month?',
      'Where did internal friction, cognitive bottlenecks, or time-drains slow you down?',
      'What emergent opportunities or untapped possibilities have surfaced that demand focus?',
      'What threats, risks, or blind spots need proactive mitigation before next month?',
    ],
    actionPrompt: 'Open your Personal Gemini Journal and use the "Strategist" persona to map out high-leverage pivots.',
  },
  okr: {
    title: 'OKR Strategic Review (Objectives & Key Results)',
    description: 'Qualitative moonshot alignment paired with measurable, verifiable milestone tracking.',
    guidingQuestions: [
      'What 1-2 paramount objectives will define exceptional success for your next 30 days?',
      'What quantifiable key results (0 to 1.0 confidence) will prove you achieved them?',
      'Which vanity metrics or low-impact tasks must you actively de-prioritize?',
      'How does your daily journaling habit directly support these milestones?',
    ],
    actionPrompt: 'Launch your Gemini chat workspace to synthesize clear OKR checkpoints with AI guidance.',
  },
  eisenhower: {
    title: 'Eisenhower Matrix & High-Leverage Focus',
    description: 'Ruthless categorization of urgent vs. important initiatives to escape reactive firefighting.',
    guidingQuestions: [
      'What critical tasks are truly Important but not immediately Urgent (Quadrant II)?',
      'What urgent distractions consumed your energy without compounding long-term value?',
      'What can you systematically automate, delegate, or eliminate starting this 15th?',
      'How will you protect dedicated deep-work blocks in your calendar this month?',
    ],
    actionPrompt: 'Reflect on Quadrant II priorities inside your journal workspace to maintain strategic clarity.',
  },
  'first-principles': {
    title: 'First-Principles Strategic Synthesis',
    description: 'Deconstruct assumptions down to fundamental truths, then reason upwards from bedrock reality.',
    guidingQuestions: [
      'What conventional belief or assumption about your work/goals might actually be untrue?',
      'If you had to rebuild your entire roadmap from scratch today with zero legacy baggage, what would it look like?',
      'What is the single most fundamental constraint holding back a 10x breakthrough?',
      'What experiments can you run in the next two weeks to test this first-principles hypothesis?',
    ],
    actionPrompt: 'Engage the "Socratic" persona in your journal to rigorously challenge your core premises.',
  },
  'four-burners': {
    title: 'Four Burners Theory (Health, Work, Relationships, Soul)',
    description: 'Deliberate life energy allocation and honest equilibrium assessment for sustained excellence.',
    guidingQuestions: [
      'Which burners (Health, Work, Relationships, Personal Growth) were burning brightest this month?',
      'Which burner was neglected, and what is the sustainable adjustment required?',
      'What is one boundary you need to set to prevent burnout while pursuing major ambitions?',
      'What restorative ritual will you commit to between now and the next monthly checkpoint?',
    ],
    actionPrompt: 'Record your holistic energy audit in your private journal and generate actionable insights.',
  },
};

export function generateReminderEmailHtml(payload: StrategicEmailReminderPayload): string {
  const fw = payload.frameworkDetails;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #1c1917; color: #f5f5f4; margin: 0; padding: 24px; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; background-color: #292524; border-radius: 16px; border: 1px solid #44403c; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1c1917 0%, #292524 100%); padding: 32px 28px 24px; border-bottom: 1px solid #44403c; }
    .badge { display: inline-block; background-color: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px; }
    .title { font-size: 22px; font-weight: 700; color: #fafaf9; margin: 0 0 6px 0; font-family: Georgia, serif; }
    .subtitle { font-size: 13px; color: #a8a29e; margin: 0; }
    .content { padding: 28px; }
    .framework-card { background-color: #1c1917; border-radius: 12px; border: 1px solid #44403c; padding: 20px; margin-bottom: 24px; }
    .framework-title { color: #f59e0b; font-size: 16px; font-weight: 600; margin: 0 0 8px 0; }
    .framework-desc { color: #d6d3d1; font-size: 13px; margin: 0 0 16px 0; line-height: 1.5; }
    .question-list { margin: 0; padding-left: 20px; color: #e7e5e4; font-size: 13px; }
    .question-list li { margin-bottom: 10px; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0c0a09; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 8px; text-align: center; }
    .footer { padding: 20px 28px; background-color: #1c1917; border-top: 1px solid #44403c; text-align: center; font-size: 12px; color: #78716c; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">Monthly Strategic Checkpoint &bull; 15th of the Month</div>
      <h1 class="title">Time for Your Monthly Strategic Journal</h1>
      <p class="subtitle">A dedicated moment to calibrate vision, audit trajectory, and write your monthly synthesis.</p>
    </div>
    
    <div class="content">
      <p style="color: #e7e5e4; font-size: 14px; margin-top: 0;">
        Greetings, <strong>${payload.recipientEmail}</strong>! Today is the 15th — the midpoint of the month. Take 15 minutes today to step back from the tactical weeds, evaluate high-leverage outcomes, and record your strategic reflection.
      </p>

      <div class="framework-card">
        <h2 class="framework-title">${fw.title}</h2>
        <p class="framework-desc">${fw.description}</p>
        
        <p style="color: #fbbf24; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">Guiding Prompt Questions:</p>
        <ul class="question-list">
          ${fw.guidingQuestions.map((q) => `<li>${q}</li>`).join('')}
        </ul>
      </div>

      <div style="text-align: center; margin: 28px 0 12px 0;">
        <a href="https://ai.studio/build" class="cta-btn" target="_blank">
          Open Personal Gemini Journal &rarr;
        </a>
      </div>
      
      <p style="text-align: center; font-size: 12px; color: #a8a29e; margin-bottom: 0;">
        ${fw.actionPrompt}
      </p>
    </div>

    <div class="footer">
      Sent with security &amp; privacy by <strong>Personal Gemini Journal</strong> &bull; Tenant Isolated Cloud Firestore
      <br>
      You are receiving this because you enabled monthly reminders on the 15th of each month for ${payload.recipientEmail}.
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Sends the monthly reminder email directly using the user's Gmail OAuth access token
 */
export async function sendMonthlyReminderEmailViaGmail(params: {
  recipientEmail: string;
  frameworkKey: string;
  dayOfMonth?: number;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { recipientEmail, frameworkKey, dayOfMonth = 15 } = params;

  let accessToken = getCachedGoogleAccessToken();
  if (!accessToken) {
    // Attempt sign in to acquire token if missing
    try {
      const authResult = await signInWithGoogle();
      accessToken = authResult.accessToken || getCachedGoogleAccessToken();
    } catch (e: any) {
      return {
        success: false,
        error: `Gmail authorization required: ${e.message || 'Please sign in with Google to authorize sending reminders.'}`,
      };
    }
  }

  if (!accessToken) {
    return {
      success: false,
      error: 'Unable to obtain Gmail OAuth token. Please click "Authorize Gmail" and confirm permissions.',
    };
  }

  const frameworkDetails = FRAMEWORKS[frameworkKey] || FRAMEWORKS['swot'];
  const subject = `[15th of the Month] Strategic Journal Reminder: ${frameworkDetails.title}`;
  const htmlContent = generateReminderEmailHtml({
    recipientEmail,
    frameworkName: frameworkDetails.title,
    dayOfMonth,
    frameworkDetails,
  });

  const raw = createRawEmail(recipientEmail, subject, htmlContent);

  try {
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMsg = errorBody.error?.message || `Gmail API responded with status ${response.status}`;
      return { success: false, error: errorMsg };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error: any) {
    console.error('Failed to send Gmail message:', error);
    return { success: false, error: error.message || 'Network error while sending email via Gmail.' };
  }
}
