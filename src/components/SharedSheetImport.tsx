import { useMemo, useState, type ChangeEvent } from "react";
import * as XLSX from "xlsx";
import { useClub } from "@/lib/club-data";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const normalize = (v: unknown) => String(v ?? "").trim().toLocaleLowerCase("el-GR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9α-ω]/gi, "");
const read = (row: Record<string, unknown>, aliases: string[]) => {
  const entries = Object.entries(row);
  const exact = entries.find(([key]) => aliases.some(a => normalize(key) === normalize(a)));
  const partial = entries.find(([key]) => aliases.some(a => normalize(key).includes(normalize(a))));
  return String((exact || partial)?.[1] ?? "").trim();
};
const consent = (v: string): boolean | null => {
  const n = normalize(v);
  if (["ναι", "yes", "true", "1"].includes(n)) return true;
  if (["οχι", "no", "false", "0"].includes(n)) return false;
  return null;
};
type Row = { action: string; name: string; email: string; phone: string; newsletter: boolean | null };
export function SharedSheetImport() {
  const { externalBookings, importSeminarParticipants } = useClub();
  const [rows,setRows] = useState<Row[]>([]);
  const [busy,setBusy] = useState(false);
  const bookings = useMemo(() => externalBookings.filter(b => b.is_public === true || b.approval_status === "approved"), [externalBookings]);
  const indexed = useMemo(() => {
    const map = new Map<string, typeof bookings>();
    for (const b of bookings) for (const title of [b.topic]) {
      const key = normalize(title);
      if (!key) continue;
      map.set(key,[...(map.get(key) || []),b]);
    }
    return map;
  }, [bookings]);
  const assignments = useMemo(() => rows.map(r => {
    const match = indexed.get(normalize(r.action)) || [];
    const unique = Array.from(new Map(match.map(b => [b.id,b])).values());
    return { row:r, booking:unique.length===1?unique[0]:null, reason:unique.length>1?"Πολλαπλές δράσεις με ίδιο τίτλο":"Δεν βρέθηκε μοναδική δράση" };
  }), [rows,indexed]);
  const matched = assignments.filter(x=>x.booking && /^\S+@\S+\.\S+$/.test(x.row.email));
  async function load(event: ChangeEvent<HTMLInputElement>) {
    const file=event.target.files?.[0];event.target.value="";if(!file)return;
    try {
      const book=XLSX.read(await file.arrayBuffer(),{type:"array"});
      const sheet=book.Sheets[book.SheetNames[0]];
      const records=XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet,{defval:""});
      const parsed=records.map(r=>({
        action:read(r,["Δράση / Σεμινάριο", "Δράση", "Σεμινάριο"]),
        name:read(r,["Ονοματεπώνυμο", "Full Name"]),
        email:read(r,["email", "e-mail"]).trim().toLowerCase(),
        phone:read(r,["Τηλέφωνο επικοινωνίας", "Τηλέφωνο", "phone"]),
        newsletter:consent(read(r,["Επιθυμώ να λαμβάνω ενημερώσεις για επόμενες δράσεις και σεμινάρια του Συλλόγου.","ενημερώσεις", "newsletter"])),
      }));
      setRows(parsed);toast.success(`Διαβάστηκαν ${parsed.length} γραμμές. Δες πρώτα την αντιστοίχιση.`);
    } catch {toast.error("Δεν διαβάστηκε το αρχείο Excel/CSV.");}
  }
  function commit(){
    setBusy(true);
    try {
      const groups=new Map<string, { booking: NonNullable<typeof matched[number]["booking"]>; rows: Row[] }>();
      // Κάθε δράση κρατά μία συμμετοχή ανά email. Το πρόσωπο διατηρεί τις άλλες δράσεις του.
      for (const x of matched) {
        const b=x.booking!;
        const grp=groups.get(b.id) || { booking:b, rows:[] };
        grp.rows.push(x.row);groups.set(b.id,grp);
      }
      let created=0,reused=0,skipped=0;
      const consentByEmail = new Map<string, boolean | null>();
      for (const {row} of matched) {
        const prev=consentByEmail.get(row.email);
        consentByEmail.set(row.email, prev === false || row.newsletter === false ? false : prev === true || row.newsletter === true ? true : null);
      }
      for (const {booking,rows:items} of groups.values()) {
        const unique = new Map<string, Row>();
        for (const r of items) {
          const prev=unique.get(r.email);
          unique.set(r.email, prev ? {...prev,name:r.name || prev.name,phone:r.phone || prev.phone,newsletter:r.newsletter===false || prev.newsletter===false?false:r.newsletter===true || prev.newsletter===true?true:null}:r);
        }
        const result=importSeminarParticipants(booking.id,booking.topic || booking.event_type || booking.booking_date,booking.booking_date,Array.from(unique.values()).map(r=>({...r, newsletter: consentByEmail.get(r.email) ?? null})));
        created+=result.created;reused+=result.reused;skipped+=result.skipped;
      }
      setRows([]);
      toast.success(`Ολοκληρώθηκε: ${groups.size} δράσεις · ${created} νέα πρόσωπα · ${reused} υπάρχοντα · ${skipped} παραλείφθηκαν.`);
    } catch(e){toast.error(e instanceof Error?e.message:"Αποτυχία εισαγωγής.");}
    finally{setBusy(false);}
  }
  return <Card className="space-y-3 p-4">
    <h3 className="font-semibold">Κοινό Google Sheets — συμμετοχές σε όλες τις δράσεις</h3>
    <p className="text-sm text-muted-foreground">Προς το παρόν κατέβασε από το ιδιωτικό Google Sheets «Αρχείο → Λήψη → Microsoft Excel (.xlsx)» και ανέβασέ το εδώ. Δεν απαιτείται αλλαγή ή δημοσίευση του Sheets. Η αυτόματη σύνδεση θα ενεργοποιηθεί μόνο μετά την ασφαλή εξουσιοδότηση του server.</p>
    <Input type="file" accept=".xlsx,.xls,.csv" onChange={e=>void load(e)}/>
    {rows.length>0 && <div className="space-y-2">
      <div className="flex flex-wrap gap-2"><Badge>{rows.length} γραμμές</Badge><Badge variant="secondary">{matched.length} αντιστοιχισμένες</Badge><Badge variant="outline">{assignments.length-matched.length} για έλεγχο</Badge><Badge variant="outline">{matched.length-new Set(matched.map(x=>x.booking!.id+"|"+x.row.email)).size} διπλές συμμετοχές</Badge></div>
      <div className="max-h-60 overflow-auto divide-y text-xs">{assignments.map((x,i)=><div key={i} className="flex flex-wrap gap-2 py-2"><span className="min-w-40 font-medium">{x.row.action||"Χωρίς δράση"}</span><span>{x.row.name||x.row.email}</span><span className="text-muted-foreground">{x.booking?"✓ "+(x.booking.topic||x.booking.event_type||x.booking.id):x.reason}</span>{x.row.newsletter===false&&<Badge variant="outline">Όχι newsletter</Badge>}</div>)}</div>
      <p className="text-xs text-muted-foreground">Οι μη αντιστοιχισμένες εγγραφές δεν εισάγονται σε λάθος δράση. Το ΟΧΙ υπερισχύει όταν εμφανίζεται αντιφατική συναίνεση για το ίδιο email.</p>
      <Button disabled={busy||matched.length===0} onClick={commit}>Εισαγωγή {matched.length} εγγραφών στις σωστές δράσεις</Button>
    </div>}
  </Card>;
}
