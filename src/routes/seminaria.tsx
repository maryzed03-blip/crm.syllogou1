import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/AppShell";
import { SeminarFinance } from "@/components/SeminarFinance";
import { FreeActionParticipants } from "@/components/FreeActionParticipants";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CalendarCheck2,
  Check,
  Clock3,
  ExternalLink,
  Mail,
  RefreshCw,
  Upload,
  UserCheck,
  Users,
  Video,
  WalletCards,
} from "lucide-react";
import { formatDate, euro, useClub, type PersonKind } from "@/lib/club-data";
import type { ExternalBooking } from "@/lib/external-calendar";

export const Route = createFileRoute("/seminaria")({
  validateSearch: (search: Record<string, unknown>) => ({
    view: typeof search.view === "string" ? search.view : undefined,
  }),
  head: () => ({ meta: [{ title: "Σεμινάρια — Κεντρικό Hub" }] }),
  component: SeminarsPage,
});

type Registration = {
  id: string;
  event_id: string;
  event_date: string;
  event_topic: string;
  event_time?: string;
  full_name: string;
  email: string;
  phone?: string;
  profession?: string;
  membership_status?: string;
  comment?: string;
  created_at?: string;
};

function SeminarsPage() {
  const search = Route.useSearch();
  const {
    seminars,
    pendingCalendarApprovals,
    externalBookings,
    calendarConnected,
    calendarError,
    approveExternalBooking,
    payments,
    people,
    newsletters,
    personActivities,
    recordZoomAttendance,
    syncCalendarContactLists,
  } = useClub();
  const [approving, setApproving] = useState<string | null>(null);
  const [selected, setSelected] = useState<ExternalBooking | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);

  async function approve(id: string) {
    setApproving(id);
    try {
      await approveExternalBooking(id);
      toast.success("Εγκρίθηκε. Η επόμενη εργασία πήγε αυτόματα στη Γραμματεία.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Η έγκριση απέτυχε.");
    } finally {
      setApproving(null);
    }
  }

  async function loadDetails(booking: ExternalBooking) {
    setSelected(booking);
    setRegistrations([]);
    setLoadingRegistrations(true);
    try {
      await syncCalendarContactLists();
      const response = await fetch(`/api/calendar-registrations?eventId=${encodeURIComponent(booking.booking_date)}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Δεν φορτώθηκαν οι εγγραφές.");
      setRegistrations(Array.isArray(payload.registrations) ? payload.registrations : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Δεν φορτώθηκαν οι εγγραφές.");
    } finally {
      setLoadingRegistrations(false);
    }
  }

  const approved = externalBookings
    .filter((booking) =>
      (booking.approval_status === "approved" || booking.is_public)
      && seminars.some((seminar) => seminar.externalBookingId === booking.id),
    )
    .sort((a, b) => a.booking_date.localeCompare(b.booking_date));

  return (
    <AppShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>{search.view === "approvals" && <a href={`/karteles?role=${encodeURIComponent("Πρόεδρος")}`} className="mb-2 inline-block text-xs text-muted-foreground hover:text-foreground">← Εργαλεία Προέδρου</a>}<h1 className="text-2xl font-semibold tracking-tight">{search.view === "approvals" ? "Εγκρίσεις σεμιναρίων" : "Σεμινάρια"}</h1><p className="mt-1 text-sm text-muted-foreground">{search.view === "approvals" ? "Μόνο τα αιτήματα που περιμένουν απόφαση Προέδρου." : "Κάθε κάρτα ανοίγει σε μία πλήρη, γρήγορη εικόνα της δράσης."}</p></div>
        <Badge variant={calendarConnected ? "secondary" : "outline"}>{calendarConnected ? "Ημερολόγιο συνδεδεμένο" : "Ημερολόγιο εκτός σύνδεσης"}</Badge>
      </div>

      {calendarError && <Card className="mt-4 border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{calendarError}</Card>}

      {pendingCalendarApprovals.length > 0 && <section className="mt-6">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Προς έγκριση Προέδρου</h2><Badge variant="destructive">{pendingCalendarApprovals.length}</Badge></div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {pendingCalendarApprovals.map((booking) => <Card key={booking.id} className="border-primary/25 p-5">
            <div className="flex flex-wrap items-center gap-2"><Badge>Νέο αίτημα</Badge><Badge variant="outline">{formatDate(booking.booking_date)}</Badge></div>
            <h3 className="mt-3 text-lg font-semibold">{booking.topic || booking.event_type || "Νέα δράση"}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{booking.action_time || ""} · {booking.therapist_name}</p>
            {booking.description && <p className="mt-3 line-clamp-3 text-sm leading-relaxed">{booking.description}</p>}
            <div className="mt-4 flex gap-2"><Button disabled={approving === booking.id} onClick={() => void approve(booking.id)}><Check className="size-4" />{approving === booking.id ? "Έγκριση…" : "Έγκριση"}</Button><Button variant="outline" onClick={() => void loadDetails(booking)}>Λεπτομέρειες</Button></div>
          </Card>)}
        </div>
      </section>}

      {search.view !== "approvals" && <>
      <section className="mt-7">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Δράσεις & σεμινάρια</h2><Badge variant="outline">{approved.length}</Badge></div>
        <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {approved.map((booking) => {
            const seminar = seminars.find((item) => item.externalBookingId === booking.id || item.date === booking.booking_date);
            const eventPayments = seminar ? payments.filter((payment) => payment.seminarId === seminar.id) : [];
            const paid = eventPayments.filter((payment) => payment.status === "Πληρωμένη");
            const listCount = seminar?.registrations || 0;
            const zoomDraft = newsletters.find((item) => item.externalBookingId === booking.id && item.templateKind === "seminar_zoom" && item.zoomUrl);
            const zoomReady = Boolean(seminar?.zoomUrl || zoomDraft?.zoomUrl);
            return <button key={booking.id} type="button" onClick={() => void loadDetails(booking)} className="text-left">
              <Card className="h-full overflow-hidden p-0 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                {booking.image_url && <div className="h-32 bg-secondary"><img src={booking.image_url} alt="" className="h-full w-full object-cover" /></div>}
                <div className="p-5">
                  <div className="flex flex-wrap gap-2"><Badge variant="secondary">{formatDate(booking.booking_date)}</Badge>{zoomReady && <Badge variant="outline" className="border-primary/30"><Video className="mr-1 size-3" />Zoom έτοιμο</Badge>}</div>
                  <h3 className="mt-3 text-lg font-semibold leading-snug">{booking.topic || booking.event_type || booking.therapist_name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{booking.action_time || ""}{booking.action_time ? " · " : ""}{booking.therapist_name}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4 text-center"><div><p className="text-lg font-semibold">{listCount}</p><p className="text-[11px] text-muted-foreground">Εγγραφές</p></div><div><p className="text-lg font-semibold">{paid.length}</p><p className="text-[11px] text-muted-foreground">Πληρωμές</p></div><div><p className="text-lg font-semibold">{euro(paid.reduce((sum, payment) => sum + payment.amount, 0))}</p><p className="text-[11px] text-muted-foreground">Έσοδα</p></div></div>
                </div>
              </Card>
            </button>;
          })}
          {approved.length === 0 && <Card className="p-8 text-center text-sm text-muted-foreground"><CalendarCheck2 className="mx-auto mb-2 size-6" />Δεν υπάρχουν ακόμη εγκεκριμένες δράσεις.</Card>}
        </div>
      </section>

      </>}

      <SeminarDialog
        booking={selected}
        registrations={registrations}
        loading={loadingRegistrations}
        onClose={() => setSelected(null)}
        people={people}
        payments={payments}
        seminars={seminars}
        newsletters={newsletters}
        personActivities={personActivities}
        onImportAttendance={(attendees) => selected ? recordZoomAttendance(selected.id, selected.topic || selected.event_type || "Δράση Συλλόγου", selected.booking_date, attendees) : 0}
      />
    </AppShell>
  );
}

function SeminarDialog({ booking, registrations, loading, onClose, people, payments, seminars, newsletters, personActivities, onImportAttendance }: {
  booking: ExternalBooking | null;
  registrations: Registration[];
  loading: boolean;
  onClose: () => void;
  people: ReturnType<typeof useClub>["people"];
  payments: ReturnType<typeof useClub>["payments"];
  seminars: ReturnType<typeof useClub>["seminars"];
  newsletters: ReturnType<typeof useClub>["newsletters"];
  personActivities: ReturnType<typeof useClub>["personActivities"];
  onImportAttendance: (attendees: Array<{ name?: string; email?: string }>) => number;
}) {
  const seminar = booking ? seminars.find((item) => item.externalBookingId === booking.id || item.date === booking.booking_date) : undefined;
  const eventPayments = seminar ? payments.filter((payment) => payment.seminarId === seminar.id) : [];
  const paidPayments = eventPayments.filter((payment) => payment.status === "Πληρωμένη");
  const toCheck = eventPayments.filter((payment) => payment.status === "Προς έλεγχο");
  const zoomDraft = booking ? newsletters.filter((item) => item.externalBookingId === booking.id && item.templateKind === "seminar_zoom" && item.zoomUrl).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] : undefined;
  const zoomUrl = seminar?.zoomUrl || zoomDraft?.zoomUrl || "";

  const classified = useMemo(() => registrations.map((registration) => {
    const person = people.find((item) => item.email.trim().toLowerCase() === registration.email.trim().toLowerCase());
    const kind: PersonKind = person?.kind || "Επισκέπτης";
    const payment = eventPayments.find((item) => item.payerEmail?.trim().toLowerCase() === registration.email.trim().toLowerCase());
    const activity = booking && person ? personActivities.find((item) => item.eventId === booking.id && item.personId === person.id) : undefined;
    return { registration, person, kind, payment, activity };
  }), [registrations, people, eventPayments, booking, personActivities]);

  if (!booking) return null;

  const counts = {
    member: classified.filter((item) => item.kind === "Μέλος").length,
    friend: classified.filter((item) => item.kind === "Φίλος").length,
    visitor: classified.filter((item) => item.kind === "Επισκέπτης").length,
    attended: classified.filter((item) => item.activity?.status === "Παρακολούθησε").length,
  };
  const received = paidPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const isFree = booking.activity_category === "association_free";
  const generalFee = isFree ? 0 : Number(String(booking.general_price || "0").replace(",", ".")) || 0;
  const registrationUrl = booking.registration_form_mode === "custom" && booking.registration_form_url && /^https?:\/\//i.test(booking.registration_form_url)
    ? booking.registration_form_url
    : `https://hmerologiosillogou.vercel.app/events?event=${encodeURIComponent(booking.booking_date)}`;
  const memberFee = Number(String(booking.member_price || "0").replace(",", ".")) || generalFee;
  const expected = classified.reduce((sum, item) => sum + (booking.activity_category === "association_free" ? 0 : booking.offers_member_discount && (item.kind === "Μέλος" || item.kind === "Φίλος") ? memberFee : generalFee), 0);

  async function importZoom(file: File) {
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const findValue = (row: Record<string, unknown>, candidates: string[]) => {
        const key = Object.keys(row).find((item) => candidates.some((candidate) => item.toLowerCase().includes(candidate)));
        return key ? String(row[key] ?? "").trim() : "";
      };
      const attendees = rows.map((row) => ({
        email: findValue(row, ["user email", "email", "e-mail"]),
        name: findValue(row, ["name (original name)", "user name", "participant name", "name", "όνομα"]),
      })).filter((item) => item.email || item.name);
      const matched = onImportAttendance(attendees);
      toast.success(`Καταχωρίστηκαν ${matched} παρουσίες από το αρχείο Zoom.`);
    } catch {
      toast.error("Δεν μπόρεσα να διαβάσω το αρχείο παρουσιών Zoom.");
    }
  }

  return <Dialog open={Boolean(booking)} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
      <DialogHeader><DialogTitle className="pr-8 text-xl">{booking.topic || booking.event_type || "Δράση Συλλόγου"}</DialogTitle></DialogHeader>

      <div className="flex flex-wrap gap-2"><Badge variant="secondary">{formatDate(booking.booking_date)}</Badge>{booking.action_time && <Badge variant="outline"><Clock3 className="mr-1 size-3" />{booking.action_time}</Badge>}<Badge variant="outline">{booking.therapist_name}</Badge></div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat icon={Users} label="Εγγραφές" value={String(registrations.length)} />
        {isFree ? <MiniStat icon={CalendarCheck2} label="Κατηγορία" value="Δωρεάν δράση" /> : <MiniStat icon={WalletCards} label="Έσοδα" value={euro(received)} note={expected ? `από ${euro(expected)} αναμενόμενα` : undefined} />}
        <MiniStat icon={UserCheck} label="Παρακολούθησαν" value={String(counts.attended)} note="με βάση εισαγωγή Zoom" />
        <MiniStat icon={Video} label="Zoom" value={zoomUrl ? "Έτοιμο" : "Δεν έχει μπει"} note={seminar?.zoomSentAt ? "Το email έχει σταλεί" : ""} />
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Μέλη</p><p className="text-2xl font-semibold">{counts.member}</p></div><div><p className="text-xs text-muted-foreground">Φίλοι</p><p className="text-2xl font-semibold">{counts.friend}</p></div><div><p className="text-xs text-muted-foreground">Επισκέπτες</p><p className="text-2xl font-semibold">{counts.visitor}</p></div></div>
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
          <Badge variant={seminar?.announcementSentAt ? "secondary" : "outline"}>Ανακοίνωση: {seminar?.announcementSentAt ? "στάλθηκε" : "εκκρεμεί"}</Badge>
          {!isFree && <Badge variant={toCheck.length ? "default" : "outline"}>Προς έλεγχο Ταμία: {toCheck.length}</Badge>}
          <Badge variant={zoomUrl ? "secondary" : "outline"}>Zoom link: {zoomUrl ? "ναι" : "όχι"}</Badge>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild><a href={`/grammateia?event=${encodeURIComponent(booking.id)}`}><Mail className="size-4" />Γραμματεία / Email</a></Button>
        <Button asChild variant="outline"><a href={`https://hmerologiosillogou.vercel.app/events?event=${encodeURIComponent(booking.booking_date)}`} target="_blank" rel="noreferrer"><ExternalLink className="size-4" />Ημερολόγιο</a></Button>
        <Button asChild variant="outline"><a href={registrationUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" />{booking.registration_form_mode === "custom" && booking.registration_form_url ? "Φόρμα θεραπευτή" : "Δήλωση συμμετοχής"}</a></Button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"><Upload className="size-4" />Εισαγωγή παρουσιών Zoom<input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importZoom(file); event.currentTarget.value = ""; }} /></label>
        <Button variant="ghost" onClick={() => window.location.reload()}><RefreshCw className="size-4" />Ανανέωση</Button>
      </div>

      {isFree ? <FreeActionParticipants bookingId={booking.id} title={booking.topic || booking.event_type || "Δράση Συλλόγου"} date={booking.booking_date} /> : <SeminarFinance key={`${booking.id}:${booking.general_price}:${booking.member_price}`} bookingId={booking.id} seminarId={seminar?.id || `seminar-${booking.id}`} title={booking.topic || booking.event_type || "Δράση Συλλόγου"} date={booking.booking_date} initialFee={generalFee} />}
      <div>
        <div className="flex items-center justify-between"><h3 className="font-semibold">Συμμετέχοντες</h3><Badge variant="outline">{registrations.length}</Badge></div>
        {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Φόρτωση εγγραφών…</p> : <div className="mt-3 space-y-2">
          {classified.map(({ registration, kind, payment, activity }) => <div key={registration.id} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="min-w-0"><p className="font-medium">{registration.full_name}</p><p className="break-all text-xs text-muted-foreground">{registration.email}{registration.phone ? ` · ${registration.phone}` : ""}</p></div>
            <div className="flex flex-wrap gap-1.5 sm:justify-end"><Badge variant={kind === "Μέλος" ? "default" : kind === "Φίλος" ? "secondary" : "outline"}>{kind}</Badge><Badge variant={payment?.status === "Πληρωμένη" ? "secondary" : payment?.status === "Προς έλεγχο" ? "default" : "outline"}>{booking.activity_category === "association_free" ? "Δωρεάν" : payment?.status || "Χωρίς επιβεβαίωση"}</Badge><Badge variant={activity?.status === "Παρακολούθησε" ? "default" : "outline"}>{activity?.status || "Εγγράφηκε"}</Badge></div>
          </div>)}
          {registrations.length === 0 && <p className="rounded-xl bg-secondary p-5 text-sm text-muted-foreground">Δεν υπάρχουν ακόμη εγγραφές.</p>}
        </div>}
      </div>
    </DialogContent>
  </Dialog>;
}

function MiniStat({ icon: Icon, label, value, note }: { icon: typeof Users; label: string; value: string; note?: string }) {
  return <Card className="p-4"><div className="flex items-center gap-2 text-muted-foreground"><Icon className="size-4" /><p className="text-xs">{label}</p></div><p className="mt-2 text-xl font-semibold">{value}</p>{note && <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>}</Card>;
}
