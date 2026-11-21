import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useClub } from "@/lib/club-data";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function FreeActionParticipants({bookingId,title,date}:{bookingId:string;title:string;date:string}) {
 const {importSeminarParticipants}=useClub();
 const [name,setName]=useState("");const [email,setEmail]=useState("");const [phone,setPhone]=useState("");const [consent,setConsent]=useState(false);
 const [bulk,setBulk]=useState("");const [bulkConsent,setBulkConsent]=useState(false);
 const parsed=useMemo(()=>bulk.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(line=>{
  const parts=(line.includes("\t")?line.split("\t"):line.includes(";")?line.split(";"):line.split(",")).map(x=>x.trim());
  const idx=parts.findIndex(x=>EMAIL.test(x));
  return idx<0?null:{email:parts[idx].toLowerCase(),name:parts.filter((x,i)=>i!==idx&&!/^\+?[0-9() -]{7,}$/.test(x)).join(" "),phone:parts.find((x,i)=>i!==idx&&/^\+?[0-9() -]{7,}$/.test(x))||"",newsletter:bulkConsent};
 }).filter((x):x is NonNullable<typeof x>=>x!==null),[bulk,bulkConsent]);
 const unique=useMemo(()=>Array.from(new Map(parsed.map(p=>[p.email,p])).values()),[parsed]);
 return <Card className="p-4 space-y-3">
  <h3 className="font-semibold">Συμμετοχές δωρεάν δράσης — Γραμματεία</h3>
  <p className="text-xs text-muted-foreground">Προσθήκη στη συγκεκριμένη δράση, στο Μητρώο και στη λίστα του Newsletter Editor. Χωρίς οικονομική καρτέλα. Το newsletter απαιτεί ξεχωριστή συναίνεση.</p>
  <div className="grid gap-2 sm:grid-cols-3"><Input aria-label="Ονοματεπώνυμο" placeholder="Ονοματεπώνυμο" value={name} onChange={e=>setName(e.target.value)}/><Input type="email" aria-label="Email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/><Input aria-label="Τηλέφωνο" placeholder="Τηλέφωνο" value={phone} onChange={e=>setPhone(e.target.value)}/></div>
  <label className="flex gap-2 items-center text-sm"><Checkbox checked={consent} onCheckedChange={v=>setConsent(v===true)}/> Ρητή συγκατάθεση newsletter</label>
  <Button onClick={()=>{if(!EMAIL.test(email.trim()))return toast.error("Μη έγκυρο email.");const r=importSeminarParticipants(bookingId,title,date,[{name,email:email.trim().toLowerCase(),phone,newsletter:consent}]);setName("");setEmail("");setPhone("");setConsent(false);toast.success(`Συμμετοχή αποθηκεύτηκε · ${r.created} νέος / ${r.reused} υπάρχων`);}}>+ Προσθήκη συμμετέχοντα</Button>
  <textarea className="w-full min-h-24 rounded-md border bg-background p-2 text-sm" aria-label="Μαζική επικόλληση συμμετεχόντων" placeholder={"Όνομα; email@example.com; τηλέφωνο\nemail2@example.com"} value={bulk} onChange={e=>setBulk(e.target.value)}/>
  <label className="flex gap-2 items-center text-sm"><Checkbox checked={bulkConsent} onCheckedChange={v=>setBulkConsent(v===true)}/> Υπάρχει ρητή συγκατάθεση newsletter για όλους</label>
  <p className="text-xs text-muted-foreground">{unique.length} μοναδικά έγκυρα email. Οι υπόλοιπες γραμμές δεν εισάγονται.</p>
  <Button variant="outline" disabled={!unique.length} onClick={()=>{const r=importSeminarParticipants(bookingId,title,date,unique);toast.success(`Έγινε εισαγωγή ${r.created+r.reused} συμμετοχών.`);setBulk("");setBulkConsent(false);}}>Μαζική προσθήκη</Button>
 </Card>;
}
