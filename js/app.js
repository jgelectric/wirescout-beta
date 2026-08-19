
const app = document.getElementById("app");
let state = {view:"jobs", jobId:null, scopeId:null, sectionIndex:0};
const settings = WSDB.getSettings();

function t(k){ return (WS_I18N[settings.language]||WS_I18N.en)[k]||k; }
function id(){ return crypto.randomUUID ? crypto.randomUUID() : Date.now()+"-"+Math.random().toString(16).slice(2); }
function esc(s=""){ return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m])); }
function toast(msg){
  const el=document.createElement("div"); el.className="toast"; el.textContent=msg; document.body.appendChild(el); setTimeout(()=>el.remove(),1800);
}
function saveJob(job){ job.updatedAt=Date.now(); WSDB.upsertJob(job); document.getElementById("syncStatus").textContent="✓ Saved Offline"; }

document.querySelectorAll(".bottom-nav button").forEach(b=>b.onclick=()=>navigate(b.dataset.nav));
function navigate(v){ state.view=v; state.jobId=null; state.scopeId=null; state.sectionIndex=0; render(); }

function render(){
  if(state.view==="jobs") renderJobs();
  else if(state.view==="new") renderNewJob();
  else if(state.view==="templates") renderTemplates();
  else if(state.view==="settings") renderSettings();
  else if(state.view==="job") renderJob();
  else if(state.view==="scope") renderScope();
}

function renderJobs(){
  const jobs=WSDB.getJobs();
  app.innerHTML=`<div class="row space"><div><div class="kicker">WireScout Beta</div><h1>${t("jobs")}</h1></div><button class="btn primary" id="newTop">＋ ${t("newJob")}</button></div>
  ${jobs.length?jobs.map(j=>{
    const done=j.scopes?.length?Math.round(j.scopes.reduce((a,s)=>a+(s.complete?1:0),0)/j.scopes.length*100):0;
    return `<div class="card job-card" data-job="${j.id}">
      <div><b>${esc(j.customer||"Untitled Job")}</b><div class="meta">${esc(j.address||"")} • ${esc(j.date||"")}</div><div class="progress"><div style="width:${done}%"></div></div></div>
      <div>›</div></div>`;
  }).join(""):`<div class="card empty">No jobs yet.<br><br><button class="btn primary" id="emptyNew">Create your first job</button></div>`}`;
  document.getElementById("newTop").onclick=()=>navigate("new");
  const en=document.getElementById("emptyNew"); if(en) en.onclick=()=>navigate("new");
  document.querySelectorAll("[data-job]").forEach(el=>el.onclick=()=>{state.view="job";state.jobId=el.dataset.job;render();});
}

function renderNewJob(){
  const today=new Date().toISOString().slice(0,10);
  app.innerHTML=`<div class="kicker">Start Walkthrough</div><h1>${t("newJob")}</h1>
  <div class="card">
    <div class="grid">
      <div><label>${t("customer")} *</label><input id="customer"></div>
      <div><label>${t("date")} *</label><input id="date" type="date" value="${today}"></div>
      <div><label>${t("address")} *</label><input id="address"></div>
      <div><label>${t("phone")}</label><input id="phone" type="tel"></div>
      <div><label>${t("email")}</label><input id="email" type="email"></div>
    </div><hr>
    <label>${t("permit")}</label><div class="yesno" id="permit">${choiceButtons()}</div>
    <br><label>${t("inspection")}</label><div class="yesno" id="inspection">${choiceButtons()}</div>
    <hr><button class="btn primary block" id="createJob">${t("continue")}</button>
  </div>`;
  wireChoice("permit"); wireChoice("inspection");
  document.getElementById("createJob").onclick=()=>{
    const customer=document.getElementById("customer").value.trim(), address=document.getElementById("address").value.trim();
    if(!customer||!address){toast("Customer and address are required");return;}
    const job={id:id(),customer,address,phone:phone.value,email:email.value,date:date.value,permit:document.getElementById("permit").dataset.value||"unsure",inspection:document.getElementById("inspection").dataset.value||"unsure",scopes:[],createdAt:Date.now(),updatedAt:Date.now()};
    saveJob(job); state.jobId=job.id; state.view="templates"; render();
  };
}
function choiceButtons(){ return `<button class="btn small" data-val="yes">${t("yes")}</button><button class="btn small" data-val="no">${t("no")}</button><button class="btn small active" data-val="unsure">${t("unsure")}</button>`; }
function wireChoice(idv){
  const box=document.getElementById(idv); box.dataset.value="unsure";
  box.querySelectorAll("button").forEach(b=>b.onclick=()=>{box.querySelectorAll("button").forEach(x=>x.classList.remove("active"));b.classList.add("active");box.dataset.value=b.dataset.val;});
}

function renderTemplates(){
  const job=state.jobId?WSDB.getJobs().find(j=>j.id===state.jobId):null;
  app.innerHTML=`<div class="kicker">${job?esc(job.customer):"Built-in"}</div><h1>Choose Job Type</h1>
  <p class="muted">You can add more than one scope to the same job.</p>
  <div class="grid">${Object.entries(WS_TEMPLATES).map(([key,v])=>`<button class="template-card" data-template="${key}">
      <div class="icon">${v.icon}</div><div><b>${esc(v.name)}</b><small>${v.sections.length} sections</small></div></button>`).join("")}</div>`;
  document.querySelectorAll("[data-template]").forEach(el=>el.onclick=()=>{
    if(!job){toast("Create a job first");return;}
    const key=el.dataset.template, tpl=WS_TEMPLATES[key];
    const scope={id:id(),templateKey:key,name:tpl.name,values:{},checks:{},quantities:{},areas:[],notes:"",complete:false};
    job.scopes.push(scope); saveJob(job); state.view="scope";state.scopeId=scope.id;state.sectionIndex=0;render();
  });
}

function renderJob(){
  const job=WSDB.getJobs().find(j=>j.id===state.jobId); if(!job){navigate("jobs");return;}
  app.innerHTML=`<div class="row space"><div><div class="kicker">Job</div><h1>${esc(job.customer)}</h1><p class="muted">${esc(job.address)} • ${esc(job.date)}</p></div><button class="btn small" id="deleteJob">Delete</button></div>
  <div class="card"><div class="grid"><div><label>Permit</label><b>${esc(job.permit)}</b></div><div><label>Inspection</label><b>${esc(job.inspection)}</b></div></div></div>
  <h2>Scopes</h2>
  ${job.scopes.length?job.scopes.map(s=>`<div class="card job-card" data-scope="${s.id}"><div><b>${esc(s.name)}</b><div class="meta">${s.complete?"Complete":"In Progress"}</div></div><div>›</div></div>`).join(""):`<div class="card empty">No scopes yet.</div>`}
  <button class="btn primary block" id="addScope">＋ ${t("addScope")}</button>
  <br><button class="btn block" id="summaryBtn">Job Summary / Print</button>`;
  document.getElementById("addScope").onclick=()=>{state.view="templates";render();};
  document.getElementById("deleteJob").onclick=()=>{ if(confirm("Delete this job?")){WSDB.deleteJob(job.id);navigate("jobs");} };
  document.querySelectorAll("[data-scope]").forEach(el=>el.onclick=()=>{state.view="scope";state.scopeId=el.dataset.scope;state.sectionIndex=0;render();});
  document.getElementById("summaryBtn").onclick=()=>printSummary(job);
}

function renderScope(){
  const job=WSDB.getJobs().find(j=>j.id===state.jobId); if(!job){navigate("jobs");return;}
  const scope=job.scopes.find(s=>s.id===state.scopeId); if(!scope){state.view="job";render();return;}
  const tpl=WS_TEMPLATES[scope.templateKey], sec=tpl.sections[state.sectionIndex];
  const completed = scope.complete ? 100 : Math.round((state.sectionIndex)/(tpl.sections.length)*100);
  app.innerHTML=`<div class="row space"><div><div class="kicker">${esc(job.customer)}</div><h1>${tpl.icon} ${esc(scope.name)}</h1></div><button class="btn small" id="backJob">Job</button></div>
  <div class="progress"><div style="width:${completed}%"></div></div><br>
  <div class="section-tabs">${tpl.sections.map((s,i)=>`<button class="pill ${i===state.sectionIndex?"active":""}" data-sec="${i}">${esc(s.name)}</button>`).join("")}</div>
  <div class="card" id="sectionBody"><h2>${esc(sec.name)}</h2>${renderSection(scope,sec)}</div>
  <div class="row space"><button class="btn" id="prev" ${state.sectionIndex===0?"disabled":""}>← Previous</button>
  <button class="btn primary" id="next">${state.sectionIndex===tpl.sections.length-1?t("finish"):"Next →"}</button></div>`;
  document.getElementById("backJob").onclick=()=>{state.view="job";render();};
  document.querySelectorAll("[data-sec]").forEach(b=>b.onclick=()=>{captureSection(scope,sec);saveJob(job);state.sectionIndex=+b.dataset.sec;render();});
  document.getElementById("prev").onclick=()=>{captureSection(scope,sec);saveJob(job);state.sectionIndex=Math.max(0,state.sectionIndex-1);render();};
  document.getElementById("next").onclick=()=>{captureSection(scope,sec); if(state.sectionIndex===tpl.sections.length-1){scope.complete=true;saveJob(job);toast("Walkthrough complete");state.view="job";render();}else{saveJob(job);state.sectionIndex++;render();}};
  wireSectionActions(job,scope,sec);
}

function renderSection(scope,sec){
  let html="";
  if(sec.pairs) html += sec.pairs.map(f=>`<div class="grid"><div><label>${esc(f)} — Existing</label><input data-field="${esc(f)}__existing" value="${esc(scope.values[f+"__existing"]||"")}"></div><div><label>${esc(f)} — Proposed</label><input data-field="${esc(f)}__proposed" value="${esc(scope.values[f+"__proposed"]||"")}"></div></div><br>`).join("");
  if(sec.fields) html += sec.fields.map(f=>`<div><label>${esc(f)}</label><input data-field="${esc(f)}" value="${esc(scope.values[f]||"")}"></div><br>`).join("");
  if(sec.measurements) html += sec.measurements.map(f=>`<div class="grid"><div><label>${esc(f)}</label><input data-field="${esc(f)}" value="${esc(scope.values[f]||"")}" inputmode="decimal"></div><div><label>Unit</label><select data-field="${esc(f)}__unit"><option>ft</option><option>in</option><option>m</option><option>cm</option></select></div></div><br>`).join("");
  if(sec.yesno) html += sec.yesno.map(f=>`<div><label>${esc(f)}</label><div class="pills" data-yn="${esc(f)}">${["Yes","No","Not Sure"].map(v=>`<button class="pill ${scope.values[f]===v?"active":""}" data-v="${v}">${v}</button>`).join("")}</div></div><br>`).join("");
  if(sec.quantities) html += sec.quantities.map(f=>qtyRow(scope,f)).join("");
  if(sec.checklist) html += sec.checklist.map(f=>`<label class="row" style="margin:10px 0;color:var(--text)"><input style="width:auto" type="checkbox" data-check="${esc(f)}" ${scope.checks[f]?"checked":""}> <span>${esc(f)}</span></label>`).join("");
  if(sec.type==="notes") html += `<label>Text Notes</label><textarea id="notesArea">${esc(scope.notes||"")}</textarea><br><button class="btn" id="voiceBtn">🎙️ Start Voice Note</button><p class="muted" id="voiceStatus">Voice notes are saved in this job session as audio files when your browser supports recording.</p>`;
  if(sec.type==="photos") html += `<div class="notice">Photos save locally to this job and work offline after the app is installed.</div><br><input id="photoInput" type="file" accept="image/*" capture="environment" multiple><div id="photoGrid" class="photo-grid" style="margin-top:12px"></div>`;
  if(sec.type==="areas") html += renderAreas(scope);
  if(sec.type==="custom") html += renderCustom(scope);
  return html || `<p class="muted">No fields in this section yet.</p>`;
}

function qtyRow(scope,f){
  const q=scope.quantities[f]||0;
  return `<div class="qty-row"><div>${esc(f)}</div><div class="qty-controls"><button data-qminus="${esc(f)}">−</button><span class="qty-num" data-qnum="${esc(f)}">${q}</span><button data-qplus="${esc(f)}">+</button></div></div>`;
}
function renderAreas(scope){
  const areas=scope.areas||[];
  return `<div id="areas">${areas.map((a,i)=>`<details><summary>${esc(a.name||("Area "+(i+1)))}</summary>
    <br><label>Area Name</label><input data-area-name="${i}" value="${esc(a.name||"")}"><br><br>
    ${WS_AREA_ITEMS.map(f=>`<div class="qty-row"><div>${esc(f)}</div><div class="qty-controls"><button data-area-minus="${i}|${esc(f)}">−</button><span class="qty-num">${a.quantities?.[f]||0}</span><button data-area-plus="${i}|${esc(f)}">+</button></div></div>`).join("")}
    <br><label>Area Notes</label><textarea data-area-notes="${i}">${esc(a.notes||"")}</textarea>
  </details>`).join("")}</div>
  <button class="btn primary block" id="addArea">＋ Add Area</button>`;
}
function renderCustom(scope){
  const fields=scope.customFields||[];
  return `${fields.map((f,i)=>`<div class="grid"><div><label>Field ${i+1}</label><input data-custom-label="${i}" value="${esc(f.label||"")}"></div><div><label>Value</label><input data-custom-value="${i}" value="${esc(f.value||"")}"></div></div><br>`).join("")}
  <button class="btn primary" id="addCustomField">＋ Add Custom Field</button>`;
}

function captureSection(scope,sec){
  document.querySelectorAll("[data-field]").forEach(el=>scope.values[el.dataset.field]=el.value);
  document.querySelectorAll("[data-check]").forEach(el=>scope.checks[el.dataset.check]=el.checked);
  document.querySelectorAll("[data-area-name]").forEach(el=>scope.areas[+el.dataset.areaName].name=el.value);
  document.querySelectorAll("[data-area-notes]").forEach(el=>scope.areas[+el.dataset.areaNotes].notes=el.value);
  document.querySelectorAll("[data-custom-label]").forEach(el=>scope.customFields[+el.dataset.customLabel].label=el.value);
  document.querySelectorAll("[data-custom-value]").forEach(el=>scope.customFields[+el.dataset.customValue].value=el.value);
  const n=document.getElementById("notesArea"); if(n) scope.notes=n.value;
}

function wireSectionActions(job,scope,sec){
  document.querySelectorAll("[data-qplus]").forEach(b=>b.onclick=()=>{scope.quantities[b.dataset.qplus]=(scope.quantities[b.dataset.qplus]||0)+1;saveJob(job);render();});
  document.querySelectorAll("[data-qminus]").forEach(b=>b.onclick=()=>{scope.quantities[b.dataset.qminus]=Math.max(0,(scope.quantities[b.dataset.qminus]||0)-1);saveJob(job);render();});
  document.querySelectorAll("[data-yn]").forEach(box=>box.querySelectorAll("button").forEach(b=>b.onclick=()=>{scope.values[box.dataset.yn]=b.dataset.v;saveJob(job);render();}));
  const aa=document.getElementById("addArea"); if(aa) aa.onclick=()=>{scope.areas.push({name:"New Area",quantities:{},notes:""});saveJob(job);render();};
  document.querySelectorAll("[data-area-plus]").forEach(b=>b.onclick=()=>areaQty(job,scope,b.dataset.areaPlus,1));
  document.querySelectorAll("[data-area-minus]").forEach(b=>b.onclick=()=>areaQty(job,scope,b.dataset.areaMinus,-1));
  const ac=document.getElementById("addCustomField"); if(ac) ac.onclick=()=>{scope.customFields=scope.customFields||[];scope.customFields.push({label:"",value:""});saveJob(job);render();};
  const pi=document.getElementById("photoInput"); if(pi){ pi.onchange=async e=>{for(const file of [...e.target.files]){await WSDB.addPhoto({id:id(),jobId:job.id,scopeId:scope.id,name:file.name,type:file.type,blob:file,createdAt:Date.now()});} toast("Photo saved to job"); loadPhotos(job.id,scope.id);}; loadPhotos(job.id,scope.id); }
  const vb=document.getElementById("voiceBtn"); if(vb) setupVoice(job,scope);
}
function areaQty(job,scope,key,delta){
  const [idxStr,item]=key.split("|"); const idx=+idxStr; const a=scope.areas[idx]; a.quantities=a.quantities||{}; a.quantities[item]=Math.max(0,(a.quantities[item]||0)+delta); saveJob(job); render();
}
async function loadPhotos(jobId,scopeId){
  const grid=document.getElementById("photoGrid"); if(!grid)return;
  const photos=await WSDB.getPhotos(jobId,scopeId); grid.innerHTML="";
  photos.forEach(p=>{const wrap=document.createElement("div"); const img=document.createElement("img"); img.src=URL.createObjectURL(p.blob); wrap.appendChild(img); grid.appendChild(wrap);});
}
function setupVoice(job,scope){
  let mediaRecorder,chunks=[];
  const btn=document.getElementById("voiceBtn"), status=document.getElementById("voiceStatus");
  btn.onclick=async()=>{
    if(mediaRecorder && mediaRecorder.state==="recording"){mediaRecorder.stop();btn.textContent="🎙️ Start Voice Note";return;}
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      mediaRecorder=new MediaRecorder(stream); chunks=[];
      mediaRecorder.ondataavailable=e=>chunks.push(e.data);
      mediaRecorder.onstop=async()=>{const blob=new Blob(chunks,{type:mediaRecorder.mimeType});await WSDB.addPhoto({id:id(),jobId:job.id,scopeId:scope.id,name:"voice-note.webm",type:blob.type,blob,createdAt:Date.now(),kind:"voice"});status.textContent="✓ Voice note saved locally";stream.getTracks().forEach(t=>t.stop());};
      mediaRecorder.start();btn.textContent="■ Stop Recording";status.textContent="Recording…";
    }catch(e){status.textContent="Voice recording is not available in this browser."; }
  };
}

function renderSettings(){
  app.innerHTML=`<div class="kicker">WireScout</div><h1>${t("settings")}</h1>
  <div class="card"><h2>General</h2>
    <label>Language</label><select id="language"><option value="en">English</option><option value="es">Español</option></select><br><br>
    <label>Units</label><select id="units"><option value="imperial">Feet & Inches</option><option value="metric">Metric</option></select>
  </div>
  <div class="card"><h2>Data</h2><p class="muted">This beta saves jobs on this device first. Cloud sync is not enabled yet.</p>
  <button class="btn block" id="exportData">Export Backup JSON</button></div>
  <div class="card"><h2>About</h2><p>WireScout Beta — offline-first jobsite walkthroughs for electricians.</p></div>`;
  language.value=settings.language; units.value=settings.units;
  language.onchange=()=>{settings.language=language.value;WSDB.saveSettings(settings);location.reload();};
  units.onchange=()=>{settings.units=units.value;WSDB.saveSettings(settings);toast("Units saved");};
  document.getElementById("exportData").onclick=()=>{const blob=new Blob([JSON.stringify(WSDB.getJobs(),null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="wirescout-backup.json";a.click();};
}

function printSummary(job){
  const html=`<html><head><title>WireScout Jobsite Report</title><style>body{font-family:Arial;padding:30px;color:#111}h1{margin-bottom:0}small{color:#666}section{margin:24px 0}li{margin:5px 0}</style></head><body>
  <h1>WireScout Jobsite Report</h1><small>Walk the job. Capture the scope. Don't forget a thing.</small>
  <section><b>${esc(job.customer)}</b><br>${esc(job.address)}<br>${esc(job.date)}<br>Permit: ${esc(job.permit)} • Inspection: ${esc(job.inspection)}</section>
  ${job.scopes.map(s=>`<section><h2>${esc(s.name)}</h2>
    ${Object.keys(s.values||{}).length?`<h3>Details</h3><ul>${Object.entries(s.values).filter(([,v])=>v).map(([k,v])=>`<li><b>${esc(k)}:</b> ${esc(v)}</li>`).join("")}</ul>`:""}
    ${Object.keys(s.quantities||{}).length?`<h3>Quantities</h3><ul>${Object.entries(s.quantities).filter(([,v])=>v).map(([k,v])=>`<li>${esc(k)}: ${v}</li>`).join("")}</ul>`:""}
    ${(s.areas||[]).length?`<h3>Areas</h3>${s.areas.map(a=>`<p><b>${esc(a.name)}</b><br>${Object.entries(a.quantities||{}).filter(([,v])=>v).map(([k,v])=>`${esc(k)}: ${v}`).join(" • ")}<br>${esc(a.notes||"")}</p>`).join("")}`:""}
    ${s.notes?`<h3>Notes</h3><p>${esc(s.notes)}</p>`:""}
  </section>`).join("")}
  <script>window.onload=()=>window.print()<\/script></body></html>`;
  const w=window.open("","_blank");w.document.write(html);w.document.close();
}

window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();window.deferredPrompt=e;});
if("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js");
render();
