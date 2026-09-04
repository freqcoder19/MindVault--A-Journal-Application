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

export interface JournalImage {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  size: number;
  mimeType: string;
  createdAt: string;
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
  images?: JournalImage[]; // Up to 2 private journal memory photos (Firebase Storage)
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
  role?: 'user' | 'admin';
  isAdmin?: boolean;
  tokenVerificationEngine?: string;
  appCheckEnforced?: boolean;
  appCheckEngine?: string;
  backendIsolationEnforced: boolean;
  storageIsolationEnforced?: boolean;
  secretManagerConfigured?: boolean;
  secretManagerGuarded?: boolean;
  firestoreRulesEnforced: boolean;
  cloudProject: string;
  databaseId: string;
}

export interface ThoughtLoopPattern {
  theme: string;
  description: string;
  frequency: string;
  trend: 'Increasing' | 'Decreasing' | 'Stable' | 'Fluctuating';
  relatedThemes: string[];
  emotionalTrend: string;
  reflectiveInsight: string;
  reflectionQuestion: string;
}

export interface ThoughtLoopAnalysis {
  recurringPatterns: ThoughtLoopPattern[];
  overallSummary: string;
  dominantEmotionalArc: string;
  entriesAnalyzedCount: number;
  insufficientData: boolean;
  message?: string;
  analyzedAt: string;
}

export interface AdminAggregateTheme {
  theme: string;
  aggregateOccurrences: number;
}

export interface AdminAggregateMetrics {
  totalUserCount: number;
  totalJournalEntryCount: number;
  totalAIRequestCount: number;
  authFailureCount: number;
  appCheckFailureCount?: number;
  rateLimitEventCount: number;
  aiRequestsByType: {
    reflection: number;
    chat: number;
    sentiment: number;
    thoughtLoops: number;
    prompts: number;
    digest: number;
  };
  aggregateThoughtLoopThemes: AdminAggregateTheme[];
  uptimeSeconds: number;
  serverStartedAt: string;
}

export interface AdminSecurityPosture {
  tokenVerificationEngine: string;
  appCheckEngine?: string;
  appCheckEnforced?: boolean;
  backendIsolationEnforced: boolean;
  secretManagerConfigured: boolean;
  secretManagerDiagnostic: string;
  geminiAuthEngine: string;
  selectedModel: string;
  vertexLocation: string;
  rateLimiterActive: boolean;
  firestoreRulesEnforced: boolean;
  adminAccessType: string;
  rawJournalAccessDisabled: boolean;
}

export interface AdminDashboardData {
  success: boolean;
  role: 'ADMIN';
  privacyAssurance: string;
  aggregateMetrics: AdminAggregateMetrics;
  securityPosture: AdminSecurityPosture;
  generatedAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetDate?: string; // YYYY-MM-DD
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface MonthlyReflection {
  monthKey: string; // e.g. '2026-09'
  monthLabel: string; // e.g. 'September 2026'
  monthInASentence: string;
  positiveMoments: string[];
  challengesAndDowns: string[];
  whatYouLearned: string[];
  carryingForward: string;
  generatedAt: string;
  entryCount: number;
}

