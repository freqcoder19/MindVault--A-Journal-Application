import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot,
  limit
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { JournalEntry, SecurityAuditLog, UserPreferences } from "../types";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Deeply remove any undefined keys so Firestore setDoc / updateDoc never rejects the payload
export function removeUndefinedFields<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined)
      .map(item => removeUndefinedFields(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedFields(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

// User-scoped path builders (Security Constitution Mandate)
export function getEntriesCollection(userId: string) {
  if (!userId) throw new Error("Security Violation: Cannot access collection without authenticated UID");
  return collection(db, "users", userId, "entries");
}

export function getConversationsCollection(userId: string) {
  if (!userId) throw new Error("Security Violation: Cannot access collection without authenticated UID");
  return collection(db, "users", userId, "conversations");
}

export function getMessagesCollection(userId: string, conversationId: string) {
  if (!userId || !conversationId) throw new Error("Security Violation: Cannot access messages without authenticated UID and conversation ID");
  return collection(db, "users", userId, "conversations", conversationId, "messages");
}

export function getLogsCollection(userId: string) {
  if (!userId) throw new Error("Security Violation: Cannot access audit logs without authenticated UID");
  return collection(db, "users", userId, "security_audit_logs");
}

export function getSettingsDoc(userId: string) {
  if (!userId) throw new Error("Security Violation: Cannot access settings without authenticated UID");
  return doc(db, "users", userId, "settings", "preferences");
}

// Ensures the parent /users/{userId} document exists with basic metadata so it renders in Firestore console
export async function ensureUserDocument(userId: string, email?: string | null, displayName?: string | null): Promise<void> {
  if (!userId) return;
  try {
    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, removeUndefinedFields({
      uid: userId,
      email: email || auth.currentUser?.email || undefined,
      displayName: displayName || auth.currentUser?.displayName || undefined,
      lastActiveAt: new Date().toISOString(),
    }), { merge: true });
  } catch (err) {
    console.warn("Could not ensure user parent document:", err);
  }
}

// Subscribe to real-time entries
export function subscribeToEntries(userId: string, onUpdate: (entries: JournalEntry[]) => void, onError?: (err: Error) => void) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const entriesQuery = query(getEntriesCollection(userId), orderBy("createdAt", "desc"));

  return onSnapshot(
    entriesQuery,
    (snapshot) => {
      const list: JournalEntry[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as Omit<JournalEntry, 'id'>) });
      });
      onUpdate(list);
    },
    (error) => {
      console.error("Firestore subscription error for path /users/" + userId + "/entries:", error);
      if (onError) onError(error);
    }
  );
}

// Subscribe to security audit logs
export function subscribeToAuditLogs(userId: string, onUpdate: (logs: SecurityAuditLog[]) => void) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const logsQuery = query(getLogsCollection(userId), orderBy("timestamp", "desc"), limit(50));

  return onSnapshot(
    logsQuery,
    (snapshot) => {
      const logs: SecurityAuditLog[] = [];
      snapshot.forEach((d) => {
        logs.push({ id: d.id, ...(d.data() as Omit<SecurityAuditLog, 'id'>) });
      });
      onUpdate(logs);
    },
    (err) => {
      console.warn("Audit logs subscription warning:", err);
    }
  );
}

// Create new journal entry in /users/{userId}/entries/{entryId}
export async function saveJournalEntry(userId: string, entry: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const path = `users/${userId}/entries`;
  try {
    // 1. Ensure the parent /users/{userId} document exists so it displays in the Firestore Console
    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, removeUndefinedFields({
      uid: userId,
      email: auth.currentUser?.email || undefined,
      displayName: auth.currentUser?.displayName || undefined,
      lastActiveAt: new Date().toISOString(),
    }), { merge: true });

    // 2. Create the entry document under /users/{userId}/entries/{entryId}
    const colRef = getEntriesCollection(userId);
    const newDocRef = doc(colRef);
    const now = new Date().toISOString();

    const fullEntry: JournalEntry = {
      ...entry,
      id: newDocRef.id,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    const cleanedData = removeUndefinedFields(fullEntry);
    await setDoc(newDocRef, cleanedData);
    await recordAuditLog(userId, "CREATE_ENTRY", "SUCCESS", `Created entry "${entry.title || 'Untitled'}" [ID: ${newDocRef.id.slice(0, 6)}...] at /users/${userId.slice(0,6)}.../entries/${newDocRef.id}`, "FIRESTORE_RULES");
    return newDocRef.id;
  } catch (error) {
    console.error("Failed to save journal entry to Firestore at", path, error);
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Update existing journal entry in /users/{userId}/entries/{entryId}
export async function updateJournalEntry(userId: string, entryId: string, updates: Partial<JournalEntry>): Promise<void> {
  const path = `users/${userId}/entries/${entryId}`;
  try {
    const docRef = doc(db, "users", userId, "entries", entryId);
    const cleanedUpdates = removeUndefinedFields({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, cleanedUpdates, { merge: true });

    await recordAuditLog(userId, "UPDATE_ENTRY", "SUCCESS", `Updated entry [ID: ${entryId.slice(0, 6)}...]`, "FIRESTORE_RULES");
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Delete journal entry in /users/{userId}/entries/{entryId}
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  const path = `users/${userId}/entries/${entryId}`;
  try {
    const docRef = doc(db, "users", userId, "entries", entryId);
    await deleteDoc(docRef);
    await recordAuditLog(userId, "DELETE_ENTRY", "SUCCESS", `Deleted entry [ID: ${entryId.slice(0, 6)}...]`, "FIRESTORE_RULES");
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Save message to conversation /users/{userId}/conversations/{conversationId}/messages/{messageId}
export async function saveConversationMessage(
  userId: string, 
  conversationId: string, 
  role: 'user' | 'assistant', 
  content: string,
  entryId?: string,
  title?: string
): Promise<string> {
  const messagePath = `users/${userId}/conversations/${conversationId}/messages`;
  try {
    const convDocRef = doc(db, "users", userId, "conversations", conversationId);
    const messagesCol = collection(db, "users", userId, "conversations", conversationId, "messages");
    const msgDocRef = doc(messagesCol);
    const now = new Date().toISOString();

    // Ensure parent conversation doc exists/is updated
    await setDoc(convDocRef, removeUndefinedFields({
      id: conversationId,
      userId,
      entryId: entryId || undefined,
      title: title || "Reflective AI Conversation",
      updatedAt: now,
    }), { merge: true });

    // Store message
    await setDoc(msgDocRef, removeUndefinedFields({
      id: msgDocRef.id,
      conversationId,
      userId,
      role,
      content,
      timestamp: now,
    }));

    return msgDocRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, messagePath);
  }
}

// Record security audit log
export async function recordAuditLog(
  userId: string,
  action: string,
  status: 'SUCCESS' | 'BLOCKED' | 'WARNING',
  details: string,
  securityLayer: SecurityAuditLog['securityLayer']
): Promise<void> {
  try {
    if (!userId) return;
    
    // Ensure parent /users/{userId} document exists
    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, removeUndefinedFields({
      uid: userId,
      email: auth.currentUser?.email || undefined,
      displayName: auth.currentUser?.displayName || undefined,
      lastActiveAt: new Date().toISOString(),
    }), { merge: true });

    const colRef = getLogsCollection(userId);
    const newDocRef = doc(colRef);
    const log: SecurityAuditLog = {
      id: newDocRef.id,
      userId,
      action,
      status,
      details,
      securityLayer,
      timestamp: new Date().toISOString(),
    };
    const cleaned = removeUndefinedFields(log);
    await setDoc(newDocRef, cleaned);
  } catch (err) {
    console.warn("Failed to record audit log:", err);
  }
}

// Fetch user preferences
export async function fetchUserPreferences(userId: string): Promise<UserPreferences | null> {
  const path = `users/${userId}/settings/preferences`;
  try {
    const docRef = getSettingsDoc(userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserPreferences;
    }
  } catch (e) {
    console.warn("Error loading preferences:", e);
  }
  return null;
}

// Save user preferences
export async function saveUserPreferences(userId: string, prefs: Partial<UserPreferences>): Promise<void> {
  const path = `users/${userId}/settings/preferences`;
  try {
    const docRef = getSettingsDoc(userId);
    const cleaned = removeUndefinedFields({
      userId,
      ...prefs,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Wipe all user data (Right to be Forgotten - GDPR Compliance)
export async function wipeAllUserData(userId: string): Promise<void> {
  if (!userId) return;

  const path = `users/${userId}`;
  try {
    // Delete all entries
    const entriesSnap = await getDocs(getEntriesCollection(userId));
    for (const d of entriesSnap.docs) {
      await deleteDoc(d.ref);
    }

    // Delete all audit logs
    const logsSnap = await getDocs(getLogsCollection(userId));
    for (const d of logsSnap.docs) {
      await deleteDoc(d.ref);
    }

    // Delete settings
    await deleteDoc(getSettingsDoc(userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

