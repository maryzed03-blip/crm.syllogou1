import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Clock3, Lock, Plus } from "lucide-react";
import { toast } from "sonner";
import { useClub, formatDate, type Role, type TaskCategory } from "@/lib/club-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ergasies")({
  validateSearch: (search: Record<string, unknown>) => ({
    role: typeof search.role === "string" ? search.role : undefined,
  }),
  head: () => ({ meta: [{ title: "Εργασίες — Κεντρικό Hub" }] }),
  component: TasksPage,
});

const categories: TaskCategory[] = ["Διοίκηση", "Γραμματεία", "Οικονομικά", "Σεμινάρια", "Δράσεις", "Επικοινωνία"];

function TasksPage() {
  const search = Route.useSearch();
  const { tasks, setTaskStatus, addTask, currentRole, boardMembers } = useClub();
  const initialRole = boardMembers.some((member) => member.role === search.role) ? (search.role as Role) : "Όλοι";
  const [role, setRole] = useState<"Όλοι" | Role>(initialRole);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [ownerRole, setOwnerRole] = useState<Role>("Πρόεδρος");
  const [category, setCategory] = useState<TaskCategory>("Διοίκηση");
  const [due, setDue] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [notes, setNotes] = useState("");
  const [urgent, setUrgent] = useState(false);

  const list = useMemo(
    () => tasks.filter((task) => role === "Όλοι" || task.ownerRole === role),
    [tasks, role],
  );

  const resetForm = () => {
    setTitle("");
    setOwnerRole(currentRole);
    setCategory("Διοίκηση");
    setDue("");
    setDueTime("");
    setNotes("");
    setUrgent(false);
  };

  const createManualTask = () => {
    if (!title.trim()) {
      toast.error("Γράψε έναν τίτλο για την εργασία.");
      return;
    }
    if (!due) {
      toast.error("Επίλεξε μέχρι πότε πρέπει να γίνει.");
      return;
    }

    addTask({
      title: title.trim(),
      ownerRole,
      category,
      due,
      dueTime: dueTime || undefined,
      notes: notes.trim() || undefined,
      urgent,
      createdByRole: currentRole,
    });
    toast.success(`Η εργασία ανατέθηκε στον ρόλο: ${ownerRole}.`);
    setDialogOpen(false);
    resetForm();
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Εργασίες</h1>
          <p className="mt-1 text-sm text-muted-foreground">Όλες οι εργασίες του ΔΣ σε ένα σημείο.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4" /> Νέα εργασία</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Νέα εργασία</DialogTitle>
              <DialogDescription>Καταχώρισε κάτι που πρέπει να γίνει και ανάθεσέ το σε έναν από τους 5 ρόλους.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="task-title">Εργασία</Label>
                <Input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="π.χ. Απάντηση στο αίτημα που ήρθε με email" autoFocus />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Ανάθεση σε</Label>
                  <Select value={ownerRole} onValueChange={(value) => setOwnerRole(value as Role)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {boardMembers.map((member) => <SelectItem key={member.id} value={member.role}>{member.name ? `${member.role} · ${member.name}` : member.role}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Κατηγορία</Label>
                  <Select value={category} onValueChange={(value) => setCategory(value as TaskCategory)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="task-date">Μέχρι πότε</Label>
                  <Input id="task-date" type="date" value={due} onChange={(event) => setDue(event.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="task-time">Ώρα <span className="font-normal text-muted-foreground">(προαιρετικά)</span></Label>
                  <Input id="task-time" type="time" value={dueTime} onChange={(event) => setDueTime(event.target.value)} />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="task-notes">Πληροφορίες / αίτημα / σημειώσεις</Label>
                <Textarea id="task-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} placeholder="Μπορείς να γράψεις ή να επικολλήσεις εδώ τις πληροφορίες από ένα email ή οτιδήποτε χρειάζεται να ξέρει αυτός που θα την αναλάβει." />
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3">
                <Checkbox checked={urgent} onCheckedChange={(checked) => setUrgent(checked === true)} />
                <span><span className="block text-sm font-medium">Άμεση εργασία</span><span className="block text-xs text-muted-foreground">Θα εμφανίζεται με ένδειξη «Άμεσο».</span></span>
              </label>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Ακύρωση</Button>
              <Button onClick={createManualTask}>Ανάθεση εργασίας</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        <Button variant={role === "Όλοι" ? "outline" : "ghost"} size="sm" onClick={() => setRole("Όλοι")}>Όλοι οι ρόλοι</Button>
        {boardMembers.map((member) => (
          <Button key={member.id} variant={role === member.role ? "outline" : "ghost"} size="sm" onClick={() => setRole(member.role)}>{member.role}</Button>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        {list.map((task) => {
          const blocked = task.dependsOn?.some((dependencyId) => tasks.find((item) => item.id === dependencyId)?.status !== "Ολοκληρώθηκε") ?? false;
          return (
            <Card key={task.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{task.title}</p>
                    {task.urgent && task.status !== "Ολοκληρώθηκε" && <Badge variant="destructive">Άμεσο</Badge>}
                    {task.manual && <Badge variant="outline">Χειροκίνητη</Badge>}
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span>{task.ownerRole}</span>·<span>{task.category}</span>·<span>{formatDate(task.due)}</span>
                    {task.dueTime && <><span>·</span><span className="inline-flex items-center gap-1"><Clock3 className="size-3" />{task.dueTime}</span></>}
                    {task.relatedTo && <>·<span>{task.relatedTo}</span></>}
                  </p>
                  {task.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{task.notes}</p>}
                  {blocked && <p className="mt-2 flex items-center gap-1.5 text-xs text-warning-foreground"><Lock className="size-3.5" /> Περιμένει να ολοκληρωθεί: {tasks.find((item) => item.id === task.dependsOn?.[0])?.title}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge className={cn(task.status === "Ολοκληρώθηκε" && "bg-success text-success-foreground", task.status === "Αναμονή" && "bg-warning text-warning-foreground")} variant={task.status === "Νέα" ? "outline" : task.status === "Σε εξέλιξη" ? "secondary" : "default"}>{task.status}</Badge>
                  {task.status !== "Ολοκληρώθηκε" && <Button size="sm" disabled={blocked} onClick={() => setTaskStatus(task.id, "Ολοκληρώθηκε")}><Check className="size-4" /> Έγινε</Button>}
                </div>
              </div>
            </Card>
          );
        })}
        {list.length === 0 && <Card className="p-8 text-center text-sm text-muted-foreground">Δεν υπάρχουν εργασίες για αυτόν τον ρόλο.</Card>}
      </div>
    </AppShell>
  );
}
