import {NextResponse} from "next/server";

const schema={
  type:"object",
  additionalProperties:false,
  properties:{
    outcome:{type:"string",enum:["Ready to resolve","Needs more information","Escalate"]},
    confidence:{type:"integer",minimum:0,maximum:100},
    rationale:{type:"string"},
    evidenceSatisfied:{type:"array",items:{type:"string"},maxItems:6},
    blockers:{type:"array",items:{type:"string"},maxItems:6},
    recommendedNextSteps:{type:"array",items:{type:"string"},maxItems:6}
  },
  required:["outcome","confidence","rationale","evidenceSatisfied","blockers","recommendedNextSteps"]
};

export async function POST(request:Request){
  try{
    const body=await request.json();
    const {caseRecord,reviewerNotes}=body||{};
    if(!caseRecord||typeof caseRecord.title!=="string"||typeof caseRecord.description!=="string"){
      return NextResponse.json({error:"Case details are required."},{status:400});
    }
    const key=process.env.OPENAI_API_KEY;
    if(!key)return NextResponse.json({error:"AI service is not configured."},{status:503});

    const input={
      title:caseRecord.title,
      description:caseRecord.description,
      status:caseRecord.status,
      category:caseRecord.category||"",
      priority:caseRecord.priority||"",
      owner:caseRecord.owner||"",
      customerId:caseRecord.customerId||"",
      transactionId:caseRecord.transactionId||"",
      amount:caseRecord.amount??null,
      currency:caseRecord.currency||"",
      processorRef:caseRecord.processorRef||"",
      paymentStatus:caseRecord.paymentStatus||"",
      reconciliationStatus:caseRecord.reconciliationStatus||"",
      currentAiSummary:caseRecord.summary||"",
      currentRecommendedAction:caseRecord.action||"",
      reviewerNotes:typeof reviewerNotes==="string"?reviewerNotes:""
    };

    const response=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{"Content-Type":"application/json",Authorization:`Bearer ${key}`},
      body:JSON.stringify({
        model:process.env.OPENAI_MODEL||"gpt-5.6-luna",
        store:false,
        instructions:"You are an operations resolution-readiness assistant. Evaluate only the supplied case record and reviewer notes. Decide whether the evidence supports Ready to resolve, Needs more information, or Escalate. Never claim that you executed a financial, access, compliance, account, or customer-impacting action. Do not mark the case resolved. Identify evidence already present, blockers or missing evidence, and concise next steps. Escalate when the available facts indicate material risk, unclear authority, or a decision outside normal case-worker scope. Lower confidence when evidence is incomplete.",
        input:JSON.stringify(input),
        text:{format:{type:"json_schema",name:"opspilot_resolution_check",strict:true,schema}}
      })
    });

    if(!response.ok){
      return NextResponse.json({error:"AI resolution check is temporarily unavailable."},{status:502});
    }
    const data=await response.json();
    if(typeof data.output_text!=="string"){
      return NextResponse.json({error:"AI resolution check returned no structured output."},{status:502});
    }
    return NextResponse.json({result:JSON.parse(data.output_text)});
  }catch{
    return NextResponse.json({error:"Unable to evaluate resolution readiness."},{status:500});
  }
}
