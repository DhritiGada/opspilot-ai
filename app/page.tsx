"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import {
  AlertTriangle, Archive, CheckCircle2, ChevronLeft, Clock3, Database,
  Download, FileText, Filter, Pencil, Play, Plus, Search, ShieldCheck,
  Sparkles, Upload, X
} from "lucide-react";

type Priority = "High" | "Medium" | "Low";
type Role = "Admin" | "Analyst" | "Viewer";
type Status = "New" | "Needs Review" | "In Progress" | "Modified" | "Approved" | "Rejected" | "Resolved" | "Archived";
type AiMode = "live" | "demo" | "seed" | "none";

type Triage = {
  category:string;
  priority:Priority;
  confidence:number;
  summary:string;
  action:string;
  owner:string;
};

type CaseRecord = Triage & {
  id:string;
  title:string;
  description:string;
  status:Status;
  createdAt:string;
  updatedAt:string;
  aiMode:AiMode;
  customerId:string;
  transactionId:string;
  amount:number | null;
  currency:string;
  processorRef:string;
  paymentStatus:string;
  reconciliationStatus:string;
  dueDate:string;
};

type Audit = {
  id:string;
  caseId:string;
  action:string;
  note:string;
  actor:string;
  at:string;
  changes?:Record<string,{from:string;to:string}>;
};

const seed:CaseRecord[] = [
  {
    id:"OP-1042",
    title:"Payment processed but balance remains open",
    description:"Customer payment completed but the account still shows an outstanding balance. Customer contacted support twice and needs resolution before tomorrow.",
    category:"Payment reconciliation",
    priority:"High",
    status:"Needs Review",
    confidence:92,
    summary:"Payment appears successful while the account state still shows an outstanding balance. Two prior contacts and a next-day deadline increase customer impact.",
    action:"Verify the transaction record, reconcile account state, then confirm the corrected balance with the customer.",
    owner:"Payments Operations",
    createdAt:"2026-09-30T09:15:00.000Z",
    updatedAt:"2026-09-30T09:15:00.000Z",
    aiMode:"seed",
    customerId:"CUS-4821",
    transactionId:"TXN-889201",
    amount:428.50,
    currency:"USD",
    processorRef:"PAY-77A1",
    paymentStatus:"Processed",
    reconciliationStatus:"Mismatch",
    dueDate:"2026-10-01"
  },
  {
    id:"OP-1041",
    title:"User cannot access account after role change",
    description:"Access stopped after an internal role update.",
    category:"Account access",
    priority:"Medium",
    status:"In Progress",
    confidence:87,
    summary:"Recent role change may have left authorization claims out of sync with the user's current permissions.",
    action:"Validate identity and role mapping, refresh access policy, then retest sign-in.",
    owner:"Identity Operations",
    createdAt:"2026-09-30T08:40:00.000Z",
    updatedAt:"2026-09-30T08:40:00.000Z",
    aiMode:"seed",
    customerId:"CUS-7742",
    transactionId:"",
    amount:null,
    currency:"USD",
    processorRef:"",
    paymentStatus:"",
    reconciliationStatus:"Not applicable",
    dueDate:"2026-10-02"
  },
  {
    id:"OP-1039",
    title:"Customer reports possible duplicate charge",
    description:"Customer sees two charges for the same amount after retrying checkout.",
    category:"Payment risk",
    priority:"High",
    status:"Needs Review",
    confidence:89,
    summary:"Two transaction references are present for the same amount within a short interval. Financial impact requires review.",
    action:"Compare processor IDs and idempotency keys before refunding or reversing either transaction.",
    owner:"Payments Operations",
    createdAt:"2026-09-29T14:05:00.000Z",
    updatedAt:"2026-09-29T14:05:00.000Z",
    aiMode:"seed",
    customerId:"CUS-1138",
    transactionId:"TXN-550032",
    amount:149.99,
    currency:"USD",
    processorRef:"PAY-9F02",
    paymentStatus:"Possible duplicate",
    reconciliationStatus:"Exception",
    dueDate:"2026-10-01"
  }
];

function deterministicTriage(title:string, description:string):Triage {
  const text=(title+" "+description).toLowerCase();
  if(/payment|charge|refund|balance|transaction/.test(text)) {
    return {
      category:/duplicate|twice|double/.test(text)?"Payment risk":"Payment reconciliation",
      priority:"High",
      confidence:90,
      summary:"The case contains a financial-state mismatch or payment-risk signal that should be reviewed before any customer-facing correction.",
      action:"Validate processor and account records, reconcile identifiers and state, then document the confirmed outcome before taking financial action.",
      owner:"Payments Operations"
    };
  }
  if(/login|access|role|permission|account/.test(text)) {
    return {
      category:"Account access",
      priority:"Medium",
      confidence:86,
      summary:"The case indicates an access or authorization issue that may involve identity, role, or permission state.",
      action:"Verify identity and current role mapping, inspect authorization state, then retest access after an approved correction.",
      owner:"Identity Operations"
    };
  }
  if(/duplicate|import|record|data|sync/.test(text)) {
    return {
      category:"Data quality",
      priority:"Low",
      confidence:84,
      summary:"The case appears related to record quality, synchronization, or duplicate data and needs validation before cleanup.",
      action:"Compare source and target records, identify the canonical record, then validate dependencies before merging or correcting data.",
      owner:"Data Operations"
    };
  }
  return {
    category:"General operations",
    priority:"Medium",
    confidence:72,
    summary:"The case does not strongly match a specialized queue. The recommendation is intentionally lower confidence and should receive closer human review.",
    action:"Review the case context, confirm the correct operational owner, and document the next action before execution.",
    owner:"Operations Triage"
  };
}

function csvCell(value:unknown){
  const s=String(value??"");
  return '"' + s.replace(/"/g,'""') + '"';
}

function downloadText(name:string, text:string, type="text/csv"){
  const blob=new Blob([text],{type});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=name;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsvLine(line:string){
  const out:string[]=[];
  let value="";
  let quoted=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch==='"' && quoted && line[i+1]==='"'){value+='"';i++;continue;}
    if(ch==='"'){quoted=!quoted;continue;}
    if(ch==="," && !quoted){out.push(value);value="";continue;}
    value+=ch;
  }
  out.push(value);
  return out.map(v=>v.trim());
}

export default function Home(){
  const [cases,setCases]=useState<CaseRecord[]>(seed);
  const [audits,setAudits]=useState<Audit[]>([]);
  const [selectedId,setSelectedId]=useState(seed[0].id);
  const [view,setView]=useState<"queue"|"audit"|"data">("queue");
  const [auditCaseId,setAuditCaseId]=useState<string|null>(null);
  const [role,setRole]=useState<Role>("Admin");
  const [hydrated,setHydrated]=useState(false);

  const [query,setQuery]=useState("");
  const [priorityFilter,setPriorityFilter]=useState("All");
  const [ownerFilter,setOwnerFilter]=useState("All");
  const [categoryFilter,setCategoryFilter]=useState("All");
  const [sourceFilter,setSourceFilter]=useState("All");
  const [sortBy,setSortBy]=useState("priority");

  const [showNew,setShowNew]=useState(false);
  const [triaging,setTriaging]=useState(false);
  const [note,setNote]=useState("");
  const [title,setTitle]=useState("");
  const [description,setDescription]=useState("");

  const [editingRecommendation,setEditingRecommendation]=useState(false);
  const [editingCase,setEditingCase]=useState(false);
  const [draft,setDraft]=useState<Partial<CaseRecord>>({});
  const fileRef=useRef<HTMLInputElement|null>(null);

  useEffect(()=>{
    try{
      const storedCases=localStorage.getItem("opspilot-v4-cases");
      const storedAudits=localStorage.getItem("opspilot-v4-audits");
      if(storedCases)setCases(JSON.parse(storedCases));
      if(storedAudits)setAudits(JSON.parse(storedAudits));
    }catch{}
    finally{setHydrated(true);}
  },[]);

  useEffect(()=>{if(hydrated)localStorage.setItem("opspilot-v4-cases",JSON.stringify(cases));},[cases,hydrated]);
  useEffect(()=>{if(hydrated)localStorage.setItem("opspilot-v4-audits",JSON.stringify(audits));},[audits,hydrated]);

  const terminal=(status:Status)=>["Approved","Rejected","Resolved","Archived"].includes(status);
  const activeCases=useMemo(()=>cases.filter(c=>!terminal(c.status)),[cases]);
  const selected=activeCases.find(c=>c.id===selectedId)||activeCases[0];

  useEffect(()=>{
    if(activeCases.length && !activeCases.some(c=>c.id===selectedId))setSelectedId(activeCases[0].id);
  },[activeCases,selectedId]);

  const owners=useMemo(()=>Array.from(new Set(cases.map(c=>c.owner).filter(Boolean))).sort(),[cases]);
  const categories=useMemo(()=>Array.from(new Set(cases.map(c=>c.category).filter(Boolean))).sort(),[cases]);

  const filtered=useMemo(()=>{
    const rank:Record<Priority,number>={High:0,Medium:1,Low:2};
    const q=query.trim().toLowerCase();
    return activeCases.filter(c=>{
      const matchesQ=!q||(c.id+" "+c.title+" "+c.category+" "+c.owner+" "+c.customerId+" "+c.transactionId).toLowerCase().includes(q);
      return matchesQ
        &&(priorityFilter==="All"||c.priority===priorityFilter)
        &&(ownerFilter==="All"||c.owner===ownerFilter)
        &&(categoryFilter==="All"||c.category===categoryFilter)
        &&(sourceFilter==="All"||c.aiMode===sourceFilter);
    }).sort((a,b)=>{
      if(sortBy==="priority")return rank[a.priority]-rank[b.priority];
      if(sortBy==="due")return (a.dueDate||"9999").localeCompare(b.dueDate||"9999");
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  },[activeCases,query,priorityFilter,ownerFilter,categoryFilter,sourceFilter,sortBy]);

  const high=activeCases.filter(c=>c.priority==="High").length;
  const exceptionAmount=activeCases.filter(c=>c.reconciliationStatus==="Exception"||c.reconciliationStatus==="Mismatch").reduce((sum,c)=>sum+(c.amount||0),0);
  const liveAiCases=cases.filter(c=>c.aiMode==="live");
  const aiReviewed=liveAiCases.filter(c=>["Approved","Rejected","Modified","Resolved"].includes(c.status));
  const aiAccepted=aiReviewed.filter(c=>["Approved","Resolved"].includes(c.status)).length;
  const aiAcceptance=aiReviewed.length?Math.round(aiAccepted/aiReviewed.length*100):null;

  const selectedAudits=audits.filter(a=>a.caseId===selected?.id);
  const auditCase=auditCaseId?cases.find(c=>c.id===auditCaseId):undefined;
  const auditCaseEvents=auditCaseId?audits.filter(a=>a.caseId===auditCaseId):[];

  const actor=role+" Demo User";
  const addAudit=(caseId:string,action:string,noteText:string,changes?:Audit["changes"])=>{
    setAudits(v=>[{id:crypto.randomUUID(),caseId,action,note:noteText,actor,at:new Date().toISOString(),changes},...v]);
  };

  const updateCase=(id:string,patch:Partial<CaseRecord>)=>{
    setCases(v=>v.map(c=>c.id===id?{...c,...patch,updatedAt:new Date().toISOString()}:c));
  };

  const createCase=async()=>{
    if(!title.trim()||!description.trim()||triaging||role==="Viewer")return;
    setTriaging(true);
    let rec=deterministicTriage(title,description);
    let aiMode:AiMode="demo";
    try{
      const response=await fetch("/api/triage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,description})});
      if(response.ok){
        const data=await response.json();
        rec=data.result;
        aiMode="live";
      }
    }catch{}
    const nextNum=Math.max(...cases.map(c=>Number(c.id.replace("OP-",""))||0),1042)+1;
    const now=new Date().toISOString();
    const record:CaseRecord={
      id:"OP-"+nextNum,
      title:title.trim(),
      description:description.trim(),
      status:"Needs Review",
      createdAt:now,
      updatedAt:now,
      aiMode,
      customerId:"",
      transactionId:"",
      amount:null,
      currency:"USD",
      processorRef:"",
      paymentStatus:"",
      reconciliationStatus:"Pending review",
      dueDate:"",
      ...rec
    };
    setCases(v=>[record,...v]);
    addAudit(record.id,"Case created",aiMode==="live"?"Case created and triaged by live AI.":"Case created with deterministic fallback triage.");
    setSelectedId(record.id);
    setTitle("");
    setDescription("");
    setShowNew(false);
    setTriaging(false);
  };

  const runAi=async(record:CaseRecord)=>{
    if(role==="Viewer"||triaging)return;
    setTriaging(true);
    let rec=deterministicTriage(record.title,record.description);
    let aiMode:AiMode="demo";
    try{
      const response=await fetch("/api/triage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:record.title,description:record.description})});
      if(response.ok){const data=await response.json();rec=data.result;aiMode="live";}
    }catch{}
    updateCase(record.id,{...rec,aiMode,status:"Needs Review"});
    addAudit(record.id,"AI triage generated",aiMode==="live"?"Live model recommendation generated.":"AI unavailable; deterministic fallback generated.");
    setTriaging(false);
  };

  const transition=(record:CaseRecord,next:Status)=>{
    if(role==="Viewer"||record.status===next)return;
    const previous=record.status;
    updateCase(record.id,{status:next});
    addAudit(record.id,"Status changed",previous+" → "+next,{status:{from:previous,to:next}});
    if(terminal(next)){
      const nextCase=activeCases.find(c=>c.id!==record.id);
      setSelectedId(nextCase?.id||"");
    }
    setNote("");
  };

  const beginCaseEdit=(record:CaseRecord)=>{
    if(role==="Viewer")return;
    setDraft({...record});
    setEditingCase(true);
    setEditingRecommendation(false);
  };

  const beginRecommendationEdit=(record:CaseRecord)=>{
    if(role==="Viewer")return;
    setDraft({...record});
    setEditingRecommendation(true);
    setEditingCase(false);
  };

  const saveDraft=(record:CaseRecord,kind:"case"|"recommendation")=>{
    if(role==="Viewer")return;
    const fields=kind==="case"
      ? ["title","description","owner","priority","category","customerId","transactionId","amount","currency","processorRef","paymentStatus","reconciliationStatus","dueDate"]
      : ["summary","category","priority","owner","action"];
    const changes:Record<string,{from:string;to:string}>={};
    const patch:Partial<CaseRecord>={};
    fields.forEach(key=>{
      const k=key as keyof CaseRecord;
      const before=String(record[k]??"");
      const after=String(draft[k]??"");
      if(before!==after){
        changes[key]={from:before,to:after};
        (patch as any)[key]=draft[k];
      }
    });
    if(!Object.keys(changes).length)return;
    if(kind==="recommendation")patch.status="Modified";
    updateCase(record.id,patch);
    addAudit(record.id,kind==="case"?"Case edited":"AI recommendation modified",note.trim()||"Saved reviewer changes.",changes);
    setEditingCase(false);
    setEditingRecommendation(false);
    setNote("");
  };

  const archiveCase=(record:CaseRecord)=>{
    if(role!=="Admin")return;
    updateCase(record.id,{status:"Archived"});
    addAudit(record.id,"Case archived","Archived by admin.");
    const nextCase=activeCases.find(c=>c.id!==record.id);
    setSelectedId(nextCase?.id||"");
  };

  const resetDemo=()=>{
    if(role!=="Admin")return;
    setCases(seed);
    setAudits([]);
    setSelectedId(seed[0].id);
    setAuditCaseId(null);
    setView("queue");
    localStorage.removeItem("opspilot-v4-cases");
    localStorage.removeItem("opspilot-v4-audits");
  };

  const exportCases=()=>{
    const header=["id","title","description","status","priority","category","owner","customer_id","transaction_id","amount","currency","processor_ref","payment_status","reconciliation_status","due_date","ai_source","ai_confidence"];
    const rows=(view==="queue"?filtered:cases).map(c=>[
      c.id,c.title,c.description,c.status,c.priority,c.category,c.owner,c.customerId,c.transactionId,c.amount??"",c.currency,c.processorRef,c.paymentStatus,c.reconciliationStatus,c.dueDate,c.aiMode,c.confidence
    ]);
    downloadText("opspilot-cases.csv",[header,...rows].map(r=>r.map(csvCell).join(",")).join("\n"));
  };

  const exportAudits=()=>{
    const header=["event_id","case_id","action","actor","timestamp","note","changes"];
    const rows=audits.map(a=>[a.id,a.caseId,a.action,a.actor,a.at,a.note,a.changes?JSON.stringify(a.changes):""]);
    downloadText("opspilot-audit-log.csv",[header,...rows].map(r=>r.map(csvCell).join(",")).join("\n"));
  };

  const downloadTemplate=()=>{
    const header=["title","description","customer_id","transaction_id","amount","currency","processor_ref","payment_status","reconciliation_status","due_date"];
    const sample=["Duplicate charge after checkout retry","Customer reports two identical charges after retrying checkout.","CUS-1001","TXN-1001","125.00","USD","PAY-EXAMPLE","Possible duplicate","Exception","2026-10-03"];
    downloadText("opspilot-billing-import-template.csv",[header,sample].map(r=>r.map(csvCell).join(",")).join("\n"));
  };

  const importCsv=async(file:File)=>{
    if(role!=="Admin")return;
    const text=await file.text();
    const lines=text.split(/\r?\n/).filter(Boolean);
    if(lines.length<2)return;
    const headers=parseCsvLine(lines[0]).map(h=>h.toLowerCase());
    let accepted=0,rejected=0;
    const created:CaseRecord[]=[];
    lines.slice(1).forEach(line=>{
      const values=parseCsvLine(line);
      const row:Record<string,string>={};
      headers.forEach((h,i)=>row[h]=values[i]||"");
      if(!row.title||!row.description){rejected++;return;}
      const nextNum=Math.max(...cases.map(c=>Number(c.id.replace("OP-",""))||0),1042)+1+accepted;
      const now=new Date().toISOString();
      created.push({
        id:"OP-"+nextNum,
        title:row.title,
        description:row.description,
        status:"New",
        priority:"Medium",
        category:"Untriaged import",
        owner:"Operations Triage",
        confidence:0,
        summary:"Imported record awaiting AI triage and human review.",
        action:"Run AI triage, validate billing fields, and assign the case.",
        createdAt:now,
        updatedAt:now,
        aiMode:"none",
        customerId:row.customer_id||"",
        transactionId:row.transaction_id||"",
        amount:row.amount?Number(row.amount):null,
        currency:row.currency||"USD",
        processorRef:row.processor_ref||"",
        paymentStatus:row.payment_status||"",
        reconciliationStatus:row.reconciliation_status||"Pending review",
        dueDate:row.due_date||""
      });
      accepted++;
    });
    if(created.length){
      setCases(v=>[...created,...v]);
      created.forEach(c=>addAudit(c.id,"Imported","Created from billing CSV import."));
      setSelectedId(created[0].id);
      setView("queue");
    }
    alert("Import complete: "+accepted+" accepted, "+rejected+" rejected.");
    if(fileRef.current)fileRef.current.value="";
  };

  const canMutate=role!=="Viewer";
  const aiSourceLabel=(mode:AiMode)=>mode==="live"?"LIVE AI":mode==="demo"?"DEMO FALLBACK":mode==="seed"?"SEEDED DEMO":"NOT TRIAGED";

  return <main>
    <aside>
      <div className="brand"><div className="logo"><Sparkles size={19}/></div><div><b>OpsPilot AI</b><small>Operations Command Center</small></div></div>
      <nav>
        <button className={view==="queue"?"active":""} onClick={()=>{setView("queue");setAuditCaseId(null)}}>Case queue <em>{activeCases.length}</em></button>
        <button className={view==="audit"?"active":""} onClick={()=>{setView("audit");setAuditCaseId(null)}}>Audit history <em>{audits.length}</em></button>
        <button className={view==="data"?"active":""} onClick={()=>{setView("data");setAuditCaseId(null)}}>Data tools</button>
      </nav>
      <div className="roleBox">
        <label>DEMO ACCESS</label>
        <select value={role} onChange={e=>setRole(e.target.value as Role)}>
          <option>Admin</option><option>Analyst</option><option>Viewer</option>
        </select>
        <small>{role==="Admin"?"Full demo controls":role==="Analyst"?"Case workflow access":"Read-only access"}</small>
      </div>
      <div className="principle"><ShieldCheck size={20}/><b>Human supervised</b><p>AI recommends. Operations teams remain accountable for decisions.</p></div>
    </aside>

    <section className="workspace">
      <header>
        <div>
          <p className="eyebrow">LIVE DEMO · SYNTHETIC DATA · {role.toUpperCase()}</p>
          <h1>{view==="queue"?"Operations Work Queue":view==="data"?"Billing Data Tools":auditCase?"Audit Case "+auditCase.id:"Audit History"}</h1>
          <p>{view==="queue"?"Triage, investigate, review, and close operational exceptions.":view==="data"?"Import billing exceptions, export operational records, and reset the demo dataset.":auditCase?"Read-only historical case record and change trail.":"Inspect every material action taken in the demo."}</p>
        </div>
        {view==="queue"&&canMutate&&<button className="primary" onClick={()=>setShowNew(true)}><Plus size={16}/>New case</button>}
      </header>

      {view==="queue"&&<>
        <div className="metrics five">
          <Metric label="Open cases" value={activeCases.length} sub="Actionable queue"/>
          <Metric label="High priority" value={high} sub="Require attention" alert/>
          <Metric label="Exception value" value={"$"+exceptionAmount.toLocaleString(undefined,{maximumFractionDigits:0})} sub="Active billing exceptions"/>
          <Metric label="Live AI cases" value={liveAiCases.length} sub="Actually model-generated"/>
          <Metric label="AI acceptance" value={aiAcceptance===null?"—":aiAcceptance+"%"} sub="Reviewed live-AI cases"/>
        </div>

        <div className="filterBar">
          <div className="search wide"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search case, customer, transaction..."/></div>
          <Filter size={15}/>
          <select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)}><option>All</option><option>High</option><option>Medium</option><option>Low</option></select>
          <select value={ownerFilter} onChange={e=>setOwnerFilter(e.target.value)}><option>All</option>{owners.map(o=><option key={o}>{o}</option>)}</select>
          <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option>All</option>{categories.map(c=><option key={c}>{c}</option>)}</select>
          <select value={sourceFilter} onChange={e=>setSourceFilter(e.target.value)}><option value="All">All AI sources</option><option value="live">Live AI</option><option value="demo">Fallback</option><option value="seed">Seeded</option><option value="none">Not triaged</option></select>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)}><option value="priority">Priority first</option><option value="due">Due date</option><option value="updated">Recently updated</option></select>
          <button onClick={exportCases}><Download size={14}/>Export view</button>
        </div>

        <div className="grid">
          <div className="queue">
            <div className="queueHead"><div><h2>Active queue</h2><small>{filtered.length} of {activeCases.length} cases</small></div></div>
            {filtered.length===0?<div className="empty"><Search/><h2>No matching cases</h2><p>Change a filter or create/import another case.</p></div>:filtered.map(c=>
              <button key={c.id} onClick={()=>{setSelectedId(c.id);setEditingCase(false);setEditingRecommendation(false);setNote("")}} className={"case "+(selected?.id===c.id?"selected":"")}>
                <div className="caseTop"><b>{c.id}</b><span className={"pill "+c.priority.toLowerCase()}>{c.priority}</span></div>
                <strong>{c.title}</strong>
                <div className="meta"><span>{c.category}</span><span>{c.status}</span></div>
                <div className="caseSignals"><span>{aiSourceLabel(c.aiMode)}</span>{c.amount!==null&&<span>{c.currency} {c.amount.toLocaleString()}</span>}{c.dueDate&&<span>Due {c.dueDate}</span>}</div>
              </button>
            )}
          </div>

          {selected?<div className="detail">
            <div className="detailTop">
              <div><span className="id">{selected.id}</span><h2>{selected.title}</h2><small>{selected.status} · Updated {new Date(selected.updatedAt).toLocaleString()}</small></div>
              <span className={"pill "+selected.priority.toLowerCase()}>{selected.priority}</span>
            </div>

            {editingCase?<CaseEditForm draft={draft} setDraft={setDraft}/>:<>
              <p className="caseDescription">{selected.description}</p>
              <div className="billingCard">
                <div><label>CUSTOMER</label><b>{selected.customerId||"—"}</b></div>
                <div><label>TRANSACTION</label><b>{selected.transactionId||"—"}</b></div>
                <div><label>AMOUNT</label><b>{selected.amount===null?"—":selected.currency+" "+selected.amount.toLocaleString()}</b></div>
                <div><label>PAYMENT STATUS</label><b>{selected.paymentStatus||"—"}</b></div>
                <div><label>RECONCILIATION</label><b>{selected.reconciliationStatus||"—"}</b></div>
                <div><label>DUE DATE</label><b>{selected.dueDate||"—"}</b></div>
              </div>
            </>}

            {editingCase?<div className="actions"><button onClick={()=>setEditingCase(false)}>Cancel</button><button className="approve" onClick={()=>saveDraft(selected,"case")}>Save case changes</button></div>:canMutate&&<div className="caseTools"><button onClick={()=>beginCaseEdit(selected)}><Pencil size={14}/>Edit case</button>{role==="Admin"&&<button onClick={()=>archiveCase(selected)}><Archive size={14}/>Archive</button>}</div>}

            <div className="ai">
              <div className="aiTitle"><Sparkles size={18}/><b>AI triage recommendation</b><span>{selected.confidence?selected.confidence+"%":"Not scored"}</span></div>
              <div className={"demoMode "+(selected.aiMode==="live"?"liveMode":"")}>{aiSourceLabel(selected.aiMode)}</div>
              {editingRecommendation?<RecommendationEdit draft={draft} setDraft={setDraft}/>:<>
                <label>SUMMARY</label><p>{selected.summary}</p>
                <div className="facts"><div><label>CLASSIFICATION</label><b>{selected.category}</b></div><div><label>SUGGESTED OWNER</label><b>{selected.owner}</b></div></div>
                <label>RECOMMENDED NEXT ACTION</label><p>{selected.action}</p>
              </>}
              <div className="guardrail"><AlertTriangle size={17}/><span>Recommendation only. A human reviewer controls the operational decision.</span></div>
            </div>

            {canMutate&&<>
              <label className="reviewLabel">REVIEWER CONTEXT</label>
              <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Add rationale or investigation notes..."/>
              <div className="actions workflowActions">
                {editingRecommendation?<><button onClick={()=>setEditingRecommendation(false)}>Cancel modification</button><button className="approve" onClick={()=>saveDraft(selected,"recommendation")}>Save modification</button></>:<>
                  {selected.aiMode==="none"&&<button onClick={()=>runAi(selected)} disabled={triaging}><Play size={14}/>{triaging?"Triaging...":"Run AI triage"}</button>}
                  <button onClick={()=>beginRecommendationEdit(selected)}><Pencil size={14}/>Modify AI</button>
                  {selected.status!=="In Progress"&&<button onClick={()=>transition(selected,"In Progress")}>Start work</button>}
                  <button onClick={()=>transition(selected,"Rejected")}>Reject</button>
                  <button className="approve" onClick={()=>transition(selected,"Approved")}><CheckCircle2 size={15}/>Approve</button>
                </>}
              </div>
            </>}
            <div className="audit"><Clock3 size={16}/><span>Events for this case:</span><b>{selectedAudits.length}</b><small>{selected.aiMode==="live"?"Live model recommendation":"No live-model claim"}</small></div>
          </div>:<div className="detail empty"><CheckCircle2/><h2>Queue cleared</h2><p>No active cases match the current dataset.</p></div>}
        </div>
      </>}

      {view==="audit"&&<div className="auditPanel">
        {auditCase?<div className="auditCaseDetail">
          <div className="auditCaseBar"><button onClick={()=>setAuditCaseId(null)}><ChevronLeft size={14}/>Back to audit history</button><span className={"pill "+auditCase.priority.toLowerCase()}>{auditCase.priority}</span></div>
          <div className="detailTop"><div><span className="id">{auditCase.id}</span><h2>{auditCase.title}</h2><small>{auditCase.status}</small></div></div>
          <p className="caseDescription">{auditCase.description}</p>
          <div className="billingCard">
            <div><label>CUSTOMER</label><b>{auditCase.customerId||"—"}</b></div><div><label>TRANSACTION</label><b>{auditCase.transactionId||"—"}</b></div>
            <div><label>AMOUNT</label><b>{auditCase.amount===null?"—":auditCase.currency+" "+auditCase.amount.toLocaleString()}</b></div><div><label>RECONCILIATION</label><b>{auditCase.reconciliationStatus||"—"}</b></div>
          </div>
          <label>AI / TRIAGE SOURCE</label><p className="caseDescription">{aiSourceLabel(auditCase.aiMode)} · {auditCase.confidence||0}% confidence</p>
          <label>SUMMARY</label><p className="caseDescription">{auditCase.summary}</p>
          <label>RECOMMENDED NEXT ACTION</label><p className="caseDescription">{auditCase.action}</p>
          <h3>Change history</h3>
          {auditCaseEvents.length===0?<p className="caseDescription">No events recorded for this seeded case yet.</p>:auditCaseEvents.map(a=><div className="auditRow static" key={a.id}><div><strong>{a.action}</strong><p>{a.actor} · {a.note}</p>{a.changes&&<div className="changeList">{Object.entries(a.changes).map(([k,v])=><span key={k}><b>{k}</b>: {v.from||"—"} → {v.to||"—"}</span>)}</div>}</div><time>{new Date(a.at).toLocaleString()}</time></div>)}
        </div>:audits.length===0?<div className="empty"><Clock3/><h2>No audit events yet</h2><p>The demo starts at zero. Create, edit, triage, approve, reject, archive, or import a case to generate events.</p></div>:audits.map(a=><button className="auditRow auditRowButton" key={a.id} onClick={()=>setAuditCaseId(a.caseId)}><div><b>{a.caseId}</b><strong>{a.action}</strong><p>{a.actor} · {a.note}</p></div><time>{new Date(a.at).toLocaleString()}</time></button>)}
      </div>}

      {view==="data"&&<div className="dataGrid">
        <section className="toolCard"><Upload/><h2>Import billing exceptions</h2><p>Load operational records from CSV. Imported rows start as New and can be sent through AI triage individually.</p><input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={e=>e.target.files?.[0]&&importCsv(e.target.files[0])}/><button disabled={role!=="Admin"} onClick={()=>fileRef.current?.click()}><Upload size={15}/>Import CSV</button><button onClick={downloadTemplate}><FileText size={15}/>Download template</button>{role!=="Admin"&&<small>Admin access required for imports.</small>}</section>
        <section className="toolCard"><Download/><h2>Export operational data</h2><p>Export all case records or the complete audit log for analysis and reconciliation reporting.</p><button onClick={exportCases}><Download size={15}/>Export cases</button><button onClick={exportAudits}><Download size={15}/>Export audit log</button></section>
        <section className="toolCard"><Database/><h2>Persistence status</h2><p>This live prototype currently persists records in versioned browser storage. The schema is ready to move behind a server database without changing the product workflow.</p><div className="statusLine"><span>Case records</span><b>{cases.length}</b></div><div className="statusLine"><span>Audit events</span><b>{audits.length}</b></div></section>
        <section className="toolCard dangerCard"><Archive/><h2>Admin demo controls</h2><p>Reset only the synthetic prototype dataset and event history in this browser.</p><button className="dangerButton" disabled={role!=="Admin"} onClick={resetDemo}>Reset demo dataset</button></section>
      </div>}
    </section>

    {showNew&&<div className="modalBackdrop" onMouseDown={()=>{setShowNew(false);setTitle("");setDescription("")}}>
      <div className="modal" onMouseDown={e=>e.stopPropagation()}>
        <div className="modalHead"><div><p className="eyebrow">NEW INTAKE</p><h2>Create operational case</h2></div><button className="iconBtn" onClick={()=>{setShowNew(false);setTitle("");setDescription("")}}><X size={18}/></button></div>
        <label>CASE TITLE</label><input className="field" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Customer charged twice after checkout retry"/>
        <label>CASE DESCRIPTION</label><textarea className="field large" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe what happened, customer impact, timing, and relevant signals..."/>
        <div className="modalHint"><Sparkles size={16}/><span>OpsPilot requests server-side AI triage. If unavailable, it clearly labels and uses the deterministic fallback. No operational action is automated.</span></div>
        <div className="actions"><button onClick={()=>{setShowNew(false);setTitle("");setDescription("")}}>Cancel</button><button className="approve" disabled={!title.trim()||!description.trim()||triaging} onClick={createCase}>{triaging?"Analyzing...":"Create & triage"}</button></div>
      </div>
    </div>}
  </main>;
}

function Metric({label,value,sub,alert}:{label:string,value:string|number,sub:string,alert?:boolean}){
  return <div className="metric"><span>{label}</span><b className={alert?"red":""}>{value}</b><small>{sub}</small></div>;
}

function CaseEditForm({draft,setDraft}:{draft:Partial<CaseRecord>,setDraft:React.Dispatch<React.SetStateAction<Partial<CaseRecord>>>}){
  const set=(key:keyof CaseRecord,value:any)=>setDraft(v=>({...v,[key]:value}));
  return <div className="editForm">
    <label>TITLE</label><input className="field" value={draft.title||""} onChange={e=>set("title",e.target.value)}/>
    <label>DESCRIPTION</label><textarea className="field" value={draft.description||""} onChange={e=>set("description",e.target.value)}/>
    <div className="facts three">
      <div><label>OWNER</label><input className="field" value={draft.owner||""} onChange={e=>set("owner",e.target.value)}/></div>
      <div><label>PRIORITY</label><select className="field" value={draft.priority||"Medium"} onChange={e=>set("priority",e.target.value)}><option>High</option><option>Medium</option><option>Low</option></select></div>
      <div><label>CATEGORY</label><input className="field" value={draft.category||""} onChange={e=>set("category",e.target.value)}/></div>
    </div>
    <div className="facts three">
      <div><label>CUSTOMER ID</label><input className="field" value={draft.customerId||""} onChange={e=>set("customerId",e.target.value)}/></div>
      <div><label>TRANSACTION ID</label><input className="field" value={draft.transactionId||""} onChange={e=>set("transactionId",e.target.value)}/></div>
      <div><label>AMOUNT</label><input className="field" type="number" value={draft.amount??""} onChange={e=>set("amount",e.target.value===""?null:Number(e.target.value))}/></div>
    </div>
    <div className="facts three">
      <div><label>PROCESSOR REF</label><input className="field" value={draft.processorRef||""} onChange={e=>set("processorRef",e.target.value)}/></div>
      <div><label>PAYMENT STATUS</label><input className="field" value={draft.paymentStatus||""} onChange={e=>set("paymentStatus",e.target.value)}/></div>
      <div><label>RECONCILIATION</label><input className="field" value={draft.reconciliationStatus||""} onChange={e=>set("reconciliationStatus",e.target.value)}/></div>
    </div>
    <label>DUE DATE</label><input className="field" type="date" value={draft.dueDate||""} onChange={e=>set("dueDate",e.target.value)}/>
  </div>;
}

function RecommendationEdit({draft,setDraft}:{draft:Partial<CaseRecord>,setDraft:React.Dispatch<React.SetStateAction<Partial<CaseRecord>>>}){
  const set=(key:keyof CaseRecord,value:any)=>setDraft(v=>({...v,[key]:value}));
  return <div className="editRecommendation">
    <label>SUMMARY</label><textarea className="field" value={draft.summary||""} onChange={e=>set("summary",e.target.value)}/>
    <div className="facts three">
      <div><label>CLASSIFICATION</label><input className="field" value={draft.category||""} onChange={e=>set("category",e.target.value)}/></div>
      <div><label>PRIORITY</label><select className="field" value={draft.priority||"Medium"} onChange={e=>set("priority",e.target.value)}><option>High</option><option>Medium</option><option>Low</option></select></div>
      <div><label>OWNER</label><input className="field" value={draft.owner||""} onChange={e=>set("owner",e.target.value)}/></div>
    </div>
    <label>RECOMMENDED NEXT ACTION</label><textarea className="field" value={draft.action||""} onChange={e=>set("action",e.target.value)}/>
  </div>;
}
