
const app = document.getElementById("app");
let state = {view:"jobs", jobId:null, scopeId:null, sectionIndex:0};
const settings = WSDB.getSettings();
const TRIAL_KEY = "wirescout_trial_v1";
function trialActive(){ return localStorage.getItem(TRIAL_KEY)==="1" && !WSCloud.getUser(); }
function startTrial(){ localStorage.setItem(TRIAL_KEY,"1"); WSDB.setUserNamespace(null); }
function endTrial(){ localStorage.removeItem(TRIAL_KEY); }
function trialLimitReached(){ return trialActive() && WSDB.getGuestJobs().length >= 1; }


function t(k){ return (WS_I18N[settings.language]||WS_I18N.en)[k]||k; }
function id(){ return crypto.randomUUID ? crypto.randomUUID() : Date.now()+"-"+Math.random().toString(16).slice(2); }
function esc(s=""){ return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m])); }
function toast(msg){
  const el=document.createElement("div"); el.className="toast"; el.textContent=msg; document.body.appendChild(el); setTimeout(()=>el.remove(),1800);
}
async function saveJob(job){
  job.updatedAt=Date.now(); WSDB.upsertJob(job);
  const status=document.getElementById("syncStatus");
  if(status) status.textContent=WSCloud.getUser()?"↻ Saving…":"✓ Saved Offline";
  if(WSCloud.getUser()){
    const ok=await WSCloud.saveJob(job);
    if(status) status.textContent=ok?"✓ Saved to Account":"✓ Saved Offline";
  }
}

document.querySelectorAll(".bottom-nav button").forEach(b=>b.onclick=()=>navigate(b.dataset.nav));
function navigate(v){
  if(WSCloud.configured() && !WSCloud.getUser() && !trialActive() && !["settings","account"].includes(v)) v="account";
  state.view=v; state.jobId=null; state.scopeId=null; state.sectionIndex=0; render();
}

function render(){
  if(state.view==="jobs") renderJobs();
  else if(state.view==="new") renderNewJob();
  else if(state.view==="templates") renderTemplates();
  else if(state.view==="settings") renderSettings();
  else if(state.view==="account") renderAccount();
  else if(state.view==="plans") renderPlans();
  else if(state.view==="job") renderJob();
  else if(state.view==="scope") renderScope();
}

function renderJobs(){
  const jobs=WSDB.getJobs();
  const trialBanner=trialActive()?`<div class="notice trial-notice"><b>Trial Mode</b> — Try one complete job without an account. <button class="link-btn" id="trialCreateAccount">Create a free account to keep it</button></div>`:"";
  app.innerHTML=`<div class="row space"><div><div class="kicker">WireScout Beta</div><h1>${t("jobs")}</h1></div><button class="btn primary" id="newTop">＋ ${t("newJob")}</button></div>${trialBanner}
  ${jobs.length?jobs.map(j=>{
    const done=j.scopes?.length?Math.round(j.scopes.reduce((a,s)=>a+(s.complete?1:0),0)/j.scopes.length*100):0;
    return `<div class="card job-card" data-job="${j.id}">
      <div><b>${esc(j.customer||"Untitled Job")}</b><div class="meta">${esc(j.address||"")} • ${esc(j.date||"")}</div><div class="progress"><div style="width:${done}%"></div></div></div>
      <div>›</div></div>`;
  }).join(""):`<div class="card empty">No jobs yet.<br><br><button class="btn primary" id="emptyNew">Create your first job</button></div>`}`;
  const goNew=()=>{if(trialLimitReached()){toast("Trial includes one job. Create a free account to save more."); state.view="account"; render(); return;} navigate("new");};
  document.getElementById("newTop").onclick=goNew;
  const en=document.getElementById("emptyNew"); if(en) en.onclick=goNew;
  const tca=document.getElementById("trialCreateAccount"); if(tca) tca.onclick=()=>{state.view="account";render();};
  document.querySelectorAll("[data-job]").forEach(el=>el.onclick=()=>{state.view="job";state.jobId=el.dataset.job;render();});
}

function renderNewJob(){
  if(trialLimitReached()){
    app.innerHTML=`<div class="auth-shell"><div class="auth-card"><div class="logo auth-logo">⚡</div><h1>Your trial job is ready</h1><p class="muted">The no-account trial includes one job. Create a free account to keep this job, sync it, and create more.</p><button class="btn primary block" id="trialUpgrade">Create Free Account</button><br><button class="btn block" id="trialBack">Back to Trial Job</button></div></div>`;
    document.getElementById("trialUpgrade").onclick=()=>{state.view="account";render();};
    document.getElementById("trialBack").onclick=()=>{state.view="jobs";render();};
    return;
  }
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
  document.getElementById("deleteJob").onclick=async()=>{ if(confirm("Delete this job?")){WSDB.deleteJob(job.id);await WSCloud.deleteJob(job.id);navigate("jobs");} };
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

const FIELD_CHOICES = {
  "Service Size":["60A","100A","125A","150A","200A","320/400A"],
  "Service Type":["Overhead","Underground"], "Meter":["Existing OK","Replace","Relocate","New"],
  "Exterior Disconnect":["Yes","No","Add New"], "Service Entrance Type":["Overhead","Underground","Mast","SE Cable","Conduit"],
  "Utility Coordination":["Eversource","Unitil","Liberty","Municipal","Not Sure"],
  "Panel Amperage":["100A","125A","150A","200A","225A","400A"], "Panel Location":["Basement","Garage","Utility Room","Exterior","Closet"],
  "Main Breaker":["60A","100A","125A","150A","200A","225A","Main Lug"], "Panel Spaces":["12","20","24","30","40","42","54"],
  "Existing Panel Brand":["Eaton","Square D","Siemens","GE","Leviton","Federal Pacific","Zinsco"], "Proposed Panel Brand":["Eaton","Square D","Siemens","GE","Leviton"],
  "Manufacturer":["Eaton","Square D","Siemens","GE","Leviton","Other"], "Panel Manufacturer":["Eaton","Square D","Siemens","GE","Leviton"],
  "Panel Rating":["100A","125A","150A","200A","225A","400A"], "Amperage":["60A","100A","125A","150A","200A","225A","400A"],
  "Work Type":["Replace","New","Relocate","Upgrade","Add Subpanel"], "New Amperage":["100A","125A","150A","200A","225A","400A"],
  "Main Breaker / Main Lug":["Main Breaker","Main Lug"], "Indoor / Outdoor":["Indoor","Outdoor"],
  "Type":["Portable","Standby","Inverter"], "Fuel":["Natural Gas","Propane","Gasoline","Diesel"],
  "Generator Size":["7.5 kW","10 kW","14 kW","18 kW","22 kW","24 kW","26 kW"],
  "Transfer Equipment":["Automatic Transfer Switch","Manual Transfer Switch","Interlock"],
  "Supply Responsibility":["Contractor","Customer","TBD"], "Charging Amperage":["32A","40A","48A","60A","80A"],
  "Circuit Amperage":["40A","50A","60A","80A","100A"], "Breaker Required":["2-Pole 40A","2-Pole 50A","2-Pole 60A","2-Pole 80A","2-Pole 100A"],
  "Route":["Basement","Attic","Exterior","Garage","Crawlspace","Finished Area"], "Conduit Type":["EMT","PVC","FMC","LFMC","Rigid","None"],
  "Mounting Surface":["Drywall","Wood","Concrete","Brick","Siding","Post"], "Parking Location":["Garage","Driveway","Carport","Parking Lot"],
  "Fixture Type":["Recessed","Flush Mount","Pendant","Sconce","Track","Chandelier"], "Fixture Supplied By":["Contractor","Customer","TBD"],
  "Size":["2 in","3 in","4 in","5 in","6 in"], "Wafer / Can / Other":["Wafer","Can","Canless Gimbal"],
  "Color Temperature":["2700K","3000K","3500K","4000K","5000K","Selectable"], "Trim Color":["White","Black","Bronze","Nickel"],
  "New / Existing Construction":["New Construction","Existing Construction","Addition","Remodel"],
  "Building / Space Type":["Office","Retail","Restaurant","Warehouse","Shop","Multifamily","Mixed Use"],
  "Ceiling Type":["Drywall","ACT / Drop Ceiling","Open","Wood","Plaster"], "Wall Construction":["Wood Stud","Metal Stud","Masonry","Concrete"],
  "Existing Wiring Access":["Open","Limited","Finished","Unknown"], "Fan Duct Route":["Roof","Soffit","Exterior Wall","Existing Duct"],
  "Existing Circuit":["15A","20A","Dedicated","Shared","Unknown"], "Conduit Type":["EMT","PVC","FMC","LFMC","Rigid","None"]
};
function choicesFor(field){
  if(FIELD_CHOICES[field]) return FIELD_CHOICES[field];
  if(/brand|manufacturer/i.test(field)) return ["Eaton","Square D","Siemens","GE","Leviton"];
  if(/location/i.test(field)) return ["Interior","Exterior","Basement","Garage","Utility Room"];
  if(/suppl/i.test(field)) return ["Contractor","Customer","TBD"];
  if(/required|needed|available|checked|present/i.test(field)) return ["Yes","No","Not Sure"];
  return ["Existing","New","Replace","Relocate","N/A"];
}
function quickField(scope,key,label,choices){
  const val=scope.values[key]||""; const opts=choices||choicesFor(label);
  return `<div class="quick-field"><label>${esc(label)}</label><div class="pills" data-quick="${esc(key)}">${opts.map(v=>`<button type="button" class="pill ${val===v?"active":""}" data-v="${esc(v)}">${esc(v)}</button>`).join("")}<button type="button" class="pill ${val && !opts.includes(val)?"active":""}" data-other="1">Other / Type</button></div><input class="quick-other ${val && !opts.includes(val)?"show":""}" data-field="${esc(key)}" data-quick-input="${esc(key)}" value="${esc(val)}" placeholder="Type custom answer…"></div>`;
}
function renderSection(scope,sec){
  let html="";
  if(sec.pairs) html += sec.pairs.map(f=>`<div class="pair-block"><div class="pair-title">${esc(f)}</div><div class="grid">${quickField(scope,f+"__existing","Existing",choicesFor(f))}${quickField(scope,f+"__proposed","Proposed",choicesFor(f))}</div></div>`).join("");
  if(sec.fields) html += sec.fields.map(f=>quickField(scope,f,f,choicesFor(f))).join("");
  if(sec.measurements) html += sec.measurements.map(f=>`<div class="measure-field"><label>${esc(f)}</label><div class="measure-row"><input data-field="${esc(f)}" value="${esc(scope.values[f]||"")}" inputmode="decimal" placeholder="0"><span>${settings.units==="metric"?"m":"ft"}</span><input type="hidden" data-field="${esc(f)}__unit" value="${settings.units==="metric"?"m":"ft"}"></div></div>`).join("");
  if(sec.yesno) html += sec.yesno.map(f=>`<div class="quick-field"><label>${esc(f)}</label><div class="pills" data-yn="${esc(f)}">${["Yes","No","N/A","Not Sure"].map(v=>`<button type="button" class="pill ${scope.values[f]===v?"active":""}" data-v="${v}">${v}</button>`).join("")}</div></div>`).join("");
  if(sec.quantities) html += sec.quantities.map(f=>qtyRow(scope,f)).join("");
  if(sec.checklist) html += `<div class="multi-choice">${sec.checklist.map(f=>`<label class="check-pill ${scope.checks[f]?"active":""}"><input type="checkbox" data-check="${esc(f)}" ${scope.checks[f]?"checked":""}> <span>${esc(f)}</span></label>`).join("")}</div>`;
  if(sec.type==="notes") html += `<label>Text Notes</label><textarea id="notesArea">${esc(scope.notes||"")}</textarea><br><button class="btn" id="voiceBtn">🎙️ Start Voice Note</button><p class="muted" id="voiceStatus">Voice notes are saved in this job session as audio files when your browser supports recording.</p>`;
  if(sec.type==="photos") html += `<div class="notice">Photos save locally to this job and work offline after the app is installed.</div><br><input id="photoInput" type="file" accept="image/*" capture="environment" multiple><div id="photoGrid" class="photo-grid" style="margin-top:12px"></div>`;
  if(sec.type==="areas") html += renderAreas(scope);
  if(sec.type==="custom") html += renderCustom(scope);
  return html || `<p class="muted">No fields in this section yet.</p>`;
}
function qtyRow(scope,f){
  const q=scope.quantities[f]||0;
  if(f==="Recessed Lights"){
    const size=scope.values["Recessed Light Size"]||"4\"";
    const type=scope.values["Recessed Light Type"]||"Wafer";
    return `<div class="qty-row recessed-qty"><div><div>${esc(f)}</div><div class="recessed-options"><span class="mini-label">Size</span><div class="mini-pills" data-recessed-option="Recessed Light Size">${["4\"","6\"","Other"].map(v=>`<button type="button" class="mini-pill ${size===v?"active":""}" data-v="${esc(v)}">${esc(v)}</button>`).join("")}</div><span class="mini-label">Type</span><div class="mini-pills" data-recessed-option="Recessed Light Type">${["Wafer","Can","Retrofit"].map(v=>`<button type="button" class="mini-pill ${type===v?"active":""}" data-v="${esc(v)}">${esc(v)}</button>`).join("")}</div></div></div><div class="qty-controls"><button data-qminus="${esc(f)}">−</button><span class="qty-num" data-qnum="${esc(f)}">${q}</span><button data-qplus="${esc(f)}">+</button></div></div>`;
  }
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
  document.querySelectorAll("[data-quick]").forEach(box=>box.querySelectorAll("button").forEach(b=>b.onclick=()=>{
    const key=box.dataset.quick, input=document.querySelector(`[data-quick-input="${CSS.escape(key)}"]`);
    if(b.dataset.other){ box.querySelectorAll("button").forEach(x=>x.classList.remove("active")); b.classList.add("active"); input.classList.add("show"); input.focus(); }
    else { scope.values[key]=b.dataset.v; input.value=b.dataset.v; input.classList.remove("show"); saveJob(job); render(); }
  }));
  document.querySelectorAll("[data-recessed-option]").forEach(box=>box.querySelectorAll("button").forEach(b=>b.onclick=()=>{scope.values[box.dataset.recessedOption]=b.dataset.v;saveJob(job);render();}));
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
  const localIds=new Set();
  photos.forEach(p=>{
    localIds.add(p.id); const wrap=document.createElement("div");
    if((p.kind||"")==="voice" || String(p.type||"").startsWith("audio/")){ const a=document.createElement("audio");a.controls=true;a.src=URL.createObjectURL(p.blob);wrap.appendChild(a); }
    else { const img=document.createElement("img"); img.src=URL.createObjectURL(p.blob); wrap.appendChild(img); }
    grid.appendChild(wrap);
  });
  if(WSCloud.getUser()){
    const remote=await WSCloud.getFiles(jobId,scopeId);
    remote.filter(f=>!localIds.has(f.id)).forEach(f=>{const wrap=document.createElement("div"); if(f.kind==="voice"||String(f.mime_type||"").startsWith("audio/")){const a=document.createElement("audio");a.controls=true;a.src=f.url;wrap.appendChild(a);}else{const img=document.createElement("img");img.src=f.url;wrap.appendChild(img);}grid.appendChild(wrap);});
  }
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

function renderAccount(){
  if(!WSCloud.configured()){
    app.innerHTML=`<div class="auth-shell"><div class="auth-card"><div class="logo auth-logo">⚡</div><h1>Cloud setup needed</h1><p class="muted">The account screens are built, but this copy still needs your Supabase Project URL and publishable key in <b>js/config.js</b>.</p><div class="notice">Run <b>supabase-schema.sql</b> in your Supabase SQL Editor first, then add the two values to <b>js/config.js</b>.</div><br><button class="btn block" id="offlineMode">Continue in Offline Test Mode</button></div></div>`;
    document.getElementById("offlineMode").onclick=()=>{state.view="jobs";render();}; return;
  }
  const u=WSCloud.getUser();
  if(u){
    const name=esc(u.user_metadata?.display_name||u.email||"WireScout User"), company=esc(u.user_metadata?.company_name||"");
    app.innerHTML=`<div class="kicker">Account</div><h1>${name}</h1><div class="card"><h2>${company||"WireScout Account"}</h2><p class="muted">${esc(u.email||"")}</p><div class="account-ok">✓ Jobs, photos and voice notes sync to this account.</div><div id="planBox" class="notice" style="margin-top:14px">Loading your plan…</div><br><button class="btn primary block" id="goJobs">Go to My Jobs</button><br><button class="btn block" id="plansBtn">View Plans</button><br><button class="btn block" id="syncNow">Sync Now</button><br><button class="btn danger block" id="signOut">Sign Out</button></div>`;
    document.getElementById("goJobs").onclick=()=>navigate("jobs");
    document.getElementById("plansBtn").onclick=()=>{state.view="plans";render();};
    document.getElementById("syncNow").onclick=async()=>{toast("Syncing…");await WSCloud.syncJobs();toast("Sync complete");render();};
    document.getElementById("signOut").onclick=async()=>{await WSCloud.signOut();state.view="account";render();};
    WSCloud.getProfile().then(p=>{const box=document.getElementById("planBox");if(!box)return;const plan=(p?.plan||"beta").toUpperCase();const status=p?.plan_status||"active";box.innerHTML=`<b>${esc(plan)} PLAN</b><br><span class="muted">Status: ${esc(status)}${plan==="BETA"?" • Beta remains free while WireScout is being tested.":""}</span>`;});
    return;
  }
  app.innerHTML=`<div class="auth-shell"><div class="auth-card"><div class="logo auth-logo">⚡</div><h1>Welcome to WireScout</h1><p><strong>Built for electricians, by a Master Electrician.</strong></p><p class="muted">Sign in to keep your jobs under your own account and access them from another device.</p>
  <div class="auth-tabs"><button class="pill active" id="tabSignIn">Sign In</button><button class="pill" id="tabCreate">Create Account</button></div>
  <form id="authForm"><div id="createFields" class="hidden"><label>Your Name</label><input id="authName" autocomplete="name"><br><label>Company Name</label><input id="authCompany" autocomplete="organization"><br></div><label>Email</label><input id="authEmail" type="email" autocomplete="email" required><br><label>Password</label><input id="authPassword" type="password" autocomplete="current-password" minlength="6" required><br><br><button class="btn primary block" id="authSubmit" type="submit">Sign In</button></form><p class="muted auth-note" id="authNote"></p><div class="auth-divider"><span>or</span></div><button class="btn block trial-btn" id="tryWireScout">Try WireScout — No Account</button><p class="muted auth-note">Try one complete job and generate a sample PDF. Create an account later to keep your work and sync across devices.</p></div></div>`;
  let mode="signin"; const createFields=document.getElementById("createFields"), submit=document.getElementById("authSubmit"), note=document.getElementById("authNote");
  function setMode(m){mode=m;createFields.classList.toggle("hidden",m!=="create");submit.textContent=m==="create"?"Create Account":"Sign In";document.getElementById("authPassword").autocomplete=m==="create"?"new-password":"current-password";document.getElementById("tabSignIn").classList.toggle("active",m==="signin");document.getElementById("tabCreate").classList.toggle("active",m==="create");note.textContent="";}
  document.getElementById("tabSignIn").onclick=()=>setMode("signin"); document.getElementById("tabCreate").onclick=()=>setMode("create");
  document.getElementById("tryWireScout").onclick=()=>{startTrial();toast("Trial mode started");state.view="jobs";render();};
  document.getElementById("authForm").onsubmit=async e=>{e.preventDefault();submit.disabled=true;note.textContent="";try{const email=document.getElementById("authEmail").value.trim(),password=document.getElementById("authPassword").value;if(mode==="create"){const data=await WSCloud.signUp({email,password,displayName:document.getElementById("authName").value.trim(),companyName:document.getElementById("authCompany").value.trim()});if(data.session){endTrial();toast("Account created");state.view="jobs";render();}else{note.textContent="Account created. Check your email to confirm your address, then sign in.";setMode("signin");}}else{await WSCloud.signIn(email,password);endTrial();toast("Signed in");state.view="jobs";render();}}catch(err){note.textContent=err.message||"Unable to sign in.";}finally{submit.disabled=false;}};
}

function renderPlans(){
  const u=WSCloud.getUser();
  app.innerHTML=`<div class="kicker">WireScout Plans</div><h1>Simple plans for the jobsite</h1><p class="muted">WireScout Beta is free right now. This screen prepares your account for paid plans later — no payment will be taken during beta.</p>
  <div class="card"><h2>Beta</h2><div class="price">FREE</div><p>Full beta access while WireScout is being tested.</p><div class="account-ok">✓ Your current beta account stays active</div></div>
  <div class="card"><h2>WireScout Pro</h2><div class="price">$9.99 <small>/ month</small></div><p class="muted">Planned launch price</p><p>Unlimited jobs • Cloud sync • Photos & voice notes • Professional PDFs</p><button class="btn primary block" id="proInterest">Pro — Coming Soon</button></div>
  <div class="card"><h2>Pro Annual</h2><div class="price">$99 <small>/ year</small></div><p>Same Pro features with annual billing.</p><button class="btn block" id="annualInterest">Annual — Coming Soon</button></div>
  <div class="notice"><b>No charges yet.</b> Stripe checkout will be connected only when you are ready to start billing customers.</div><br><button class="btn block" id="plansBack">Back to Account</button>`;
  document.getElementById("plansBack").onclick=()=>{state.view=u?"account":"settings";render();};
  document.getElementById("proInterest").onclick=()=>toast("Pro billing is coming soon — beta stays free.");
  document.getElementById("annualInterest").onclick=()=>toast("Annual billing is coming soon — beta stays free.");
}

function renderSettings(){
  const u=WSCloud.getUser();
  const cloudText=!WSCloud.configured()?"Account feature is built but Supabase is not connected yet.":u?`Signed in as <b>${esc(u.email||"")}</b>. Jobs save locally first and sync to your private account.`:trialActive()?"You are using Trial Mode. Your one trial job is saved only on this device until you create an account.":"Sign in to turn on private cloud backup and multi-device access.";
  app.innerHTML=`<div class="kicker">WireScout</div><h1>${t("settings")}</h1>
  <div class="card"><h2>Account & Cloud</h2><p class="muted">${cloudText}</p><button class="btn primary block" id="accountBtn">${u?"Manage Account":"Sign In / Create Account"}</button></div>
  <div class="card"><h2>General</h2><label>Language</label><select id="language"><option value="en">English</option><option value="es">Español</option></select><br><br><label>Units</label><select id="units"><option value="imperial">Feet & Inches</option><option value="metric">Metric</option></select></div>
  <div class="card"><h2>Data</h2><p class="muted">Offline-first: your current account keeps a local copy for jobsite use. When online, changes sync to the account.</p><button class="btn block" id="exportData">Export Backup JSON</button></div>
  <div class="card"><h2>Plans</h2><p class="muted">Beta is free now. Pro is prepared for $9.99/month or $99/year when billing launches.</p><button class="btn block" id="viewPlans">View Plans</button></div>
  <div class="card"><h2>About</h2><p>WireScout Beta — offline-first jobsite walkthroughs for electricians.</p><p><strong>Built for electricians, by a Master Electrician.</strong></p></div>`;
  language.value=settings.language; units.value=settings.units;
  document.getElementById("accountBtn").onclick=()=>{state.view="account";render();};
  document.getElementById("viewPlans").onclick=()=>{state.view="plans";render();};
  language.onchange=()=>{settings.language=language.value;WSDB.saveSettings(settings);location.reload();};
  units.onchange=()=>{settings.units=units.value;WSDB.saveSettings(settings);toast("Units saved");};
  document.getElementById("exportData").onclick=()=>{const blob=new Blob([JSON.stringify(WSDB.getJobs(),null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="wirescout-backup.json";a.click();};
}

function reportLabel(k){ return k.replace(/__existing$/, " — Existing").replace(/__proposed$/, " — Proposed").replace(/__unit$/, " Unit").replace(/_/g," "); }
function printSummary(job){
  const scopes=job.scopes.map(s=>{
    const vals=Object.entries(s.values||{}).filter(([k,v])=>v && !k.endsWith("__unit") && String(v).trim());
    const detail=vals.map(([k,v])=>{const unit=s.values[k+"__unit"];return `<div class="item"><b>${esc(reportLabel(k))}</b><span>${esc(v)}${unit?" "+esc(unit):""}</span></div>`}).join("");
    const qty=Object.entries(s.quantities||{}).filter(([,v])=>Number(v)>0).map(([k,v])=>`<div class="item"><b>${esc(k)}</b><span>${v}</span></div>`).join("");
    const checks=Object.entries(s.checks||{}).filter(([,v])=>v).map(([k])=>`<span class="tag">✓ ${esc(k)}</span>`).join("");
    const areas=(s.areas||[]).filter(a=>a.name||a.notes||Object.values(a.quantities||{}).some(v=>v)).map(a=>`<div class="area"><b>${esc(a.name||"Area")}</b> ${Object.entries(a.quantities||{}).filter(([,v])=>v).map(([k,v])=>`<span>${esc(k)}: ${v}</span>`).join(" • ")}${a.notes?`<div>${esc(a.notes)}</div>`:""}</div>`).join("");
    if(!detail&&!qty&&!checks&&!areas&&!s.notes) return "";
    return `<section><h2>${esc(s.name)}</h2>${detail||qty?`<div class="details">${detail}${qty}</div>`:""}${checks?`<div class="tags">${checks}</div>`:""}${areas}${s.notes?`<div class="notes"><b>Notes</b><div>${esc(s.notes)}</div></div>`:""}</section>`;
  }).join("");
  const html=`<html><head><title>WireScout Jobsite Report</title><style>@page{size:auto;margin:.45in}*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;margin:0;color:#182230;font-size:11px}header{border-bottom:3px solid #f7c52b;padding-bottom:10px;margin-bottom:12px}h1{font-size:22px;margin:0;color:#0b1f3a}header small{color:#6e7a89}.job{display:grid;grid-template-columns:2fr 1fr;gap:8px;background:#f5f7fa;border-radius:8px;padding:10px;margin-bottom:12px}.job b{font-size:13px}section{break-inside:avoid;margin:0 0 12px}h2{font-size:15px;color:#0b1f3a;margin:0 0 6px;border-bottom:1px solid #dbe2ea;padding-bottom:4px}.details{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px}.item{display:flex;justify-content:space-between;border-bottom:1px dotted #dbe2ea;padding:3px 0;gap:8px}.item span{text-align:right}.tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}.tag{border:1px solid #dbe2ea;border-radius:10px;padding:2px 6px}.area,.notes{margin-top:6px;padding:6px;background:#f8fafc;border-radius:6px}.notes div{white-space:pre-wrap;margin-top:3px}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><header><h1>⚡ WireScout Jobsite Report</h1><small>Walk the job. Capture the scope. Don't forget a thing.</small></header><div class="job"><div><b>${esc(job.customer)}</b><br>${esc(job.address)}</div><div>${esc(job.date)}<br>Permit: ${esc(job.permit)} • Inspection: ${esc(job.inspection)}</div></div>${scopes}<script>window.onload=()=>window.print()<\/script></body></html>`;
  const w=window.open("","_blank");w.document.write(html);w.document.close();
}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();window.deferredPrompt=e;});
if("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js");
window.addEventListener("online",async()=>{ if(WSCloud.getUser()){const st=document.getElementById("syncStatus");if(st)st.textContent="↻ Syncing…";await WSCloud.syncJobs();if(st)st.textContent="✓ Saved to Account";render();} });
window.addEventListener("wirescout-auth",()=>{const st=document.getElementById("syncStatus");if(st)st.textContent=WSCloud.getUser()?"✓ Saved to Account":"✓ Saved Offline";});
(async function boot(){
  await WSCloud.init();
  const st=document.getElementById("syncStatus");
  if(st) st.textContent=WSCloud.getUser()?"✓ Saved to Account":"✓ Saved Offline";
  if(WSCloud.configured() && !WSCloud.getUser() && !trialActive()) state.view="account";
  render();
})();
