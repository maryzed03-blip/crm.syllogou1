import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarCheck2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClub, euro, formatDate, type Person, type PersonKind } from "@/lib/club-data";

export const Route = createFileRoute("/meli")({
  head: () => ({ meta: [{ title: "Μητρώο — Κεντρικό Hub" }] }),
  component: MembersPage,
});

function MembersPage() {
  const { people, dues, personActivities, updatePersonKind, updatePersonApplication } = useClub();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<PersonKind>("Μέλος");
  const [fromDate, setFromDate] = useState("");
  const [selected, setSelected] = useState<Person | null>(null);
  const list = people.filter((p) => p.kind === tab && (!fromDate || (p.applicationDate || "") >= fromDate) && `${p.name} ${p.email}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold tracking-tight">Μητρώο Συλλόγου</h1>
      <p className="mt-1 text-sm text-muted-foreground">Μέλη, Φίλοι και Επισκέπτες σε ένα σημείο. Οι εγγραφές σε δράσεις ενημερώνουν αυτόματα το ιστορικό κάθε ανθρώπου.</p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as PersonKind)}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="Μέλος">Μέλη · {people.filter((p) => p.kind === "Μέλος").length}</TabsTrigger>
            <TabsTrigger value="Φίλος">Φίλοι · {people.filter((p) => p.kind === "Φίλος").length}</TabsTrigger>
            <TabsTrigger value="Επισκέπτης">Επισκέπτες · {people.filter((p) => p.kind === "Επισκέπτης").length}</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input className="max-w-sm" placeholder="Αναζήτηση ονόματος ή email…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2"><span className="text-sm text-muted-foreground">Αίτηση από:</span><Input type="date" className="w-44" value={fromDate} onChange={e=>setFromDate(e.target.value)}/><Button variant="outline" onClick={()=>setFromDate("")}>Καθαρισμός φίλτρου</Button></div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {list.map((person) => {
          const due = dues.find((d) => d.personId === person.id && d.year === 2026);
          const activities = personActivities.filter((activity) => activity.personId === person.id);
          return (
            <button key={person.id} type="button" onClick={() => setSelected(person)} className="text-left">
              <Card className="h-full p-4 transition hover:border-primary/40 hover:shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary"><UserRound className="size-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{person.name}</p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">{person.email}</p>
                    <p className="text-xs text-muted-foreground">{person.phone || "Χωρίς τηλέφωνο"} · στο μητρώο από {person.since}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{activities.length} καταχωρίσεις στο ιστορικό</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge variant={person.kind === "Μέλος" ? "default" : person.kind === "Φίλος" ? "secondary" : "outline"}>{person.kind}</Badge>
                    {person.kind !== "Επισκέπτης" && <Badge variant="outline" className={due?.status === "Πληρωμένη" ? "border-success text-success" : "border-warning text-warning"}>2026: {due?.status ?? "Άγνωστο"} · {euro(person.kind === "Μέλος" ? 20 : 10)}</Badge>}
                  </div>
                </div>
              </Card>
            </button>
          );
        })}
        {list.length === 0 && <Card className="p-7 text-sm text-muted-foreground">Δεν υπάρχουν καταχωρίσεις σε αυτή την κατηγορία.</Card>}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
          {selected && (() => {
            const activities = personActivities.filter((activity) => activity.personId === selected.id).sort((a, b) => b.date.localeCompare(a.date));
            return <>
              <DialogHeader><DialogTitle>{selected.name}</DialogTitle></DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Email</p><p className="mt-1 break-all text-sm font-medium">{selected.email}</p><p className="mt-3 text-xs text-muted-foreground">Τηλέφωνο</p><p className="mt-1 text-sm font-medium">{selected.phone || "—"}</p></div>
                <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Κατηγορία στο μητρώο</p><Select value={selected.kind} onValueChange={(value) => { const kind = value as PersonKind; updatePersonKind(selected.id, kind); setSelected({ ...selected, kind }); }}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Μέλος">Μέλος</SelectItem><SelectItem value="Φίλος">Φίλος</SelectItem><SelectItem value="Επισκέπτης">Επισκέπτης</SelectItem></SelectContent></Select><p className="mt-2 text-xs text-muted-foreground">Η κατηγορία αυτή χρησιμοποιείται αυτόματα και στα σεμινάρια.</p></div>
              </div>
              <div className="rounded-xl border p-4 space-y-2">
                <h3 className="font-semibold">Αίτηση μέλους / φίλου</h3>
                <p className="text-xs text-muted-foreground">Η μεταβολή ιδιότητας απαιτεί έλεγχο της αίτησης από τη Γραμματεία.</p>
                <label className="block text-xs" htmlFor="application-date">Ημερομηνία αίτησης</label>
                <Input id="application-date" type="date" defaultValue={selected.applicationDate || ""} key={`${selected.id}-date`} onBlur={e=>{if(e.target.value !== (selected.applicationDate || "")){updatePersonApplication(selected.id,e.target.value,selected.applicationDocumentUrl || "");setSelected({...selected,applicationDate:e.target.value});}}}/>
                <p className="text-xs text-muted-foreground">Ασφαλής μεταφόρτωση ιδιωτικού PDF: εκκρεμεί σύνδεση με Storage και δικαιώματα ανά ρόλο. Μην προσθέτεις δημόσιο URL με προσωπικά στοιχεία.</p>
              </div>
              <div>
                <div className="flex items-center justify-between"><h3 className="font-semibold">Ιστορικό στον Σύλλογο</h3><Badge variant="outline">{activities.length}</Badge></div>
                <div className="mt-3 space-y-2">
                  {activities.map((activity) => <div key={activity.id} className="flex items-start gap-3 rounded-xl border p-3"><CalendarCheck2 className="mt-0.5 size-4 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{activity.title}</p><p className="text-xs text-muted-foreground">{formatDate(activity.date)} · {activity.status}</p></div><Badge variant={activity.status === "Παρακολούθησε" ? "default" : "secondary"}>{activity.status}</Badge></div>)}
                  {activities.length === 0 && <p className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">Δεν υπάρχει ακόμη ιστορικό δράσεων.</p>}
                </div>
              </div>
            </>;
          })()}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
