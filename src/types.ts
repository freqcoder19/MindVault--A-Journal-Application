export type MoodType = 
  | 'ecstatic' 
  | 'grateful' 
  | 'calm' 
  | 'focused' 
  | 'reflective' 
  | 'anxious' 
  | 'exhausted' 
  | 'grieving' 
  | 'frustrated' 
  | 'hopeful';

export interface MoodMeta {
  type: MoodType;
  label: string;
  score: number; // 1 to 5
  color: string;
  bgColor: string;
  emoji: string;
}

export type PersonaType = 'empathetic' | 'socratic' | 'cbt' | 'stoic' | 'actionable';

export interface PersonaMeta {
  id: PersonaType;
  name: string;
  subtitle: string;
  description: string;
  iconName: string;
  badgeColor: string;
}

export interface AIReflectionData {
  reflection: string;
  keyThemes: string[];
  cognitiveReframe: string;
  inquiryQuestions: string[];
  sentimentSummary: string;
  actionableNudge?: string;
  personaUsed?: PersonaType;
  generatedAt: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  userId: string;
  entryId?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood: MoodType;
  moodScore: number;
  tags: string[];
  isEncrypted: boolean;
  isLocked?: boolean;
  encryptedPayload?: string; // Ciphertext if client zero-knowledge vault is enabled
  aiReflection?: AIReflectionData | null;
  aiChatHistory?: AIChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SecurityAuditLog {
  id: string;
  userId: string;
  action: string;
  status: 'SUCCESS' | 'BLOCKED' | 'WARNING';
  details: string;
  ipMasked?: string;
  securityLayer: 'FIREBASE_AUTH' | 'EXPRESS_BACKEND' | 'FIRESTORE_RULES' | 'GEMINI_GATEWAY' | 'CLIENT_VAULT';
  timestamp: string;
}

export interface UserPreferences {
  userId: string;
  defaultPersona: PersonaType;
  autoReflect: boolean;
  enablePasskeyLock: boolean;
  passkeyHash?: string;
  theme: 'dark-obsidian' | 'warm-amber' | 'slate-minimal';
  allowAiDiagnostics: boolean;
}

export interface DigestReport {
  executiveSummary: string;
  dominantEmotions: Array<{ emotion: string; frequency: string; context: string }>;
  growthBreakthroughs: string[];
  latentStressors: string[];
  weeklyRecommendation: string;
  timeframe: string;
  generatedAt: string;
}

export interface IntrospectivePrompt {
  category: string;
  title: string;
  promptText: string;
  estimatedMinutes: number;
  tags: string[];
}

export interface SecurityStatusReport {
  authStatus: 'verified' | 'unauthenticated' | 'invalid_token';
  verifiedUid: string | null;
  backendIsolationEnforced: boolean;
  secretManagerGuarded: boolean;
  firestoreRulesEnforced: boolean;
  cloudProject: string;
  databaseId: string;
}
