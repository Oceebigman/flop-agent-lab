const get=id=>document.getElementById(id);
const refresh=get('refresh');
const models=get('models');
async function check(id,path,render){
 const el=get(id);el.textContent='Checking...';el.dataset.state='checking';
 try{
  const res=await fetch(path,{cache:'no-store',signal:AbortSignal.timeout(19000)});
  if(!res.ok){
   const info=await res.json().catch(()=>null);
   throw Error(info?.error || 'Dashboard request returned HTTP '+res.status+'.');
  }
  render(await res.json(),el);
 }catch(e){el.dataset.state='unknown';el.textContent=(e.message||'Unable to complete the check.')+' Current status is unknown.';}
 get(id+'-time').textContent='Last checked: '+new Date().toLocaleString();
}
async function update(){
 refresh.disabled=true;get("scan").hidden=false;models.replaceChildren();
 try{await Promise.all([
  check('health','/health',(d,el)=>{if(typeof d.status!=='string')throw Error('Unexpected health response.');el.dataset.state=['ok','degraded','error'].includes(d.status)?d.status:'unknown';el.textContent='FLOP reports '+d.status+(d.network?.network?' on '+d.network.network:'')+'.';}),
  check('catalog','/v1/models',(d,el)=>{if(!Array.isArray(d.data))throw Error('Unexpected model list response.');
   el.textContent=d.data.length+' listed. Listing alone does not confirm a model can answer.';
   for(const m of d.data){const li=document.createElement('li');li.textContent=m.id;models.append(li);}
  })
 ]);}finally{refresh.disabled=false;get("scan").hidden=true;}
}
refresh.onclick=update;
get('report').onchange=async e=>{
 const out=get('receipt'), file=e.target.files[0];
 if(!file){out.textContent='No report selected.';return;}
 try{
  if(file.size>1000000)throw Error();
  const d=JSON.parse(await file.text());
  if(d.schema!=='flop-agent-lab/v1'||typeof d.request_id!=='string')throw Error();
  const state=d.receipt_state;
  out.textContent=(state==='settled'?'Settled: the report records a completed settlement.':state==='released'?'Released: the request did not settle.':'Unverified: this report does not confirm settlement.')+' Request ID: '+d.request_id;
 }catch{out.textContent='Choose a valid FLOP Agent Lab runner report.';}
};
update();



