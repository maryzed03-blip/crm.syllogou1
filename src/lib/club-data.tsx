import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { hubCloudEnabled, saveHubEntity, deleteHubEntity, runCleanSlateMigration, seedAndSubscribe, type HubCollection } from "@/lib/hub-firestore";
import { subscribeCalendarBookings, type ExternalBooking } from "@/lib/external-calendar";

export type Role = "Πρόεδρος" | "Αντιπρόεδρος" | "Γραμματέας" | "Ταμίας" | "Μέλος";

export type BoardMember = {
  id: string;
  name: string;
  role: Role;
  duties: string[];
  weeklyFocus: string;
};

export type TaskStatus = "Νέα" | "Σε εξέλιξη" | "Αναμονή" | "Ολοκληρώθηκε";
export type TaskCategory =
  | "Οικονομικά"
  | "Γραμματεία"
  | "Σεμινάρια"
  | "Δράσεις"
  | "Διοίκηση"
  | "Επικοινωνία";

export type Task = {
  id: string;
  title: string;
  ownerRole: Role;
  category: TaskCategory;
  due: string;
  dueTime?: string;
  status: TaskStatus;
  urgent?: boolean;
  manual?: boolean;
  createdAt?: string;
  createdByRole?: Role;
  notes?: string;
  relatedTo?: string;
  dependsOn?: string[];
  action?: { label: string; to: string };
};

export type WorkflowStep = { id: string; title: string; ownerRole: Role; daysBefore: number; notes?: string };
export type WorkflowTemplate = { id: string; name: string; trigger: "board" | "members" | "activity" | "manual"; enabled: boolean; steps: WorkflowStep[]; createdAt: string };
export type MeetingMinute = { id: string; calendarEventId?: string; type: "board" | "members"; title: string; date: string; attendees: string; agenda: string; minutes: string; decisions: string; createdAt: string };
export type TherapistDirectoryEntry = { id: string; name: string; role?: string; area?: string; prefecture?: string; photo?: string; email?: string };

export type Installment = { id: string; amount: number; due: string; note?: string };
export type InstallmentPayment = { id: string; amount: number; paidAt: string; method?: string; reference?: string };
export type SeminarAgreement = {
  id: string; seminarId: string; personId: string; total: number;
  installments: Installment[]; received: InstallmentPayment[];
  notes?: string; updatedAt: string;
};
export type SeminarPriceRule = { id: string; seminarId: string; defaultTotal: number; installments: Installment[]; updatedAt: string };

export type PersonKind = "Μέλος" | "Φίλος" | "Επίτιμο Μέλος" | "Κοινό" | "Επισκέπτης";

export type Person = {
  id: string;
  name: string;
  email: string;
  phone: string;
  kind: PersonKind;
  since: number;
  applicationDate?: string;
  applicationDocumentUrl?: string;
};


export type PersonActivity = {
  id: string;
  personId: string;
  eventId: string;
  title: string;
  date: string;
  type: "Σεμινάριο" | "Συνάντηση";
  status: "Εγγράφηκε" | "Παρακολούθησε";
  registeredAt?: string;
  attendedAt?: string;
  source: "Ημερολόγιο" | "Zoom CSV";
};

export type ContactKind = PersonKind | "Άλλη επαφή";

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  kind: ContactKind;
  subscribed: boolean;
  tags: string[];
  source: "Μητρώο" | "Χειροκίνητη" | "Σεμινάριο" | "Import Excel";
  updatedAt: string;
};

export type ContactList = {
  id: string;
  name: string;
  type: "Χειροκίνητη" | "Αυτόματη" | "Import Excel";
  source: "Χειροκίνητη" | "Ημερολόγιο" | "Import Excel";
  contactIds: string[];
  externalBookingId?: string;
  eventDate?: string;
  eventTitle?: string;
  createdAt: string;
  updatedAt: string;
};

export type NewsletterStatus = "Πρόχειρο" | "Απεσταλμένο";
export type NewsletterRecipientGroup = "Όλοι" | "Μέλη" | "Φίλοι" | "Συμμετέχοντες" | "Δική μου λίστα";

export type Newsletter = {
  id: string;
  templateKind?: string;
  externalBookingId?: string;
  subject: string;
  preheader: string;
  eyebrow?: string;
  heading: string;
  dateLabel?: string;
  dateText?: string;
  intro: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl: string;
  html: string;
  recipientGroup: NewsletterRecipientGroup;
  customRecipientIds?: string[] | undefined;
  customRecipientEmails?: string[] | undefined;
  recipientListId?: string | undefined;
  seminarId?: string | undefined;
  zoomUrl?: string | undefined;
  status: NewsletterStatus;
  createdAt: string;
  updatedAt: string;
  sentAt?: string | undefined;
  sentCount?: number | undefined;
};

export type PaymentStatus = "Εκκρεμεί" | "Προς έλεγχο" | "Πληρωμένη";

export type Payment = {
  id: string;
  personId: string;
  purpose: string;
  year: number;
  amount: number;
  due: string;
  status: PaymentStatus;
  paidAt?: string;
  confirmedAt?: string;
  receiptNo?: string;
  source: "Συνδρομή" | "Σεμινάριο" | "Άλλο";
  seminarId?: string;
  payerName?: string;
  payerEmail?: string;
  externalDeclarationId?: string;
  declaredAt?: string;
  paymentReference?: string;
  receiptSentAt?: string;
  receiptSentTo?: string;
};


export type MemberApplication = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  requestedKind: "Μέλος" | "Φίλος";
  submittedAt: string;
  status: "Νέα" | "Σε επεξεργασία" | "Ολοκληρώθηκε" | "Απορρίφθηκε";
  source: "Φόρμα" | "Χειροκίνητη" | "Import";
  notes?: string;
};

export type MonthlyArchive = {
  id: string;
  month: string;
  generatedAt: string;
  income: number;
  expenses: number;
  net: number;
  seminarsCount: number;
  registrations: number;
  paidTransactions: number;
  receiptsCount: number;
  newApplications: number;
  activityTitles: string[];
};

export type ExternalPaymentDeclaration = {
  id: string;
  event_id: string;
  event_topic: string;
  event_date: string;
  event_time?: string;
  full_name: string;
  email: string;
  membership_status?: string;
  payment_reference?: string;
  amount: number;
  status: string;
  declared_at?: string;
};

export type DueStatus = "Άγνωστο" | "Εκκρεμεί" | "Προς έλεγχο" | "Πληρωμένη";

export type MembershipDue = {
  id: string;
  personId: string;
  year: number;
  amount: number;
  status: DueStatus;
  paidAt?: string;
  confirmedAt?: string;
};

export type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
};

export type Seminar = {
  id: string;
  title: string;
  date: string;
  fee: number;
  registrations: number;
  paid: number;
  status: "Προς έγκριση" | "Εγκεκριμένο" | "Ολοκληρωμένο";
  workflowStep:
    | "Έγκριση Προέδρου"
    | "Ενημερωτικό email"
    | "Εγγραφές"
    | "Πληρωμές"
    | "Ολοκληρώθηκε";
  owner: string;
  externalBookingId?: string;
  zoomUrl?: string;
  announcementSentAt?: string;
  zoomSentAt?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  type: "Συνεδρίαση" | "Σεμινάριο" | "Deadline" | "Οικονομικός έλεγχος" | "Δράση";
};

export type ClubFile = {
  id: string;
  name: string;
  kind: string;
  size: string;
  updated: string;
};

export const CURRENT_YEAR = 2026;
export const DUE_YEARS = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
export const TODAY = new Date("2026-08-11T09:00:00+03:00");

const initialBoardMembers: BoardMember[] = [
  {
    id: "b1",
    name: "",
    role: "Πρόεδρος",
    duties: ["Εγκρίσεις", "Συντονισμός", "Εκπροσώπηση", "Συνεδριάσεις ΔΣ"],
    weeklyFocus: "Αποφάσεις, εγκρίσεις και ξεμπλοκάρισμα εκκρεμοτήτων",
  },
  {
    id: "b2",
    name: "",
    role: "Αντιπρόεδρος",
    duties: ["Δράσεις", "Οργάνωση", "Συνεργασίες", "Αναπλήρωση Προέδρου"],
    weeklyFocus: "Παρακολούθηση δράσεων και επόμενων βημάτων",
  },
  {
    id: "b3",
    name: "",
    role: "Γραμματέας",
    duties: ["Emails", "Πρακτικά", "Νέα μέλη", "Επικοινωνίες", "Ανακοινώσεις"],
    weeklyFocus: "Επικοινωνίες, νέα μέλη και διοικητική συνέχεια",
  },
  {
    id: "b4",
    name: "",
    role: "Ταμίας",
    duties: ["Συνδρομές", "Πληρωμές", "Έσοδα/Έξοδα", "Αποδείξεις", "Αναφορές"],
    weeklyFocus: "Ένας συγκεντρωτικός έλεγχος πληρωμών και ταμείου",
  },
  {
    id: "b5",
    name: "",
    role: "Μέλος",
    duties: ["Υποστήριξη δράσεων", "Σεμινάρια", "Περιεχόμενο", "Επικοινωνία"],
    weeklyFocus: "Υλοποίηση συγκεκριμένων εργασιών δράσεων και περιεχομένου",
  },
];

const people: Person[] = [];

const initialContacts: Contact[] = [];

const initialNewsletters: Newsletter[] = [];

const initialDues: MembershipDue[] = [];

const initialPayments: Payment[] = [];

export const expenses: Expense[] = [];

const initialSeminars: Seminar[] = [];

export const calendarEvents: CalendarEvent[] = [];

export const clubFiles: ClubFile[] = [];

const initialTasks: Task[] = [];

type Store = {
  boardMembers: BoardMember[];
  updateBoardMemberName: (role: Role, name: string) => void;
  resetBoardMemberNames: () => void;
  currentRole: Role;
  setCurrentRole: (r: Role) => void;
  tasks: Task[];
  workflowTemplates: WorkflowTemplate[];
  saveWorkflowTemplate: (template: WorkflowTemplate) => void;
  deleteWorkflowTemplate: (id: string) => void;
  meetingMinutes: MeetingMinute[];
  saveMeetingMinute: (minute: MeetingMinute) => void;
  therapists: TherapistDirectoryEntry[];
  therapistSyncError: string | null;
  addTask: (task: Omit<Task, "id" | "status" | "createdAt"> & { status?: TaskStatus }) => Task;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  people: Person[];
  personActivities: PersonActivity[];
  agreements: SeminarAgreement[];
  priceRules: SeminarPriceRule[];
  saveAgreement: (agreement: SeminarAgreement) => void;
  savePriceRule: (rule: SeminarPriceRule) => void;
  importSeminarParticipants: (eventId: string, title: string, date: string, rows: Array<{name: string; email: string; phone?: string; newsletter?: boolean | null}>) => {created: number; reused: number; skipped: number};
  updatePersonApplication: (id: string, date: string, documentUrl: string) => void;
  updatePersonKind: (id: string, kind: PersonKind) => void;
  recordZoomAttendance: (eventId: string, title: string, date: string, attendees: Array<{ name?: string; email?: string }>) => number;
  payments: Payment[];
  dues: MembershipDue[];
  seminars: Seminar[];
  contacts: Contact[];
  contactLists: ContactList[];
  newsletters: Newsletter[];
  memberApplications: MemberApplication[];
  monthlyArchives: MonthlyArchive[];
  externalBookings: ExternalBooking[];
  paymentDeclarations: ExternalPaymentDeclaration[];
  pendingCalendarApprovals: ExternalBooking[];
  calendarConnected: boolean;
  calendarError: string | null;
  cloudEnabled: boolean;
  cloudError: string | null;
  confirmPayment: (id: string) => void;
  markReceiptSent: (id: string, email: string) => void;
  upsertMemberApplication: (application: MemberApplication) => void;
  saveMonthlyArchive: (archive: MonthlyArchive) => void;
  sendReminder: (id: string) => void;
  markDuePaid: (personId: string, year: number) => void;
  approveSeminar: (id: string) => void;
  rejectSeminar: (id: string) => void;
  sendSeminarAnnouncement: (id: string) => void;
  approveExternalBooking: (bookingId: string) => Promise<void>;
  refreshPaymentDeclarations: () => Promise<void>;
  upsertContact: (contact: Contact) => void;
  deleteContact: (id: string) => void;
  toggleContactSubscription: (id: string) => void;
  upsertContactList: (list: ContactList) => void;
  deleteContactList: (id: string) => void;
  syncCalendarContactLists: () => Promise<void>;
  saveNewsletter: (newsletter: Newsletter) => void;
  markNewsletterSent: (newsletter: Newsletter, sentCount: number) => void;
  deleteNewsletter: (id: string) => void;
  duplicateNewsletter: (id: string) => Newsletter | null;
  resetDemo: () => void;
};

const ClubContext = createContext<Store | null>(null);

function nextReceiptNo(list: Payment[]) {
  const max = list.reduce((current, payment) => {
    const match = payment.receiptNo?.match(/^ΑΠ-2026-(\d+)$/);
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);
  return `ΑΠ-2026-${String(max + 1).padStart(3, "0")}`;
}

const CLEAN_SLATE_LOCAL_VERSION = "clean-slate-2026-08-11-v1";
const CLEAN_SLATE_LOCAL_KEYS = [
  "club-tasks",
  "club-people",
  "club-person-activities",
  "club-payments",
  "club-dues",
  "club-seminars",
  "club-contacts",
  "club-contact-lists",
  "club-newsletters",
  "club-member-applications",
  "club-monthly-archives",
];

function clearLegacyLocalDataOnce() {
  if (typeof window === "undefined") return;
  const markerKey = "club-clean-slate-version";
  if (window.localStorage.getItem(markerKey) === CLEAN_SLATE_LOCAL_VERSION) return;
  CLEAN_SLATE_LOCAL_KEYS.forEach((key) => window.localStorage.removeItem(key));
  window.localStorage.setItem(markerKey, CLEAN_SLATE_LOCAL_VERSION);
}

function safeLoad<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function todayInAthens() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Athens",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function previousDay(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const date = new Date(`${iso}T12:00:00+03:00`);
  date.setDate(date.getDate() - 1);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Athens", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}

function upsertById<T extends { id: string }>(list: T[], value: T) {
  return list.some((item) => item.id === value.id)
    ? list.map((item) => (item.id === value.id ? value : item))
    : [...list, value];
}

export function ClubProvider({ children }: { children: ReactNode }) {
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>(initialBoardMembers);
  const [currentRole, setCurrentRole] = useState<Role>("Γραμματέας");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [workflowTemplates, setWorkflowTemplates] = useState<WorkflowTemplate[]>([]);
  const [meetingMinutes, setMeetingMinutes] = useState<MeetingMinute[]>([]);
  const [therapists, setTherapists] = useState<TherapistDirectoryEntry[]>([]);
  const [therapistSyncError, setTherapistSyncError] = useState<string | null>(null);
  const generatedTaskIds = useRef(new Set<string>());
  const [peopleList, setPeopleList] = useState<Person[]>(people);
  const [personActivities, setPersonActivities] = useState<PersonActivity[]>([]);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [agreements, setAgreements] = useState<SeminarAgreement[]>([]);
  const [priceRules, setPriceRules] = useState<SeminarPriceRule[]>([]);
  const [dues, setDues] = useState<MembershipDue[]>(initialDues);
  const [seminars, setSeminars] = useState<Seminar[]>(initialSeminars);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>(initialNewsletters);
  const [memberApplications, setMemberApplications] = useState<MemberApplication[]>([]);
  const [monthlyArchives, setMonthlyArchives] = useState<MonthlyArchive[]>([]);
  const [externalBookings, setExternalBookings] = useState<ExternalBooking[]>([]);
  const [paymentDeclarations, setPaymentDeclarations] = useState<ExternalPaymentDeclaration[]>([]);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const cloudEnabled = hubCloudEnabled();
  const unsubsRef = useRef<Array<() => void>>([]);
  const contactsRef = useRef<Contact[]>(initialContacts);
  const peopleRef = useRef<Person[]>(people);
  const activitiesRef = useRef<PersonActivity[]>([]);
  const contactListsRef = useRef<ContactList[]>([]);

  useEffect(() => {
    // Never delete local data automatically during RTDB migration.
    // clearLegacyLocalDataOnce();
    const localBoard = safeLoad<BoardMember[]>("club-board-members", initialBoardMembers);
    const localRole = safeLoad<Role>("club-role", "Γραμματέας");
    const localTasks = safeLoad<Task[]>("club-tasks", initialTasks);
    const localPeople = safeLoad<Person[]>("club-people", people);
    const localActivities = safeLoad<PersonActivity[]>("club-person-activities", []);
    const localPayments = safeLoad<Payment[]>("club-payments", initialPayments);
    const localDues = safeLoad<MembershipDue[]>("club-dues", initialDues);
    const localSeminars = safeLoad<Seminar[]>("club-seminars", initialSeminars);
    const localContacts = safeLoad<Contact[]>("club-contacts", initialContacts);
    const localContactLists = safeLoad<ContactList[]>("club-contact-lists", []);
    const localNewsletters = safeLoad<Newsletter[]>("club-newsletters", initialNewsletters);
    const localMemberApplications = safeLoad<MemberApplication[]>("club-member-applications", []);
    const localMonthlyArchives = safeLoad<MonthlyArchive[]>("club-monthly-archives", []);

    setBoardMembers(localBoard);
    setCurrentRole(localRole);
    setTasks(localTasks);
    setWorkflowTemplates(safeLoad<WorkflowTemplate[]>("club-workflow-templates", []));
    setMeetingMinutes(safeLoad<MeetingMinute[]>("club-meeting-minutes", []));
    setPeopleList(localPeople);
    setPersonActivities(localActivities);
    setPayments(localPayments);
    setAgreements(safeLoad<SeminarAgreement[]>("club-seminar-agreements", []));
    setPriceRules(safeLoad<SeminarPriceRule[]>("club-seminar-price-rules", []));
    setDues(localDues);
    setSeminars(localSeminars);
    setContacts(localContacts);
    setContactLists(localContactLists);
    setNewsletters(localNewsletters);
    setMemberApplications(localMemberApplications);
    setMonthlyArchives(localMonthlyArchives);
    setHydrated(true);

    if (!cloudEnabled) return;
    let cancelled = false;

    const connect = async () => {
      try {
        // No destructive migration or sample-data seeding on the production database.
        const onCloudError = (error: Error) => setCloudError(error.message);
        const unsubs = await Promise.all([
          // Στο νέο Firestore σπέρνουμε μόνο τους 5 ρόλους του ΔΣ.
          // Δεν ανεβάζουμε demo οικονομικά/επαφές/σεμινάρια σε πραγματική βάση.
          seedAndSubscribe("board_members", localBoard, setBoardMembers, onCloudError),
          seedAndSubscribe("tasks", [], setTasks, onCloudError),
          seedAndSubscribe("workflow_templates", [], setWorkflowTemplates, onCloudError),
          seedAndSubscribe("meeting_minutes", [], setMeetingMinutes, onCloudError),
          seedAndSubscribe("people", [], setPeopleList, onCloudError),
          seedAndSubscribe("person_activity", [], setPersonActivities, onCloudError),
          seedAndSubscribe("payments", [], setPayments, onCloudError),
          seedAndSubscribe("seminar_agreements", [], setAgreements, onCloudError),
          seedAndSubscribe("seminar_price_rules", [], setPriceRules, onCloudError),
          seedAndSubscribe("membership_dues", [], setDues, onCloudError),
          seedAndSubscribe("seminars", [], setSeminars, onCloudError),
          seedAndSubscribe("contacts", [], setContacts, onCloudError),
          seedAndSubscribe("contact_lists", [], setContactLists, onCloudError),
          seedAndSubscribe("newsletters", [], setNewsletters, onCloudError),
          seedAndSubscribe("member_applications", [], setMemberApplications, onCloudError),
          seedAndSubscribe("monthly_archives", [], setMonthlyArchives, onCloudError),
        ]);
        if (cancelled) {
          unsubs.forEach((unsubscribe) => unsubscribe?.());
          return;
        }
        unsubsRef.current = unsubs.filter(Boolean) as Array<() => void>;
        setCloudError(null);
      } catch (error) {
        setCloudError(error instanceof Error ? error.message : "Δεν ήταν δυνατή η σύνδεση με τη Realtime Database.");
      }
    };
    void connect();

    return () => {
      cancelled = true;
      unsubsRef.current.forEach((unsubscribe) => unsubscribe());
      unsubsRef.current = [];
    };
  }, [cloudEnabled]);

  useEffect(() => { contactsRef.current = contacts; }, [contacts]);
  useEffect(() => { peopleRef.current = peopleList; }, [peopleList]);
  useEffect(() => { activitiesRef.current = personActivities; }, [personActivities]);

  useEffect(() => {
    contactListsRef.current = contactLists;
  }, [contactLists]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    void subscribeCalendarBookings(
      (items) => {
        if (cancelled) return;
        setExternalBookings(items);
        setCalendarConnected(true);
        setCalendarError(null);
      },
      (message) => {
        if (cancelled) return;
        setCalendarConnected(false);
        setCalendarError(message);
      },
    )
      .then((stop) => {
        if (cancelled) stop();
        else unsubscribe = stop;
      })
      .catch((error) => {
        setCalendarConnected(false);
        setCalendarError(error instanceof Error ? error.message : "Δεν ήταν δυνατή η σύνδεση με το ημερολόγιο.");
      });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const run = async () => { if (!cancelled) await refreshPaymentDeclarations(); };
    void run();
    const timer = window.setInterval(() => void run(), 60_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [calendarConnected, payments.length, seminars.length]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem("club-board-members", JSON.stringify(boardMembers));
    window.localStorage.setItem("club-role", JSON.stringify(currentRole));
    window.localStorage.setItem("club-tasks", JSON.stringify(tasks));
    window.localStorage.setItem("club-workflow-templates", JSON.stringify(workflowTemplates));
    window.localStorage.setItem("club-meeting-minutes", JSON.stringify(meetingMinutes));
    window.localStorage.setItem("club-people", JSON.stringify(peopleList));
    window.localStorage.setItem("club-person-activities", JSON.stringify(personActivities));
    window.localStorage.setItem("club-payments", JSON.stringify(payments));
    window.localStorage.setItem("club-seminar-agreements", JSON.stringify(agreements));
    window.localStorage.setItem("club-seminar-price-rules", JSON.stringify(priceRules));
    window.localStorage.setItem("club-dues", JSON.stringify(dues));
    window.localStorage.setItem("club-seminars", JSON.stringify(seminars));
    window.localStorage.setItem("club-contacts", JSON.stringify(contacts));
    window.localStorage.setItem("club-contact-lists", JSON.stringify(contactLists));
    window.localStorage.setItem("club-newsletters", JSON.stringify(newsletters));
    window.localStorage.setItem("club-member-applications", JSON.stringify(memberApplications));
    window.localStorage.setItem("club-monthly-archives", JSON.stringify(monthlyArchives));
  }, [hydrated, boardMembers, currentRole, tasks, workflowTemplates, meetingMinutes, peopleList, personActivities, payments, agreements, priceRules, dues, seminars, contacts, contactLists, newsletters, memberApplications, monthlyArchives]);

  const persist = <T extends { id: string }>(collectionName: HubCollection, value: T) => {
    if (!cloudEnabled) return;
    void saveHubEntity(collectionName, value).catch((error) =>
      setCloudError(error instanceof Error ? error.message : "Αποτυχία αποθήκευσης στο Firestore."),
    );
  };

  const refreshPaymentDeclarations = async () => {
    try {
      const response = await fetch("/api/calendar-payment-declarations", { headers: { Accept: "application/json" } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Δεν φορτώθηκαν οι δηλώσεις κατάθεσης.");
      const declarations = (Array.isArray(payload.declarations) ? payload.declarations : []) as ExternalPaymentDeclaration[];
      setPaymentDeclarations(declarations);

      for (const declaration of declarations) {
        if (!declaration?.id || !(Number(declaration.amount) > 0)) continue;
        const existing = payments.find((payment) => payment.externalDeclarationId === declaration.id);
        if (existing) continue;
        const eventYear = Number(String(declaration.event_date || "").slice(0, 4)) || CURRENT_YEAR;
        const seminar = seminars.find((item) => item.externalBookingId === declaration.event_id || item.date === declaration.event_date);
        const matchedPerson = peopleRef.current.find((item) => item.email.trim().toLowerCase() === String(declaration.email || "").trim().toLowerCase());
        const payment: Payment = {
          id: `external-${declaration.id}`,
          personId: matchedPerson?.id || `external-${declaration.id}`,
          payerName: declaration.full_name || "Συμμετέχων",
          payerEmail: declaration.email || "",
          purpose: `Σεμινάριο «${declaration.event_topic || "Δράση Συλλόγου"}»`,
          year: eventYear,
          amount: Number(declaration.amount),
          due: declaration.event_date || `${eventYear}-12-31`,
          status: "Προς έλεγχο",
          source: "Σεμινάριο",
          seminarId: seminar?.id,
          externalDeclarationId: declaration.id,
          declaredAt: declaration.declared_at,
          paymentReference: declaration.payment_reference || undefined,
        };
        setPayments((prev) => upsertById(prev, payment));
        persist("payments", payment);
      }
    } catch (error) {
      console.warn("PAYMENT_DECLARATIONS_SYNC_FAILED", error);
    }
  };

  const updateBoardMemberName = (role: Role, name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const current = boardMembers.find((member) => member.role === role);
    if (!current) return;
    const updated = { ...current, name: cleanName };
    setBoardMembers((prev) => prev.map((member) => (member.role === role ? updated : member)));
    persist("board_members", updated);
  };

  const resetBoardMemberNames = () => {
    setBoardMembers(initialBoardMembers);
    initialBoardMembers.forEach((member) => persist("board_members", member));
  };

  const saveWorkflowTemplate = (template: WorkflowTemplate) => {
    setWorkflowTemplates((prev) => upsertById(prev, template));
    persist("workflow_templates", template);
  };
  const deleteWorkflowTemplate = (id: string) => {
    setWorkflowTemplates((prev) => prev.filter((item) => item.id !== id));
    if (cloudEnabled) void deleteHubEntity("workflow_templates", id);
  };
  const saveMeetingMinute = (minute: MeetingMinute) => {
    setMeetingMinutes((prev) => upsertById(prev, minute));
    persist("meeting_minutes", minute);
  };

  // Stable ids prevent duplicate tasks when the calendar sends the same event twice.
  useEffect(() => {
    if (!hydrated || !calendarConnected) return;
    for (const booking of externalBookings) {
      if (booking.status === "cancelled" || booking.status === "canceled") continue;
      const haystack = `${booking.event_type || ""} ${booking.topic || ""}`.toLocaleLowerCase("el-GR");
      const isMeeting = /συνάντ|συνεδρ|συνελεύσ/.test(haystack);
      const trigger = isMeeting
        ? (/δσ|διοικητικ|συμβούλ/.test(haystack) ? "board" : "members")
        : "activity";
      for (const template of workflowTemplates) {
        if (!template.enabled || template.trigger !== trigger) continue;
        template.steps.forEach((step, index) => {
          const id = `project-${template.id}-${booking.id}-${step.id}`;
          if (generatedTaskIds.current.has(id) || tasks.some((task) => task.id === id)) return;
          generatedTaskIds.current.add(id);
          const date = new Date(`${booking.booking_date}T12:00:00Z`);
          if (Number.isNaN(date.getTime())) return;
          date.setUTCDate(date.getUTCDate() - (Number(step.daysBefore) || 0));
          const due = date.toISOString().slice(0, 10);
          const task: Task = { id, title: `${step.title} — ${booking.topic || booking.event_type || "Δράση"}`, ownerRole: step.ownerRole,
            category: isMeeting ? "Διοίκηση" : "Δράσεις", due, status: index === 0 ? "Νέα" : "Αναμονή",
            createdAt: new Date().toISOString(), createdByRole: "Γραμματέας", relatedTo: booking.id,
            dependsOn: index ? [`project-${template.id}-${booking.id}-${template.steps[index - 1].id}`] : [],
            notes: step.notes || `Πρότυπο: ${template.name}`, action: { label: "Ημερολόγιο", to: "/imerologio" } };
          setTasks((prev) => prev.some((item) => item.id === id) ? prev : [task, ...prev]);
          persist("tasks", task);
        });
      }
    }
  }, [hydrated, calendarConnected, externalBookings, workflowTemplates, tasks, cloudEnabled]);

  useEffect(() => {
    let stopped = false;
    let unsubscribe: (() => void) | undefined;
    import("@/lib/external-therapists").then(({ subscribeTherapists }) =>
      subscribeTherapists((items) => { if (!stopped) { setTherapists(items); setTherapistSyncError(null); } },
        (message) => { if (!stopped) setTherapistSyncError(message); }),
    ).then((stop) => { if (stopped) stop(); else unsubscribe = stop; })
      .catch((error) => { if (!stopped) setTherapistSyncError(String(error)); });
    return () => { stopped = true; unsubscribe?.(); };
  }, []);

  const addTask = (draft: Omit<Task, "id" | "status" | "createdAt"> & { status?: TaskStatus }) => {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `manual-${crypto.randomUUID()}`
      : `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const task: Task = {
      ...draft,
      id,
      status: draft.status ?? "Νέα",
      manual: true,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [task, ...prev]);
    persist("tasks", task);
    return task;
  };

  const setTaskStatus = (id: string, status: TaskStatus) => {
    const current = tasks.find((task) => task.id === id);
    if (!current) return;
    const updated = { ...current, status };
    setTasks((prev) => prev.map((task) => (task.id === id ? updated : task)));
    persist("tasks", updated);
  };

  // A completed step unlocks its direct successor; records remain auditable.
  useEffect(() => {
    if (!hydrated) return;
    for (const task of tasks) {
      if (task.status !== "Αναμονή" || !task.dependsOn?.length || !task.id.startsWith("project-")) continue;
      if (!task.dependsOn.every((id) => tasks.some((parent) => parent.id === id && parent.status === "Ολοκληρώθηκε"))) continue;
      const updated: Task = { ...task, status: "Νέα" };
      setTasks((prev) => prev.map((item) => item.id === updated.id ? updated : item));
      persist("tasks", updated);
    }
  }, [hydrated, tasks, cloudEnabled]);

  const confirmPayment = (id: string) => {
    const today = todayInAthens();
    const paymentToConfirm = payments.find((payment) => payment.id === id);
    if (!paymentToConfirm || paymentToConfirm.status === "Πληρωμένη") return;
    const updatedPayment: Payment = {
      ...paymentToConfirm,
      status: "Πληρωμένη",
      paidAt: paymentToConfirm.paidAt ?? today,
      confirmedAt: today,
      receiptNo: paymentToConfirm.receiptNo ?? nextReceiptNo(payments),
    };
    setPayments((prev) => prev.map((payment) => (payment.id === id ? updatedPayment : payment)));
    persist("payments", updatedPayment);

    if (paymentToConfirm.source === "Συνδρομή") {
      const due = dues.find((item) => item.personId === paymentToConfirm.personId && item.year === paymentToConfirm.year);
      if (due) {
        const updatedDue: MembershipDue = {
          ...due,
          status: "Πληρωμένη",
          paidAt: updatedPayment.paidAt,
          confirmedAt: today,
        };
        setDues((prev) => prev.map((item) => (item.id === due.id ? updatedDue : item)));
        persist("membership_dues", updatedDue);
      }
    }

    if (paymentToConfirm.source === "Σεμινάριο" && paymentToConfirm.seminarId) {
      const seminar = seminars.find((item) => item.id === paymentToConfirm.seminarId);
      if (seminar) {
        const updatedSeminar = { ...seminar, paid: Math.min(seminar.registrations, seminar.paid + 1) };
        setSeminars((prev) => prev.map((item) => (item.id === seminar.id ? updatedSeminar : item)));
        persist("seminars", updatedSeminar);
      }
    }
  };

  const markReceiptSent = (id: string, email: string) => {
    const current = payments.find((payment) => payment.id === id);
    if (!current) return;
    const updated: Payment = { ...current, receiptSentAt: new Date().toISOString(), receiptSentTo: email.trim().toLowerCase() };
    setPayments((prev) => prev.map((payment) => (payment.id === id ? updated : payment)));
    persist("payments", updated);
  };

  const upsertMemberApplication = (application: MemberApplication) => {
    setMemberApplications((prev) => upsertById(prev, application));
    persist("member_applications", application);
  };

  const saveMonthlyArchive = (archive: MonthlyArchive) => {
    setMonthlyArchives((prev) => upsertById(prev, archive));
    persist("monthly_archives", archive);
  };

  const sendReminder = (_id: string) => {
    // Η αποστολή reminder θα συνδεθεί με το ίδιο email transport του newsletter.
  };

  const markDuePaid = (personId: string, year: number) => {
    const today = todayInAthens();
    const person = peopleList.find((item) => item.id === personId);
    const amount = person?.kind === "Φίλος" ? 10 : 20;
    const due = dues.find((item) => item.personId === personId && item.year === year);
    const updatedDue: MembershipDue = due
      ? { ...due, status: "Πληρωμένη", amount, paidAt: today, confirmedAt: today }
      : { id: `due-${personId}-${year}`, personId, year, amount, status: "Πληρωμένη", paidAt: today, confirmedAt: today };
    setDues((prev) => upsertById(prev, updatedDue));
    persist("membership_dues", updatedDue);
    if (year === CURRENT_YEAR) {
      const existing = payments.find((payment) => payment.personId === personId && payment.year === year && payment.source === "Συνδρομή");
      const updatedPayment: Payment = existing
        ? { ...existing, status: "Πληρωμένη", amount, paidAt: today, confirmedAt: today, receiptNo: existing.receiptNo ?? nextReceiptNo(payments) }
        : {
            id: `pay-manual-${personId}-${year}`,
            personId,
            purpose: person?.kind === "Φίλος" ? `Συνδρομή φίλου ${year}` : `Ετήσια συνδρομή ${year}`,
            year,
            amount,
            due: `${year}-12-31`,
            status: "Πληρωμένη",
            paidAt: today,
            confirmedAt: today,
            receiptNo: nextReceiptNo(payments),
            source: "Συνδρομή",
          };
      setPayments((prev) => upsertById(prev, updatedPayment));
      persist("payments", updatedPayment);
    }
  };

  const saveAgreement = (agreement: SeminarAgreement) => {
    const updated = { ...agreement, updatedAt: new Date().toISOString() };
    setAgreements((prev) => upsertById(prev, updated));
    persist("seminar_agreements", updated);
  };
  const savePriceRule = (rule: SeminarPriceRule) => {
    const updated = { ...rule, updatedAt: new Date().toISOString() };
    setPriceRules((prev) => upsertById(prev, updated));
    persist("seminar_price_rules", updated);
  };
  const updatePersonApplication = (id: string, applicationDate: string, applicationDocumentUrl: string) => {
    const person = peopleRef.current.find((item) => item.id === id);
    if (!person) return;
    const updated = { ...person, applicationDate, applicationDocumentUrl };
    peopleRef.current = upsertById(peopleRef.current, updated);
    setPeopleList((prev) => upsertById(prev, updated));
    persist("people", updated);
  };
  const importSeminarParticipants = (eventId: string, title: string, date: string, rows: Array<{name: string; email: string; phone?: string; newsletter?: boolean | null}>) => {
    let created = 0, reused = 0, skipped = 0;
    const ids: string[] = [];
    const now = new Date().toISOString();
    for (const row of rows) {
      const email = String(row.email || "").trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) { skipped++; continue; }
      const name = row.name?.trim() || email;
      let person = peopleRef.current.find((p) => p.email.trim().toLowerCase() === email);
      if (!person) {
        const id = `visitor-${email.replace(/[^a-z0-9]/g, "-").slice(0, 80)}`;
        person = { id, email, name, phone: row.phone || "", kind: "Επισκέπτης", since: Number(date.slice(0, 4)) || new Date().getFullYear() };
        peopleRef.current = upsertById(peopleRef.current, person);
        setPeopleList((prev) => upsertById(prev, person!));
        persist("people", person); created++;
      } else {
        reused++;
        const updated = { ...person, name: row.name?.trim() || person.name, phone: row.phone?.trim() || person.phone };
        person = updated;
        peopleRef.current = upsertById(peopleRef.current, updated);
        setPeopleList(prev => upsertById(prev, updated)); persist("people", updated);
      }
      const activityId = `activity-${eventId}-${person.id}`;
      if (!activitiesRef.current.some((a) => a.id === activityId)) {
        const activity: PersonActivity = { id: activityId, personId: person.id, eventId, title, date, type: "Σεμινάριο", status: "Εγγράφηκε", source: "Ημερολόγιο", registeredAt: now };
        activitiesRef.current = upsertById(activitiesRef.current, activity);
        setPersonActivities((prev) => upsertById(prev, activity)); persist("person_activity", activity);
      }
      let contact = contactsRef.current.find((c) => c.email.trim().toLowerCase() === email);
      if (!contact) {
        contact = { id: `contact-import-${person.id}`, name, email, phone: row.phone, kind: person.kind, subscribed: row.newsletter === true, tags: ["Σεμινάριο", title], source: "Import Excel", updatedAt: now };
      } else {
        // Μόνο ρητή συναίνεση ΝΑΙ αλλάζει μία προηγούμενη μη εγγραφή· όχι τα κενά πεδία.
        contact = { ...contact, name: row.name?.trim() || contact.name, phone: row.phone?.trim() || contact.phone, subscribed: row.newsletter === null || row.newsletter === undefined ? contact.subscribed : row.newsletter, tags: Array.from(new Set([...(contact.tags || []), "Σεμινάριο", title])), updatedAt: now };
      }
      contactsRef.current = upsertById(contactsRef.current, contact);
      setContacts((prev) => upsertById(prev, contact!)); persist("contacts", contact);
      ids.push(contact.id);
    }
    const listId = `calendar-${eventId}`;
    const prior = contactListsRef.current.find((l) => l.id === listId);
    const list: ContactList = { id: listId, name: title, source: "Import Excel", type: "Import Excel", externalBookingId: eventId, eventDate: date, eventTitle: title, contactIds: Array.from(new Set([...(prior?.contactIds || []), ...ids])), createdAt: prior?.createdAt || now, updatedAt: now };
    contactListsRef.current = upsertById(contactListsRef.current, list);
    setContactLists((prev) => upsertById(prev, list)); persist("contact_lists", list);
    return { created, reused, skipped };
  };

  const updatePersonKind = (id: string, kind: PersonKind) => {
    const current = peopleList.find((item) => item.id === id);
    if (!current) return;
    const updated = { ...current, kind };
    setPeopleList((prev) => prev.map((item) => (item.id === id ? updated : item)));
    peopleRef.current = peopleRef.current.map((item) => (item.id === id ? updated : item));
    persist("people", updated);
    const contact = contacts.find((item) => item.email.trim().toLowerCase() === current.email.trim().toLowerCase());
    if (contact) upsertContact({ ...contact, kind });
  };

  const recordZoomAttendance = (eventId: string, title: string, date: string, attendees: Array<{ name?: string; email?: string }>) => {
    let matched = 0;
    const normalizedName = (value: string) => value.toLocaleLowerCase("el-GR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zα-ω0-9]/gi, "");
    for (const attendee of attendees) {
      const email = (attendee.email || "").trim().toLowerCase();
      const nameKey = normalizedName(attendee.name || "");
      const person = peopleRef.current.find((item) => email && item.email.trim().toLowerCase() === email)
        || peopleRef.current.find((item) => nameKey && normalizedName(item.name) === nameKey);
      if (!person) continue;
      const existing = activitiesRef.current.find((item) => item.eventId === eventId && item.personId === person.id);
      const activity: PersonActivity = existing
        ? { ...existing, status: "Παρακολούθησε", attendedAt: new Date().toISOString(), source: "Zoom CSV" }
        : { id: `activity-${eventId}-${person.id}`, personId: person.id, eventId, title, date, type: "Σεμινάριο", status: "Παρακολούθησε", attendedAt: new Date().toISOString(), source: "Zoom CSV" };
      activitiesRef.current = upsertById(activitiesRef.current, activity);
      setPersonActivities((prev) => upsertById(prev, activity));
      persist("person_activity", activity);
      matched += 1;
    }
    return matched;
  };

  const approveSeminar = (id: string) => {
    const seminar = seminars.find((item) => item.id === id);
    if (!seminar) return;
    const updated = { ...seminar, status: "Εγκεκριμένο" as const, workflowStep: "Ενημερωτικό email" as const };
    setSeminars((prev) => prev.map((item) => (item.id === id ? updated : item)));
    persist("seminars", updated);
  };

  const rejectSeminar = (id: string) => {
    setSeminars((prev) => prev.filter((item) => item.id !== id));
    if (cloudEnabled) void deleteHubEntity("seminars", id);
  };

  const sendSeminarAnnouncement = (id: string) => {
    const seminar = seminars.find((item) => item.id === id);
    if (!seminar) return;
    const updated = { ...seminar, workflowStep: "Εγγραφές" as const };
    setSeminars((prev) => prev.map((item) => (item.id === id ? updated : item)));
    persist("seminars", updated);
    const task = tasks.find((item) => item.relatedTo === id && item.ownerRole === "Γραμματέας");
    if (task) setTaskStatus(task.id, "Ολοκληρώθηκε");
  };

  const approveExternalBooking = async (bookingId: string) => {
    const booking = externalBookings.find((item) => item.id === bookingId);
    if (!booking) throw new Error("Το αίτημα δεν βρέθηκε.");

    const response = await fetch("/api/calendar-approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: booking.booking_date }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Η έγκριση απέτυχε.");

    setExternalBookings((prev) =>
      prev.map((item) =>
        item.id === bookingId ? { ...item, approval_status: "approved", requested_public: true, is_public: true } : item,
      ),
    );

    const fee = Number(booking.general_price || 0) || 0;
    const seminar: Seminar = {
      id: `calendar-${booking.id}`,
      externalBookingId: booking.id,
      title: booking.topic || booking.event_type || "Δράση Συλλόγου",
      date: booking.booking_date,
      fee,
      registrations: 0,
      paid: 0,
      status: "Εγκεκριμένο",
      workflowStep: "Ενημερωτικό email",
      owner: booking.therapist_name || "Υπεύθυνος δράσης",
    };
    setSeminars((prev) => upsertById(prev, seminar));
    persist("seminars", seminar);

    const task: Task = {
      id: `newsletter-${booking.id}`,
      title: `Ετοιμασία & αποστολή newsletter — ${seminar.title}`,
      ownerRole: "Γραμματέας",
      category: "Επικοινωνία",
      due: todayInAthens(),
      status: "Νέα",
      urgent: true,
      relatedTo: seminar.id,
      notes: "Δημιουργήθηκε αυτόματα μετά την έγκριση του Προέδρου.",
      action: { label: "Άνοιγμα newsletter", to: `/grammateia?event=${encodeURIComponent(booking.id)}` },
    };
    setTasks((prev) => upsertById(prev, task));
    persist("tasks", task);

    const zoomTask: Task = {
      id: `zoom-${booking.id}`,
      title: `Αποστολή Zoom στους συμμετέχοντες — ${seminar.title}`,
      ownerRole: "Γραμματέας",
      category: "Επικοινωνία",
      due: previousDay(booking.booking_date),
      status: "Αναμονή",
      relatedTo: seminar.id,
      dependsOn: [task.id],
      notes: "Να σταλεί μία ημέρα πριν τη δράση, μόνο στους εγγεγραμμένους συμμετέχοντες.",
      action: { label: "Ετοιμασία Zoom email", to: `/grammateia?event=${encodeURIComponent(booking.id)}&mode=zoom` },
    };
    setTasks((prev) => upsertById(prev, zoomTask));
    persist("tasks", zoomTask);
  };

  const upsertContact = (contact: Contact) => {
    const updated = { ...contact, updatedAt: new Date().toISOString() };
    setContacts((prev) => upsertById(prev, updated));
    persist("contacts", updated);
  };

  const deleteContact = (id: string) => {
    setContacts((prev) => prev.filter((item) => item.id !== id));
    const affectedLists = contactLists.filter((list) => list.contactIds.includes(id));
    affectedLists.forEach((list) => {
      const updated = { ...list, contactIds: list.contactIds.filter((contactId) => contactId !== id), updatedAt: new Date().toISOString() };
      setContactLists((prev) => upsertById(prev, updated));
      persist("contact_lists", updated);
    });
    if (cloudEnabled) void deleteHubEntity("contacts", id);
  };

  const toggleContactSubscription = (id: string) => {
    const current = contacts.find((item) => item.id === id);
    if (!current) return;
    upsertContact({ ...current, subscribed: !current.subscribed });
  };

  const upsertContactList = (list: ContactList) => {
    const now = new Date().toISOString();
    const updated: ContactList = {
      ...list,
      contactIds: Array.from(new Set(list.contactIds)),
      createdAt: list.createdAt || now,
      updatedAt: now,
    };
    setContactLists((prev) => upsertById(prev, updated));
    persist("contact_lists", updated);
  };

  const deleteContactList = (id: string) => {
    setContactLists((prev) => prev.filter((item) => item.id !== id));
    if (cloudEnabled) void deleteHubEntity("contact_lists", id);
  };

  const syncCalendarContactLists = async () => {
    const approved = externalBookings.filter((booking) =>
      (booking.approval_status === "approved" || booking.is_public === true)
      && seminars.some((seminar) => seminar.externalBookingId === booking.id),
    );
    const knownContacts = [...contactsRef.current];
    const knownPeople = [...peopleRef.current];
    const knownActivities = [...activitiesRef.current];
    const knownLists = [...contactListsRef.current];

    for (const booking of approved) {
      const title = booking.topic || booking.event_type || booking.therapist_name || "Δράση Συλλόγου";
      const listId = `calendar-${booking.id}`;
      const existingList = knownLists.find((item) => item.id === listId);
      let contactIds: string[] = existingList?.contactIds ? [...existingList.contactIds] : [];
      try {
        const response = await fetch(`/api/calendar-registrations?eventId=${encodeURIComponent(booking.booking_date)}`, { headers: { Accept: "application/json" } });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Δεν φορτώθηκαν οι συμμετοχές.");
        const registrations = Array.isArray(payload.registrations) ? payload.registrations : [];
        contactIds = [];

        for (const raw of registrations) {
          const email = typeof raw?.email === "string" ? raw.email.trim().toLowerCase() : "";
          if (!/^\S+@\S+\.\S+$/.test(email)) continue;
          const name = typeof raw?.full_name === "string" && raw.full_name.trim() ? raw.full_name.trim() : email;
          const phone = typeof raw?.phone === "string" ? raw.phone.trim() : "";
          let person = knownPeople.find((item) => item.email.trim().toLowerCase() === email);
          if (!person) {
            const safeId = email.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || crypto.randomUUID();
            person = { id: `visitor-${safeId}`, name, email, phone, kind: "Επισκέπτης", since: Number(booking.booking_date.slice(0, 4)) || CURRENT_YEAR };
            knownPeople.push(person);
            peopleRef.current = knownPeople;
            setPeopleList((prev) => upsertById(prev, person!));
            persist("people", person);
          } else if ((!person.phone && phone) || (person.name === person.email && name !== email)) {
            person = { ...person, phone: person.phone || phone, name: person.name === person.email ? name : person.name };
            const personIndex = knownPeople.findIndex((item) => item.id === person!.id);
            if (personIndex >= 0) knownPeople[personIndex] = person;
            peopleRef.current = knownPeople;
            setPeopleList((prev) => upsertById(prev, person!));
            persist("people", person);
          }

          const relatedSeminar = seminars.find((item) => item.externalBookingId === booking.id || item.date === booking.booking_date);
          payments.filter((payment) => payment.payerEmail?.trim().toLowerCase() === email && payment.source === "Σεμινάριο").forEach((payment) => {
            if (payment.personId === person!.id && (!relatedSeminar || payment.seminarId === relatedSeminar.id)) return;
            const updatedPayment = { ...payment, personId: person!.id, seminarId: relatedSeminar?.id || payment.seminarId };
            setPayments((prev) => upsertById(prev, updatedPayment));
            persist("payments", updatedPayment);
          });

          const activityId = `activity-${booking.id}-${person.id}`;
          const existingActivity = knownActivities.find((item) => item.id === activityId);
          const activity: PersonActivity = existingActivity ?? {
            id: activityId, personId: person.id, eventId: booking.id, title, date: booking.booking_date, type: "Σεμινάριο", status: "Εγγράφηκε",
            registeredAt: typeof raw?.created_at === "string" ? raw.created_at : new Date().toISOString(), source: "Ημερολόγιο",
          };
          if (!existingActivity) {
            knownActivities.push(activity);
            activitiesRef.current = knownActivities;
            setPersonActivities((prev) => upsertById(prev, activity));
            persist("person_activity", activity);
          }

          let contact = knownContacts.find((item) => item.email.trim().toLowerCase() === email);
          if (!contact) {
            contact = {
              id: `contact-calendar-${crypto.randomUUID()}`,
              name,
              email,
              phone,
              kind: person.kind,
              subscribed: raw?.newsletter_consent === true || raw?.newsletter_opt_in === true,
              tags: ["Σεμινάριο", title],
              source: "Σεμινάριο",
              updatedAt: new Date().toISOString(),
            };
            knownContacts.push(contact);
            contactsRef.current = knownContacts;
            setContacts((prev) => upsertById(prev, contact!));
            persist("contacts", contact);
          } else {
            const tags = Array.from(new Set([...(contact.tags || []), "Σεμινάριο", title]));
            if (tags.length !== (contact.tags || []).length || contact.kind !== person.kind) {
              contact = { ...contact, kind: person.kind, tags, updatedAt: new Date().toISOString() };
              const index = knownContacts.findIndex((item) => item.id === contact!.id);
              if (index >= 0) knownContacts[index] = contact;
              contactsRef.current = knownContacts;
              setContacts((prev) => upsertById(prev, contact!));
              persist("contacts", contact);
            }
          }
          contactIds.push(contact.id);
        }
        const seminar = seminars.find((item) => item.externalBookingId === booking.id || item.date === booking.booking_date);
        if (seminar && seminar.registrations !== registrations.length) {
          const updatedSeminar = { ...seminar, registrations: registrations.length };
          setSeminars((prev) => prev.map((item) => (item.id === seminar.id ? updatedSeminar : item)));
          persist("seminars", updatedSeminar);
        }
      } catch (error) {
        console.warn("CALENDAR_CONTACT_LIST_SYNC_FAILED", booking.id, error);
      }

      const now = new Date().toISOString();
      const list: ContactList = {
        id: listId,
        name: existingList?.name || `${title} — ${booking.booking_date}`,
        type: "Αυτόματη",
        source: "Ημερολόγιο",
        contactIds: Array.from(new Set(contactIds)),
        externalBookingId: booking.id,
        eventDate: booking.booking_date,
        eventTitle: title,
        createdAt: existingList?.createdAt || now,
        updatedAt: now,
      };
      const listIndex = knownLists.findIndex((item) => item.id === list.id);
      const previous = listIndex >= 0 ? knownLists[listIndex] : undefined;
      const sameContacts = previous && previous.contactIds.length === list.contactIds.length && previous.contactIds.every((id) => list.contactIds.includes(id));
      if (listIndex >= 0) knownLists[listIndex] = list; else knownLists.push(list);
      if (!previous || !sameContacts || previous.name !== list.name || previous.eventTitle !== list.eventTitle || previous.eventDate !== list.eventDate) {
        setContactLists((prev) => upsertById(prev, list));
        persist("contact_lists", list);
      }
      contactListsRef.current = knownLists;
    }
  };

  useEffect(() => {
    if (!calendarConnected || typeof window === "undefined") return;
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await syncCalendarContactLists();
    };
    void run();
    const timer = window.setInterval(() => void run(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [
    calendarConnected,
    externalBookings.map((item) => `${item.id}:${item.approval_status}:${item.is_public}`).join("|"),
    seminars.map((item) => `${item.id}:${item.externalBookingId || ""}:${item.registrations}`).join("|"),
  ]);

  const saveNewsletter = (newsletter: Newsletter) => {
    const now = new Date().toISOString();
    const updated: Newsletter = {
      ...newsletter,
      createdAt: newsletter.createdAt || now,
      updatedAt: now,
    };
    setNewsletters((prev) => upsertById(prev, updated));
    persist("newsletters", updated);
  };

  const markNewsletterSent = (newsletter: Newsletter, sentCount: number) => {
    const now = new Date().toISOString();
    const updated: Newsletter = { ...newsletter, status: "Απεσταλμένο", sentAt: now, sentCount, updatedAt: now };
    setNewsletters((prev) => upsertById(prev, updated));
    persist("newsletters", updated);

    if (newsletter.seminarId) {
      const seminar = seminars.find((item) => item.id === newsletter.seminarId);
      if (seminar) {
        if (newsletter.templateKind === "seminar_zoom") {
          const updatedSeminar = { ...seminar, zoomUrl: newsletter.zoomUrl || seminar.zoomUrl, zoomSentAt: now };
          setSeminars((prev) => prev.map((item) => (item.id === seminar.id ? updatedSeminar : item)));
          persist("seminars", updatedSeminar);
        } else {
          const updatedSeminar = { ...seminar, workflowStep: "Εγγραφές" as const, announcementSentAt: now };
          setSeminars((prev) => prev.map((item) => (item.id === seminar.id ? updatedSeminar : item)));
          persist("seminars", updatedSeminar);
        }
      }
    }

    if (newsletter.externalBookingId) {
      if (newsletter.templateKind === "member_meeting_announcement") {
        const booking = externalBookings.find((item) => item.id === newsletter.externalBookingId);
        if (booking) {
          const meetingZoomTask: Task = {
            id: `member-zoom-${booking.id}`,
            title: `Αποστολή Zoom στα Μέλη — ${booking.topic || "Μηνιαία συνάντηση"}`,
            ownerRole: "Γραμματέας",
            category: "Επικοινωνία",
            due: previousDay(booking.booking_date),
            status: "Νέα",
            relatedTo: booking.id,
            notes: "Δημιουργήθηκε αυτόματα μετά την πρώτη ενημέρωση. Αποστολή μία ημέρα πριν, μόνο στα Μέλη.",
            action: { label: "Ετοιμασία Zoom email", to: `/grammateia?event=${encodeURIComponent(booking.id)}&mode=member-zoom` },
          };
          setTasks((prev) => upsertById(prev, meetingZoomTask));
          persist("tasks", meetingZoomTask);
        }
      }

      const taskId = newsletter.templateKind === "seminar_zoom"
        ? `zoom-${newsletter.externalBookingId}`
        : newsletter.templateKind === "member_meeting_zoom"
          ? `member-zoom-${newsletter.externalBookingId}`
          : `newsletter-${newsletter.externalBookingId}`;
      const task = tasks.find((item) => item.id === taskId);
      if (task) setTaskStatus(task.id, "Ολοκληρώθηκε");
      if (newsletter.templateKind === "seminar_announcement") {
        const zoomTask = tasks.find((item) => item.id === `zoom-${newsletter.externalBookingId}`);
        if (zoomTask && zoomTask.status === "Αναμονή") setTaskStatus(zoomTask.id, "Νέα");
      }
    }
  };

  const deleteNewsletter = (id: string) => {
    setNewsletters((prev) => prev.filter((item) => item.id !== id));
    if (cloudEnabled) void deleteHubEntity("newsletters", id);
  };

  const duplicateNewsletter = (id: string) => {
    const original = newsletters.find((item) => item.id === id);
    if (!original) return null;
    const now = new Date().toISOString();
    const copy: Newsletter = {
      ...original,
      id: `newsletter-${crypto.randomUUID()}`,
      subject: original.subject ? `${original.subject} — αντίγραφο` : "Αντίγραφο newsletter",
      status: "Πρόχειρο",
      createdAt: now,
      updatedAt: now,
      sentAt: undefined,
      sentCount: undefined,
    };
    setNewsletters((prev) => upsertById(prev, copy));
    persist("newsletters", copy);
    return copy;
  };

  const resetDemo = () => {
    setBoardMembers(initialBoardMembers);
    setCurrentRole("Γραμματέας");
    setTasks([]);
    setPeopleList([]);
    setPersonActivities([]);
    setPayments([]);
    setDues([]);
    setSeminars([]);
    setContacts([]);
    setContactLists([]);
    setNewsletters([]);
    setMemberApplications([]);
    setMonthlyArchives([]);
  };

  const pendingCalendarApprovals = externalBookings.filter(
    (booking) => booking.requested_public === true && booking.approval_status === "pending",
  );

  const value = useMemo<Store>(
    () => ({
      boardMembers,
      updateBoardMemberName,
      resetBoardMemberNames,
      currentRole,
      setCurrentRole,
      tasks,
      workflowTemplates,
      saveWorkflowTemplate,
      deleteWorkflowTemplate,
      meetingMinutes,
      saveMeetingMinute,
      therapists,
      therapistSyncError,
      addTask,
      setTaskStatus,
      people: peopleList,
      personActivities,
      agreements,
      priceRules,
      saveAgreement,
      savePriceRule,
      importSeminarParticipants,
      updatePersonApplication,
      updatePersonKind,
      recordZoomAttendance,
      payments,
      dues,
      seminars,
      contacts,
      contactLists,
      newsletters,
      memberApplications,
      monthlyArchives,
      externalBookings,
      paymentDeclarations,
      pendingCalendarApprovals,
      calendarConnected,
      calendarError,
      cloudEnabled,
      cloudError,
      confirmPayment,
      markReceiptSent,
      upsertMemberApplication,
      saveMonthlyArchive,
      sendReminder,
      markDuePaid,
      approveSeminar,
      rejectSeminar,
      sendSeminarAnnouncement,
      approveExternalBooking,
      refreshPaymentDeclarations,
      upsertContact,
      deleteContact,
      toggleContactSubscription,
      upsertContactList,
      deleteContactList,
      syncCalendarContactLists,
      saveNewsletter,
      markNewsletterSent,
      deleteNewsletter,
      duplicateNewsletter,
      resetDemo,
    }),
    [boardMembers, currentRole, tasks, workflowTemplates, meetingMinutes, therapists, therapistSyncError, peopleList, personActivities, payments, agreements, priceRules, dues, seminars, contacts, contactLists, newsletters, memberApplications, monthlyArchives, externalBookings, paymentDeclarations, calendarConnected, calendarError, cloudEnabled, cloudError],
  );

  return <ClubContext.Provider value={value}>{children}</ClubContext.Provider>;
}

export function useClub() {
  const ctx = useContext(ClubContext);
  if (!ctx) throw new Error("useClub must be used inside ClubProvider");
  return ctx;
}

export function personName(id: string) {
  return people.find((p) => p.id === id)?.name ?? "—";
}

export function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("el-GR", {
    day: "2-digit",
    month: "short",
    year: new Date(iso).getFullYear() !== CURRENT_YEAR ? "numeric" : undefined,
  });
}

export function euro(n: number) {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function daysUntil(iso: string) {
  const target = new Date(`${iso}T09:00:00+03:00`);
  return Math.round((target.getTime() - TODAY.getTime()) / 86400000);
}

export function roleProgress(tasks: Task[], role: Role) {
  const relevant = tasks.filter((t) => t.ownerRole === role);
  if (!relevant.length) return 0;
  return Math.round((relevant.filter((t) => t.status === "Ολοκληρώθηκε").length / relevant.length) * 100);
}
