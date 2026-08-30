import { getUserIdToken } from "./firebase";
import { PersonaType, AIReflectionData, AIChatMessage, DigestReport, IntrospectivePrompt } from "../types";

export interface ReflectParams {
  content: string;
  mood?: string;
  moodScore?: number;
  tags?: string[];
  persona?: PersonaType;
  promptIntent?: string;
}

// Request AI Reflection from trusted backend
export async function requestAIReflection(params: ReflectParams): Promise<AIReflectionData> {
  const token = await getUserIdToken();
  if (!token) {
    throw new Error("Authentication required: Please sign in to request Gemini reflections.");
  }

  const response = await fetch("/api/gemini/reflect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
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

// Interactive chat dialog on entry
export async function sendEntryDialog(entryContent: string, messages: AIChatMessage[], currentMessage: string): Promise<string> {
  const token = await getUserIdToken();
  if (!token) {
    throw new Error("Authentication required.");
  }

  const response = await fetch("/api/gemini/dialog", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      entryContent,
      messages,
      currentMessage,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Dialog error" }));
    throw new Error(err.error || "Failed to communicate with Gemini");
  }

  const data = await response.json();
  return data.reply;
}

// Generate weekly/trend digest from entries
export async function generateWeeklyDigest(entries: any[], timeframe: string = "Past 7 Days"): Promise<DigestReport> {
  const token = await getUserIdToken();
  if (!token) {
    throw new Error("Authentication required.");
  }

  const response = await fetch("/api/gemini/digest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
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

  const response = await fetch("/api/gemini/prompts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ recentMoods, preferredFocus }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Prompt generation error" }));
    throw new Error(err.error || "Failed to fetch prompts");
  }

  const data = await response.json();
  return data.prompts || [];
}

// Fetch backend security status
export async function fetchSecurityStatus(): Promise<any> {
  const token = await getUserIdToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch("/api/security/status", { headers });
  if (!response.ok) throw new Error("Failed to query security status");
  return response.json();
}
