import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowRight, CalendarDays, UsersRound } from "lucide-react";
import {
  useClub,
  formatDate,
  daysUntil,
  TODAY,
  type Task,
} from "@/lib/club-data";
import type { ExternalBooking } from "@/lib/external-calendar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Αρχική — Κεντρικό Hub ΔΣ" },
      {
        name: "description",
        content: "Οι άμεσες εργασίες του ΔΣ, ποιος έχει τι να κάνει και το κοινό ημερολόγιο.",
      },
    ],
  }),
  component: Index,
});

type CalendarKind = "Σεμινάριο" | "Zoom" | "Συνεδρίαση" | "Deadline" | "Οικονομικός έλεγχος" | "Δράση";
type HomeCalendarItem = { id: string; date: string; title: string; kind: CalendarKind };

function bookingKind(booking: ExternalBooking): CalendarKind {
  const value = `${booking.event_type ?? ""} ${booking.topic ?? ""}`.toLocaleLowerCase("el-GR");
  if (value.includes("συνάντ") || value.includes("συνεδρ")) return "Συνεδρίαση";
  if (value.includes("σεμιν") || value.includes("εργαστ") || value.includes("ημερί")) return "Σεμινάριο";
  return "Δράση";
}

function calendarClass(kind: CalendarKind) {
  if (kind === "Σεμινάριο") return "border-emerald-200 bg-emerald-100 text-emerald-950";
  if (kind === "Zoom") return "border-violet-200 bg-violet-100 text-violet-950";
  if (kind === "Συνεδρίαση") return "border-sky-200 bg-sky-100 text-sky-950";
  if (kind === "Οικονομικός έλεγχος") return "border-amber-200 bg-amber-100 text-amber-950";
  if (kind === "Deadline") return "border-rose-200 bg-rose-100 text-rose-950";
  return "border-teal-200 bg-teal-100 text-teal-950";
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildMonthDays(year: number, month: number) {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: count }, (_, index) => index + 1),
  ];
}

function actionableCount(tasks: Task[], role: Task["ownerRole"]) {
  return tasks.filter((task) => task.ownerRole === role && task.status !== "Ολοκληρώθηκε" && task.status !== "Αναμονή").length;
}

function Index() {
  const { tasks, boardMembers, pendingCalendarApprovals, externalBookings } = useClub();
  const actionable = tasks.filter((task) => task.status !== "Ολοκληρώθηκε" && task.status !== "Αναμονή");
  const urgent = actionable
    .filter((task) => task.urgent || daysUntil(task.due) <= 1)
    .sort((a, b) => a.due.localeCompare(b.due));

  const approvedBookings = externalBookings.filter(
    (booking) => booking.approval_status === "approved" || booking.is_public === true,
  );
  const zoomItems: HomeCalendarItem[] = tasks
    .filter((task) => task.status !== "Ολοκληρώθηκε" && task.title.toLocaleLowerCase("el-GR").includes("zoom"))
    .map((task) => ({ id: task.id, date: task.due, title: task.title.replace(/^Αποστολή\s+/i, ""), kind: "Zoom" }));
  const externalItems: HomeCalendarItem[] = approvedBookings.map((booking) => ({
    id: `booking-${booking.id}`,
    date: booking.booking_date,
    title: booking.topic || booking.event_type || "Δράση Συλλόγου",
    kind: bookingKind(booking),
  }));
  const calendarItems = [...externalItems, ...zoomItems];

  const year = TODAY.getFullYear();
  const month = TODAY.getMonth();
  const monthDays = buildMonthDays(year, month);
  const monthName = new Date(year, month, 1).toLocaleDateString("el-GR", { month: "long", year: "numeric" });
  const todayIso = dateKey(year, month, TODAY.getDate());

  return (
    <AppShell>
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Αρχική</h1>
          <p className="text-sm text-muted-foreground">
            {TODAY.toLocaleDateString("el-GR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </header>

      <div className="mt-5 grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <AlertCircle className="size-5 text-destructive" /> Άμεσα
            </h2>
            <Badge variant="outline">{urgent.length + pendingCalendarApprovals.length}</Badge>
          </div>

          <div className="mt-3 grid gap-3">
            {pendingCalendarApprovals.map((booking) => (
              <Card key={`approval-${booking.id}`} className="flex flex-col gap-3 border-destructive/25 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Έγκριση: {booking.topic || booking.event_type || "Νέα δράση"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Πρόεδρος · {formatDate(booking.booking_date)}</p>
                </div>
                <Button asChild size="sm">
                  <Link to="/seminaria">Έγκριση <ArrowRight className="size-4" /></Link>
                </Button>
              </Card>
            ))}

            {urgent.map((task) => (
              <Card key={task.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{task.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{task.ownerRole} · {formatDate(task.due)}</p>
                </div>
                <Button asChild size="sm">
                  <Link to={task.action?.to ?? "/ergasies"}>{task.action?.label ?? "Άνοιγμα"}<ArrowRight className="size-4" /></Link>
                </Button>
              </Card>
            ))}

            {urgent.length === 0 && pendingCalendarApprovals.length === 0 && (
              <Card className="p-5 text-sm text-muted-foreground">Δεν υπάρχει άμεση ενέργεια αυτή τη στιγμή.</Card>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><UsersRound className="size-5" /> Η ομάδα των 5</h2>
            <Button asChild variant="ghost" size="sm"><Link to="/karteles">Καρτέλες ΔΣ</Link></Button>
          </div>
          <Card className="mt-3 overflow-hidden p-0">
            <div className="divide-y divide-border">
              {boardMembers.map((member) => {
                const count = actionableCount(tasks, member.role);
                return (
                  <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{member.name || member.role}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold leading-none">{count}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">εργασίες</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>
      </div>

      <section className="mt-7">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold"><CalendarDays className="size-5" /> Ημερολόγιο</h2>
            <p className="text-xs capitalize text-muted-foreground">{monthName}</p>
          </div>
          <Button asChild variant="outline" size="sm"><Link to="/imerologio">Άνοιγμα ημερολογίου</Link></Button>
        </div>

        <Card className="mt-3 overflow-x-auto p-3">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-7 gap-1.5 pb-2 text-center text-[11px] font-medium uppercase text-muted-foreground">
              {['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'].map((day) => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {monthDays.map((day, index) => {
                if (!day) return <div key={`blank-${index}`} className="min-h-24 rounded-xl bg-muted/20" />;
                const iso = dateKey(year, month, day);
                const dayItems = calendarItems.filter((item) => item.date === iso);
                return (
                  <div key={iso} className={`min-h-24 rounded-xl border p-2 ${iso === todayIso ? "border-primary bg-primary/5" : "border-border bg-background"}`}>
                    <p className={`text-xs font-semibold ${iso === todayIso ? "text-primary" : "text-muted-foreground"}`}>{day}</p>
                    <div className="mt-1.5 space-y-1">
                      {dayItems.slice(0, 3).map((item) => (
                        <div key={`${item.kind}-${item.id}`} className={`rounded-md border px-1.5 py-1 text-[10px] font-medium leading-tight ${calendarClass(item.kind)}`}>
                          <span className="font-semibold">{item.kind === "Zoom" ? "Zoom" : item.kind}:</span> {item.title}
                        </div>
                      ))}
                      {dayItems.length > 3 && <p className="px-1 text-[10px] text-muted-foreground">+{dayItems.length - 3} ακόμη</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
