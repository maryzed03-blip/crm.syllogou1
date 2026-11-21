import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { SharedSheetImport } from "@/components/SharedSheetImport";
import {
  ContactRound,
  Copy,
  Eye,
  FileCode2,
  FileSpreadsheet,
  Folder,
  FolderOpen,
  FolderPlus,
  Mail,
  MailCheck,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Trash2,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import {
  useClub,
  type Contact,
  type ContactKind,
  type ContactList,
  type Newsletter,
  type NewsletterRecipientGroup,
} from "@/lib/club-data";
import {
  blankFieldsFor,
  buildNewsletterHtml,
  fieldsFromBooking,
  templateLabels,
  type NewsletterFields,
  type NewsletterTemplateKind,
} from "@/lib/newsletter-template";

export const Route = createFileRoute("/grammateia")({
  validateSearch: (search: Record<string, unknown>) => ({
    view: typeof search.view === "string" ? search.view : undefined,
    draft: typeof search.draft === "string" ? search.draft : undefined,
    event: typeof search.event === "string" ? search.event : undefined,
    mode: typeof search.mode === "string" ? search.mode : undefined,
  }),
  head: () => ({ meta: [{ title: "Γραμματεία — Κεντρικό Hub" }] }),
  component: SecretaryPage,
});

const blankFields: NewsletterFields = blankFieldsFor("seminar_announcement");
const EMAIL_RE = /^\S+@\S+\.\S+$/;

function SecretaryPage() {
  const search = Route.useSearch();
  const { tasks, contacts, contactLists, newsletters } = useClub();
  const [activeTab, setActiveTab] = useState("tasks");
  const [openNewsletterId, setOpenNewsletterId] = useState<string | null>(search.draft ?? null);

  const secretaryTasks = tasks.filter((task) => task.ownerRole === "Γραμματέας" && task.status !== "Ολοκληρώθηκε");
  const activeContacts = contacts.filter((contact) => contact.subscribed && contact.email);
  const sent = newsletters.filter((item) => item.status === "Απεσταλμένο").length;

  function openNewsletter(id: string) {
    setOpenNewsletterId(id);
    setActiveTab("newsletter");
  }

  const dedicatedView = search.view;
  if (dedicatedView === "contacts") return (
    <AppShell>
      <SecretaryToolHeader title="Επαφές & λίστες" note="Φάκελοι, επαφές, αυτόματες λίστες σεμιναρίων και Excel import." />
      <div className="mt-5"><ContactsPanel /></div>
    </AppShell>
  );
  if (dedicatedView === "newsletter") return (
    <AppShell>
      <SecretaryToolHeader title="Newsletter / Email Builder" note="Δημιουργία, preview και αποστολή email." />
      <div className="mt-5"><NewsletterBuilder openNewsletterId={openNewsletterId} onStartNew={() => setOpenNewsletterId(null)} /></div>
    </AppShell>
  );
  if (dedicatedView === "history") return (
    <AppShell>
      <SecretaryToolHeader title="Πρόχειρα & ιστορικό" note="Άνοιγμα, αντιγραφή και διαγραφή προηγούμενων email." />
      <div className="mt-5"><NewsletterHistory onOpen={(id) => { window.location.href = `/grammateia?view=newsletter&draft=${encodeURIComponent(id)}`; }} /></div>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Γραμματεία</h1>
          <p className="mt-1 text-sm text-muted-foreground">Εργασίες, λίστες επαφών και email σε ένα σημείο.</p>
        </div>
        <Badge variant="outline" className="w-fit">{secretaryTasks.length} ανοιχτές εργασίες</Badge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <Card className="p-4"><ContactRound className="size-5 text-primary" /><p className="mt-3 text-2xl font-semibold">{contacts.length}</p><p className="text-xs text-muted-foreground">συνολικές επαφές</p></Card>
        <Card className="p-4"><Folder className="size-5 text-primary" /><p className="mt-3 text-2xl font-semibold">{contactLists.length}</p><p className="text-xs text-muted-foreground">λίστες / φάκελοι</p></Card>
        <Card className="p-4"><UsersRound className="size-5 text-primary" /><p className="mt-3 text-2xl font-semibold">{activeContacts.length}</p><p className="text-xs text-muted-foreground">ενεργοί παραλήπτες</p></Card>
        <Card className="p-4"><MailCheck className="size-5 text-primary" /><p className="mt-3 text-2xl font-semibold">{sent}</p><p className="text-xs text-muted-foreground">email που στάλθηκαν</p></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="tasks">Οι εργασίες μου</TabsTrigger>
          <TabsTrigger value="contacts">Επαφές & λίστες</TabsTrigger>
          <TabsTrigger value="newsletter">Newsletter / HTML Builder</TabsTrigger>
          <TabsTrigger value="history">Πρόχειρα & ιστορικό</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          <div className="grid gap-3">
            {secretaryTasks.map((task) => (
              <Card key={task.id} className="p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1"><p className="font-medium">{task.title}</p><p className="mt-1 text-xs text-muted-foreground">{task.category} · {task.due}{task.notes ? ` · ${task.notes}` : ""}</p></div>
                  <Badge variant={task.urgent ? "destructive" : "outline"}>{task.status}</Badge>
                </div>
              </Card>
            ))}
            {secretaryTasks.length === 0 && <Card className="p-8 text-center text-sm text-muted-foreground">Δεν υπάρχει ανοιχτή εργασία για τη Γραμματεία.</Card>}
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="mt-4"><ContactsPanel /></TabsContent>
        <TabsContent value="newsletter" className="mt-4">
          <NewsletterBuilder openNewsletterId={openNewsletterId} onStartNew={() => setOpenNewsletterId(null)} />
        </TabsContent>
        <TabsContent value="history" className="mt-4"><NewsletterHistory onOpen={openNewsletter} /></TabsContent>
      </Tabs>
    </AppShell>
  );
}

function SecretaryToolHeader({ title, note }: { title: string; note: string }) {
  return <div><a href={`/karteles?role=${encodeURIComponent("Γραμματέας")}`} className="text-xs text-muted-foreground hover:text-foreground">← Εργαλεία Γραμματείας</a><h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{note}</p></div>;
}

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9α-ω]+/g, "");
}

function valueByHeaders(row: Record<string, unknown>, candidates: string[]) {
  const normalized = new Map(Object.entries(row).map(([key, value]) => [normalizeHeader(key), value]));
  for (const candidate of candidates) {
    const value = normalized.get(normalizeHeader(candidate));
    if (value !== undefined && String(value).trim()) return String(value).trim();
  }
  return "";
}

function parseContactKind(value: string): ContactKind {
  const normalized = normalizeHeader(value);
  if (normalized.includes("μελ") || normalized === "member") return "Μέλος";
  if (normalized.includes("φιλ") || normalized === "friend") return "Φίλος";
  if (normalized.includes("επισκεπ") || normalized === "visitor" || normalized === "guest") return "Επισκέπτης";
  return "Άλλη επαφή";
}

function ContactsPanel() {
  const {
    contacts,
    contactLists,
    people,
    upsertContact,
    deleteContact,
    toggleContactSubscription,
    upsertContactList,
    deleteContactList,
    syncCalendarContactLists,
  } = useClub();
  const [query, setQuery] = useState("");
  const [activeListId, setActiveListId] = useState("all");
  const [contactOpen, setContactOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [kind, setKind] = useState<ContactKind>("Άλλη επαφή");
  const [folderName, setFolderName] = useState("");
  const [importFolderName, setImportFolderName] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const activeList = activeListId === "all" ? undefined : contactLists.find((item) => item.id === activeListId);
  const list = contacts
    .filter((contact) => !activeList || activeList.contactIds.includes(contact.id))
    .filter((contact) => `${contact.name} ${contact.email} ${contact.phone || ""}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, "el"));

  function addContact() {
    if (name.trim().length < 2 || !EMAIL_RE.test(email.trim())) {
      toast.error("Συμπλήρωσε όνομα και έγκυρο email.");
      return;
    }
    const contact: Contact = {
      id: `contact-${crypto.randomUUID()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      kind,
      subscribed: false,
      tags: [kind],
      source: "Χειροκίνητη",
      updatedAt: new Date().toISOString(),
    };
    upsertContact(contact);
    if (activeList) upsertContactList({ ...activeList, contactIds: Array.from(new Set([...activeList.contactIds, contact.id])) });
    setName(""); setEmail(""); setPhone(""); setKind("Άλλη επαφή"); setContactOpen(false);
    toast.success(activeList ? `Η επαφή προστέθηκε στη λίστα «${activeList.name}».` : "Η επαφή προστέθηκε.");
  }

  function createFolder() {
    if (!folderName.trim()) {
      toast.error("Δώσε όνομα στη λίστα.");
      return;
    }
    const now = new Date().toISOString();
    const folder: ContactList = {
      id: `list-${crypto.randomUUID()}`,
      name: folderName.trim(),
      type: "Χειροκίνητη",
      source: "Χειροκίνητη",
      contactIds: [],
      createdAt: now,
      updatedAt: now,
    };
    upsertContactList(folder);
    setActiveListId(folder.id);
    setFolderName("");
    setFolderOpen(false);
    toast.success("Η λίστα δημιουργήθηκε.");
  }

  function renameFolder(folder: ContactList) {
    const next = window.prompt("Νέο όνομα λίστας", folder.name)?.trim();
    if (!next || next === folder.name) return;
    upsertContactList({ ...folder, name: next });
    toast.success("Η λίστα μετονομάστηκε.");
  }

  async function runCalendarSync() {
    setSyncing(true);
    try {
      await syncCalendarContactLists();
      toast.success("Οι λίστες συμμετοχών συγχρονίστηκαν από το Ημερολόγιο.");
    } finally {
      setSyncing(false);
    }
  }

  async function importExcel() {
    if (!importFile || !importFolderName.trim()) {
      toast.error("Επίλεξε Excel/CSV και όνομα λίστας.");
      return;
    }
    setImporting(true);
    try {
      const XLSX = await import("xlsx");
      const data = await importFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!firstSheet) throw new Error("Το αρχείο δεν έχει φύλλο δεδομένων.");
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
      if (!rows.length) throw new Error("Το αρχείο δεν περιέχει εγγραφές.");

      const knownByEmail = new Map(contacts.map((contact) => [contact.email.trim().toLowerCase(), contact]));
      const importedIds: string[] = [];
      let created = 0;
      let reused = 0;
      let skipped = 0;

      for (const row of rows) {
        const rowEmail = valueByHeaders(row, ["email", "e-mail", "mail", "ηλεκτρονικό ταχυδρομείο", "ηλεκτρονικη διευθυνση"]).toLowerCase();
        const rowName = valueByHeaders(row, ["ονοματεπώνυμο", "ονομα", "name", "full name", "fullname"]);
        const rowPhone = valueByHeaders(row, ["τηλέφωνο", "τηλεφωνο", "phone", "mobile", "κινητό", "κινητο"]);
        const rowKind = valueByHeaders(row, ["κατηγορία", "κατηγορια", "τύπος", "τυπος", "kind", "type", "status"]);
        const optInText = valueByHeaders(row, ["newsletter", "ενημερωτικό δελτίο", "συναίνεση", "ενημερώσεις", "Επιθυμώ να λαμβάνω ενημερώσεις για επόμενες δράσεις και σεμινάρια του Συλλόγου."]);
        const normalizedConsent = optInText.trim().toLocaleLowerCase("el-GR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const optIn = ["ναι", "yes", "true", "1", "συμφωνω"].includes(normalizedConsent);
        const optOut = ["οχι", "no", "false", "0", "δεν συμφωνω"].includes(normalizedConsent);
        if (!EMAIL_RE.test(rowEmail)) { skipped += 1; continue; }

        let contact = knownByEmail.get(rowEmail);
        if (!contact) {
          contact = {
            id: `contact-import-${crypto.randomUUID()}`,
            name: rowName || rowEmail,
            email: rowEmail,
            phone: rowPhone,
            kind: parseContactKind(rowKind),
            subscribed: optIn,
            tags: ["Import Excel"],
            source: "Import Excel",
            updatedAt: new Date().toISOString(),
          };
          knownByEmail.set(rowEmail, contact);
          upsertContact(contact);
          created += 1;
        } else {
          reused += 1;
          if (optIn || optOut) {
            contact = { ...contact, subscribed: optIn, name: rowName || contact.name, phone: rowPhone || contact.phone, updatedAt: new Date().toISOString() };
            upsertContact(contact);
            knownByEmail.set(rowEmail, contact);
          }
        }
        importedIds.push(contact.id);
      }

      const existing = contactLists.find((item) => item.source !== "Ημερολόγιο" && item.name.trim().toLowerCase() === importFolderName.trim().toLowerCase());
      const now = new Date().toISOString();
      const folder: ContactList = existing
        ? { ...existing, contactIds: Array.from(new Set([...existing.contactIds, ...importedIds])) }
        : {
            id: `list-import-${crypto.randomUUID()}`,
            name: importFolderName.trim(),
            type: "Import Excel",
            source: "Import Excel",
            contactIds: Array.from(new Set(importedIds)),
            createdAt: now,
            updatedAt: now,
          };
      upsertContactList(folder);
      setActiveListId(folder.id);
      setImportOpen(false);
      setImportFile(null);
      setImportFolderName("");
      toast.success(`Import ολοκληρώθηκε: ${created} νέες, ${reused} υπάρχουσες${skipped ? `, ${skipped} χωρίς έγκυρο email` : ""}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Δεν ήταν δυνατή η εισαγωγή Excel.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <Card className="h-fit p-3">
        <div className="flex items-center justify-between px-1 py-1">
          <div><p className="font-semibold">Λίστες επαφών</p><p className="text-xs text-muted-foreground">{contactLists.length} φάκελοι</p></div>
          <Dialog open={folderOpen} onOpenChange={setFolderOpen}>
            <DialogTrigger asChild><Button size="icon" variant="ghost" title="Νέα λίστα"><FolderPlus className="size-4" /></Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Νέα λίστα επαφών</DialogTitle><DialogDescription>Δημιούργησε έναν δικό σου φάκελο παραληπτών.</DialogDescription></DialogHeader>
              <div className="grid gap-1.5 py-2"><Label>Όνομα λίστας</Label><Input placeholder="π.χ. Συνάδελφοι Αθήνας" value={folderName} onChange={(event) => setFolderName(event.target.value)} /></div>
              <DialogFooter><Button onClick={createFolder}>Δημιουργία</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="mt-2 space-y-1">
          <button type="button" onClick={() => setActiveListId("all")} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${activeListId === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
            <span>Όλες οι επαφές</span><span className="text-xs opacity-70">{contacts.length}</span>
          </button>
          {contactLists.slice().sort((a, b) => a.name.localeCompare(b.name, "el")).map((folder) => (
            <div key={folder.id} className={`group flex items-center rounded-lg ${activeListId === folder.id ? "bg-muted" : "hover:bg-muted/60"}`}>
              <button type="button" onClick={() => setActiveListId(folder.id)} className="min-w-0 flex-1 px-3 py-2 text-left">
                <div className="flex items-center gap-2"><Folder className="size-3.5 shrink-0" /><span className="truncate text-sm font-medium">{folder.name}</span></div>
                <p className="mt-0.5 pl-5 text-[11px] text-muted-foreground">{folder.contactIds.length} επαφές · {folder.source}</p>
              </button>
              <Button size="icon" variant="ghost" className="mr-1 size-7 opacity-60 group-hover:opacity-100" onClick={() => renameFolder(folder)} title="Μετονομασία"><Pencil className="size-3.5" /></Button>
            </div>
          ))}
        </div>
      </Card>

      <div className="lg:col-span-2"><SharedSheetImport /></div>
      <div className="min-w-0">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-semibold">{activeList?.name || "Όλες οι επαφές"}</h2>
            <p className="text-xs text-muted-foreground">{list.length} εμφανιζόμενες επαφές{activeList?.source === "Ημερολόγιο" ? " · ενημερώνεται αυτόματα από τις εγγραφές" : ""}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={syncing} onClick={() => void runCalendarSync()}><RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} /> Συγχρονισμός Ημερολογίου</Button>
            <Button variant="outline" onClick={() => {
              let added = 0;
              people.forEach((person) => {
                const exists = contacts.some((contact) => contact.email.toLowerCase() === person.email.toLowerCase());
                if (exists || !person.email) return;
                upsertContact({ id: `contact-${person.id}`, name: person.name, email: person.email.toLowerCase(), phone: person.phone, kind: person.kind, subscribed: false, tags: [person.kind], source: "Μητρώο", updatedAt: new Date().toISOString() });
                added += 1;
              });
              toast.success(added ? `Προστέθηκαν ${added} επαφές από το μητρώο.` : "Το μητρώο είναι ήδη συγχρονισμένο.");
            }}>Μέλη/Φίλοι</Button>
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild><Button variant="outline"><FileSpreadsheet className="size-4" /> Import Excel</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Εισαγωγή Excel / CSV</DialogTitle><DialogDescription>Χρειάζεται τουλάχιστον στήλη Email. Αναγνωρίζονται επίσης Ονοματεπώνυμο, Τηλέφωνο και Κατηγορία.</DialogDescription></DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-1.5"><Label>Όνομα φακέλου</Label><Input placeholder="π.χ. Παλιό Newsletter 2025" value={importFolderName} onChange={(event) => setImportFolderName(event.target.value)} /></div>
                  <div className="grid gap-1.5"><Label>Αρχείο</Label><Input type="file" accept=".xlsx,.xls,.csv" onChange={(event: ChangeEvent<HTMLInputElement>) => setImportFile(event.target.files?.[0] || null)} /></div>
                </div>
                <DialogFooter><Button disabled={importing} onClick={() => void importExcel()}>{importing ? "Εισαγωγή…" : "Εισαγωγή στη λίστα"}</Button></DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={contactOpen} onOpenChange={setContactOpen}>
              <DialogTrigger asChild><Button><Plus className="size-4" /> Νέα επαφή</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Νέα επαφή</DialogTitle><DialogDescription>{activeList ? `Θα προστεθεί και στη λίστα «${activeList.name}».` : "Προσθήκη παραλήπτη στη βάση επαφών."}</DialogDescription></DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-1.5"><Label>Ονοματεπώνυμο</Label><Input value={name} onChange={(event) => setName(event.target.value)} /></div>
                  <div className="grid gap-1.5"><Label>Email</Label><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
                  <div className="grid gap-1.5"><Label>Τηλέφωνο</Label><Input value={phone} onChange={(event) => setPhone(event.target.value)} /></div>
                  <div className="grid gap-1.5"><Label>Κατηγορία</Label><Select value={kind} onValueChange={(value) => setKind(value as ContactKind)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Μέλος">Μέλος</SelectItem><SelectItem value="Φίλος">Φίλος</SelectItem><SelectItem value="Επισκέπτης">Επισκέπτης</SelectItem><SelectItem value="Άλλη επαφή">Άλλη επαφή</SelectItem></SelectContent></Select></div>
                </div>
                <DialogFooter><Button onClick={addContact}>Αποθήκευση</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Αναζήτηση ονόματος, email ή τηλεφώνου…" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
          {activeList && activeList.source !== "Ημερολόγιο" && <Button variant="ghost" className="text-destructive" onClick={() => {
            if (!window.confirm(`Να διαγραφεί η λίστα «${activeList.name}»; Οι επαφές δεν θα διαγραφούν.`)) return;
            deleteContactList(activeList.id); setActiveListId("all"); toast.success("Η λίστα διαγράφηκε.");
          }}><Trash2 className="size-4" /> Διαγραφή λίστας</Button>}
        </div>

        <Card className="mt-4 divide-y divide-border p-0">
          {list.map((contact) => (
            <div key={contact.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1"><p className="font-medium">{contact.name}</p><p className="text-xs text-muted-foreground">{contact.email}{contact.phone ? ` · ${contact.phone}` : ""} · {contact.kind} · {contact.source}</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <ContactListsDialog contact={contact} />
                <Label className="flex items-center gap-2 text-xs font-normal"><Switch checked={contact.subscribed} onCheckedChange={() => toggleContactSubscription(contact.id)} /> Newsletter</Label>
                <Button variant="ghost" size="sm" onClick={() => { deleteContact(contact.id); toast.success("Η επαφή διαγράφηκε."); }}>Διαγραφή</Button>
              </div>
            </div>
          ))}
          {list.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Δεν βρέθηκαν επαφές σε αυτή τη λίστα.</p>}
        </Card>
      </div>
    </div>
  );
}

function ContactListsDialog({ contact }: { contact: Contact }) {
  const { contactLists, upsertContactList } = useClub();
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm"><Folder className="size-3.5" /> Λίστες</Button></DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Λίστες — {contact.name}</DialogTitle><DialogDescription>Μία επαφή μπορεί να ανήκει σε πολλές λίστες χωρίς να δημιουργείται ξανά.</DialogDescription></DialogHeader>
        <div className="max-h-[360px] space-y-1 overflow-y-auto rounded-lg border p-2">
          {contactLists.map((folder) => {
            const checked = folder.contactIds.includes(contact.id);
            return (
              <label key={folder.id} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50">
                <Checkbox disabled={folder.source === "Ημερολόγιο"} checked={checked} onCheckedChange={(value) => {
                  const nextIds = value === true ? Array.from(new Set([...folder.contactIds, contact.id])) : folder.contactIds.filter((id) => id !== contact.id);
                  upsertContactList({ ...folder, contactIds: nextIds });
                }} />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{folder.name}</p><p className="text-xs text-muted-foreground">{folder.source} · {folder.contactIds.length} επαφές{folder.source === "Ημερολόγιο" ? " · αυτόματη" : ""}</p></div>
              </label>
            );
          })}
          {contactLists.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">Δεν υπάρχουν ακόμη λίστες.</p>}
        </div>
        <DialogFooter><Button onClick={() => setOpen(false)}>Έτοιμο</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewsletterHistory({ onOpen }: { onOpen: (id: string) => void }) {
  const { newsletters, duplicateNewsletter, deleteNewsletter } = useClub();
  const sorted = [...newsletters].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <Card className="divide-y divide-border p-0">
      {sorted.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Δεν υπάρχει ακόμη πρόχειρο ή ιστορικό email.</p>}
      {sorted.map((item) => (
        <div key={item.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><p className="font-medium">{item.subject || "Χωρίς θέμα"}</p><Badge variant={item.status === "Απεσταλμένο" ? "secondary" : "outline"}>{item.status}</Badge></div>
            <p className="mt-1 text-xs text-muted-foreground">Τελευταία αλλαγή {new Date(item.updatedAt).toLocaleString("el-GR")}{item.sentCount ? ` · ${item.sentCount} παραλήπτες` : ""}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => {
              if (item.status === "Απεσταλμένο") {
                const copy = duplicateNewsletter(item.id);
                if (copy) onOpen(copy.id);
              } else onOpen(item.id);
            }}><FolderOpen className="size-4" /> {item.status === "Απεσταλμένο" ? "Άνοιγμα ως νέο" : "Άνοιγμα"}</Button>
            <Button size="sm" variant="outline" onClick={() => {
              const copy = duplicateNewsletter(item.id);
              if (!copy) return;
              toast.success("Δημιουργήθηκε αντίγραφο ως πρόχειρο.");
              onOpen(copy.id);
            }}><Copy className="size-4" /> Duplicate</Button>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => {
              if (!window.confirm(`Να διαγραφεί το «${item.subject || "Χωρίς θέμα"}»;`)) return;
              deleteNewsletter(item.id);
              toast.success("Η εγγραφή διαγράφηκε.");
            }}><Trash2 className="size-4" /> Διαγραφή</Button>
          </div>
        </div>
      ))}
    </Card>
  );
}

function validTemplateKind(value?: string): NewsletterTemplateKind {
  return value && Object.prototype.hasOwnProperty.call(templateLabels, value) ? value as NewsletterTemplateKind : "free_newsletter";
}

function NewsletterBuilder({ openNewsletterId, onStartNew }: { openNewsletterId: string | null; onStartNew: () => void }) {
  const { contacts, contactLists, externalBookings, seminars, people, personActivities, newsletters, saveNewsletter, markNewsletterSent, boardMembers } = useClub();
  const approvedBookings = externalBookings.filter((booking) => booking.approval_status === "approved" || booking.is_public === true);
  const [templateKind, setTemplateKind] = useState<NewsletterTemplateKind>("seminar_announcement");
  const [bookingId, setBookingId] = useState("");
  const [fields, setFields] = useState<NewsletterFields>(blankFields);
  const [html, setHtml] = useState(buildNewsletterHtml(blankFields, boardMembers));
  const [recipientGroup, setRecipientGroup] = useState<NewsletterRecipientGroup>("Όλοι");
  const [recipientListId, setRecipientListId] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [registrations, setRegistrations] = useState<Array<{ id?: string; full_name: string; email: string }>>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [customRecipientIds, setCustomRecipientIds] = useState<string[]>([]);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientDialogOpen, setRecipientDialogOpen] = useState(false);
  const [draftId, setDraftId] = useState(() => `newsletter-${crypto.randomUUID()}`);

  const isSeminarZoom = templateKind === "seminar_zoom";
  const isMemberMail = templateKind === "member_meeting_announcement" || templateKind === "member_meeting_zoom";
  const selectedRecipientList = contactLists.find((item) => item.id === recipientListId);

  // Ταυτοποίηση ανά κανονικοποιημένο email (όχι ανά όνομα ή εγγραφή σε δράση).
  // Αν αντικρουόμενες εγγραφές έχουν ΝΑΙ και ΟΧΙ, το ΟΧΙ υπερισχύει
  // μέχρι η Γραμματεία να επιβεβαιώσει τη συγκατάθεση στο Μητρώο.
  const contactEmailGroups = useMemo(() => {
    const groups = new Map<string, typeof contacts>();
    for (const c of contacts) {
      const email = c.email.trim().toLowerCase();
      if (!EMAIL_RE.test(email)) continue;
      groups.set(email, [...(groups.get(email) || []), c]);
    }
    return groups;
  }, [contacts]);
  const contactIsConsented = (email: string) => {
    const group = contactEmailGroups.get(email.trim().toLowerCase()) || [];
    return group.length > 0 && group.every(c => c.subscribed === true);
  };
  const contactRecipients = useMemo(() => {
    const selected = contacts.filter((contact) => {
      const email = contact.email.trim().toLowerCase();
      if (!EMAIL_RE.test(email)) return false;
      if (!(contactEmailGroups.get(email) || []).every(c => c.subscribed === true)) return false;
      if (recipientGroup === "Δική μου λίστα") return selectedRecipientList?.contactIds.includes(contact.id) === true;
      if (recipientGroup === "Μέλη") return contact.kind === "Μέλος";
      if (recipientGroup === "Φίλοι") return contact.kind === "Φίλος";
      return true;
    });
    return Array.from(new Map(selected.map(c => [c.email.trim().toLowerCase(),c])).values());
  }, [contacts, recipientGroup, selectedRecipientList, contactEmailGroups]);
  const newsletterAudience = useMemo(() => Array.from(contactEmailGroups.entries()).map(([email,rows]) => ({
    email, name: rows.find(x => x.name && x.name !== x.email)?.name || rows[0].name,
    kind: rows[0].kind, duplicateCount: rows.length,
    consent: rows.every(x => x.subscribed === true),
    inSelectedList: recipientGroup !== "Δική μου λίστα" || rows.some(x => selectedRecipientList?.contactIds.includes(x.id)),
    inGroup: recipientGroup === "Όλοι" || recipientGroup === "Δική μου λίστα" || rows.some(x => x.kind === (recipientGroup === "Μέλη" ? "Μέλος" : "Φίλος")),
  })).filter(x => x.inSelectedList && x.inGroup).sort((a,b)=>a.name.localeCompare(b.name,"el")), [contactEmailGroups, recipientGroup, selectedRecipientList]);

  const registrationEmails = useMemo(() => Array.from(new Set(registrations.map((item) => item.email.trim().toLowerCase()).filter((email) => EMAIL_RE.test(email)))), [registrations]);
  const customRecipients = useMemo(() => contacts.filter((contact) => customRecipientIds.includes(contact.id) && EMAIL_RE.test(contact.email.trim()) && (contactEmailGroups.get(contact.email.trim().toLowerCase()) || []).every(c => c.subscribed === true)), [contacts, customRecipientIds, contactEmailGroups]);
  const baseRecipientEmails = isSeminarZoom ? registrationEmails : contactRecipients.map((contact) => contact.email.trim().toLowerCase());
  const recipientEmails = Array.from(new Set([...baseRecipientEmails, ...customRecipients.map((contact) => contact.email.trim().toLowerCase())]));
  const recipientCount = recipientEmails.length;
  const selectableContacts = useMemo(() => contacts
    .filter((contact) => EMAIL_RE.test(contact.email.trim()))
    .filter((contact) => `${contact.name} ${contact.email} ${contact.kind}`.toLowerCase().includes(recipientSearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, "el")), [contacts, recipientSearch]);

  useEffect(() => {
    setHtml(buildNewsletterHtml(fields, boardMembers));
  }, [boardMembers]);

  useEffect(() => {
    if (!openNewsletterId) return;
    const item = newsletters.find((newsletter) => newsletter.id === openNewsletterId);
    if (!item) return;
    const kind = validTemplateKind(item.templateKind);
    const defaults = blankFieldsFor(kind);
    const nextFields: NewsletterFields = {
      ...defaults,
      templateKind: kind,
      subject: item.subject || defaults.subject,
      preheader: item.preheader || defaults.preheader,
      eyebrow: item.eyebrow || defaults.eyebrow,
      heading: item.heading || defaults.heading,
      dateLabel: item.dateLabel || defaults.dateLabel,
      dateText: item.dateText || defaults.dateText,
      intro: item.intro || defaults.intro,
      body: item.body || defaults.body,
      ctaLabel: item.ctaLabel || defaults.ctaLabel,
      ctaUrl: item.ctaUrl || defaults.ctaUrl,
      imageUrl: item.imageUrl || defaults.imageUrl,
      zoomUrl: item.zoomUrl || defaults.zoomUrl,
    };
    setDraftId(item.id);
    setTemplateKind(kind);
    setBookingId(item.externalBookingId || "");
    setRecipientGroup(item.recipientGroup || "Όλοι");
    setRecipientListId(item.recipientListId || "");
    setCustomRecipientIds(item.customRecipientIds || []);
    setFields(nextFields);
    setHtml(item.html || buildNewsletterHtml(nextFields, boardMembers));
  }, [openNewsletterId]);

  useEffect(() => {
    if (typeof window === "undefined" || openNewsletterId) return;
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const requested = params.get("event");
    const nextKind: NewsletterTemplateKind = mode === "zoom" ? "seminar_zoom" : mode === "member-zoom" ? "member_meeting_zoom" : mode === "member-meeting" ? "member_meeting_announcement" : "seminar_announcement";
    if (mode === "zoom" || mode === "member-zoom" || mode === "member-meeting") setTemplateKind(nextKind);
    if (mode === "member-zoom" || mode === "member-meeting") setRecipientGroup("Μέλη");
    if (requested && approvedBookings.some((booking) => booking.id === requested)) {
      setBookingId(requested);
      const booking = approvedBookings.find((item) => item.id === requested);
      if (booking) {
        const next = fieldsFromBooking(booking, nextKind);
        setFields(next);
        setHtml(buildNewsletterHtml(next, boardMembers));
      }
    }
  }, [approvedBookings.length, openNewsletterId]);

  // Η κοινή φόρμα Google Sheets είναι πλέον η πηγή συμμετεχόντων.
  // Δεν αναζητούμε πλέον εγγραφές στην παλιά Firebase φόρμα συγκεκριμένης δράσης.
  useEffect(() => {
    if (!isSeminarZoom || !bookingId) { setRegistrations([]); setLoadingRegistrations(false); return; }
    const booking = approvedBookings.find(b => b.id === bookingId);
    if (!booking) {setRegistrations([]);return;}
    const ids = new Set(personActivities.filter(a => a.eventId === booking.id).map(a => a.personId));
    const mapped = people.filter(p => ids.has(p.id) && EMAIL_RE.test(p.email.trim()))
      .map(p => ({ id:p.id, full_name:p.name || "Χωρίς όνομα", email:p.email.trim().toLowerCase() }));
    setRegistrations(Array.from(new Map(mapped.map(p=>[p.email,p])).values()));
    setLoadingRegistrations(false);
  }, [isSeminarZoom, bookingId, externalBookings, personActivities, people]);

  function rebuild(next: NewsletterFields) {
    setFields(next);
    setHtml(buildNewsletterHtml(next, boardMembers));
  }

  function setField<K extends keyof NewsletterFields>(key: K, value: NewsletterFields[K]) {
    rebuild({ ...fields, [key]: value });
  }

  function startNew() {
    const kind: NewsletterTemplateKind = "free_newsletter";
    const next = blankFieldsFor(kind);
    setDraftId(`newsletter-${crypto.randomUUID()}`);
    setTemplateKind(kind);
    setBookingId("");
    setRecipientGroup("Όλοι");
    setRecipientListId("");
    setCustomRecipientIds([]);
    setRegistrations([]);
    rebuild(next);
    onStartNew();
  }

  function changeTemplate(kind: NewsletterTemplateKind) {
    setTemplateKind(kind);
    setRegistrations([]);
    setCustomRecipientIds([]);
    setRecipientListId("");
    if (kind === "member_meeting_announcement" || kind === "member_meeting_zoom") setRecipientGroup("Μέλη");
    else if (kind === "seminar_zoom") setRecipientGroup("Συμμετέχοντες");
    else setRecipientGroup("Όλοι");
    const booking = bookingId ? approvedBookings.find((item) => item.id === bookingId) : undefined;
    rebuild(booking && kind !== "free_newsletter" ? fieldsFromBooking(booking, kind) : blankFieldsFor(kind));
  }

  function selectBooking(id: string) {
    setBookingId(id);
    setCustomRecipientIds([]);
    setRecipientListId("");
    const booking = approvedBookings.find((item) => item.id === id);
    if (!booking) return;
    if (templateKind === "seminar_zoom") setRecipientGroup("Συμμετέχοντες");
    if (templateKind === "member_meeting_announcement" || templateKind === "member_meeting_zoom") setRecipientGroup("Μέλη");
    rebuild(fieldsFromBooking(booking, templateKind));
  }

  const linkedSeminar = bookingId ? seminars.find((item) => item.externalBookingId === bookingId) : undefined;

  function newsletterObject(status: "Πρόχειρο" | "Απεσταλμένο" = "Πρόχειρο"): Newsletter {
    const existing = newsletters.find((item) => item.id === draftId);
    const now = new Date().toISOString();
    return {
      id: draftId,
      templateKind,
      externalBookingId: bookingId || undefined,
      subject: fields.subject,
      preheader: fields.preheader,
      eyebrow: fields.eyebrow,
      heading: fields.heading,
      dateLabel: fields.dateLabel,
      dateText: fields.dateText,
      intro: fields.intro,
      body: fields.body,
      ctaLabel: fields.ctaLabel,
      ctaUrl: fields.ctaUrl,
      imageUrl: fields.imageUrl,
      html,
      recipientGroup: isSeminarZoom ? "Συμμετέχοντες" : recipientGroup,
      recipientListId: recipientGroup === "Δική μου λίστα" ? recipientListId || undefined : undefined,
      customRecipientIds,
      customRecipientEmails: customRecipients.map((contact) => contact.email),
      seminarId: linkedSeminar?.id,
      zoomUrl: fields.zoomUrl || undefined,
      status,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
  }

  async function send(mode: "test" | "bulk") {
    if (!fields.subject.trim() || !html.trim()) { toast.error("Χρειάζεται θέμα και περιεχόμενο."); return; }
    if ((templateKind === "seminar_zoom" || templateKind === "member_meeting_zoom") && !/^https?:\/\//i.test(fields.zoomUrl.trim())) { toast.error("Συμπλήρωσε τον σύνδεσμο Zoom πριν την αποστολή."); return; }
    if (mode === "test" && !EMAIL_RE.test(testEmail.trim())) { toast.error("Συμπλήρωσε email δοκιμής."); return; }
    if (mode === "bulk" && recipientCount === 0) { toast.error(isSeminarZoom ? "Δεν υπάρχουν συμμετέχοντες για αυτή τη δράση." : "Δεν υπάρχουν ενεργοί παραλήπτες."); return; }
    setSending(true);
    try {
      const response = await fetch("/api/send-newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: fields.subject, html, recipients: recipientEmails, testRecipient: testEmail.trim(), mode }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Η αποστολή απέτυχε.");
      if (mode === "test") toast.success("Το test email στάλθηκε.");
      else {
        const sentCount = Number(payload.sent || recipientCount);
        markNewsletterSent(newsletterObject("Απεσταλμένο"), sentCount);
        toast.success(`Το email στάλθηκε σε ${sentCount} παραλήπτες.`);
        setDraftId(`newsletter-${crypto.randomUUID()}`);
        onStartNew();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Η αποστολή απέτυχε.");
    } finally { setSending(false); }
  }

  return (
    <div>
      <div className="mb-3 flex justify-end"><Button variant="outline" onClick={startNew}><Plus className="size-4" /> Νέο email</Button></div>
      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-5">
          <div className="flex items-center gap-2"><Mail className="size-5 text-primary" /><h2 className="font-semibold">Email Builder</h2></div>
          <p className="mt-1 text-xs text-muted-foreground">Διάλεξε τι θέλεις να στείλεις. Το σύστημα συμπληρώνει όσα γνωρίζει ήδη.</p>
          <div className="mt-4 grid gap-4">
            <div className="grid gap-1.5"><Label>Τύπος email</Label><Select value={templateKind} onValueChange={(value) => changeTemplate(value as NewsletterTemplateKind)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(templateLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>

            {templateKind !== "free_newsletter" && (
              <div className="grid gap-1.5">
                <Label>{isMemberMail ? "Συνάντηση από το ημερολόγιο" : "Δράση / σεμινάριο"}</Label>
                <Select value={bookingId} onValueChange={selectBooking}><SelectTrigger><SelectValue placeholder="Επίλεξε εγκεκριμένη δράση…" /></SelectTrigger><SelectContent>{approvedBookings.map((booking) => <SelectItem key={booking.id} value={booking.id}>{booking.booking_date} · {booking.topic || booking.event_type || booking.therapist_name}</SelectItem>)}</SelectContent></Select>
                {templateKind === "seminar_announcement" && <p className="text-xs text-muted-foreground">Το κουμπί «Δήλωση συμμετοχής» ανοίγει την υπάρχουσα φόρμα της δράσης στο Ημερολόγιο.</p>}
                {templateKind === "seminar_zoom" && <p className="text-xs text-muted-foreground">{loadingRegistrations ? "Φόρτωση συμμετοχών…" : `${registrationEmails.length} πραγματικοί εγγεγραμμένοι βρέθηκαν αυτόματα.`}</p>}
              </div>
            )}

            <div className="grid gap-1.5"><Label>Θέμα email</Label><Input value={fields.subject} onChange={(event) => setField("subject", event.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Μικρός τίτλος</Label><Input value={fields.eyebrow} onChange={(event) => setField("eyebrow", event.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Κεντρικός τίτλος</Label><Input value={fields.heading} onChange={(event) => setField("heading", event.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Ημερομηνία / ώρα</Label><Input value={fields.dateText} onChange={(event) => setField("dateText", event.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Εισαγωγή</Label><Textarea value={fields.intro} onChange={(event) => setField("intro", event.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Κύριο περιεχόμενο</Label><Textarea className="min-h-40" value={fields.body} onChange={(event) => setField("body", event.target.value)} /></div>

            {(templateKind === "seminar_zoom" || templateKind === "member_meeting_zoom") ? (
              <div className="grid gap-1.5"><Label>Σύνδεσμος Zoom</Label><Input placeholder="https://zoom.us/j/..." value={fields.zoomUrl} onChange={(event) => setField("zoomUrl", event.target.value)} /></div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2"><div className="grid gap-1.5"><Label>Κείμενο κουμπιού</Label><Input value={fields.ctaLabel} onChange={(event) => setField("ctaLabel", event.target.value)} /></div><div className="grid gap-1.5"><Label>Link κουμπιού</Label><Input value={fields.ctaUrl} onChange={(event) => setField("ctaUrl", event.target.value)} /></div></div>
            )}

            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><Label className="text-sm font-semibold">Λίστα παραληπτών</Label><p className="mt-1 text-xs text-muted-foreground">Αυτόματη λίστα ή δικός σου φάκελος, συν προαιρετικές μεμονωμένες επαφές.</p></div><Badge variant="secondary">Τελικό σύνολο: {recipientCount}</Badge></div>

              {isSeminarZoom ? (
                <div className="mt-4 rounded-lg border bg-background p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-medium">Αυτόματα: συμμετέχοντες του σεμιναρίου</p><p className="text-xs text-muted-foreground">{loadingRegistrations ? "Φόρτωση συμμετοχών…" : `${registrationEmails.length} μοναδικά email`}</p></div><Badge variant="outline">{registrationEmails.length}</Badge></div>
                  {!loadingRegistrations && registrations.length > 0 && <div className="mt-3 max-h-36 space-y-1 overflow-y-auto rounded-md bg-muted/30 p-2">{registrations.map((registration) => <div key={registration.id || registration.email} className="flex items-center justify-between gap-3 text-xs"><span className="truncate font-medium">{registration.full_name}</span><span className="truncate text-muted-foreground">{registration.email}</span></div>)}</div>}
                </div>
              ) : (
                <div className="mt-4 grid gap-2">
                  <Label>Βασική λίστα</Label>
                  <Select value={recipientGroup} onValueChange={(value) => { setRecipientGroup(value as NewsletterRecipientGroup); if (value !== "Δική μου λίστα") setRecipientListId(""); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Όλοι">Όλοι οι ενεργοί</SelectItem><SelectItem value="Μέλη">Μόνο Μέλη</SelectItem><SelectItem value="Φίλοι">Μόνο Φίλοι</SelectItem><SelectItem value="Δική μου λίστα">Δική μου λίστα / φάκελος</SelectItem></SelectContent></Select>
                  {recipientGroup === "Δική μου λίστα" && <Select value={recipientListId} onValueChange={setRecipientListId}><SelectTrigger><SelectValue placeholder="Επίλεξε λίστα επαφών…" /></SelectTrigger><SelectContent>{contactLists.map((folder) => <SelectItem key={folder.id} value={folder.id}>{folder.name} · {folder.contactIds.length}</SelectItem>)}</SelectContent></Select>}
                  <p className="text-xs text-muted-foreground">{contactRecipients.length} παραλήπτες από τη βασική λίστα.</p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Dialog open={recipientDialogOpen} onOpenChange={setRecipientDialogOpen}>
                  <DialogTrigger asChild><Button type="button" variant="outline"><UserPlus className="size-4" /> Πρόσθεσε επαφές{customRecipients.length ? ` (${customRecipients.length})` : ""}</Button></DialogTrigger>
                  <DialogContent className="max-w-xl">
                    <DialogHeader><DialogTitle>Επιλογή πρόσθετων επαφών</DialogTitle><DialogDescription>Οι διπλές διευθύνσεις αφαιρούνται αυτόματα.</DialogDescription></DialogHeader>
                    <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Αναζήτηση ονόματος ή email…" value={recipientSearch} onChange={(event) => setRecipientSearch(event.target.value)} /></div>
                    <div className="max-h-[360px] space-y-1 overflow-y-auto rounded-lg border p-2">
                      {selectableContacts.map((contact) => {
                        const checked = customRecipientIds.includes(contact.id);
                        const alreadyIncluded = baseRecipientEmails.includes(contact.email.trim().toLowerCase());
                        return <label key={contact.id} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50"><Checkbox checked={checked} onCheckedChange={(value) => setCustomRecipientIds((previous) => value === true ? Array.from(new Set([...previous, contact.id])) : previous.filter((id) => id !== contact.id))} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{contact.name}</p><p className="truncate text-xs text-muted-foreground">{contact.email} · {contact.kind}</p></div>{alreadyIncluded && <Badge variant="outline" className="shrink-0 text-[10px]">ήδη μέσα</Badge>}</label>;
                      })}
                    </div>
                    <DialogFooter><Button type="button" variant="outline" onClick={() => setCustomRecipientIds([])}>Καθαρισμός</Button><Button type="button" onClick={() => setRecipientDialogOpen(false)}>Έτοιμο · {customRecipients.length}</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
                {customRecipients.length > 0 && <Button type="button" variant="ghost" size="sm" onClick={() => setCustomRecipientIds([])}><X className="size-4" /> Αφαίρεση πρόσθετων</Button>}
              </div>
              {!isSeminarZoom && <div className="mt-4 rounded-lg border p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">Προεπισκόπηση newsletter · έλεγχος διπλών</p><Badge variant="secondary">{newsletterAudience.filter(x => x.duplicateCount > 1).length} διπλά email</Badge></div>
                <p className="text-xs text-muted-foreground">Κάθε email εμφανίζεται μία φορά. Χωρίς συναίνεση: μη επιλεγμένο και μη διαθέσιμο για διαφημιστική αποστολή. Τα πρόσωπα παραμένουν σε όλες τις δράσεις στις οποίες συμμετείχαν.</p>
                <div className="max-h-60 overflow-auto divide-y text-sm">{newsletterAudience.map(item => <div key={item.email} className="flex items-center gap-2 py-2">
                  <Checkbox disabled checked={recipientEmails.includes(item.email)} />
                  <div className="min-w-0 flex-1"><p className="truncate font-medium">{item.name}</p><p className="truncate text-xs text-muted-foreground">{item.email}</p></div>
                  {item.duplicateCount > 1 && <Badge variant="outline">{item.duplicateCount} εγγραφές</Badge>}
                  <Badge variant={item.consent ? "secondary" : "outline"}>{item.consent ? "ΝΑΙ" : "ΟΧΙ / άγνωστο"}</Badge>
                </div>)}</div>
                <p className="text-xs text-muted-foreground">{newsletterAudience.filter(x => !x.consent).length} χωρίς έγκυρη συναίνεση · {newsletterAudience.filter(x => x.consent).length} με συναίνεση.</p>
              </div>}
              <p className="mt-3 text-xs font-medium">Θα σταλεί σε {recipientCount} μοναδικές διευθύνσεις email.</p>
              {!isSeminarZoom && <p className="mt-1 text-xs text-muted-foreground">Εξαιρούνται αυτόματα {contacts.filter(c => !c.subscribed).length} επαφές χωρίς συναίνεση newsletter. Για πληροφορίες συγκεκριμένης εγγραφής χρησιμοποιείται η ξεχωριστή λειτουργική επικοινωνία του σεμιναρίου.</p>}
            </div>

            <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => { saveNewsletter(newsletterObject()); toast.success("Το draft αποθηκεύτηκε."); }}><Save className="size-4" /> Αποθήκευση draft</Button><Button disabled={sending || recipientCount === 0 || loadingRegistrations} onClick={() => void send("bulk")}><Send className="size-4" /> Αποστολή σε {recipientCount}</Button></div>
            <div className="rounded-xl border p-3"><Label>Δοκιμαστική αποστολή</Label><div className="mt-2 flex gap-2"><Input type="email" placeholder="δικό σου email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} /><Button variant="secondary" disabled={sending} onClick={() => void send("test")}>Test</Button></div></div>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <Tabs defaultValue="preview">
            <div className="flex items-center justify-between border-b px-4 py-3"><p className="font-semibold">Προεπισκόπηση</p><TabsList><TabsTrigger value="preview"><Eye className="mr-1 size-4" /> Preview</TabsTrigger><TabsTrigger value="html"><FileCode2 className="mr-1 size-4" /> HTML</TabsTrigger></TabsList></div>
            <TabsContent value="preview" className="m-0"><iframe title="Newsletter preview" srcDoc={html} className="h-[760px] w-full bg-white" /></TabsContent>
            <TabsContent value="html" className="m-0 p-4"><p className="mb-2 text-xs text-muted-foreground">Μπορείς να κάνεις ειδικές αλλαγές στο HTML. Αλλαγή πεδίου αριστερά ξαναχτίζει το template.</p><Textarea className="min-h-[700px] font-mono text-xs" value={html} onChange={(event) => setHtml(event.target.value)} /></TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
