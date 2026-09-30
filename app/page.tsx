"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import {
  AlertTriangle,Archive,CheckCircle2,ChevronLeft,Clock3,Database,Download,
  FileText,Filter,LayoutDashboard,Pencil,Play,Plus,Search,ShieldCheck,
  Sparkles,Upload,Users,X
} from "lucide-react";

type Priority=""|"High"|"Medium"|"Low";
type Status="New"|"Needs Review"|"In Progress"|"Modified"|"Approved"|"Rejected"|"Resolved"|"Archived";
type AiMode="live"|"none";
type Workspace="worker"|"admin";
type View="dashboard"|"audit"|"data";

type Triage={
  category:string;
  priority:Priority;
  confidence:number;
  summary:string;
  action:string;
  owner:string;
  riskSignals:string[];
  missingInformation:string[];
  resolutionPlan:string[];
};

type CaseRecord=Triage&{
  id:string;
  title:string;
  description:string;
  status:Status;
  aiMode:AiMode;
  createdAt:string;
  updatedAt:string;
  customerId:string;
  transactionId:string;
  amount:number|null;
  currency:string;
  processorRef:string;
  paymentStatus:string;
  reconciliationStatus:string;
  dueDate:string;
  riskSignals:string[];
  missingInformation:string[];
  resolutionPlan:string[];
};

type Audit={
  id:string;
  caseId:string;
  action:string;
  actor:string;
  note:string;
  at:string;
  changes?:Record<string,{from:string;to:string}>;
};

function csvCell(value:unknown){
  const s=String(value??"");
  return '"' + s.replace(/"/g,'""') + '"';
}

function downloadText(name:string,text:string){
  const blob=new Blob([text],{type:"text/csv"});
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
    if(ch==='"'&&quoted&&line[i+1]==='"'){value+='"';i++;continue;}
    if(ch==='"'){quoted=!quoted;continue;}
    if(ch===","&&!quoted){out.push(value);value="";continue;}
    value+=ch;
  }
  out.push(value);
  return out.map(v=>v.trim());
}

function makeCaseId(){
  return "OP-"+crypto.randomUUID().split("-")[0].toUpperCase();
}

export default function Home(){
  const [cases,setCases]=useState<CaseRecord[]>([]);
  const [audits,setAudits]=useState<Audit[]>([]);
  const [workspace,setWorkspace]=useState<Workspace>("worker");
  const [view,setView]=useState<View>("dashboard");
  const [selectedId,setSelectedId]=useState("");
  const [auditCaseId,setAuditCaseId]=useState<string|null>(null);
  const [hydrated,setHydrated]=useState(false);

  const [query,setQuery]=useState("");
  const [priorityFilter,setPriorityFilter]=useState("All");
  const [ownerFilter,setOwnerFilter]=useState("All");
  const [sourceFilter,setSourceFilter]=useState("All");
  const [sortBy,setSortBy]=useState("priority");

  const [showNew,setShowNew]=useState(false);
  const [title,setTitle]=useState("");
  const [description,setDescription]=useState("");
  const [triaging,setTriaging]=useState(false);
  const [aiError,setAiError]=useState("");
  const [actionNotice,setActionNotice]=useState("");
  const [draftAnalysis,setDraftAnalysis]=useState<Triage|null>(null);
  const [bulkRunning,setBulkRunning]=useState(false);
  const [bulkOwner,setBulkOwner]=useState("");
  const [note,setNote]=useState("");

  const [editingCase,setEditingCase]=useState(false);
  const [editingRecommendation,setEditingRecommendation]=useState(false);
  const [draft,setDraft]=useState<Partial<CaseRecord>>({});
  const fileRef=useRef<HTMLInputElement|null>(null);

  useEffect(()=>{
    try{
      const storedCases=localStorage.getItem("opspilot-control-cases");
      const storedAudits=localStorage.getItem("opspilot-control-audits");
      if(storedCases)setCases(JSON.parse(storedCases));
      if(storedAudits)setAudits(JSON.parse(storedAudits));
    }catch{}
    finally{setHydrated(true);}
  },[]);

  useEffect(()=>{if(hydrated)localStorage.setItem("opspilot-control-cases",JSON.stringify(cases));},[cases,hydrated]);
  useEffect(()=>{if(hydrated)localStorage.setItem("opspilot-control-audits",JSON.stringify(audits));},[audits,hydrated]);

  const terminal=(status:Status)=>["Approved","Rejected","Resolved","Archived"].includes(status);
  const activeCases=useMemo(()=>cases.filter(c=>!terminal(c.status)),[cases]);
  const selected=activeCases.find(c=>c.id===selectedId)||activeCases[0];

  useEffect(()=>{
    if(activeCases.length&&!activeCases.some(c=>c.id===selectedId))setSelectedId(activeCases[0].id);
    if(!activeCases.length)setSelectedId("");
  },[activeCases,selectedId]);

  const owners=useMemo(()=>Array.from(new Set(cases.map(c=>c.owner).filter(Boolean))).sort(),[cases]);

  const filtered=useMemo(()=>{
    const rank:Record<Priority,number>={High:0,Medium:1,Low:2,"":3};
    const q=query.trim().toLowerCase();
    return activeCases.filter(c=>{
      const hay=(c.id+" "+c.title+" "+c.description+" "+c.category+" "+c.owner+" "+c.customerId+" "+c.transactionId).toLowerCase();
      return (!q||hay.includes(q))
        &&(priorityFilter==="All"||c.priority===priorityFilter)
        &&(ownerFilter==="All"||c.owner===ownerFilter)
        &&(sourceFilter==="All"||c.aiMode===sourceFilter);
    }).sort((a,b)=>{
      if(sortBy==="priority")return rank[a.priority]-rank[b.priority];
      if(sortBy==="due"){
        if(!a.dueDate&&!b.dueDate)return 0;
        if(!a.dueDate)return 1;
        if(!b.dueDate)return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  },[activeCases,query,priorityFilter,ownerFilter,sourceFilter,sortBy]);

  const high=activeCases.filter(c=>c.priority==="High").length;
  const untriaged=activeCases.filter(c=>c.aiMode==="none").length;
  const liveAi=cases.filter(c=>c.aiMode==="live");
  const reviewedAi=liveAi.filter(c=>["Approved","Rejected","Resolved","Modified"].includes(c.status));
  const acceptedAi=reviewedAi.filter(c=>["Approved","Resolved"].includes(c.status)).length;
  const acceptance=reviewedAi.length?Math.round(acceptedAi/reviewedAi.length*100):null;
  const exceptionValue=activeCases.reduce((sum,c)=>sum+(c.amount||0),0);

  const selectedAudits=audits.filter(a=>a.caseId===selected?.id);
  const auditCase=auditCaseId?cases.find(c=>c.id===auditCaseId):undefined;
  const auditCaseEvents=auditCaseId?audits.filter(a=>a.caseId===auditCaseId):[];

  const actor=workspace==="admin"?"Admin User":"Case Worker";

  const addAudit=(caseId:string,action:string,noteText:string,changes?:Audit["changes"])=>{
    setAudits(v=>[{id:crypto.randomUUID(),caseId,action,actor,note:noteText,at:new Date().toISOString(),changes},...v]);
  };

  const updateCase=(id:string,patch:Partial<CaseRecord>)=>{
    setCases(v=>v.map(c=>c.id===id?{...c,...patch,updatedAt:new Date().toISOString()}:c));
  };

  const requestTriage=async(titleText:string,descriptionText:string)=>{
    const response=await fetch("/api/triage",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({title:titleText,description:descriptionText})
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data.result)throw new Error(data.error||"AI triage is unavailable.");
    return data.result as Triage;
  };

  const createCase=async()=>{
    if(!title.trim()||!description.trim()||triaging)return;
    setTriaging(true);
    setAiError("");
    const now=new Date().toISOString();
    let triage:Partial<Triage>=draftAnalysis||{};
    let aiMode:AiMode=draftAnalysis?"live":"none";
    try{
      if(!draftAnalysis){triage=await requestTriage(title.trim(),description.trim());aiMode="live";}
    }catch(error){
      setAiError(error instanceof Error?error.message:"AI triage is unavailable. The case was created without a recommendation.");
    }
    const record:CaseRecord={
      id:makeCaseId(),
      title:title.trim(),
      description:description.trim(),
      status:aiMode==="live"?"Needs Review":"New",
      aiMode,
      createdAt:now,
      updatedAt:now,
      category:triage.category||"",
      priority:triage.priority||"",
      confidence:triage.confidence||0,
      summary:triage.summary||"",
      action:triage.action||"",
      owner:triage.owner||"",
      riskSignals:triage.riskSignals||[],
      missingInformation:triage.missingInformation||[],
      resolutionPlan:triage.resolutionPlan||[],
      customerId:"",
      transactionId:"",
      amount:null,
      currency:"",
      processorRef:"",
      paymentStatus:"",
      reconciliationStatus:"",
      dueDate:""
    };
    setCases(v=>[record,...v]);
    addAudit(record.id,"Case created",aiMode==="live"?"Case created with a live AI recommendation.":"Case created without an AI recommendation.");
    setSelectedId(record.id);
    setTitle("");
    setDescription("");
    setDraftAnalysis(null);
    setShowNew(false);
    setTriaging(false);
  };

  const analyzeDraft=async()=>{
    if(!title.trim()||!description.trim()||triaging)return;
    setTriaging(true);setAiError("");setDraftAnalysis(null);
    try{
      const result=await requestTriage(title.trim(),description.trim());
      setDraftAnalysis(result);
    }catch(error){
      setAiError(error instanceof Error?error.message:"AI analysis is unavailable.");
    }
    setTriaging(false);
  };

  const runAi=async(record:CaseRecord)=>{
    if(triaging)return;
    setTriaging(true);
    setAiError("");
    try{
      const triage=await requestTriage(record.title,record.description);
      updateCase(record.id,{...triage,aiMode:"live",status:"Needs Review"});
      addAudit(record.id,"AI triage generated","Live AI recommendation generated.");
    }catch(error){
      const message=error instanceof Error?error.message:"AI triage is unavailable.";
      setAiError(message);
      addAudit(record.id,"AI triage failed","No AI-generated fields were written.");
    }
    setTriaging(false);
  };

  const transition=(record:CaseRecord,next:Status)=>{
    if(record.status===next){
      setActionNotice(record.id+" is already "+next.toLowerCase()+".");
      return;
    }
    const previous=record.status;
    updateCase(record.id,{status:next});
    const context=note.trim();
    addAudit(record.id,"Status changed",context?previous+" → "+next+". "+context:previous+" → "+next,{status:{from:previous,to:next}});
    setActionNotice(next==="In Progress"
      ?record.id+" is now In Progress. Work has started and the transition was recorded in the audit history."
      :record.id+" moved to "+next+".");
    if(terminal(next)){
      const nextCase=activeCases.find(c=>c.id!==record.id);
      setSelectedId(nextCase?.id||"");
    }
    setNote("");
  };

  const beginEdit=(record:CaseRecord,type:"case"|"ai")=>{
    setDraft({...record});
    setEditingCase(type==="case");
    setEditingRecommendation(type==="ai");
  };

  const saveDraft=(record:CaseRecord,type:"case"|"ai")=>{
    const fields=type==="case"
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
    if(type==="ai")patch.status="Modified";
    updateCase(record.id,patch);
    addAudit(record.id,type==="case"?"Case edited":"AI recommendation modified",note.trim()||"Changes saved.",changes);
    setEditingCase(false);
    setEditingRecommendation(false);
    setNote("");
  };

  const archiveCase=(record:CaseRecord)=>{
    updateCase(record.id,{status:"Archived"});
    addAudit(record.id,"Case archived","Archived from the admin workspace.");
    const next=activeCases.find(c=>c.id!==record.id);
    setSelectedId(next?.id||"");
  };

  const exportCases=()=>{
    const header=["id","title","description","status","priority","category","owner","customer_id","transaction_id","amount","currency","processor_ref","payment_status","reconciliation_status","due_date","ai_state","ai_confidence","created_at","updated_at"];
    const rows=cases.map(c=>[c.id,c.title,c.description,c.status,c.priority,c.category,c.owner,c.customerId,c.transactionId,c.amount??"",c.currency,c.processorRef,c.paymentStatus,c.reconciliationStatus,c.dueDate,c.aiMode,c.confidence,c.createdAt,c.updatedAt]);
    downloadText("opspilot-cases.csv",[header,...rows].map(r=>r.map(csvCell).join(",")).join("\n"));
  };

  const exportAudits=()=>{
    const header=["event_id","case_id","action","actor","timestamp","note","changes"];
    const rows=audits.map(a=>[a.id,a.caseId,a.action,a.actor,a.at,a.note,a.changes?JSON.stringify(a.changes):""]);
    downloadText("opspilot-audit-log.csv",[header,...rows].map(r=>r.map(csvCell).join(",")).join("\n"));
  };

  const downloadTemplate=()=>{
    const header=["title","description","customer_id","transaction_id","amount","currency","processor_ref","payment_status","reconciliation_status","due_date"];
    downloadText("opspilot-import-template.csv",header.map(csvCell).join(","));
  };

  const importCsv=async(file:File)=>{
    const text=await file.text();
    const lines=text.split(/\r?\n/).filter(Boolean);
    if(lines.length<2){setAiError("The CSV has no data rows.");return;}
    const headers=parseCsvLine(lines[0]).map(h=>h.toLowerCase());
    const created:CaseRecord[]=[];
    let rejected=0;
    for(const line of lines.slice(1)){
      const values=parseCsvLine(line);
      const row:Record<string,string>={};
      headers.forEach((h,i)=>row[h]=values[i]||"");
      if(!row.title||!row.description){rejected++;continue;}
      const now=new Date().toISOString();
      const amount=row.amount===""||row.amount===undefined?null:Number(row.amount);
      created.push({
        id:makeCaseId(),
        title:row.title,
        description:row.description,
        status:"New",
        aiMode:"none",
        createdAt:now,
        updatedAt:now,
        category:"",
        priority:"",
        confidence:0,
        summary:"",
        action:"",
        owner:"",
        customerId:row.customer_id||"",
        transactionId:row.transaction_id||"",
        amount:Number.isFinite(amount as number)?amount:null,
        currency:row.currency||"",
        processorRef:row.processor_ref||"",
        paymentStatus:row.payment_status||"",
        reconciliationStatus:row.reconciliation_status||"",
        dueDate:row.due_date||"",
        riskSignals:[],missingInformation:[],resolutionPlan:[]
      });
    }
    if(created.length){
      setCases(v=>[...created,...v]);
      created.forEach(c=>addAudit(c.id,"Imported","Created from CSV import."));
      setSelectedId(created[0].id);
      setWorkspace("worker");
      setView("dashboard");
    }
    setAiError("Import complete: "+created.length+" accepted, "+rejected+" rejected.");
    if(fileRef.current)fileRef.current.value="";
  };

  const bulkTriage=async()=>{
    const targets=cases.filter(c=>c.aiMode==="none"&&!terminal(c.status));
    if(!targets.length){
      setActionNotice("There are no active untriaged cases to process.");
      return;
    }
    setBulkRunning(true);setAiError("");setActionNotice("");
    let success=0;
    let lastError="";
    for(const record of targets){
      try{
        const triage=await requestTriage(record.title,record.description);
        setCases(v=>v.map(c=>c.id===record.id?{...c,...triage,aiMode:"live",status:"Needs Review",updatedAt:new Date().toISOString()}:c));
        addAudit(record.id,"AI triage generated","Bulk AI triage generated a live recommendation.");
        success++;
      }catch(error){
        lastError=error instanceof Error?error.message:"AI triage failed.";
      }
    }
    if(success===targets.length)setActionNotice("AI triage completed for all "+success+" eligible case"+(success===1?"":"s")+".");
    else setAiError("Bulk AI triage completed for "+success+" of "+targets.length+" cases."+((lastError&&success===0)?" "+lastError:""));
    setBulkRunning(false);
  };

  const bulkArchiveCompleted=()=>{
    const completed=cases.filter(c=>["Approved","Rejected","Resolved"].includes(c.status));
    if(!completed.length){
      setActionNotice("There are no completed cases to archive.");
      return;
    }
    const ids=new Set(completed.map(c=>c.id));
    setCases(v=>v.map(c=>ids.has(c.id)?{...c,status:"Archived",updatedAt:new Date().toISOString()}:c));
    completed.forEach(c=>addAudit(c.id,"Case archived","Bulk archived from Admin workspace."));
    setActionNotice("Archived "+completed.length+" completed case"+(completed.length===1?"":"s")+".");
  };

  const assignUnowned=()=>{
    const owner=bulkOwner.trim();
    if(!owner){
      setActionNotice("Enter an owner or queue before assigning cases.");
      return;
    }
    const targets=cases.filter(c=>!terminal(c.status)&&!c.owner);
    if(!targets.length){
      setActionNotice("There are no active unowned cases to assign.");
      return;
    }
    const ids=new Set(targets.map(c=>c.id));
    setCases(v=>v.map(c=>ids.has(c.id)?{...c,owner,updatedAt:new Date().toISOString()}:c));
    targets.forEach(c=>addAudit(c.id,"Owner assigned","Assigned to "+owner+" from Admin workspace.",{owner:{from:"",to:owner}}));
    setBulkOwner("");
    setActionNotice("Assigned "+targets.length+" unowned case"+(targets.length===1?"":"s")+" to "+owner+".");
  };

  const clearWorkspace=()=>{
    setCases([]);
    setAudits([]);
    setSelectedId("");
    setAuditCaseId(null);
    localStorage.removeItem("opspilot-control-cases");
    localStorage.removeItem("opspilot-control-audits");
  };

  const sourceLabel=(mode:AiMode)=>mode==="live"?"AI generated":"Not AI triaged";

  return <main>
    <aside>
      <div className="brand"><div className="logo"><Sparkles size={19}/></div><div><b>OpsPilot Control</b><small>AI-assisted operations workspace</small></div></div>

      <div className="workspaceSwitch">
        <button className={workspace==="worker"?"selectedMode":""} onClick={()=>{setWorkspace("worker");setView("dashboard");setAuditCaseId(null)}}><Users size={15}/>Case Worker</button>
        <button className={workspace==="admin"?"selectedMode":""} onClick={()=>{setWorkspace("admin");setView("dashboard");setAuditCaseId(null)}}><LayoutDashboard size={15}/>Admin</button>
      </div>

      <nav>
        <button className={view==="dashboard"?"active":""} onClick={()=>{setView("dashboard");setAuditCaseId(null)}}>{workspace==="worker"?"Work queue":"Operations dashboard"}</button>
        <button className={view==="audit"?"active":""} onClick={()=>{setView("audit");setAuditCaseId(null)}}>Audit history <em>{audits.length}</em></button>
        {workspace==="admin"&&<button className={view==="data"?"active":""} onClick={()=>setView("data")}>Data management</button>}
      </nav>

      <div className="principle"><ShieldCheck size={20}/><b>Human controlled</b><p>AI can recommend. People own operational decisions.</p></div>
    </aside>

    <section className="workspace">
      <header>
        <div>
          <p className="eyebrow">{workspace==="worker"?"CASE WORKER WORKSPACE":"ADMIN WORKSPACE"}</p>
          <h1>{view==="audit"?(auditCase?"Case history":"Audit History"):view==="data"?"Data Management":workspace==="worker"?"My Case Queue":"Operations Overview"}</h1>
          <p>{view==="audit"?(auditCase?"Review the complete case record and its change history.":"Inspect recorded operational activity."):view==="data"?"Import, export, and manage operational records.":workspace==="worker"?"Review, investigate, and resolve assigned operational cases.":"Monitor workload, AI usage, exception value, and operational activity."}</p>
        </div>
        {workspace==="worker"&&view==="dashboard"&&<button className="primary" onClick={()=>setShowNew(true)}><Plus size={16}/>Create case</button>}
      </header>

      {aiError&&<div className="aiError"><AlertTriangle size={16}/><span>{aiError}</span><button onClick={()=>setAiError("")}>Dismiss</button></div>}
      {actionNotice&&<div className="actionNotice"><CheckCircle2 size={16}/><span>{actionNotice}</span><button onClick={()=>setActionNotice("")}>Dismiss</button></div>}

      {view==="dashboard"&&workspace==="admin"&&<>
        <div className="metrics five">
          <Metric label="Active cases" value={activeCases.length} sub="Current workload"/>
          <Metric label="High priority" value={high} sub="Need attention" alert/>
          <Metric label="Not AI triaged" value={untriaged} sub="Awaiting recommendation"/>
          <Metric label="Exception value" value={exceptionValue?exceptionValue.toLocaleString(undefined,{style:"currency",currency:"USD"}):"—"} sub="Active recorded amount"/>
          <Metric label="AI acceptance" value={acceptance===null?"—":acceptance+"%"} sub="Reviewed AI recommendations"/>
        </div>
        <div className="adminGrid">
          <section className="adminPanel">
            <div className="panelHead"><div><h2>Operational workload</h2><small>{cases.length} total records</small></div><button onClick={()=>{setWorkspace("worker");setView("dashboard")}}>Open worker queue</button></div>
            <div className="statusRows">
              <StatusRow label="New" value={cases.filter(c=>c.status==="New").length}/>
              <StatusRow label="Needs review" value={cases.filter(c=>c.status==="Needs Review").length}/>
              <StatusRow label="In progress" value={cases.filter(c=>c.status==="In Progress").length}/>
              <StatusRow label="Completed" value={cases.filter(c=>terminal(c.status)).length}/>
            </div>
          </section>
          <section className="adminPanel">
            <div className="panelHead"><div><h2>AI operations</h2><small>Actual model usage only</small></div></div>
            <div className="statusRows">
              <StatusRow label="AI-generated cases" value={liveAi.length}/>
              <StatusRow label="Reviewed AI cases" value={reviewedAi.length}/>
              <StatusRow label="Accepted AI cases" value={acceptedAi}/>
              <StatusRow label="Awaiting AI triage" value={untriaged}/>
            </div>
          </section>
          <section className="adminPanel">
            <div className="panelHead"><div><h2>AI operations</h2><small>Admin-only controls</small></div></div>
            <p className="panelCopy">Generate recommendations for every active case that has not been triaged yet.</p>
            <button className="adminAction" onClick={bulkTriage} disabled={bulkRunning||untriaged===0}><Sparkles size={14}/>{bulkRunning?"Running AI...":"Triage all untriaged"}</button>
            <div className="statusRows"><StatusRow label="Awaiting AI" value={untriaged}/><StatusRow label="AI generated" value={liveAi.length}/></div>
          </section>
          <section className="adminPanel">
            <div className="panelHead"><div><h2>Queue controls</h2><small>Admin-only actions</small></div></div>
            <label>ASSIGN UNOWNED CASES</label>
            <div className="inlineControl"><input value={bulkOwner} onChange={e=>setBulkOwner(e.target.value)} placeholder="Owner or queue"/><button onClick={assignUnowned}>Assign</button></div>
            <button className="adminAction secondary" onClick={bulkArchiveCompleted}><Archive size={14}/>Archive completed cases</button>
          </section>
          <section className="adminPanel widePanel">
            <div className="panelHead"><div><h2>Recent activity</h2><small>Latest audit events</small></div><button onClick={()=>setView("audit")}>View full audit</button></div>
            {audits.length===0?<div className="empty compact"><Clock3/><p>No activity has been recorded yet.</p></div>:audits.slice(0,6).map(a=><button className="auditRow auditRowButton" key={a.id} onClick={()=>{setAuditCaseId(a.caseId);setView("audit")}}><div><b>{a.caseId}</b><strong>{a.action}</strong><p>{a.actor} · {a.note}</p></div><time>{new Date(a.at).toLocaleString()}</time></button>)}
          </section>
        </div>
      </>}

      {view==="dashboard"&&workspace==="worker"&&<>
        <div className="workerSummary">
          <Metric label="My active queue" value={activeCases.length} sub="Open work"/>
          <Metric label="High priority" value={high} sub="Need attention" alert/>
          <Metric label="Awaiting AI" value={untriaged} sub="Can be triaged"/>
          <Metric label="Completed" value={cases.filter(c=>terminal(c.status)).length} sub="In history"/>
        </div>

        <div className="filterBar">
          <div className="search wide"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search case, customer, transaction..."/></div>
          <Filter size={15}/>
          <select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)}><option value="All">All priorities</option><option>High</option><option>Medium</option><option>Low</option></select>
          <select value={ownerFilter} onChange={e=>setOwnerFilter(e.target.value)}><option value="All">All owners</option>{owners.map(o=><option key={o}>{o}</option>)}</select>
          <select value={sourceFilter} onChange={e=>setSourceFilter(e.target.value)}><option value="All">All recommendation states</option><option value="live">AI generated</option><option value="none">Not AI triaged</option></select>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)}><option value="priority">Priority first</option><option value="due">Due date</option><option value="updated">Recently updated</option></select>
        </div>

        <div className="grid">
          <div className="queue">
            <div className="queueHead"><div><h2>Case queue</h2><small>{filtered.length} active cases</small></div></div>
            {filtered.length===0?<div className="empty"><Search/><h2>No active cases</h2><p>Create a case or import records from the Admin workspace.</p></div>:filtered.map(c=>
              <button key={c.id} onClick={()=>{setSelectedId(c.id);setEditingCase(false);setEditingRecommendation(false);setNote("")}} className={"case "+(selected?.id===c.id?"selected":"")}>
                <div className="caseTop"><b>{c.id}</b><span className={"pill "+(c.priority||"unset").toLowerCase()}>{c.priority||"Not set"}</span></div>
                <strong>{c.title}</strong>
                <div className="meta"><span>{c.category||"Unclassified"}</span><span>{c.status}</span></div>
                <div className="caseSignals"><span>{sourceLabel(c.aiMode)}</span>{c.amount!==null&&<span>{c.currency||"Amount"} {c.amount.toLocaleString()}</span>}{c.dueDate&&<span>Due {c.dueDate}</span>}</div>
              </button>
            )}
          </div>

          {selected?<div className="detail">
            <div className="detailTop"><div><span className="id">{selected.id}</span><h2>{selected.title}</h2><small>{selected.status} · Updated {new Date(selected.updatedAt).toLocaleString()}</small></div><span className={"pill "+(selected.priority||"unset").toLowerCase()}>{selected.priority||"Not set"}</span></div>

            {editingCase?<CaseEditForm draft={draft} setDraft={setDraft}/>:<>
              <p className="caseDescription">{selected.description}</p>
              <div className="billingCard">
                <div><label>CUSTOMER</label><b>{selected.customerId||"—"}</b></div><div><label>TRANSACTION</label><b>{selected.transactionId||"—"}</b></div>
                <div><label>AMOUNT</label><b>{selected.amount===null?"—":(selected.currency?selected.currency+" ":"")+selected.amount.toLocaleString()}</b></div><div><label>PAYMENT STATUS</label><b>{selected.paymentStatus||"—"}</b></div>
                <div><label>RECONCILIATION</label><b>{selected.reconciliationStatus||"—"}</b></div><div><label>DUE DATE</label><b>{selected.dueDate||"—"}</b></div>
              </div>
            </>}

            {editingCase?<div className="actions"><button onClick={()=>setEditingCase(false)}>Cancel</button><button className="approve" onClick={()=>saveDraft(selected,"case")}>Save case</button></div>:<div className="caseTools"><button onClick={()=>beginEdit(selected,"case")}><Pencil size={14}/>Edit case</button></div>}

            <div className="ai">
              <div className="aiTitle"><Sparkles size={18}/><b>AI recommendation</b><span>{selected.aiMode==="live"?selected.confidence+"%":"Not generated"}</span></div>
              <div className={"demoMode "+(selected.aiMode==="live"?"liveMode":"")}>{sourceLabel(selected.aiMode)}</div>
              {editingRecommendation?<RecommendationEdit draft={draft} setDraft={setDraft}/>:selected.aiMode==="live"?<>
                <label>SUMMARY</label><p>{selected.summary}</p>
                <div className="facts"><div><label>CLASSIFICATION</label><b>{selected.category}</b></div><div><label>SUGGESTED OWNER</label><b>{selected.owner}</b></div></div>
                <label>RECOMMENDED NEXT ACTION</label><p>{selected.action}</p>
                {selected.riskSignals.length>0&&<><label>RISK SIGNALS</label><div className="tagList">{selected.riskSignals.map(x=><span key={x}>{x}</span>)}</div></>}
                {selected.missingInformation.length>0&&<><label>MISSING INFORMATION</label><ul className="aiList">{selected.missingInformation.map(x=><li key={x}>{x}</li>)}</ul></>}
                {selected.resolutionPlan.length>0&&<><label>PROPOSED RESOLUTION PLAN</label><ol className="aiList">{selected.resolutionPlan.map(x=><li key={x}>{x}</li>)}</ol></>}
              </>:<div className="empty compact"><Sparkles/><p>No AI recommendation exists for this case.</p></div>}
              <div className="guardrail"><AlertTriangle size={17}/><span>AI recommendations do not execute operational actions.</span></div>
            </div>

            <label className="reviewLabel">CASE NOTES</label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Add investigation context or decision rationale..."/>
            <div className="actions workflowActions">
              {editingRecommendation?<><button onClick={()=>setEditingRecommendation(false)}>Cancel</button><button className="approve" onClick={()=>saveDraft(selected,"ai")}>Save AI changes</button></>:<>
                {selected.aiMode!=="live"&&<button onClick={()=>runAi(selected)} disabled={triaging}><Play size={14}/>{triaging?"Generating...":"Run AI triage"}</button>}
                {selected.aiMode==="live"&&<button onClick={()=>beginEdit(selected,"ai")}><Pencil size={14}/>Modify recommendation</button>}
                {selected.status!=="In Progress"
                  ?<button onClick={()=>transition(selected,"In Progress")}><Play size={14}/>Start work</button>
                  :<button className="inProgressButton" disabled><Clock3 size={14}/>In progress</button>}
                <button onClick={()=>transition(selected,"Rejected")}>Reject</button>
                <button className="approve" onClick={()=>transition(selected,"Approved")}><CheckCircle2 size={15}/>Approve</button>
              </>}
            </div>
            <div className="audit"><Clock3 size={16}/><span>Case events</span><b>{selectedAudits.length}</b><small>{sourceLabel(selected.aiMode)}</small></div>
          </div>:<div className="detail empty"><CheckCircle2/><h2>Queue clear</h2><p>There are no active cases.</p></div>}
        </div>
      </>}

      {view==="audit"&&<div className="auditPanel">
        {auditCase?<div className="auditCaseDetail">
          <div className="auditCaseBar"><button onClick={()=>setAuditCaseId(null)}><ChevronLeft size={14}/>Back to audit history</button><span className={"pill "+(auditCase.priority||"unset").toLowerCase()}>{auditCase.priority||"Not set"}</span></div>
          <div className="detailTop"><div><span className="id">{auditCase.id}</span><h2>{auditCase.title}</h2><small>{auditCase.status}</small></div></div>
          <p className="caseDescription">{auditCase.description}</p>
          <div className="billingCard">
            <div><label>CUSTOMER</label><b>{auditCase.customerId||"—"}</b></div><div><label>TRANSACTION</label><b>{auditCase.transactionId||"—"}</b></div>
            <div><label>AMOUNT</label><b>{auditCase.amount===null?"—":(auditCase.currency?auditCase.currency+" ":"")+auditCase.amount.toLocaleString()}</b></div><div><label>RECONCILIATION</label><b>{auditCase.reconciliationStatus||"—"}</b></div>
          </div>
          <label>AI STATE</label><p className="caseDescription">{sourceLabel(auditCase.aiMode)}{auditCase.aiMode==="live"?" · "+auditCase.confidence+"% confidence":""}</p>
          {auditCase.aiMode==="live"&&<><label>SUMMARY</label><p className="caseDescription">{auditCase.summary}</p><label>RECOMMENDED NEXT ACTION</label><p className="caseDescription">{auditCase.action}</p></>}
          <h3>Change history</h3>
          {auditCaseEvents.length===0?<p className="caseDescription">No events recorded for this case.</p>:auditCaseEvents.map(a=><div className="auditRow static" key={a.id}><div><strong>{a.action}</strong><p>{a.actor} · {a.note}</p>{a.changes&&<div className="changeList">{Object.entries(a.changes).map(([k,v])=><span key={k}><b>{k}</b>: {v.from||"—"} → {v.to||"—"}</span>)}</div>}</div><time>{new Date(a.at).toLocaleString()}</time></div>)}
        </div>:audits.length===0?<div className="empty"><Clock3/><h2>No audit events</h2><p>Activity will appear here as cases are created, triaged, edited, and reviewed.</p></div>:audits.map(a=><button className="auditRow auditRowButton" key={a.id} onClick={()=>setAuditCaseId(a.caseId)}><div><b>{a.caseId}</b><strong>{a.action}</strong><p>{a.actor} · {a.note}</p></div><time>{new Date(a.at).toLocaleString()}</time></button>)}
      </div>}

      {view==="data"&&workspace==="admin"&&<div className="dataGrid">
        <section className="toolCard"><Upload/><h2>Import cases</h2><p>Import operational records from CSV. Imported cases remain untriaged until a worker requests AI analysis.</p><input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={e=>e.target.files?.[0]&&importCsv(e.target.files[0])}/><button onClick={()=>fileRef.current?.click()}><Upload size={15}/>Import CSV</button><button onClick={downloadTemplate}><FileText size={15}/>Download blank template</button></section>
        <section className="toolCard"><Download/><h2>Export records</h2><p>Export case records or the complete audit history for reporting and reconciliation.</p><button onClick={exportCases}><Download size={15}/>Export cases</button><button onClick={exportAudits}><Download size={15}/>Export audit log</button></section>
        <section className="toolCard"><Database/><h2>Storage</h2><p>Records created or imported in this browser are persisted locally. No seeded business records are loaded.</p><div className="statusLine"><span>Case records</span><b>{cases.length}</b></div><div className="statusLine"><span>Audit events</span><b>{audits.length}</b></div></section>
        <section className="toolCard dangerCard"><Archive/><h2>Workspace controls</h2><p>Clear all locally stored cases and audit history.</p><button className="dangerButton" onClick={clearWorkspace}>Clear workspace</button></section>
      </div>}
    </section>

    {showNew&&<div className="modalBackdrop" onMouseDown={()=>{setShowNew(false);setTitle("");setDescription("");setDraftAnalysis(null)}}>
      <div className="modal" onMouseDown={e=>e.stopPropagation()}>
        <div className="modalHead"><div><p className="eyebrow">NEW CASE</p><h2>Create operational case</h2></div><button className="iconBtn" onClick={()=>{setShowNew(false);setTitle("");setDescription("");setDraftAnalysis(null)}}><X size={18}/></button></div>
        <label>CASE TITLE</label><input className="field" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Describe the operational issue"/>
        <label>CASE DESCRIPTION</label><textarea className="field large" value={description} onChange={e=>{setDescription(e.target.value);setDraftAnalysis(null)}} placeholder="Add context, impact, timing, and relevant signals"/>
        <div className="draftAiBar"><button disabled={!title.trim()||!description.trim()||triaging} onClick={analyzeDraft}><Sparkles size={15}/>{triaging?"Analyzing...":"Analyze description with AI"}</button><span>Preview AI guidance before creating the case.</span></div>
        {draftAnalysis&&<div className="draftPreview"><div className="draftPreviewHead"><Sparkles size={16}/><b>AI case analysis</b><span>{draftAnalysis.confidence}% confidence</span></div><div className="facts"><div><label>CLASSIFICATION</label><b>{draftAnalysis.category}</b></div><div><label>PRIORITY</label><b>{draftAnalysis.priority}</b></div></div><div className="facts"><div><label>OWNER</label><b>{draftAnalysis.owner}</b></div><div><label>NEXT ACTION</label><b>{draftAnalysis.action}</b></div></div><label>SUMMARY</label><p>{draftAnalysis.summary}</p>{draftAnalysis.riskSignals.length>0&&<><label>RISK SIGNALS</label><div className="tagList">{draftAnalysis.riskSignals.map(x=><span key={x}>{x}</span>)}</div></>}{draftAnalysis.missingInformation.length>0&&<><label>MISSING INFORMATION</label><ul className="aiList">{draftAnalysis.missingInformation.map(x=><li key={x}>{x}</li>)}</ul></>}{draftAnalysis.resolutionPlan.length>0&&<><label>PROPOSED RESOLUTION PLAN</label><ol className="aiList">{draftAnalysis.resolutionPlan.map(x=><li key={x}>{x}</li>)}</ol></>}</div>}
        <div className="modalHint"><Sparkles size={16}/><span>OpsPilot will request a server-side AI recommendation. If AI is unavailable, the case is created without generated fields.</span></div>
        <div className="actions"><button onClick={()=>{setShowNew(false);setTitle("");setDescription("");setDraftAnalysis(null)}}>Cancel</button><button className="approve" disabled={!title.trim()||!description.trim()||triaging} onClick={createCase}>{triaging?"Generating...":draftAnalysis?"Create with AI analysis":"Create case"}</button></div>
      </div>
    </div>}
  </main>;
}

function Metric({label,value,sub,alert}:{label:string,value:string|number,sub:string,alert?:boolean}){
  return <div className="metric"><span>{label}</span><b className={alert?"red":""}>{value}</b><small>{sub}</small></div>;
}

function StatusRow({label,value}:{label:string,value:number}){
  return <div className="statusLine"><span>{label}</span><b>{value}</b></div>;
}

function CaseEditForm({draft,setDraft}:{draft:Partial<CaseRecord>,setDraft:React.Dispatch<React.SetStateAction<Partial<CaseRecord>>>}){
  const set=(key:keyof CaseRecord,value:any)=>setDraft(v=>({...v,[key]:value}));
  return <div className="editForm">
    <label>TITLE</label><input className="field" value={draft.title||""} onChange={e=>set("title",e.target.value)}/>
    <label>DESCRIPTION</label><textarea className="field" value={draft.description||""} onChange={e=>set("description",e.target.value)}/>
    <div className="facts three">
      <div><label>OWNER</label><input className="field" value={draft.owner||""} onChange={e=>set("owner",e.target.value)}/></div>
      <div><label>PRIORITY</label><select className="field" value={draft.priority||""} onChange={e=>set("priority",e.target.value)}><option value="">Not set</option><option>High</option><option>Medium</option><option>Low</option></select></div>
      <div><label>CATEGORY</label><input className="field" value={draft.category||""} onChange={e=>set("category",e.target.value)}/></div>
    </div>
    <div className="facts three">
      <div><label>CUSTOMER ID</label><input className="field" value={draft.customerId||""} onChange={e=>set("customerId",e.target.value)}/></div>
      <div><label>TRANSACTION ID</label><input className="field" value={draft.transactionId||""} onChange={e=>set("transactionId",e.target.value)}/></div>
      <div><label>AMOUNT</label><input className="field" type="number" value={draft.amount??""} onChange={e=>set("amount",e.target.value===""?null:Number(e.target.value))}/></div>
    </div>
    <div className="facts three">
      <div><label>CURRENCY</label><input className="field" value={draft.currency||""} onChange={e=>set("currency",e.target.value)}/></div>
      <div><label>PROCESSOR REF</label><input className="field" value={draft.processorRef||""} onChange={e=>set("processorRef",e.target.value)}/></div>
      <div><label>PAYMENT STATUS</label><input className="field" value={draft.paymentStatus||""} onChange={e=>set("paymentStatus",e.target.value)}/></div>
    </div>
    <label>RECONCILIATION STATUS</label><input className="field" value={draft.reconciliationStatus||""} onChange={e=>set("reconciliationStatus",e.target.value)}/>
    <label>DUE DATE</label><input className="field" type="date" value={draft.dueDate||""} onChange={e=>set("dueDate",e.target.value)}/>
  </div>;
}

function RecommendationEdit({draft,setDraft}:{draft:Partial<CaseRecord>,setDraft:React.Dispatch<React.SetStateAction<Partial<CaseRecord>>>}){
  const set=(key:keyof CaseRecord,value:any)=>setDraft(v=>({...v,[key]:value}));
  return <div className="editRecommendation">
    <label>SUMMARY</label><textarea className="field" value={draft.summary||""} onChange={e=>set("summary",e.target.value)}/>
    <div className="facts three">
      <div><label>CLASSIFICATION</label><input className="field" value={draft.category||""} onChange={e=>set("category",e.target.value)}/></div>
      <div><label>PRIORITY</label><select className="field" value={draft.priority||""} onChange={e=>set("priority",e.target.value)}><option value="">Not set</option><option>High</option><option>Medium</option><option>Low</option></select></div>
      <div><label>OWNER</label><input className="field" value={draft.owner||""} onChange={e=>set("owner",e.target.value)}/></div>
    </div>
    <label>RECOMMENDED NEXT ACTION</label><textarea className="field" value={draft.action||""} onChange={e=>set("action",e.target.value)}/>
  </div>;
}
