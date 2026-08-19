const WSDB = (() => {
  const LEGACY_JOB_KEY = "wirescout_jobs_v1";
  const SET_KEY = "wirescout_settings_v1";
  let namespace = "guest";

  function keyFor(ns=namespace){ return `wirescout_jobs_v2_${ns||"guest"}`; }
  function parse(key){ try{return JSON.parse(localStorage.getItem(key)||"[]")}catch{return []} }
  function setUserNamespace(userId){
    if(!localStorage.getItem(keyFor("guest")) && localStorage.getItem(LEGACY_JOB_KEY)){
      localStorage.setItem(keyFor("guest"),localStorage.getItem(LEGACY_JOB_KEY));
    }
    namespace=userId||"guest";
  }
  function getJobs(){ return parse(keyFor()); }
  function saveJobs(jobs){ localStorage.setItem(keyFor(),JSON.stringify(jobs)); }
  function getGuestJobs(){ return parse(keyFor("guest")); }
  function clearGuestJobs(){ localStorage.removeItem(keyFor("guest")); }
  function upsertJob(job){
    const jobs=getJobs(); const i=jobs.findIndex(j=>j.id===job.id);
    if(i>=0) jobs[i]=job; else jobs.unshift(job);
    saveJobs(jobs); return job;
  }
  function deleteJob(id){ saveJobs(getJobs().filter(j=>j.id!==id)); }
  function getSettings(){ return Object.assign({language:"en",units:"imperial"},JSON.parse(localStorage.getItem(SET_KEY)||"{}")); }
  function saveSettings(s){ localStorage.setItem(SET_KEY,JSON.stringify(s)); }

  const photoDB = new Promise((resolve,reject)=>{
    const req=indexedDB.open("wirescout_photos_v1",1);
    req.onupgradeneeded=()=>{ const db=req.result; if(!db.objectStoreNames.contains("photos")) db.createObjectStore("photos",{keyPath:"id"}); };
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
  async function addPhoto(record){
    const db=await photoDB; await new Promise((res,rej)=>{const tx=db.transaction("photos","readwrite");tx.objectStore("photos").put(record);tx.oncomplete=()=>res(record);tx.onerror=()=>rej(tx.error);});
    if(window.WSCloud) WSCloud.saveFile(record).catch(()=>{});
    return record;
  }
  async function getPhotos(jobId,scopeId){
    const db=await photoDB; return new Promise((res,rej)=>{const tx=db.transaction("photos","readonly");const req=tx.objectStore("photos").getAll();req.onsuccess=()=>res(req.result.filter(p=>p.jobId===jobId && (!scopeId || p.scopeId===scopeId)));req.onerror=()=>rej(req.error);});
  }
  async function deletePhoto(id){
    const db=await photoDB; return new Promise((res,rej)=>{const tx=db.transaction("photos","readwrite");tx.objectStore("photos").delete(id);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);});
  }
  return {setUserNamespace,getJobs,saveJobs,getGuestJobs,clearGuestJobs,upsertJob,deleteJob,getSettings,saveSettings,addPhoto,getPhotos,deletePhoto};
})();
