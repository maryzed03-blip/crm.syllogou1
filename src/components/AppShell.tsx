import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  ListChecks,
  CalendarDays,
  Users,
  GraduationCap,
  FolderOpen,
  Settings,
  Bell,
  Menu,
  Crown,
  ShieldCheck,
  MailPlus,
  Wallet,
  UserRound,
  Workflow,
  NotebookPen,
  MapPinned,
} from "lucide-react";
import { useClub, type Role } from "@/lib/club-data";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const mainNav = [
  { href: "/", label: "Αρχική", icon: LayoutDashboard },
  { href: "/ergasies", label: "Εργασίες", icon: ListChecks },
  { href: "/projects", label: "Projects", icon: Workflow },
  { href: "/synantiseis", label: "Συναντήσεις", icon: NotebookPen },
] as const;

const roleNav: Array<{ role: Role; label: string; icon: typeof Crown }> = [
  { role: "Πρόεδρος", label: "Πρόεδρος", icon: Crown },
  { role: "Αντιπρόεδρος", label: "Αντιπρόεδρος", icon: ShieldCheck },
  { role: "Γραμματέας", label: "Γραμματέας", icon: MailPlus },
  { role: "Ταμίας", label: "Ταμίας", icon: Wallet },
  { role: "Μέλος", label: "Μέλος", icon: UserRound },
];

const modulesNav = [
  { href: "/imerologio", label: "Ημερολόγιο", icon: CalendarDays },
  { href: "/crm", label: "SEPSIG CRM", icon: Users },
  { href: "/meli", label: "Μητρώο (παλαιό)", icon: Users },
  { href: "/therapeftes", label: "Θεραπευτές Συλλόγου", icon: MapPinned },
  { href: "/seminaria", label: "Σεμινάρια", icon: GraduationCap },
] as const;

function currentRoleFromUrl() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("role");
}

function settingsFromUrl() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("settings") === "1";
}

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof LayoutDashboard; active: boolean }) {
  return (
    <a
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      <Icon className="size-5" />
      {label}
    </a>
  );
}

function Navigation({ pathname }: { pathname: string }) {
  const roleParam = currentRoleFromUrl();
  const settingsActive = pathname === "/karteles" && settingsFromUrl();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav className="space-y-1 overflow-y-auto pr-1">
        {mainNav.map((item) => (
          <NavLink key={item.href} {...item} active={item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)} />
        ))}

        <div className="my-2 border-t border-border" />
        {roleNav.map((item) => (
          <NavLink
            key={item.role}
            href={`/karteles?role=${encodeURIComponent(item.role)}`}
            label={item.label}
            icon={item.icon}
            active={pathname === "/karteles" && !settingsActive && roleParam === item.role}
          />
        ))}

        <div className="my-2 border-t border-border" />
        {modulesNav.map((item) => (
          <NavLink key={item.href} {...item} active={pathname.startsWith(item.href)} />
        ))}
      </nav>

      <div className="mt-auto space-y-1 border-t border-border pt-3">
        <NavLink href="/arxeia" label="Αρχεία" icon={FolderOpen} active={pathname.startsWith("/arxeia")} />
        <NavLink href="/karteles?settings=1" label="ΔΣ Ρυθμίσεις" icon={Settings} active={settingsActive} />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { currentRole, setCurrentRole, tasks, boardMembers, pendingCalendarApprovals } = useClub();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const myTasks = tasks.filter((t) => t.ownerRole === currentRole && t.status !== "Ολοκληρώθηκε");
  const actionTasks = myTasks.filter((t) => t.status !== "Αναμονή").slice(0, 6);
  const notifications = currentRole === "Πρόεδρος"
    ? [
        ...pendingCalendarApprovals.map((booking) => ({ id: `calendar-${booking.id}`, title: `Έγκριση: ${booking.topic || booking.event_type || booking.therapist_name}`, action: { to: "/seminaria" } })),
        ...actionTasks,
      ].slice(0, 8)
    : actionTasks;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Μενού"><Menu className="size-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-72 flex-col p-4">
              <div className="mb-5 flex items-center gap-3 px-1 pt-2">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground">ΔΣ</span>
                <div><p className="font-semibold">Κεντρικό Hub</p><p className="text-xs text-muted-foreground">Σύλλογος</p></div>
              </div>
              <div className="min-h-0 flex-1"><Navigation pathname={pathname} /></div>
            </SheetContent>
          </Sheet>
          <Link to="/" className="font-semibold">Κεντρικό Hub ΔΣ</Link>
          <div className="ml-auto"><NotificationButton currentRole={currentRole} actionTasks={notifications} /></div>
        </div>
      </header>

      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-card p-4 lg:flex lg:flex-col">
        <Link to="/" className="mb-5 flex items-center gap-3 px-1">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground">ΔΣ</span>
          <div><p className="font-semibold tracking-tight">Κεντρικό Hub</p><p className="text-xs text-muted-foreground">Όλα σε ένα σημείο</p></div>
        </Link>
        <div className="min-h-0 flex-1"><Navigation pathname={pathname} /></div>
      </aside>

      <div className="lg:pl-64">
        <div className="hidden border-b border-border bg-card/80 px-6 py-3 backdrop-blur lg:flex lg:items-center lg:justify-end">
          <div className="flex items-center gap-2">
            <NotificationButton currentRole={currentRole} actionTasks={notifications} />
            <Select value={currentRole} onValueChange={(v) => setCurrentRole(v as Role)}>
              <SelectTrigger className="w-[215px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {boardMembers.map((m) => <SelectItem key={m.id} value={m.role}>{m.name ? `${m.role} · ${m.name}` : m.role}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7">{children}</main>
      </div>
    </div>
  );
}

function NotificationButton({ currentRole, actionTasks }: { currentRole: string; actionTasks: { id: string; title: string; action?: { to: string } }[] }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Ειδοποιήσεις">
          <Bell className="size-5" />
          {actionTasks.length > 0 && <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">{actionTasks.length}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-2">
        <p className="px-2 py-1 text-xs font-semibold">Ενέργειες · {currentRole}</p>
        {actionTasks.length === 0 ? <p className="rounded-lg bg-secondary px-3 py-3 text-sm">Δεν υπάρχει άμεση εκκρεμότητα.</p> : actionTasks.map((task) => (
          <Link key={task.id} to={task.action?.to ?? "/ergasies"} className="block rounded-lg px-3 py-2 text-sm hover:bg-secondary">{task.title}</Link>
        ))}
      </PopoverContent>
    </Popover>
  );
}
