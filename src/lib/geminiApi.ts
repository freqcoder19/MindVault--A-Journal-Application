import { getUserIdToken, getAppCheckToken } from "./firebase";
import { PersonaType, AIReflectionData, AIChatMessage, DigestReport, IntrospectivePrompt, ThoughtLoopAnalysis, AdminDashboardData, MonthlyReflection } from "../types";

export interface ReflectParams {
  content: string;
  mood?: string;
  moodScore?: number;
  tags?: string[];
  persona?: PersonaType;
  promptIntent?: string;
  entryId?: string;
}

// Helper to construct authenticated + App Check attested headers
async function buildSecureHeaders(includeAuth = true): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (includeAuth) {
    const token = await getUserIdToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  // App Check attestation token (attests that request comes from authentic MindVault client)
  try {
    const appCheckToken = await getAppCheckToken();
    if (appCheckToken) {
      headers["X-Firebase-AppCheck"] = appCheckToken;
    }
  } catch (err) {
    console.warn("[AppCheck] Token retrieval notice:", err);
  }

  return headers;
}

// Request AI Reflection from trusted backend (/api/reflect or /api/gemini/reflect)
export async function requestAIReflection(params: ReflectParams): Promise<AIReflectionData> {
  const token = await getUserIdToken();
  if (!token) {
    throw new Error("Authentication required: Please sign in to request Gemini reflections.");
  }

  const headers = await buildSecureHeaders(true);
  const response = await fetch("/api/reflect", {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Network error" }));
    throw new Error(errorData.error || `Server returned ${response.status}`);
  }

  const data = await response.json();
  return {
    ...data.result,
    personaUsed: params.persona || 'empathetic',
    generatedAt: data.reflectedAt || new Date().toISOString(),
  };
}

// Interactive chat dialog on entry (/api/chat or /api/gemini/dialog)
export interface GeminiCompanionChatParams {
  currentMessage: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  entryId?: string;
  entryContent?: string;
  conversationId?: string;
}

export async function sendGeminiCompanionChat(params: GeminiCompanionChatParams): Promise<string> {
  const token = await getUserIdToken();
  if (!token) {
    throw new Error("Authentication required: Please sign in to talk with Gemini.");
  }

  const headers = await buildSecureHeaders(true);
  const response = await fetch("/api/chat", {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Dialog error" }));
    throw new Error(err.error || "Failed to communicate with Gemini");
  }

  const data = await response.json();
  return data.reply;
}

export async function sendEntryDialog(
  entryContent: string, 
  messages: AIChatMessage[], 
  currentMessage: string,
  conversationId?: string,
  entryId?: string
): Promise<string> {
  return sendGeminiCompanionChat({
    entryContent,
    history: messages.map(m => ({ role: m.role, content: m.content })),
    currentMessage,
    conversationId,
    entryId
  });
}

// Generate weekly/trend digest from entries
export async function generateWeeklyDigest(entries: any[], timeframe: string = "Past 7 Days"): Promise<DigestReport> {
  const token = await getUserIdToken();
  if (!token) {
    throw new Error("Authentication required.");
  }

  const headers = await buildSecureHeaders(true);
  const response = await fetch("/api/digest", {
    method: "POST",
    headers,
    body: JSON.stringify({ entries, timeframe }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Digest error" }));
    throw new Error(err.error || "Failed to generate digest");
  }

  const data = await response.json();
  return {
    ...data.digest,
    timeframe,
    generatedAt: data.generatedAt || new Date().toISOString(),
  };
}

// Fetch personalized guided prompts
export async function fetchPersonalizedPrompts(recentMoods: string[], preferredFocus: string): Promise<IntrospectivePrompt[]> {
  const token = await getUserIdToken();
  if (!token) {
    throw new Error("Authentication required.");
  }

  const headers = await buildSecureHeaders(true);
  const response = await fetch("/api/prompts", {
    method: "POST",
    headers,
    body: JSON.stringify({ recentMoods, preferredFocus }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Prompt generation error" }));
    throw new Error(err.error || "Failed to fetch prompts");
  }

  const data = await response.json();
  return data.prompts || [];
}

// Request Sentiment Analysis
export async function requestSentimentAnalysis(text: string): Promise<any> {
  const token = await getUserIdToken();
  if (!token) {
    throw new Error("Authentication required.");
  }

  const headers = await buildSecureHeaders(true);
  const response = await fetch("/api/sentiment", {
    method: "POST",
    headers,
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Sentiment error" }));
    throw new Error(err.error || "Failed to analyze sentiment");
  }

  const data = await response.json();
  return data.sentiment;
}

// Fetch Thought Loop Detector analysis across user's private journal history
export async function fetchThoughtLoops(): Promise<ThoughtLoopAnalysis> {
  const token = await getUserIdToken();
  if (!token) {
    throw new Error("Authentication required: Please sign in to analyze your thought patterns.");
  }

  const headers = await buildSecureHeaders(true);
  const response = await fetch("/api/thought-loops", {
    method: "POST",
    headers,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || `Failed to analyze thought loops (${response.status})`);
  }

  const data = await response.json();
  return {
    recurringPatterns: data.recurringPatterns || [],
    overallSummary: data.overallSummary || "",
    dominantEmotionalArc: data.dominantEmotionalArc || "",
    entriesAnalyzedCount: data.entriesAnalyzedCount || 0,
    insufficientData: Boolean(data.insufficientData),
    message: data.message,
    analyzedAt: data.analyzedAt || new Date().toISOString(),
  };
}

// Fetch backend security status
export async function fetchSecurityStatus(): Promise<any> {
  const headers = await buildSecureHeaders(false);
  const token = await getUserIdToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch("/api/security/status", { headers });
  if (!response.ok) throw new Error("Failed to query security status");
  return response.json();
}

// Fetch Admin Aggregate Dashboard (Protected: Verified ADMIN role + App Check required)
export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  const token = await getUserIdToken();
  if (!token) {
    throw new Error("Authentication required: Please sign in with an administrative account.");
  }

  const headers = await buildSecureHeaders(true);
  const response = await fetch("/api/admin/dashboard", {
    method: "GET",
    headers,
  });

  if (response.status === 403) {
    const err = await response.json().catch(() => ({ error: "Forbidden" }));
    throw new Error(err.error || "Access Denied: Administrative privileges required. Non-admin users cannot access system telemetry.");
  }

  if (response.status === 401) {
    const err = await response.json().catch(() => ({ error: "Unauthorized" }));
    throw new Error(err.error || "Authentication required: Invalid or expired token / App Check failure.");
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || `Failed to fetch admin dashboard (${response.status})`);
  }

  return response.json();
}

// Fetch Dedicated Admin Aggregate Telemetry (Protected: Verified Single Admin barathsuresh19@gmail.com)
export async function fetchAdminTelemetry(): Promise<any> {
  const token = await getUserIdToken();
  if (!token) {
    throw new Error("Authentication required: Please sign in as the administrator.");
  }

  const headers = await buildSecureHeaders(true);
  const response = await fetch("/api/admin/telemetry", {
    method: "GET",
    headers,
  });

  if (response.status === 403) {
    const err = await response.json().catch(() => ({ error: "Forbidden" }));
    throw new Error(err.error || "Access Denied: Administrative privileges required.");
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || `Failed to fetch admin telemetry (${response.status})`);
  }

  return response.json();
}

// Generate Monthly Reflection via secure Gemini backend (/api/monthly-reflection)
export async function generateMonthlyReflection(
  entries: any[],
  monthKey: string
): Promise<{ reflection: MonthlyReflection | null; message?: string; entryCount: number }> {
  const token = await getUserIdToken();
  if (!token) {
    throw new Error("Authentication required: Please sign in to reflect on this month.");
  }

  const headers = await buildSecureHeaders(true);
  const response = await fetch("/api/monthly-reflection", {
    method: "POST",
    headers,
    body: JSON.stringify({
      month: monthKey,
      entries: entries.map((e) => ({
        id: e.id,
        createdAt: e.createdAt,
        title: e.title,
        mood: e.mood,
        moodScore: e.moodScore,
        tags: e.tags,
        content: e.content,
      })),
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || `Failed to generate monthly reflection (${response.status})`);
  }

  const data = await response.json();
  return {
    reflection: data.reflection || null,
    message: data.message,
    entryCount: data.entryCount || 0,
  };
}


