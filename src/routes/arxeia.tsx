import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Archive, Download, FileCheck2, FileText, FolderArchive, Printer, ReceiptText, Users } from "lucide-react";
import { clubFiles, expenses, euro, formatDate, useClub, type MonthlyArchive, type Payment } from "@/lib/club-data";

export const Route = createFileRoute("/arxeia")({
  head: () => ({ meta: [{ title: "Αρχεία — Κεντρική Εφαρμογή Συλλόγου" }] }),
  component: FilesPage,
});

function currentMonthAthens() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Athens", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value || "2026";
  const month = parts.find((part) => part.type === "month")?.value || "08";
  return `${year}-${month}`;
}

function monthLabel(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) return month;
  const date = new Date(`${month}-01T12:00:00+03:00`);
  return new Intl.DateTimeFormat("el-GR", { month: "long", year: "numeric" }).format(date);
}

function receiptName(payment: Payment, people: ReturnType<typeof useClub>["people"]) {
  return payment.payerName || people.find((person) => person.id === payment.personId)?.name || "—";
}

function FilesPage() {
  const {
    payments,
    people,
    seminars,
    externalBookings,
    memberApplications,
    monthlyArchives,
    saveMonthlyArchive,
  } = useClub();
  const [month, setMonth] = useState(currentMonthAthens());

  const paidPayments = payments.filter((payment) => payment.status === "Πληρωμένη");
  const receipts = paidPayments.filter((payment) => payment.receiptNo).sort((a, b) => (b.paidAt || "").localeCompare(a.paidAt || ""));
  const monthPayments = paidPayments.filter((payment) => (payment.paidAt || payment.confirmedAt || "").startsWith(month));
  const monthExpenses = expenses.filter((expense) => expense.date.startsWith(month));
  const monthEvents = externalBookings.filter((booking) => (booking.approval_status === "approved" || booking.is_public) && booking.booking_date.startsWith(month));
  const monthSeminars = seminars.filter((seminar) => seminar.date.startsWith(month));
  const monthApplications = memberApplications.filter((application) => application.submittedAt.startsWith(month));
  const income = monthPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const expenseTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const registrations = monthSeminars.reduce((sum, seminar) => sum + seminar.registrations, 0);
  const receiptsCount = monthPayments.filter((payment) => payment.receiptNo).length;
  const savedArchive = monthlyArchives.find((archive) => archive.id === `month-${month}`);

  const activityTitles = useMemo(() => Array.from(new Set(monthEvents.map((booking) => booking.topic || booking.event_type || booking.therapist_name || "Δράση Συλλόγου"))), [monthEvents]);

  function makeArchive(): MonthlyArchive {
    return {
      id: `month-${month}`,
      month,
      generatedAt: new Date().toISOString(),
      income,
      expenses: expenseTotal,
      net: income - expenseTotal,
      seminarsCount: monthEvents.length,
      registrations,
      paidTransactions: monthPayments.length,
      receiptsCount,
      newApplications: monthApplications.length,
      activityTitles,
    };
  }

  function saveReport() {
    saveMonthlyArchive(makeArchive());
    toast.success(`Αποθηκεύτηκε το μηνιαίο αρχείο ${monthLabel(month)}.`);
  }

  function printMonthlyReport() {
    const archive = makeArchive();
    const w = window.open("", "_blank", "width=850,height=950");
    if (!w) return;
    w.document.write(`<!doctype html><html lang="el"><head><meta charset="utf-8"><title>Μηνιαία αναφορά ${month}</title><style>body{font-family:Arial,sans-serif;padding:42px;color:#23372c}.box{max-width:760px;margin:auto}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.stat{border:1px solid #ddd;border-radius:12px;padding:16px}.muted{font-size:12px;color:#6b776f}.section{margin-top:28px;border-top:1px solid #ddd;padding-top:18px}li{margin:8px 0}@media print{button{display:none}}</style></head><body><div class="box"><p class="muted">Σ.Ε.ΨΥ.G. · ΜΗΝΙΑΙΟ ΑΡΧΕΙΟ</p><h1>${monthLabel(month)}</h1><div class="grid"><div class="stat"><div class="muted">Έσοδα</div><strong>${euro(archive.income)}</strong></div><div class="stat"><div class="muted">Έξοδα</div><strong>${euro(archive.expenses)}</strong></div><div class="stat"><div class="muted">Καθαρή κίνηση</div><strong>${euro(archive.net)}</strong></div><div class="stat"><div class="muted">Δράσεις</div><strong>${archive.seminarsCount}</strong></div><div class="stat"><div class="muted">Πληρωμές</div><strong>${archive.paidTransactions}</strong></div><div class="stat"><div class="muted">Αποδείξεις</div><strong>${archive.receiptsCount}</strong></div></div><div class="section"><h2>Δράσεις του μήνα</h2>${archive.activityTitles.length ? `<ul>${archive.activityTitles.map((title) => `<li>${title}</li>`).join("")}</ul>` : "<p>Δεν καταγράφηκε δράση.</p>"}</div><div class="section"><h2>Οικονομική κίνηση</h2><p>Επιβεβαιωμένες συναλλαγές: ${archive.paidTransactions}</p><p>Συνολικά έσοδα: ${euro(archive.income)}</p><p>Συνολικά έξοδα: ${euro(archive.expenses)}</p></div><div class="section"><h2>Νέες αιτήσεις</h2><p>${archive.newApplications} αιτήσεις Μέλους/Φίλου</p></div><button onclick="window.print()">Εκτύπωση / Αποθήκευση PDF</button></div></body></html>`);
    w.document.close();
  }

  function printReceipt(payment: Payment) {
    const w = window.open("", "_blank", "width=760,height=900");
    if (!w) return;
    w.document.write(`<!doctype html><html lang="el"><head><meta charset="utf-8"><title>${payment.receiptNo}</title><style>body{font-family:Arial,sans-serif;padding:48px;color:#172033}.box{max-width:650px;margin:auto;border:1px solid #ccd3df;border-radius:16px;padding:32px}.row{display:flex;justify-content:space-between;border-bottom:1px solid #eef1f5;padding:12px 0}.muted{color:#667085;font-size:13px}.amount{font-size:28px;font-weight:700;margin:24px 0}@media print{button{display:none}.box{border:0}}</style></head><body><div class="box"><p class="muted">Σ.Ε.ΨΥ.G. · ΑΠΟΔΕΙΞΗ</p><h1>${payment.receiptNo}</h1><div class="amount">${euro(payment.amount)}</div><div class="row"><span>Ονοματεπώνυμο</span><strong>${receiptName(payment, people)}</strong></div><div class="row"><span>Αιτιολογία</span><strong>${payment.purpose}</strong></div><div class="row"><span>Ημερομηνία</span><strong>${payment.paidAt ? formatDate(payment.paidAt) : "—"}</strong></div><button onclick="window.print()" style="margin-top:18px;padding:12px 18px">Εκτύπωση / PDF</button></div></body></html>`);
    w.document.close();
  }

  return (
    <AppShell>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Αρχεία Συλλόγου</h1>
        <p className="mt-1 text-sm text-muted-foreground">Οργανωμένα αρχεία, όχι ένας ενιαίος φάκελος.</p>
      </div>

      <Tabs defaultValue="monthly" className="mt-6">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="monthly">Μηνιαίο αρχείο</TabsTrigger>
          <TabsTrigger value="receipts">Αποδείξεις · {receipts.length}</TabsTrigger>
          <TabsTrigger value="applications">Αιτήσεις Μελών/Φίλων · {memberApplications.length}</TabsTrigger>
          <TabsTrigger value="documents">Κοινά έγγραφα</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="mt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-semibold">Μηνιαία αναφορά Συλλόγου</h2><p className="text-xs text-muted-foreground">Δράσεις, οικονομική κίνηση και βασικά αρχεία του μήνα.</p></div>
            <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="w-48" />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4"><p className="text-xs text-muted-foreground">Δράσεις</p><p className="mt-1 text-2xl font-semibold">{monthEvents.length}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">Έσοδα</p><p className="mt-1 text-2xl font-semibold">{euro(income)}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">Έξοδα</p><p className="mt-1 text-2xl font-semibold">{euro(expenseTotal)}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">Καθαρή κίνηση</p><p className="mt-1 text-2xl font-semibold">{euro(income - expenseTotal)}</p></Card>
          </div>

          <Card className="mt-4 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><FolderArchive className="size-5" /><h3 className="font-semibold">{monthLabel(month)}</h3>{savedArchive && <Badge variant="secondary"><FileCheck2 className="mr-1 size-3" />Αποθηκευμένο</Badge>}</div>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div><p className="text-xs text-muted-foreground">Πληρωμένες συναλλαγές</p><p className="font-medium">{monthPayments.length}</p></div>
                  <div><p className="text-xs text-muted-foreground">Αποδείξεις</p><p className="font-medium">{receiptsCount}</p></div>
                  <div><p className="text-xs text-muted-foreground">Εγγραφές σε σεμινάρια</p><p className="font-medium">{registrations}</p></div>
                  <div><p className="text-xs text-muted-foreground">Νέες αιτήσεις Μέλους/Φίλου</p><p className="font-medium">{monthApplications.length}</p></div>
                </div>
                <div className="mt-4"><p className="text-xs font-medium text-muted-foreground">Δράσεις</p>{activityTitles.length ? <ul className="mt-2 space-y-1 text-sm">{activityTitles.map((title) => <li key={title}>• {title}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Καμία καταχωρισμένη δράση.</p>}</div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2"><Button variant="outline" onClick={printMonthlyReport}><Printer className="size-4" /> Προβολή / PDF</Button><Button onClick={saveReport}><Archive className="size-4" /> {savedArchive ? "Ενημέρωση αρχείου" : "Αποθήκευση μήνα"}</Button></div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="receipts" className="mt-4">
          <Card className="divide-y divide-border p-0">
            {receipts.map((payment) => <div key={payment.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><ReceiptText className="size-5 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="font-medium">{payment.receiptNo} — {receiptName(payment, people)}</p><p className="text-xs text-muted-foreground">{payment.purpose} · {euro(payment.amount)} · {payment.paidAt ? formatDate(payment.paidAt) : "—"}</p>{payment.receiptSentAt && <p className="mt-1 text-xs text-success">Στάλθηκε στο {payment.receiptSentTo || "email παραλήπτη"}</p>}</div><Button variant="outline" size="sm" onClick={() => printReceipt(payment)}><Printer className="size-4" /> Άνοιγμα</Button></div>)}
            {receipts.length === 0 && <div className="p-7 text-sm text-muted-foreground">Δεν υπάρχουν ακόμη αποδείξεις.</div>}
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="mt-4">
          <Card className="divide-y divide-border p-0">
            {[...memberApplications].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).map((application) => <div key={application.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><Users className="size-5 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="font-medium">{application.name}</p><p className="text-xs text-muted-foreground">Αίτηση για {application.requestedKind} · {application.email} · {formatDate(application.submittedAt.slice(0, 10))}</p></div><Badge variant={application.status === "Ολοκληρώθηκε" ? "secondary" : application.status === "Νέα" ? "default" : "outline"}>{application.status}</Badge></div>)}
            {memberApplications.length === 0 && <div className="p-7 text-sm text-muted-foreground">Δεν έχει συγχρονιστεί ακόμη αίτηση νέου Μέλους/Φίλου. Η ενότητα είναι έτοιμη να διαβάζει τη συλλογή <code>member_applications</code> του Firestore όταν συνδεθεί η φόρμα εγγραφής.</div>}
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card className="divide-y divide-border p-0">
            {clubFiles.map((file) => <div key={file.id} className="flex items-center gap-3 p-4"><FileText className="size-5 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{file.kind} · {file.size} · Ενημέρωση {formatDate(file.updated)}</p></div><Button variant="ghost" size="sm"><Download className="size-4" /> Λήψη</Button></div>)}
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
