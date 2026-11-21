import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  GraduationCap,
  MailPlus,
  ReceiptText,
  RotateCcw,
  Settings,
  Users,
  WalletCards,
} from "lucide-react";
import { useClub, formatDate, type Role } from "@/lib/club-data";

export const Route = createFileRoute("/karteles")({
  validateSearch: (search: Record<string, unknown>) => ({
    role: typeof search.role === "string" ? search.role : undefined,
    settings: typeof search.settings === "string" ? search.settings : undefined,
  }),
  head: () => ({ meta: [{ title: "ΔΣ — Κεντρικό Hub" }] }),
  component: BoardWorkspace,
});

const ROLES: Role[] = ["Πρόεδρος", "Αντιπρόεδρος", "Γραμματέας", "Ταμίας", "Μέλος"];
function isRole(value?: string): value is Role { return Boolean(value && ROLES.includes(value as Role)); }

type Tool = { title: string; note: string; to: string; count?: number; icon: typeof CalendarDays };

function BoardWorkspace() {
  const search = Route.useSearch();
  const club = useClub();
  if (search.settings === "1") return <BoardSettings />;

  const selectedRole = isRole(search.role) ? search.role : club.currentRole;
  return <RoleWorkspace role={selectedRole} />;
}

function RoleWorkspace({ role }: { role: Role }) {
  const {
    currentRole,
    setCurrentRole,
    tasks,
    setTaskStatus,
    boardMembers,
    pendingCalendarApprovals,
    payments,
    newsletters,
    seminars,
  } = useClub();

  useEffect(() => {
    if (currentRole !== role) setCurrentRole(role);
  }, [role, currentRole, setCurrentRole]);

  const member = boardMembers.find((item) => item.role === role);
  const openTasks = tasks.filter((task) => task.ownerRole === role && task.status !== "Ολοκληρώθηκε");
  const toCheck = payments.filter((payment) => payment.status === "Προς έλεγχο").length;
  const drafts = newsletters.filter((newsletter) => newsletter.status === "Πρόχειρο").length;
  const activeSeminars = seminars.filter((seminar) => seminar.status !== "Ολοκληρωμένο").length;

  const tools = useMemo<Tool[]>(() => {
    if (role === "Πρόεδρος") return [
      { title: "Εγκρίσεις σεμιναρίων", note: "Μόνο τα αιτήματα που περιμένουν απόφαση", to: "/seminaria?view=approvals", count: pendingCalendarApprovals.length, icon: GraduationCap },
      { title: "Ημερολόγιο", note: "Συναντήσεις, δράσεις και deadlines", to: "/imerologio", icon: CalendarDays },
      { title: "Εργασίες Προέδρου", note: "Οι εργασίες που έχουν ανατεθεί στον Πρόεδρο", to: `/ergasies?role=${encodeURIComponent("Πρόεδρος")}`, icon: CheckCircle2 },
    ];
    if (role === "Αντιπρόεδρος") return [
      { title: "Σεμινάρια & δράσεις", note: "Γρήγορη εικόνα ενεργών δράσεων", to: "/seminaria", count: activeSeminars, icon: GraduationCap },
      { title: "Ημερολόγιο", note: "Οργάνωση επόμενων ημερομηνιών", to: "/imerologio", icon: CalendarDays },
      { title: "Αρχεία", note: "Κοινό υλικό του συλλόγου", to: "/arxeia", icon: FileText },
    ];
    if (role === "Γραμματέας") return [
      { title: "Επαφές & λίστες", note: "Φάκελοι, επαφές και Excel import", to: "/grammateia?view=contacts", icon: Users },
      { title: "Newsletter / Email Builder", note: "Δημιουργία και αποστολή HTML email", to: "/grammateia?view=newsletter", icon: MailPlus },
      { title: "Πρόχειρα & ιστορικό", note: "Άνοιγμα, duplicate και διαγραφή email", to: "/grammateia?view=history", count: drafts, icon: FileText },
      { title: "Μητρώο", note: "Μέλη, Φίλοι, Επισκέπτες και ιστορικό", to: "/meli", icon: Users },
    ];
    if (role === "Ταμίας") return [
      { title: "Συνδρομές Μελών & Φίλων", note: "Μόνο ο πίνακας συνδρομών 2023–2030", to: "/oikonomika?view=syndromes", icon: ReceiptText },
      { title: "Έλεγχος πληρωμών", note: "Πρώτα σεμινάρια, μετά συνδρομές", to: "/oikonomika?view=elegxos", count: toCheck, icon: WalletCards },
      { title: "Αποδείξεις", note: "Έκδοση, αποστολή και αρχείο αποδείξεων", to: "/oikonomika?view=apodeixeis", icon: FileText },
      { title: "Έξοδα", note: "Καταχωρισμένες δαπάνες του Συλλόγου", to: "/oikonomika?view=exoda", icon: ReceiptText },
    ];
    return [
      { title: "Σεμινάρια & δράσεις", note: "Τι τρέχει αυτή την περίοδο", to: "/seminaria", count: activeSeminars, icon: GraduationCap },
      { title: "Ημερολόγιο", note: "Επόμενες δράσεις και υποχρεώσεις", to: "/imerologio", icon: CalendarDays },
      { title: "Αρχεία", note: "Υλικό που χρειάζεται για τις εργασίες", to: "/arxeia", icon: FileText },
    ];
  }, [role, pendingCalendarApprovals.length, activeSeminars, drafts, toCheck]);

  return (
    <AppShell>
      <div>
        <p className="text-sm text-muted-foreground">{role}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{member?.name || role}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{member?.weeklyFocus}</p>
      </div>

      <section className="mt-6">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Εργασίες</h2><Badge variant="outline">{openTasks.length}</Badge></div>
        <div className="mt-3 grid gap-3">
          {openTasks.map((task) => (
            <Card key={task.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{task.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{task.category} · {formatDate(task.due)}{task.dueTime ? ` · ${task.dueTime}` : ""} · {task.status}</p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm"><Link to={task.action?.to ?? "/ergasies"}>Άνοιγμα <ArrowRight className="size-4" /></Link></Button>
                <Button size="sm" onClick={() => { setTaskStatus(task.id, "Ολοκληρώθηκε"); toast.success("Η εργασία ολοκληρώθηκε."); }}>Έγινε</Button>
              </div>
            </Card>
          ))}
          {openTasks.length === 0 && <Card className="p-5 text-sm text-muted-foreground"><CheckCircle2 className="mb-2 size-5 text-success" />Δεν υπάρχει ανοιχτή εργασία.</Card>}
        </div>
      </section>

      <section className="mt-7">
        <h2 className="text-lg font-semibold">Εργαλεία {role}</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <a key={tool.title} href={tool.to} className="group">
              <Card className="h-full p-5 transition hover:border-primary/40 hover:shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary"><tool.icon className="size-5" /></span>
                  <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="font-semibold">{tool.title}</p>{tool.count !== undefined && <Badge variant={tool.count ? "default" : "outline"}>{tool.count}</Badge>}</div><p className="mt-1 text-sm text-muted-foreground">{tool.note}</p></div>
                  <ArrowRight className="mt-1 size-4 text-muted-foreground transition group-hover:translate-x-0.5" />
                </div>
              </Card>
            </a>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <h2 className="text-lg font-semibold">Σταθερές αρμοδιότητες</h2>
        <Card className="mt-3 p-4"><div className="flex flex-wrap gap-2">{member?.duties.map((duty) => <Badge key={duty} variant="secondary">{duty}</Badge>)}</div></Card>
      </section>
    </AppShell>
  );
}

function BoardSettings() {
  const { boardMembers, updateBoardMemberName, resetBoardMemberNames } = useClub();
  const [draftNames, setDraftNames] = useState<Record<Role, string>>(() => Object.fromEntries(boardMembers.map((m) => [m.role, m.name])) as Record<Role, string>);

  useEffect(() => setDraftNames(Object.fromEntries(boardMembers.map((m) => [m.role, m.name])) as Record<Role, string>), [boardMembers]);

  return (
    <AppShell>
      <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-secondary"><Settings className="size-5" /></span><div><h1 className="text-2xl font-semibold tracking-tight">ΔΣ Ρυθμίσεις</h1><p className="text-sm text-muted-foreground">Αλλαγή ονομάτων των 5 ρόλων.</p></div></div>
      <Card className="mt-6 max-w-2xl p-5">
        <div className="grid gap-4">
          {boardMembers.map((member) => (
            <div key={member.id} className="grid gap-1.5"><Label htmlFor={`board-name-${member.id}`}>{member.role}</Label><Input id={`board-name-${member.id}`} value={draftNames[member.role] ?? ""} onChange={(e) => setDraftNames((prev) => ({ ...prev, [member.role]: e.target.value }))} /></div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap justify-between gap-2">
          <Button variant="ghost" onClick={() => { resetBoardMemberNames(); toast.success("Επαναφέρθηκαν τα αρχικά ονόματα."); }}><RotateCcw className="size-4" /> Επαναφορά</Button>
          <Button onClick={() => { boardMembers.forEach((member) => updateBoardMemberName(member.role, draftNames[member.role] ?? member.name)); toast.success("Τα ονόματα του ΔΣ αποθηκεύτηκαν."); }}>Αποθήκευση</Button>
        </div>
      </Card>
    </AppShell>
  );
}
