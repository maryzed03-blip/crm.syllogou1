import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { getHubAuth } from "@/lib/firebase-clients";

// Bootstrap restriction; replace with server-managed role claims when adding board users.
const INITIAL_ADMIN_UID = "xEkPHe63dvSfvocPny9J97xXNXh1";
export function HubAuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const auth = getHubAuth();
  useEffect(() => {
    if (!auth) { setError("Δεν είναι διαθέσιμο το Firebase Authentication."); setUser(null); return; }
    return onAuthStateChanged(auth, setUser, () => { setUser(null); setError("Αποτυχία ελέγχου σύνδεσης."); });
  }, [auth]);
  if (user === undefined) return <div className="min-h-screen grid place-items-center">Έλεγχος σύνδεσης…</div>;
  if (user && user.uid === INITIAL_ADMIN_UID) return <>
    <div className="fixed bottom-3 right-3 z-50"><button className="rounded border bg-white px-3 py-1.5 text-xs shadow" onClick={() => auth && signOut(auth)}>Αποσύνδεση</button></div>
    {children}
  </>;
  const wrongAccount = !!user;
  return <main className="min-h-screen grid place-items-center bg-slate-50 p-4">
    <section className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm space-y-4">
      <h1 className="text-xl font-semibold">Διαχείριση Συλλόγου</h1>
      <p className="text-sm text-slate-600">Είσοδος εξουσιοδοτημένου διαχειριστή</p>
      {wrongAccount ? <>
        <p className="text-sm text-red-700">Ο συνδεδεμένος λογαριασμός δεν έχει πρόσβαση στη Διαχείριση.</p>
        <button className="rounded border px-3 py-2" onClick={() => auth && signOut(auth)}>Αποσύνδεση</button>
      </> : <form className="space-y-3" onSubmit={async e => {
        e.preventDefault(); if (!auth) return;
        setError(""); setBusy(true);
        try { await signInWithEmailAndPassword(auth, email, password); setPassword(""); }
        catch { setError("Αποτυχία εισόδου. Έλεγξε τα στοιχεία του λογαριασμού σου."); }
        finally { setBusy(false); }
      }}>
        <label className="block text-sm">Email<input required autoComplete="username" type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded border p-2" /></label>
        <label className="block text-sm">Κωδικός<input required autoComplete="current-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded border p-2" /></label>
        <button disabled={busy} className="w-full rounded bg-slate-900 p-2 text-white disabled:opacity-50">{busy ? "Σύνδεση…" : "Σύνδεση"}</button>
      </form>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </section>
  </main>;
}
