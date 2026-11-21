// Retain the public module API while migrating Hub operations from Firestore to RTDB.
// Data is stored ONLY under appData/; existing Calendar/Map databases are untouched.
import { onValue, ref, remove, set, type Database } from "firebase/database";
import { getHubAuth, getHubRealtimeDatabase, isHubFirebaseConfigured } from "@/lib/firebase-clients";

export type HubCollection =
  | "board_members" | "tasks" | "workflow_templates" | "meeting_minutes"
  | "people" | "person_activity" | "payments" | "seminar_agreements"
  | "seminar_price_rules" | "membership_dues" | "seminars" | "contacts"
  | "contact_lists" | "newsletters" | "member_applications"
  | "monthly_archives" | "system_meta";

export function hubCloudEnabled() { return isHubFirebaseConfigured(); }

function readyDb(): Database {
  const db = getHubRealtimeDatabase();
  const auth = getHubAuth();
  if (!db || !auth?.currentUser) throw new Error("Απαιτείται σύνδεση με εξουσιοδοτημένο λογαριασμό.");
  return db;
}

function safeId(id: string) {
  // RTDB keys cannot contain . # $ [ ] / and control chars.
  // Encode all IDs reversibly, avoiding collisions and preserving Unicode.
  return encodeURIComponent(id).replace(/\./g, "%2E");
}
function sanitize<T>(value: T): T {
  if (Array.isArray(value)) return value.map(sanitize) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, sanitize(v)])) as T;
  }
  return value;
}
function path(collectionName: HubCollection, id?: string) {
  return `appData/${collectionName}` + (id === undefined ? "" : `/${safeId(id)}`);
}

export async function seedAndSubscribe<T extends { id: string }>(
  collectionName: HubCollection, _seed: T[], onItems: (items: T[]) => void,
  onError?: (error: Error) => void,
): Promise<() => void> {
  const db = readyDb();
  const r = ref(db, path(collectionName));
  // Never seed demo/local data to production.
  const unsubscribe = onValue(r, snapshot => {
    const values = snapshot.val() as Record<string, T> | null;
    onItems(values ? Object.values(values) : []);
  }, err => onError?.(err));
  return unsubscribe;
}

export async function saveHubEntity<T extends { id: string }>(collectionName: HubCollection, value: T) {
  const db = readyDb();
  await set(ref(db, path(collectionName, value.id)), sanitize(value));
  return true;
}
export async function deleteHubEntity(collectionName: HubCollection, id: string) {
  const db = readyDb();
  await remove(ref(db, path(collectionName, id)));
  return true;
}
// Intentionally disabled: do not run legacy destructive cleanup on any production database.
export async function runCleanSlateMigration() { return false; }
