import {NextResponse} from "next/server";

const schema={type:"object",additionalProperties:false,properties:{category:{type:"string"},priority:{type:"string",enum:["High","Medium","Low"]},confidence:{type:"integer",minimum:0,maximum:100},summary:{type:"string"},action:{type:"string"},owner:{type:"string"},riskSignals:{type:"array",items:{type:"string"},maxItems:5},missingInformation:{type:"array",items:{type:"string"},maxItems:5},resolutionPlan:{type:"array",items:{type:"string"},minItems:1,maxItems:5}},required:["category","priority","confidence","summary","action","owner","riskSignals","missingInformation","resolutionPlan"]};

export async function POST(request:Request){
 try{
  const {title,description}=await request.json();
  if(typeof title!=="string"||typeof description!=="string"||!title.trim()||!description.trim()) return NextResponse.json({error:"Title and description are required."},{status:400});
  const key=process.env.OPENAI_API_KEY;
  if(!key) return NextResponse.json({error:"AI service is not configured."},{status:503});
  const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${key}`},body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-5.6-luna",store:false,instructions:"You are an operations case-analysis assistant. Analyze only the supplied case. Return a classification, priority, confidence, concise factual summary, suggested owner, safe next action, risk signals, missing information needed to resolve the case, and a short proposed resolution plan. Do not claim facts not present in the case. Never execute or imply that you executed a financial, access, compliance, or customer-impacting action. Lower confidence when context is ambiguous.",input:`Case title: ${title.trim()}\nCase description: ${description.trim()}`,text:{format:{type:"json_schema",name:"opspilot_triage",strict:true,schema}}})});
  if(!response.ok) return NextResponse.json({error:"AI triage is temporarily unavailable."},{status:502});
  const data=await response.json();
  if(typeof data.output_text!=="string") return NextResponse.json({error:"AI triage returned no structured output."},{status:502});
  return NextResponse.json({result:JSON.parse(data.output_text),mode:"live"});
 }catch{return NextResponse.json({error:"Unable to generate AI triage."},{status:500});}
}