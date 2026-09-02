export type AIPersona = 'reflective' | 'brainstormer' | 'socratic' | 'strategist' | 'stoic';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface SentimentTrajectory {
  startMood: string;
  endMood: string;
  arc: string;
}

export interface MindMapNode {
  category: string;
  points: string[];
}

export interface EntrySynthesis {
  title: string;
  summaryMarkdown: string;
  keyInsights: string[];
  actionItems: string[];
  sentimentTrajectory: SentimentTrajectory;
  tags: string[];
  mindMapNodes?: MindMapNode[];
  synthesizedAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  persona: AIPersona;
  messages: ChatMessage[];
  synthesis?: EntrySynthesis;
  isVaultEncrypted?: boolean;
  encryptedPayload?: string; // Base64 ciphertext if encrypted
  tags: string[];
  favorite?: boolean;
  wordCount?: number;
  actionItemsCompleted?: Record<string, boolean>;
}

export interface SparkPrompt {
  id: string;
  category: string;
  headline: string;
  promptText: string;
  iconType: 'spark' | 'brain' | 'heart' | 'target' | 'shield';
}

export interface SecurityAuditData {
  securityConstitutionVersion: string;
  threatModel: {
    strideCompliant: boolean;
    authEnforcement: string;
    dataIsolation: string;
    keyManagement: string;
    browserKeyLeakageRisk: string;
    clientVaultEncryptionSupport: string;
  };
  secretAudit: {
    keyProvisioned: boolean;
    keyMask: string;
    keyLength: string;
    managedLocation: string;
  };
}

export interface MonthlyReminderConfig {
  enabled: boolean;
  recipientEmail: string;
  dayOfMonth: number; // default 15
  sendTime: string; // e.g. "09:00"
  strategicFramework: 'architecture-planning' | 'swot' | 'okr' | 'eisenhower' | 'first-principles' | 'four-burners';
  includePromptQuestions: boolean;
  lastSentAt?: number | null;
  lastSentStatus?: string | null;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

