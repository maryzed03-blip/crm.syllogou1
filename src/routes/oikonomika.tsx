import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  HelpCircle,
  MailCheck,
  Printer,
  Send,
  WalletCards,
} from "lucide-react";
import {
  useClub,
  expenses,
  euro,
  formatDate,
  DUE_YEARS,
  CURRENT_YEAR,
  type PersonKind,
  type DueStatus,
  type Payment,
} from "@/lib/club-data";

type FinanceView = "synopsi" | "syndromes" | "elegxos" | "ekkremi" | "seminaria" | "exoda" | "apodeixeis";
const FINANCE_VIEWS: FinanceView[] = ["synopsi", "syndromes", "elegxos", "ekkremi", "seminaria", "exoda", "apodeixeis"];

export const Route = createFileRoute("/oikonomika")({
  validateSearch: (search: Record<string, unknown>) => ({
    view: typeof search.view === "string" && FINANCE_VIEWS.includes(search.view as FinanceView) ? (search.view as FinanceView) : undefined,
  }),
  head: () => ({ meta: [{ title: "Ταμείο — Κεντρικό Hub ΔΣ" }] }),
  component: FinancePage,
});

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      {note && <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>}
    </Card>
  );
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char] || char);
}

function FinancePage() {
  const search = Route.useSearch();
  const {
    payments,
    dues,
    people,
    contacts,
    seminars,
    confirmPayment,
    markReceiptSent,
    sendReminder,
    markDuePaid,
    boardMembers,
    refreshPaymentDeclarations,
  } = useClub();
  const treasurerName = boardMembers.find((member) => member.role === "Ταμίας")?.name || "Ο Ταμίας";
  const [tab, setTab] = useState<FinanceView>(search.view ?? "synopsi");
  const [kind, setKind] = useState<PersonKind>("Μέλος");
  const [receiptReadyId, setReceiptReadyId] = useState<string | null>(null);
  const [sendingReceiptId, setSendingReceiptId] = useState<string | null>(null);

  useEffect(() => {
    if (search.view) setTab(search.view);
  }, [search.view]);

  const currentPayments = payments.filter((p) => p.year === CURRENT_YEAR);
  const income = currentPayments.filter((p) => p.status === "Πληρωμένη").reduce((s, p) => s + p.amount, 0);
  const totalExpenses = expenses.filter((e) => e.date.startsWith(String(CURRENT_YEAR))).reduce((s, e) => s + e.amount, 0);
  const pending = currentPayments.filter((p) => p.status !== "Πληρωμένη").reduce((s, p) => s + p.amount, 0);
  const toCheck = currentPayments.filter((p) => p.status === "Προς έλεγχο");
  const toCheckSeminars = toCheck.filter((p) => p.source === "Σεμινάριο");
  const toCheckDues = toCheck.filter((p) => p.source === "Συνδρομή");
  const toCheckOther = toCheck.filter((p) => p.source === "Άλλο");
  const outstanding = currentPayments.filter((p) => p.status === "Εκκρεμεί");
  const receipts = payments.filter((p) => p.receiptNo).sort((a, b) => (b.paidAt || "").localeCompare(a.paidAt || ""));
  const memberDues = dues.filter((d) => people.find((p) => p.id === d.personId)?.kind === kind);
  const visiblePeople = people.filter((p) => p.kind === kind);
  const personName = (id: string, payment?: Payment) => payment?.payerName || people.find((person) => person.id === id)?.name || "—";
  const normalizedPersonName = (value: string) => value.trim().toLocaleLowerCase("el-GR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
  const personEmail = (payment: Payment) => {
    if (payment.payerEmail?.trim()) return payment.payerEmail.trim();
    const person = people.find((item) => item.id === payment.personId);
    if (person?.email?.trim()) return person.email.trim();
    const name = payment.payerName || person?.name || "";
    if (!name) return "";
    return contacts.find((contact) => normalizedPersonName(contact.name) === normalizedPersonName(name))?.email || "";
  };

  const paidMembers2026 = dues.filter((d) => d.year === CURRENT_YEAR && d.status === "Πληρωμένη" && people.find((p) => p.id === d.personId)?.kind === "Μέλος").length;
  const paidFriends2026 = dues.filter((d) => d.year === CURRENT_YEAR && d.status === "Πληρωμένη" && people.find((p) => p.id === d.personId)?.kind === "Φίλος").length;
  const receiptReady = receiptReadyId ? payments.find((payment) => payment.id === receiptReadyId) : undefined;

  const exportForExcel = () => {
    const header = ["Τύπος", "Ονοματεπώνυμο", ...DUE_YEARS.map(String)];
    const rows = people.map((person) => [
      person.kind,
      person.name,
      ...DUE_YEARS.map((year) => {
        const due = dues.find((d) => d.personId === person.id && d.year === year);
        if (!due) return "";
        return due.status === "Πληρωμένη"
          ? `Πληρώθηκε ${due.amount}€${due.paidAt ? ` (${due.paidAt})` : ""}`
          : due.status;
      }),
    ]);
    const esc = (v: string) => `"${String(v).replaceAll('"', '""')}"`;
    const csv = "\uFEFF" + [header, ...rows].map((r) => r.map((x) => esc(String(x))).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `syntromes-${CURRENT_YEAR}-gia-excel.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Έγινε εξαγωγή αρχείου για Excel.");
  };

  const receiptHtml = (payment: Payment) => {
    const seminar = payment.seminarId ? seminars.find((item) => item.id === payment.seminarId) : undefined;
    const name = personName(payment.personId, payment);
    return `<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(payment.receiptNo || "Απόδειξη")}</title></head><body style="margin:0;background:#f2f0ea;font-family:Arial,Helvetica,sans-serif;color:#25372c"><div style="max-width:640px;margin:0 auto;padding:28px"><div style="background:#244533;color:#fff;padding:28px;border-radius:18px 18px 0 0;text-align:center"><div style="font-size:12px;letter-spacing:1.2px">Σ.Ε.ΨΥ.G.</div><h1 style="margin:8px 0 0;font-family:Georgia,serif;font-size:26px">Απόδειξη πληρωμής</h1></div><div style="background:#fff;padding:30px;border-radius:0 0 18px 18px"><p style="color:#6b776f;font-size:13px">Αριθμός απόδειξης</p><p style="font-size:20px;font-weight:700">${escapeHtml(payment.receiptNo || "—")}</p><div style="font-size:30px;font-weight:700;margin:24px 0">${escapeHtml(euro(payment.amount))}</div><table style="width:100%;border-collapse:collapse;font-size:14px"><tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#6b776f">Ονοματεπώνυμο</td><td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-weight:700">${escapeHtml(name)}</td></tr><tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#6b776f">Αιτιολογία</td><td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-weight:700">${escapeHtml(payment.purpose)}</td></tr>${seminar ? `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#6b776f">Σεμινάριο</td><td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-weight:700">${escapeHtml(seminar.title)}</td></tr><tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#6b776f">Ημερομηνία</td><td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-weight:700">${escapeHtml(formatDate(seminar.date))}</td></tr>` : ""}<tr><td style="padding:10px 0;color:#6b776f">Ημερομηνία πληρωμής</td><td style="padding:10px 0;text-align:right;font-weight:700">${escapeHtml(payment.paidAt ? formatDate(payment.paidAt) : "—")}</td></tr></table><p style="margin-top:28px;color:#6b776f;font-size:12px;line-height:1.6">Η απόδειξη έχει καταχωριστεί στο οικονομικό αρχείο του Συλλόγου.</p></div></div></body></html>`;
  };

  const printReceipt = (payment: Payment) => {
    const w = window.open("", "_blank", "width=760,height=900");
    if (!w) return;
    w.document.write(receiptHtml(payment).replace("</body>", '<div style="text-align:center;margin:0 0 30px"><button onclick="window.print()" style="padding:12px 18px">Εκτύπωση / Αποθήκευση ως PDF</button></div></body>'));
    w.document.close();
  };

  async function sendReceipt(payment: Payment) {
    const recipient = personEmail(payment).trim().toLowerCase();
    if (!recipient) {
      toast.error("Δεν υπάρχει email για αυτόν τον άνθρωπο.");
      return;
    }
    setSendingReceiptId(payment.id);
    try {
      const response = await fetch("/api/send-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "receipt",
          recipients: [recipient],
          subject: `Απόδειξη ${payment.receiptNo || "πληρωμής"} — ${payment.purpose}`,
          html: receiptHtml(payment),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Η αποστολή απόδειξης απέτυχε.");
      markReceiptSent(payment.id, recipient);
      toast.success(`Η απόδειξη στάλθηκε στο ${recipient}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Η αποστολή απόδειξης απέτυχε.");
    } finally {
      setSendingReceiptId(null);
    }
  }

  function handleConfirm(payment: Payment) {
    confirmPayment(payment.id);
    setReceiptReadyId(payment.id);
    toast.success("Η κατάθεση επιβεβαιώθηκε. Η απόδειξη είναι έτοιμη για αποστολή.");
  }

  const dedicatedTitle: Partial<Record<FinanceView, string>> = {
    syndromes: "Συνδρομές Μελών & Φίλων",
    elegxos: "Έλεγχος πληρωμών",
    ekkremi: "Εκκρεμείς πληρωμές",
    seminaria: "Οικονομικά σεμιναρίων",
    exoda: "Έξοδα",
    apodeixeis: "Αποδείξεις",
  };

  function PaymentRows({ items }: { items: Payment[] }) {
    if (items.length === 0) return <Card className="p-5 text-sm text-muted-foreground">Δεν υπάρχει πληρωμή σε αυτή την κατηγορία.</Card>;
    return <div className="grid gap-3">{items.map((p) => (
      <Card key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{personName(p.personId, p)}</p>
          <p className="text-sm text-muted-foreground">{p.purpose} · {euro(p.amount)} · προθεσμία {formatDate(p.due)}</p>
          {p.externalDeclarationId && <p className="mt-1 text-xs text-primary">Δήλωσε ότι έκανε την κατάθεση{p.payerEmail ? ` · ${p.payerEmail}` : ""}{p.paymentReference ? ` · αιτιολογία: ${p.paymentReference}` : ""}.</p>}
        </div>
        <Button size="lg" onClick={() => handleConfirm(p)}><Check className="size-4" /> Πληρώθηκε</Button>
      </Card>
    ))}</div>;
  }

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {search.view && <a href={`/karteles?role=${encodeURIComponent("Ταμίας")}`} className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Εργαλεία Ταμία</a>}
          <h1 className="text-2xl font-semibold tracking-tight">{search.view ? dedicatedTitle[search.view] || "Ταμείο" : "Ταμείο"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{search.view ? treasurerName : `${treasurerName} · συγκεντρωτικός έλεγχος, όχι καθημερινό κυνήγι καταθέσεων.`}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(search.view === "elegxos" || !search.view) && <Button variant="outline" onClick={() => void refreshPaymentDeclarations().then(() => toast.success("Ελέγχθηκαν νέες δηλώσεις κατάθεσης."))}><Bell className="size-4" /> Νέες δηλώσεις</Button>}
          {(search.view === "syndromes" || !search.view) && <Button variant="outline" onClick={exportForExcel}><Download className="size-4" /> Εξαγωγή για Excel</Button>}
        </div>
      </div>

      {!search.view && <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Έσοδα 2026" value={euro(income)} note="Επιβεβαιωμένες πληρωμές" />
        <Stat label="Έξοδα 2026" value={euro(totalExpenses)} />
        <Stat label="Υπόλοιπο" value={euro(income - totalExpenses)} />
        <Stat label="Αναμενόμενες εισπράξεις" value={euro(pending)} note={`${toCheck.length + outstanding.length} ανοιχτές εγγραφές`} />
      </div>}

      <Tabs value={tab} onValueChange={(value) => setTab(value as FinanceView)} className="mt-6">
        {!search.view && <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-xl bg-secondary/70 p-1">
          <TabsTrigger value="synopsi">Σύνοψη</TabsTrigger>
          <TabsTrigger value="syndromes">Συνδρομές 2023–2030</TabsTrigger>
          <TabsTrigger value="elegxos">Προς έλεγχο ({toCheck.length})</TabsTrigger>
          <TabsTrigger value="ekkremi">Εκκρεμείς ({outstanding.length})</TabsTrigger>
          <TabsTrigger value="seminaria">Σεμινάρια</TabsTrigger>
          <TabsTrigger value="exoda">Έξοδα</TabsTrigger>
          <TabsTrigger value="apodeixeis">Αποδείξεις</TabsTrigger>
        </TabsList>}

        <TabsContent value="synopsi" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-center gap-2"><WalletCards className="size-5" /><h2 className="font-semibold">Συνδρομές {CURRENT_YEAR}</h2></div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-secondary p-4"><p className="text-xs text-muted-foreground">Μέλη · 20€/έτος</p><p className="mt-1 text-2xl font-semibold">{paidMembers2026}/{people.filter((p) => p.kind === "Μέλος").length}</p><p className="text-xs text-muted-foreground">πληρωμένες</p></div>
                <div className="rounded-xl bg-secondary p-4"><p className="text-xs text-muted-foreground">Φίλοι · 10€/έτος</p><p className="mt-1 text-2xl font-semibold">{paidFriends2026}/{people.filter((p) => p.kind === "Φίλος").length}</p><p className="text-xs text-muted-foreground">πληρωμένες</p></div>
              </div>
              <Button className="mt-4" onClick={() => setTab("syndromes")}>Άνοιγμα πίνακα συνδρομών</Button>
            </Card>
            <Card className="p-5">
              <h2 className="font-semibold">Επόμενη ενέργεια Ταμία</h2>
              <p className="mt-2 text-3xl font-semibold">{toCheck.length}</p>
              <p className="text-sm text-muted-foreground">καταθέσεις έχουν μπει στην ουρά ελέγχου</p>
              <Button className="mt-4" onClick={() => setTab("elegxos")}>Έλεγχος τώρα</Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="syndromes" className="mt-4">
          <Card className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="font-semibold">Ιστορικό ετήσιων συνδρομών</h2><p className="text-xs text-muted-foreground">✓ πληρωμένο · ? άγνωστο ιστορικό · ○ εκκρεμεί · ◷ προς έλεγχο</p></div>
              <div className="flex gap-2"><Button size="sm" variant={kind === "Μέλος" ? "default" : "outline"} onClick={() => setKind("Μέλος")}>Μέλη · 20€</Button><Button size="sm" variant={kind === "Φίλος" ? "default" : "outline"} onClick={() => setKind("Φίλος")}>Φίλοι · 10€</Button></div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead><tr className="border-b border-border"><th className="sticky left-0 z-10 bg-card px-3 py-3 text-left font-medium">Ονοματεπώνυμο</th>{DUE_YEARS.map((year) => <th key={year} className="px-3 py-3 text-center font-medium">{year}</th>)}</tr></thead>
                <tbody>{visiblePeople.map((person) => (
                  <tr key={person.id} className="border-b border-border/70 last:border-0">
                    <td className="sticky left-0 z-10 bg-card px-3 py-3 font-medium">{person.name}<p className="text-[11px] font-normal text-muted-foreground">{person.email}</p></td>
                    {DUE_YEARS.map((year) => {
                      const due = memberDues.find((d) => d.personId === person.id && d.year === year);
                      return <td key={year} className="px-2 py-2 text-center"><DueCell status={due?.status ?? "Άγνωστο"} amount={due?.amount ?? (kind === "Μέλος" ? 20 : 10)} paidAt={due?.paidAt} disabled={year > CURRENT_YEAR} onMarkPaid={() => { if (window.confirm(`Καταχώριση πληρωμής ${year} για ${person.name};`)) { markDuePaid(person.id, year); toast.success(`Καταχωρίστηκε η συνδρομή ${year}.`); } }} /></td>;
                    })}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="elegxos" className="mt-4 space-y-6">
          {receiptReady?.status === "Πληρωμένη" && <Card className="border-success/40 bg-success/5 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><CheckCircle2 className="size-5 text-success" /><p className="font-semibold">Η πληρωμή επιβεβαιώθηκε</p></div><p className="mt-1 text-sm text-muted-foreground">{personName(receiptReady.personId, receiptReady)} · {receiptReady.purpose} · {euro(receiptReady.amount)} · {receiptReady.receiptNo}</p>{receiptReady.receiptSentAt && <p className="mt-2 text-xs text-success">Η απόδειξη στάλθηκε στο {receiptReady.receiptSentTo}.</p>}</div>
              {!receiptReady.receiptSentAt && <Button size="lg" disabled={sendingReceiptId === receiptReady.id} onClick={() => void sendReceipt(receiptReady)}><Send className="size-4" />{sendingReceiptId === receiptReady.id ? "Αποστολή…" : "Αποστολή απόδειξης"}</Button>}
            </div>
          </Card>}

          <section><div className="mb-3 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Πληρωμές σεμιναρίων</h2><p className="text-xs text-muted-foreground">Πρώτα οι πληρωμές με τη μεγαλύτερη καθημερινή κίνηση.</p></div><Badge>{toCheckSeminars.length}</Badge></div><PaymentRows items={toCheckSeminars} /></section>
          <section><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Συνδρομές Μελών & Φίλων</h2><Badge variant="outline">{toCheckDues.length}</Badge></div><PaymentRows items={toCheckDues} /></section>
          {toCheckOther.length > 0 && <section><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Άλλες πληρωμές</h2><Badge variant="outline">{toCheckOther.length}</Badge></div><PaymentRows items={toCheckOther} /></section>}
          {toCheck.length === 0 && !receiptReady && <Card className="p-6 text-sm text-muted-foreground"><CheckCircle2 className="mb-2 size-5 text-success" />Καμία πληρωμή προς έλεγχο.</Card>}
        </TabsContent>

        <TabsContent value="ekkremi" className="mt-4 grid gap-3">
          {outstanding.map((p) => <Card key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="font-medium">{personName(p.personId, p)}</p><p className="text-sm text-muted-foreground">{p.purpose} · {euro(p.amount)} · προθεσμία {formatDate(p.due)}</p></div><Button variant="outline" size="lg" onClick={() => { sendReminder(p.id); toast.success("Καταγράφηκε υπενθύμιση email (pilot)."); }}><Bell className="size-4" /> Υπενθύμιση</Button></Card>)}
          {outstanding.length === 0 && <Card className="p-5 text-sm text-muted-foreground">Δεν υπάρχουν εκκρεμείς πληρωμές.</Card>}
        </TabsContent>

        <TabsContent value="seminaria" className="mt-4 grid gap-3">
          {seminars.map((s) => <Card key={s.id} className="p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{s.title}</p><Badge variant={s.status === "Προς έγκριση" ? "destructive" : "secondary"}>{s.status}</Badge></div><div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"><div><p className="text-xs text-muted-foreground">Εγγραφές</p><p className="font-medium">{s.registrations}</p></div><div><p className="text-xs text-muted-foreground">Πληρωμένες</p><p className="font-medium text-success">{s.paid}</p></div><div><p className="text-xs text-muted-foreground">Εισπραχθέντα</p><p className="font-medium">{euro(s.paid * s.fee)}</p></div><div><p className="text-xs text-muted-foreground">Αναμενόμενα</p><p className="font-medium">{euro(Math.max(0, s.registrations - s.paid) * s.fee)}</p></div></div></Card>)}
        </TabsContent>

        <TabsContent value="exoda" className="mt-4"><Card className="divide-y divide-border p-0">{expenses.map((e) => <div key={e.id} className="flex items-center gap-3 p-4"><div className="min-w-0 flex-1"><p className="text-sm font-medium">{e.title}</p><p className="text-xs text-muted-foreground">{e.category} · {formatDate(e.date)}</p></div><p className="font-medium">−{euro(e.amount)}</p></div>)}</Card></TabsContent>

        <TabsContent value="apodeixeis" className="mt-4">
          <Card className="divide-y divide-border p-0">
            {receipts.map((p) => {
              const recipient = personEmail(p);
              return <div key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><FileText className="size-4 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{p.receiptNo} — {personName(p.personId, p)}</p><p className="text-xs text-muted-foreground">{p.purpose} · {euro(p.amount)} · {p.paidAt && formatDate(p.paidAt)}</p>{p.receiptSentAt && <p className="mt-1 text-xs text-success"><MailCheck className="mr-1 inline size-3" />Στάλθηκε {p.receiptSentTo ? `στο ${p.receiptSentTo}` : "με email"}</p>}</div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => printReceipt(p)}><Printer className="size-4" /> Προβολή / PDF</Button>{!p.receiptSentAt && <Button size="sm" disabled={!recipient || sendingReceiptId === p.id} onClick={() => void sendReceipt(p)}><Send className="size-4" /> Αποστολή</Button>}</div></div>;
            })}
            {receipts.length === 0 && <div className="p-6 text-sm text-muted-foreground">Δεν έχουν εκδοθεί ακόμη αποδείξεις.</div>}
          </Card>
          <p className="mt-3 text-xs text-muted-foreground">Η απόδειξη αποθηκεύεται στην πληρωμή και στο αρχείο. Όταν δοθεί το επίσημο PDF template του Συλλόγου, θα αντικαταστήσει την προσωρινή εκτυπώσιμη μορφή χωρίς να αλλάξει η ροή.</p>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function DueCell({ status, amount, paidAt, disabled, onMarkPaid }: { status: DueStatus; amount: number; paidAt?: string; disabled?: boolean; onMarkPaid: () => void }) {
  const common = "mx-auto flex min-h-10 min-w-16 flex-col items-center justify-center rounded-lg border px-2 py-1 text-xs";
  if (disabled) return <div className={`${common} border-transparent text-muted-foreground`}>—</div>;
  if (status === "Πληρωμένη") return <div className={`${common} border-success/30 bg-success/10 text-success`} title={paidAt ? `Πληρώθηκε ${paidAt}` : "Πληρωμένη"}><CheckCircle2 className="size-4" /><span>{amount}€</span></div>;
  if (status === "Προς έλεγχο") return <button className={`${common} border-warning/40 bg-warning/10 text-warning-foreground hover:bg-warning/20`} onClick={onMarkPaid} title="Πάτησε για επιβεβαίωση"><Clock3 className="size-4" /><span>{amount}€</span></button>;
  if (status === "Εκκρεμεί") return <button className={`${common} border-border hover:bg-secondary`} onClick={onMarkPaid} title="Πάτησε για καταχώριση πληρωμής"><span className="text-lg leading-none">○</span><span>{amount}€</span></button>;
  return <button className={`${common} border-dashed border-border text-muted-foreground hover:bg-secondary`} onClick={onMarkPaid} title="Άγνωστο ιστορικό — πάτησε μόνο αν επιβεβαιώσεις ότι πληρώθηκε"><HelpCircle className="size-4" /><span>?</span></button>;
}
