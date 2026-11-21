import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useClub, TODAY } from "@/lib/club-data";
import type { ExternalBooking } from "@/lib/external-calendar";

export const Route = createFileRoute("/imerologio")({
  head: () => ({
    meta: [
      { title: "Ημερολόγιο — Κεντρική Εφαρμογή Συλλόγου" },
      {
        name: "description",
        content: "Κοινό ημερολόγιο ΔΣ με δράσεις, σεμινάρια, συναντήσεις και υπενθυμίσεις Zoom.",
      },
    ],
  }),
  component: CalendarPage,
});

type CalendarKind = "Σεμινάριο" | "Zoom" | "Συνεδρίαση" | "Deadline" | "Οικονομικός έλεγχος" | "Δράση";
type CalendarItem = { id: string; date: string; title: string; kind: CalendarKind; to?: string };

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

function monthCells(year: number, month: number) {
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: count }, (_, index) => index + 1),
  ];
}

function CalendarPage() {
  const { tasks, externalBookings } = useClub();
  const [cursor, setCursor] = useState(() => new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const items = useMemo<CalendarItem[]>(() => {
    const bookingItems: CalendarItem[] = externalBookings
      .filter((booking) => booking.approval_status === "approved" || booking.is_public === true)
      .map((booking) => ({
        id: `booking-${booking.id}`,
        date: booking.booking_date,
        title: booking.topic || booking.event_type || "Δράση Συλλόγου",
        kind: bookingKind(booking),
        to: "/seminaria",
      }));
    const zoomItems: CalendarItem[] = tasks
      .filter((task) => task.status !== "Ολοκληρώθηκε" && task.title.toLocaleLowerCase("el-GR").includes("zoom"))
      .map((task) => ({
        id: task.id,
        date: task.due,
        title: task.title.replace(/^Αποστολή\s+/i, ""),
        kind: "Zoom",
        to: task.action?.to || "/grammateia",
      }));
    return [...bookingItems, ...zoomItems];
  }, [tasks, externalBookings]);

  const cells = monthCells(year, month);
  const monthName = cursor.toLocaleDateString("el-GR", { month: "long", year: "numeric" });
  const todayIso = dateKey(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());

  return (
    <AppShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ημερολόγιο</h1>
          <p className="mt-1 text-sm text-muted-foreground">Δράσεις και οι ενέργειες που πρέπει να γίνουν σε συγκεκριμένη ημέρα.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Προηγούμενος μήνας"><ChevronLeft className="size-4" /></Button>
          <div className="min-w-40 text-center text-sm font-semibold capitalize">{monthName}</div>
          <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Επόμενος μήνας"><ChevronRight className="size-4" /></Button>
        </div>
      </div>

      <Card className="mt-5 overflow-x-auto p-3 sm:p-4">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-7 gap-2 pb-2 text-center text-xs font-medium uppercase text-muted-foreground">
            {['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή'].map((day) => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {cells.map((day, index) => {
              if (!day) return <div key={`blank-${index}`} className="min-h-32 rounded-xl bg-muted/20" />;
              const iso = dateKey(year, month, day);
              const dayItems = items.filter((item) => item.date === iso);
              return (
                <div key={iso} className={`min-h-32 rounded-xl border p-2 ${iso === todayIso ? "border-primary bg-primary/5" : "border-border bg-background"}`}>
                  <p className={`text-sm font-semibold ${iso === todayIso ? "text-primary" : "text-muted-foreground"}`}>{day}</p>
                  <div className="mt-2 space-y-1.5">
                    {dayItems.map((item) => {
                      const content = (
                        <div className={`rounded-lg border px-2 py-1.5 text-[11px] leading-snug ${calendarClass(item.kind)}`}>
                          <p className="font-semibold">{item.kind}</p>
                          <p className="mt-0.5 line-clamp-3">{item.title}</p>
                        </div>
                      );
                      return item.to ? <Link key={`${item.kind}-${item.id}`} to={item.to}>{content}</Link> : <div key={`${item.kind}-${item.id}`}>{content}</div>;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
