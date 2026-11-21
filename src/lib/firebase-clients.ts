import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getDatabase, type Database } from "firebase/database";

const HUB_APP_NAME = "boardCentralHub";
const CALENDAR_APP_NAME = "associationCalendar";

function hubConfig() {
  return {
    apiKey: "AIzaSyBNTDHTxDfOHDaRL6HwpmZbJaMuX0t8U6U",
    authDomain: "diaxeirisi-syllogoy.firebaseapp.com",
    projectId: "diaxeirisi-syllogoy",
    storageBucket: "diaxeirisi-syllogoy.firebasestorage.app",
    messagingSenderId: "869593980656",
    appId: "1:869593980656:web:1f5b22fe9ee7a799422c35",
    databaseURL: "https://diaxeirisi-syllogoy-default-rtdb.europe-west1.firebasedatabase.app",
  };
}

export function isHubFirebaseConfigured() {
  const config = hubConfig();
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
}

function namedApp(name: string, create: () => FirebaseApp) {
  return getApps().find((app) => app.name === name) ?? create();
}

export function getHubFirebaseApp(): FirebaseApp | null {
  if (!isHubFirebaseConfigured()) return null;
  const config = hubConfig();
  return namedApp(HUB_APP_NAME, () => initializeApp(config, HUB_APP_NAME));
}

export function getHubRealtimeDatabase(): Database | null {
  const app = getHubFirebaseApp();
  return app ? getDatabase(app) : null;
}

export function getHubAuth() {
  const app = getHubFirebaseApp();
  return app ? getAuth(app) : null;
}

export function getHubFirestore(): Firestore | null {
  const app = getHubFirebaseApp();
  return app ? getFirestore(app) : null;
}

export async function ensureHubAnonymousAuth() {
  const app = getHubFirebaseApp();
  if (!app) return null;
  const auth = getAuth(app);
  if (auth.currentUser) return auth.currentUser;
  const result = await signInAnonymously(auth);
  return result.user;
}

// Δημόσιο Firebase config του υπάρχοντος ημερολογίου. Τα πραγματικά δικαιώματα
// εξακολουθούν να ελέγχονται από Firebase Auth + Firestore Rules.
const calendarConfig = {
  apiKey: "AIzaSyCBimPw1xvGMUyRZomN60ZJKpU9ZcvTovw",
  authDomain: "imerologiosullogou.firebaseapp.com",
  projectId: "imerologiosullogou",
  storageBucket: "imerologiosullogou.firebasestorage.app",
  messagingSenderId: "595458367967",
  appId: "1:595458367967:web:8609d1ace41d7dfda7e46a",
};

export function getCalendarFirebaseApp(): FirebaseApp {
  return namedApp(CALENDAR_APP_NAME, () => initializeApp(calendarConfig, CALENDAR_APP_NAME));
}

export function getCalendarFirestore(): Firestore {
  return getFirestore(getCalendarFirebaseApp());
}

export async function ensureCalendarAnonymousAuth() {
  const app = getCalendarFirebaseApp();
  const auth = getAuth(app);
  if (auth.currentUser) return auth.currentUser;
  const result = await signInAnonymously(auth);
  return result.user;
}

const mapConfig = {
  apiKey: "AIzaSyCodx-CuHNysOVROtLcCuRtgxcB4oovPVc",
  authDomain: "syllogos-map.firebaseapp.com", projectId: "syllogos-map",
  storageBucket: "syllogos-map.firebasestorage.app", messagingSenderId: "399287687870",
  appId: "1:399287687870:web:5a1953623334e676af9cef",
};
export function getMapFirebaseApp() { return namedApp("associationTherapistMap", () => initializeApp(mapConfig, "associationTherapistMap")); }
