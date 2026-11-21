import { useMemo, useState, type ChangeEvent } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useClub, euro, type Installment, type SeminarAgreement } from "@/lib/club-data";

const today = () => new Date().toISOString().slice(0, 10);
const clean = (value: unknown) => String(value ?? "").trim();
const simplify = (value: string) => value.toLocaleLowerCase("el-GR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9α-ω]/gi, "");
const read = (row: Record<string, unknown>, names: string[]) => {
  const keys = Object.keys(row);
  const wanted = names.map(simplify);
  const key = keys.find((k) => wanted.includes(simplify(k))) || keys.find((k) => wanted.some((x) => simplify(k).includes(x)));
  return key ? clean(row[key]) : "";
};
const parseConsent = (raw: string): boolean | null => {
  const value = simplify(raw);
  if (["ναι", "yes", "true", "1", "συμφωνω", "αποδεχομαι"].includes(value)) return true;
  if (["οχι", "no", "false", "0", "δενσυμφωνω"].includes(value)) return false;
  return null;
};
const newInstallment = (amount = 0): Installment => ({ id: crypto.randomUUID(), amount, due: today() });

type Props = { bookingId: string; seminarId: string; title: string; date: string; initialFee: number };
export function SeminarFinance({ bookingId, seminarId, title, date, initialFee }: Props) {
  const { people, personActivities, priceRules, agreements, saveAgreement, savePriceRule, importSeminarParticipants } = useClub();
  const rule = priceRules.find((r) => r.seminarId === seminarId);
  const [editRule, setEditRule] = useState(false);
  const defaultTotal = String(initialFee);
  const [template, setTemplate] = useState<Installment[]>(rule?.installments ?? [newInstallment(initialFee)]);
  const [selected, setSelected] = useState("");
  const [special, setSpecial] = useState(false);
  const [total, setTotal] = useState(String(initialFee));
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [paidAmount, setPaidAmount] = useState("");
  const [paidDate, setPaidDate] = useState(today());
  const [paidMethod, setPaidMethod] = useState("");
  const [paidReference, setPaidReference] = useState("");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<Array<{name:string;email:string;phone?:string;newsletter?:boolean|null}>>([]);
  const [importing, setImporting] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualConsent, setManualConsent] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkConsent, setBulkConsent] = useState(false);
  const [manualResults, setManualResults] = useState("");
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const addManual = () => {
    const email = manualEmail.trim().toLowerCase();
    if (!emailRe.test(email)) return toast.error("Συμπλήρωσε έγκυρο email.");
    const outcome = importSeminarParticipants(bookingId,title,date,[{name:manualName.trim(),email,phone:manualPhone.trim(),newsletter:manualConsent}]);
    setManualResults(`Νέα πρόσωπα: ${outcome.created} · Ήδη στο μητρώο: ${outcome.reused} · Μη έγκυρα: ${outcome.skipped}`);
    setManualName("");setManualEmail("");setManualPhone("");setManualConsent(false);
    toast.success("Η συμμετοχή ενημερώθηκε στο Μητρώο και στη λίστα της δράσης.");
  };
  const bulkPreview = useMemo(() => bulkText.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map(line=>{
    // Δεκτό: email ή ονοματεπώνυμο;email;τηλέφωνο (επίσης tab ή κόμμα).
    const fields = line.includes("\t") ? line.split("\t") : line.includes(";") ? line.split(";") : line.split(",");
    const parts=fields.map(x=>x.trim());
    const mailIndex=parts.findIndex(x=>emailRe.test(x));
    if(mailIndex<0)return {name:"",email:"",phone:"",newsletter:false,invalid:line};
    return {name:parts.filter((_,i)=>i!==mailIndex && !/^\+?[0-9() -]{7,}$/.test(parts[i])).join(" ").trim(),email:parts[mailIndex].toLowerCase(),phone:parts.find((x,i)=>i!==mailIndex && /^\+?[0-9() -]{7,}$/.test(x))||"",newsletter:bulkConsent,invalid:""};
  }),[bulkText,bulkConsent]);
  const bulkUnique = useMemo(()=>Array.from(new Map(bulkPreview.filter(p=>p.email).map(p=>[p.email,p])).values()),[bulkPreview]);
  const addBulk=()=>{
    if(!bulkUnique.length)return toast.error("Δεν βρέθηκαν έγκυρες διευθύνσεις email.");
    const result=importSeminarParticipants(bookingId,title,date,bulkUnique);
    setManualResults(`${bulkPreview.length} γραμμές · ${bulkUnique.length} μοναδικά email · Νέα πρόσωπα: ${result.created} · Ήδη στο μητρώο: ${result.reused}`);
    setBulkText("");setBulkConsent(false);
    toast.success("Οι συμμετέχοντες προστέθηκαν στη δράση και στο Μητρώο.");
  };
  const roster = useMemo(() => {
    const ids = new Set(personActivities.filter((a) => a.eventId === bookingId).map((a) => a.personId));
    return people.filter((p) => ids.has(p.id)).sort((a, b) => a.name.localeCompare(b.name, "el"));
  }, [personActivities, people, bookingId]);
  const current = agreements.find((a) => a.seminarId === seminarId && a.personId === selected);
  const collected = (current?.received || []).reduce((sum, p) => sum + p.amount, 0);
  const totalAgreed = current?.total ?? initialFee;
  const totalCollected = roster.reduce((sum,p) => sum + (agreements.find(a=>a.seminarId===seminarId && a.personId===p.id)?.received || []).reduce((x,r)=>x+r.amount,0),0);
  const overdue = agreements.flatMap((a) => a.seminarId !== seminarId ? [] : a.installments.filter((i)=>i.due && i.due < today() && a.received.reduce((sum,p)=>sum+p.amount,0) < a.total).map(i=>({a,i}))).length;
  const editItem = (id: string, field: "amount"|"due", value: string, base: Installment[], setter: (a: Installment[]) => void) => setter(base.map(i=>i.id===id ? { ...i, [field]:field==="amount"?Number(value):value } : i));
  const usePerson = (id: string) => {
    setSelected(id);
    const existing = agreements.find(a=>a.seminarId===seminarId && a.personId===id);
    setTotal(String(existing?.total ?? initialFee));
    setSpecial(Boolean(existing && existing.total !== (initialFee)));
    setInstallments((existing?.installments || rule?.installments || [newInstallment(initialFee)]).map(i=>({...i})));
    setNotes(existing?.notes || ""); setPaidAmount(""); setPaidReference("");
  };
  const save = () => {
    if (!selected) return;
    const t = special ? Number(total) : (initialFee);
    if (!Number.isFinite(t) || t < 0 || installments.some(i => !Number.isFinite(i.amount) || i.amount < 0 || !i.due)) return toast.error("Έλεγξε τα ποσά και τις ημερομηνίες.");
    if (Math.abs(installments.reduce((sum,i)=>sum+i.amount,0)-t) > .01) return toast.error("Το άθροισμα δόσεων πρέπει να ισούται με τη συμφωνία.");
    const existing = agreements.find(a=>a.seminarId===seminarId && a.personId===selected);
    const agreement: SeminarAgreement = { id: existing?.id || `agreement-${seminarId}-${selected}`, seminarId, personId: selected, total:t, installments, received:existing?.received || [], notes, updatedAt:today() };
    saveAgreement(agreement); toast.success("Η συμφωνία αποθηκεύτηκε.");
  };
  const addPayment = () => {
    if (!current) return toast.error("Αποθήκευσε πρώτα τη συμφωνία.");
    const amount = Number(paidAmount);
    if (!Number.isFinite(amount) || amount<=0 || !paidDate) return toast.error("Συμπλήρωσε έγκυρη πληρωμή.");
    saveAgreement({...current, received:[...current.received, {id:crypto.randomUUID(), amount, paidAt:paidDate, method:paidMethod, reference:paidReference}]});
    setPaidAmount("");setPaidReference("");toast.success("Η πληρωμή προστέθηκε στο ιστορικό.");
  };
  async function importExcel(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value=""; if (!file) return;
    try {
      const workbook = XLSX.read(await file.arrayBuffer(),{type:"array"});
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string,unknown>>(sheet,{defval:""});
      const parsed = rows.map(row=>({
        name:read(row,["Ονοματεπώνυμο","Ονομα","Full Name","Name"]),
        email:read(row,["Email","E-mail","Ηλεκτρονικό ταχυδρομείο"]).toLowerCase(),
        phone:read(row,["Τηλέφωνο","Κινητό","Phone"]),
        newsletter:parseConsent(read(row,["newsletter","Ενημερωτικό δελτίο","Συναίνεση","Ενημερώσεις","Επιθυμώ να λαμβάνω ενημερώσεις για επόμενες δράσεις και σεμινάρια του Συλλόγου."]))
      }));
      setPreview(parsed);
      if (!parsed.length) toast.error("Δεν εντοπίστηκαν γραμμές δεδομένων.");
    } catch {toast.error("Το Excel/CSV δεν διαβάστηκε.");}
  }
  const runImport=()=>{
    setImporting(true);
    try {const result=importSeminarParticipants(bookingId,title,date,preview);
      toast.success(`Νέοι: ${result.created} · Υπάρχοντες: ${result.reused} · Παραλείφθηκαν: ${result.skipped}`);setPreview([]);
    } catch (e) {toast.error(e instanceof Error ? e.message : "Αποτυχία εισαγωγής.");}
    finally {setImporting(false);}
  };
  return <div className="space-y-4 border-t pt-4">
    <h3 className="text-lg font-semibold">Οικονομικές συμφωνίες και συμμετοχές</h3>
    <div className="grid gap-3 sm:grid-cols-3">
      <Card className="p-3"><p className="text-xs text-muted-foreground">Τιμή από Ημερολόγιο</p><p className="text-xl font-semibold">{euro(initialFee)}</p></Card>
      <Card className="p-3"><p className="text-xs text-muted-foreground">Καταχωρισμένες εισπράξεις συμφωνιών</p><p className="text-xl font-semibold">{euro(totalCollected)}</p></Card>
      <Card className="p-3"><p className="text-xs text-muted-foreground">Ληξιπρόθεσμες προγραμματισμένες δόσεις (προς έλεγχο)</p><p className="text-xl font-semibold">{overdue}</p></Card>
    </div>
    <Button variant="outline" onClick={()=>setEditRule(!editRule)}>Ρυθμίσεις δόσεων (τιμή από Ημερολόγιο)</Button>
    {editRule && <Card className="space-y-3 p-4">
      <p className="text-sm text-muted-foreground">Η βασική τιμή ({euro(initialFee)}) ενημερώνεται μόνο από το Ημερολόγιο Συλλόγου. Εδώ ορίζεις αποκλειστικά το πρότυπο των δόσεων.</p>
      <p className="text-sm font-semibold">Πρότυπο δόσεων</p>
      {template.map((i,n)=><div key={i.id} className="flex flex-wrap items-center gap-2"><span className="text-xs">{n+1}.</span><Input className="w-28" type="number" min="0" value={i.amount} onChange={e=>editItem(i.id,"amount",e.target.value,template,setTemplate)}/><Input className="w-44" type="date" value={i.due} onChange={e=>editItem(i.id,"due",e.target.value,template,setTemplate)}/><Button size="sm" variant="outline" onClick={()=>setTemplate(v=>v.filter(x=>x.id!==i.id))}>Αφαίρεση</Button></div>)}
      <Button variant="outline" onClick={()=>setTemplate(v=>[...v,newInstallment()])}>+ Δόση</Button>
      <Button onClick={()=>{const t=Number(defaultTotal);if(!Number.isFinite(t)||t<0||Math.abs(template.reduce((a,i)=>a+i.amount,0)-t)>.01||template.some(i=>!i.due)){toast.error("Το άθροισμα των δόσεων πρέπει να ισούται με τη βασική τιμή και να έχουν ημερομηνίες.");return;}savePriceRule({id:`price-${seminarId}`,seminarId,defaultTotal:t,installments:template,updatedAt:today()});setEditRule(false);toast.success("Αποθηκεύτηκε το πρότυπο. Οι παλιές ατομικές συμφωνίες δεν αλλάζουν.");}}>Αποθήκευση προτύπου</Button>
    </Card>}
    <Card className="space-y-3 p-4">
      <h4 className="font-semibold">Προσθήκη συμμετέχοντα από τη Γραμματεία</h4>
      <p className="text-xs text-muted-foreground">Αν υπάρχει ήδη στο Μητρώο, ενημερώνεται η ίδια καρτέλα και προστίθεται σε αυτή τη δράση. Η λίστα της δράσης ενημερώνει αυτόματα και τον Newsletter Editor. Η επιλογή newsletter δεν προεπιλέγεται.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input aria-label="Ονοματεπώνυμο συμμετέχοντα" placeholder="Ονοματεπώνυμο" value={manualName} onChange={e=>setManualName(e.target.value)}/>
        <Input aria-label="Email συμμετέχοντα" placeholder="Email (υποχρεωτικό)" type="email" value={manualEmail} onChange={e=>setManualEmail(e.target.value)}/>
        <Input aria-label="Τηλέφωνο συμμετέχοντα" placeholder="Τηλέφωνο" value={manualPhone} onChange={e=>setManualPhone(e.target.value)}/>
      </div>
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={manualConsent} onCheckedChange={v=>setManualConsent(v===true)}/> Υπάρχει ρητή συναίνεση για newsletter</label>
      <Button onClick={addManual}>+ Προσθήκη στη συγκεκριμένη δράση</Button>
    </Card>
    <Card className="space-y-3 p-4">
      <h4 className="font-semibold">Μαζική επικόλληση συμμετεχόντων</h4>
      <p className="text-xs text-muted-foreground">Κάθε γραμμή: email ή Ονοματεπώνυμο; email; τηλέφωνο. Δέχεται και επικόλληση από στήλες Excel με tab. Το ίδιο email εισάγεται μόνο μία φορά στη δράση.</p>
      <textarea aria-label="Επικόλληση συμμετεχόντων" className="w-full min-h-28 rounded-md border bg-background p-2 text-sm" placeholder={"Άννα Παπαδοπούλου; anna@example.com; 6900000000\nnikos@example.com"} value={bulkText} onChange={e=>setBulkText(e.target.value)}/>
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={bulkConsent} onCheckedChange={v=>setBulkConsent(v===true)}/> Έχω επιβεβαιωμένη συναίνεση newsletter για ΟΛΟΥΣ τους παραπάνω</label>
      <p className="text-xs">{bulkPreview.length} γραμμές · {bulkUnique.length} μοναδικά έγκυρα email · {bulkPreview.filter(x=>x.invalid).length} μη αναγνωρίσιμες γραμμές</p>
      {bulkPreview.some(x=>x.invalid)&&<p className="text-xs text-destructive">Οι γραμμές χωρίς έγκυρο email θα παραλειφθούν. Έλεγξέ τες πριν την εισαγωγή.</p>}
      <Button disabled={!bulkUnique.length} onClick={addBulk}>Προσθήκη {bulkUnique.length} συμμετεχόντων</Button>
      {manualResults&&<p className="text-xs text-muted-foreground" role="status">{manualResults}</p>}
    </Card>
    <Card className="space-y-3 p-4">
      <h4 className="font-semibold">Εισαγωγή συμμετεχόντων από Excel / CSV</h4>
      <p className="text-sm text-muted-foreground">Οι συμμετέχοντες ταυτοποιούνται με email. Κενή συναίνεση newsletter σημαίνει χωρίς συγκατάθεση. Εισαγωγή από την πρώτη καρτέλα του αρχείου.</p>
      <Input type="file" accept=".xlsx,.xls,.csv" onChange={e=>void importExcel(e)}/>
      {preview.length>0 && <div className="space-y-2"><p className="text-sm">Προεπισκόπηση {preview.length} γραμμών · {preview.filter(p=>p.newsletter===true).length} με ρητό ΝΑΙ για newsletter</p><div className="max-h-36 overflow-auto text-xs">{preview.slice(0,8).map((p,i)=><p key={i}>{p.name} · {p.email} · newsletter: {p.newsletter===true?"Ναι":p.newsletter===false?"Όχι":"Άγνωστο"}</p>)}</div><Button disabled={importing} onClick={runImport}>Επιβεβαίωση εισαγωγής</Button></div>}
    </Card>
    <div className="space-y-2"><Label>Συμμετέχων ({roster.length})</Label><select className="w-full rounded-md border bg-background p-2 text-sm" value={selected} onChange={e=>usePerson(e.target.value)}><option value="">Επιλογή συμμετέχοντα…</option>{roster.map(p=><option key={p.id} value={p.id}>{p.name} — {p.email}</option>)}</select></div>
    {selected && <Card className="space-y-3 p-4">
      <h4 className="font-semibold">Ατομική συμφωνία</h4>
      <Label className="flex items-center gap-2"><Checkbox checked={special} onCheckedChange={v=>{setSpecial(v===true);if(v!==true){setTotal(String(initialFee));setInstallments((rule?.installments || [newInstallment(initialFee)]).map(i=>({...i})));}}}/> Ειδική τιμή / προσωπικό πρόγραμμα δόσεων</Label>
      {special && <><Label>Συμφωνημένο ποσό (€)</Label><Input type="number" min="0" value={total} onChange={e=>setTotal(e.target.value)}/></>}
      <p className="text-sm font-medium">Δόσεις — άλλαξε ποσό και ημερομηνία</p>
      {installments.map((i,n)=><div className="flex flex-wrap items-center gap-2" key={i.id}><span className="text-xs">{n+1}.</span><Input className="w-28" type="number" min="0" value={i.amount} onChange={e=>editItem(i.id,"amount",e.target.value,installments,setInstallments)}/><Input className="w-44" type="date" value={i.due} onChange={e=>editItem(i.id,"due",e.target.value,installments,setInstallments)}/><Button size="sm" variant="outline" onClick={()=>setInstallments(v=>v.filter(x=>x.id!==i.id))}>Αφαίρεση</Button></div>)}
      <Button variant="outline" onClick={()=>setInstallments(v=>[...v,newInstallment()])}>+ Προσθήκη δόσης</Button>
      <p className="text-xs text-muted-foreground">Σύνολο δόσεων: {euro(installments.reduce((a,i)=>a+i.amount,0))} · Συμφωνία: {euro(special?Number(total):(initialFee))}</p>
      <Label>Σημειώσεις συμφωνίας</Label><Input value={notes} onChange={e=>setNotes(e.target.value)}/>
      <Button onClick={save}>Αποθήκευση συμφωνίας και ημερομηνιών</Button>
      {current && <div className="space-y-2 border-t pt-3"><h4 className="font-semibold">Καταγραφή πληρωμής</h4><p className="text-sm">Καταβλήθηκαν: {euro(collected)} / {euro(totalAgreed)} · Υπόλοιπο: {euro(Math.max(0,totalAgreed-collected))}</p><div className="grid gap-2 sm:grid-cols-2"><Input aria-label="Ποσό πληρωμής" placeholder="Ποσό €" type="number" min="0" value={paidAmount} onChange={e=>setPaidAmount(e.target.value)}/><Input aria-label="Ημερομηνία πληρωμής" type="date" value={paidDate} onChange={e=>setPaidDate(e.target.value)}/><Input aria-label="Τρόπος πληρωμής" placeholder="Τρόπος πληρωμής" value={paidMethod} onChange={e=>setPaidMethod(e.target.value)}/><Input aria-label="Αριθμός παραστατικού" placeholder="Αριθμός απόδειξης / αναφορά" value={paidReference} onChange={e=>setPaidReference(e.target.value)}/></div><Button onClick={addPayment}>+ Καταχώριση είσπραξης</Button>{current.received.map(p=><p key={p.id} className="text-xs">{p.paidAt} · {euro(p.amount)} · {p.method} · {p.reference}</p>)}</div>}
    </Card>}
    <p className="text-xs text-muted-foreground">Οι υπενθυμίσεις ληξιπρόθεσμων δόσεων εμφανίζονται εδώ για έλεγχο όταν ανοίγει η εφαρμογή. Προγραμματισμένες ειδοποιήσεις email απαιτούν ξεχωριστό ασφαλή server μηχανισμό. Δεν υπάρχει ακόμη ασφαλής αποθήκευση PDF.</p>
  </div>;
}
