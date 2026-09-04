import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { Goal } from "../types";
import { removeUndefinedFields, handleFirestoreError, OperationType } from "./journalService";

/**
 * User-scoped path builder for Goals (Security Constitution Mandate)
 * Path: /users/{userId}/goals
 */
export function getGoalsCollection(userId: string) {
  if (!userId) {
    throw new Error("Security Violation: Cannot access goals collection without authenticated UID");
  }
  return collection(db, "users", userId, "goals");
}

/**
 * Validates and sanitizes goal input
 */
export function validateGoalInput(data: {
  title: string;
  description?: string;
  targetDate?: string;
}): { title: string; description?: string; targetDate?: string } {
  const title = (data.title || "").trim();
  if (!title) {
    throw new Error("Goal title is required.");
  }
  if (title.length > 120) {
    throw new Error("Goal title must be 120 characters or less.");
  }

  let description: string | undefined = undefined;
  if (data.description !== undefined && data.description !== null) {
    const trimmedDesc = data.description.trim();
    if (trimmedDesc.length > 500) {
      throw new Error("Goal description must be 500 characters or less.");
    }
    if (trimmedDesc.length > 0) {
      description = trimmedDesc;
    }
  }

  let targetDate: string | undefined = undefined;
  if (data.targetDate && data.targetDate.trim()) {
    const trimmedDate = data.targetDate.trim();
    // Validate simple YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
      targetDate = trimmedDate;
    } else {
      throw new Error("Target date must be in YYYY-MM-DD format.");
    }
  }

  return { title, description, targetDate };
}

/**
 * Real-time subscription to authenticated user's goals
 */
export function subscribeToGoals(
  userId: string,
  onUpdate: (goals: Goal[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const path = `users/${userId}/goals`;
  try {
    const q = query(
      getGoalsCollection(userId),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const goals: Goal[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            userId: data.userId || userId,
            title: data.title || "Untitled Goal",
            description: data.description || undefined,
            targetDate: data.targetDate || undefined,
            status: data.status === "completed" ? "completed" : "active",
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
            completedAt: data.completedAt || null,
          };
        });
        onUpdate(goals);
      },
      (error) => {
        console.error(`[GoalService] Subscription error on ${path}:`, error);
        if (onError) {
          onError(error);
        }
      }
    );
  } catch (err: any) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
}

/**
 * Creates a new personal goal strictly under /users/{userId}/goals/{goalId}
 */
export async function createGoal(
  userId: string,
  data: {
    title: string;
    description?: string;
    targetDate?: string;
  }
): Promise<Goal> {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid || currentUid !== userId) {
    throw new Error("Security Violation: Cannot create goal for unverified user identity.");
  }

  const sanitized = validateGoalInput(data);
  const now = new Date().toISOString();
  const goalRef = doc(getGoalsCollection(userId));
  const goalId = goalRef.id;

  const newGoal: Goal = {
    id: goalId,
    userId,
    title: sanitized.title,
    description: sanitized.description,
    targetDate: sanitized.targetDate,
    status: "active",
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };

  const path = `users/${userId}/goals/${goalId}`;
  try {
    const payload = removeUndefinedFields(newGoal);
    await setDoc(goalRef, payload);
    return newGoal;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

/**
 * Updates an existing goal
 */
export async function updateGoal(
  userId: string,
  goalId: string,
  data: {
    title: string;
    description?: string;
    targetDate?: string;
  }
): Promise<void> {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid || currentUid !== userId) {
    throw new Error("Security Violation: Cannot update goal for unverified user identity.");
  }

  const sanitized = validateGoalInput(data);
  const path = `users/${userId}/goals/${goalId}`;
  const goalRef = doc(db, "users", userId, "goals", goalId);

  try {
    const updatePayload = removeUndefinedFields({
      title: sanitized.title,
      description: sanitized.description || null,
      targetDate: sanitized.targetDate || null,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(goalRef, updatePayload, { merge: true });
  } catch (err: any) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Toggles a goal's status between 'active' and 'completed'
 */
export async function toggleGoalStatus(
  userId: string,
  goalId: string,
  currentStatus: "active" | "completed"
): Promise<void> {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid || currentUid !== userId) {
    throw new Error("Security Violation: Cannot modify goal for unverified user identity.");
  }

  const path = `users/${userId}/goals/${goalId}`;
  const goalRef = doc(db, "users", userId, "goals", goalId);
  const newStatus: "active" | "completed" = currentStatus === "active" ? "completed" : "active";
  const now = new Date().toISOString();

  try {
    const updatePayload = removeUndefinedFields({
      status: newStatus,
      updatedAt: now,
      completedAt: newStatus === "completed" ? now : null,
    });
    await setDoc(goalRef, updatePayload, { merge: true });
  } catch (err: any) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Deletes a goal permanently
 */
export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid || currentUid !== userId) {
    throw new Error("Security Violation: Cannot delete goal for unverified user identity.");
  }

  const path = `users/${userId}/goals/${goalId}`;
  const goalRef = doc(db, "users", userId, "goals", goalId);

  try {
    await deleteDoc(goalRef);
  } catch (err: any) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
