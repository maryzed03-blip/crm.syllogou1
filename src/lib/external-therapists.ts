import { collection, onSnapshot } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getMapFirebaseApp } from "@/lib/firebase-clients";
import type { TherapistDirectoryEntry } from "@/lib/club-data";

export async function subscribeTherapists(onValue: (items: TherapistDirectoryEntry[]) => void, onError: (message: string) => void) {
  const app = getMapFirebaseApp();
  const auth = getAuth(app);
  if (!auth.currentUser) await signInAnonymously(auth);
  return onSnapshot(collection(getFirestore(app), "therapists"), (snapshot) => {
    onValue(snapshot.docs.map((doc) => {
      const raw = doc.data();
      const str = (name: string) => typeof raw[name] === "string" ? raw[name] as string : "";
      return { id: doc.id, name: str("name"), role: str("role"), area: str("area"), prefecture: str("prefecture"), photo: str("photo"), email: str("email") };
    }).filter((item) => item.name).sort((a,b) => a.name.localeCompare(b.name, "el")));
  }, (error) => onError(error.message));
}
