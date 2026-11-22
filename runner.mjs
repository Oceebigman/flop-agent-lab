import {readFileSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
const [keyPath,model,scriptPath,existingId]=process.argv.slice(2);
if(!keyPath||!model||(!scriptPath&&!existingId)) {
 console.error('Usage: node runner.mjs KEY_FILE MODEL SCRIPT_FILE [EXISTING_REQUEST_ID]');
 process.exit(2);
}
const key=readFileSync(keyPath,'utf8').trim();
if(!key)throw Error('Empty gateway key');
const id=existingId||randomUUID();
if(!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id))throw Error('Invalid request ID');
const filename='flop-report-'+id+'.json';
const started=Date.now();
const report={schema:'flop-agent-lab/v1',request_id:id,model,started_at:new Date().toISOString(),http_status:null,receipt_state:'unverified'};
const save=()=>writeFileSync(filename,JSON.stringify(report,null,2)+'\n',{mode:0o600});
const request=(path,options={})=>fetch('https://api.flop.network'+path,{...options,headers:{Authorization:'Bearer '+key,...options.headers},signal:AbortSignal.timeout(130000)});
save();
console.log('Request:',id);
if(!existingId){
 const script=readFileSync(scriptPath,'utf8').trim();
 if(!script||script.length>3000)throw Error('Use a script of 1-3000 characters.');
 try{
  const res=await request('/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':id},body:JSON.stringify({model,max_tokens:64,messages:[{role:'user',content:'Summarize these gateway test notes in three short bullets. Separate confirmed observations from unknowns. Notes: '+script}]})});
  report.http_status=res.status;
  const payload=await res.json().catch(()=>({}));
  const code=payload.error?.code;
  if(typeof code==='string'&&/^[a-z_]{1,64}$/.test(code)) report.provider_code=code;
  if(res.ok&&typeof payload.choices?.[0]?.message?.content==='string')console.log(payload.choices[0].message.content);
 } catch(e){report.transport_error=e.name;}
 report.request_ms=Date.now()-started;
 save();
}
try{
 const res=await request('/v1/keys/me/receipts');
 report.receipt_http_status=res.status;
 if(res.ok){
  const body=await res.json();
  const rows=Array.isArray(body)?body:body.receipts??body.data;
  const row=Array.isArray(rows)?rows.find(r=>r.request_id===id):null;
  if(row)report.receipt_state=['settled','released','pending','reserved'].includes(row.state)?row.state:'unknown';
 }
}catch(e){report.receipt_error=e.name;}
save();
console.log(JSON.stringify(report,null,2));



