const WSCloud = (() => {
  let client = null;
  let user = null;
  let ready = false;

  function configured(){
    const c=window.WS_CONFIG||{};
    return !!(c.SUPABASE_URL && c.SUPABASE_PUBLISHABLE_KEY && !c.SUPABASE_URL.includes("YOUR_") && !c.SUPABASE_PUBLISHABLE_KEY.includes("YOUR_"));
  }
  function getUser(){ return user; }
  function isReady(){ return ready; }
  function getClient(){ return client; }
  function emit(){ window.dispatchEvent(new CustomEvent("wirescout-auth",{detail:{user,configured:configured()}})); }

  async function init(){
    if(!configured() || !window.supabase){
      WSDB.setUserNamespace(null); ready=true; emit(); return;
    }
    client=window.supabase.createClient(window.WS_CONFIG.SUPABASE_URL,window.WS_CONFIG.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data}=await client.auth.getSession();
    user=data?.session?.user||null;
    WSDB.setUserNamespace(user?.id||null);
    if(user) await syncJobs();
    client.auth.onAuthStateChange(async (_event,session)=>{
      user=session?.user||null;
      WSDB.setUserNamespace(user?.id||null);
      if(user) await syncJobs();
      emit();
    });
    ready=true; emit();
  }

  async function signUp({email,password,displayName,companyName}){
    if(!client) throw new Error("Cloud setup is not configured yet.");
    const {data,error}=await client.auth.signUp({email,password,options:{data:{display_name:displayName||"",company_name:companyName||""}}});
    if(error) throw error;
    if(data.user){
      await client.from("profiles").upsert({id:data.user.id,display_name:displayName||"",company_name:companyName||"",email});
    }
    return data;
  }
  async function signIn(email,password){
    if(!client) throw new Error("Cloud setup is not configured yet.");
    const {data,error}=await client.auth.signInWithPassword({email,password});
    if(error) throw error;
    user=data.user; WSDB.setUserNamespace(user.id); await migrateGuestJobs(); await syncJobs(); emit(); return data;
  }
  async function signOut(){ if(client) await client.auth.signOut(); user=null; WSDB.setUserNamespace(null); emit(); }

  async function getProfile(){
    if(!client||!user) return null;
    const {data,error}=await client.from("profiles").select("email,display_name,company_name,plan,plan_status,billing_status,subscription_started_at,subscription_ends_at").eq("id",user.id).maybeSingle();
    if(error){ console.warn("WireScout profile load failed",error); return null; }
    return data||null;
  }

  async function migrateGuestJobs(){
    if(!user) return;
    const guest=WSDB.getGuestJobs();
    if(!guest.length) return;
    const mine=WSDB.getJobs();
    const map=new Map(mine.map(j=>[j.id,j]));
    guest.forEach(j=>{ if(!map.has(j.id)) map.set(j.id,j); });
    WSDB.saveJobs([...map.values()]);
    for(const j of guest) await saveJob(j);
    WSDB.clearGuestJobs();
  }

  async function saveJob(job){
    if(!client||!user||!navigator.onLine) return false;
    const {error}=await client.from("jobs").upsert({id:job.id,user_id:user.id,payload:job,updated_at:new Date(job.updatedAt||Date.now()).toISOString()});
    if(error){ console.warn("WireScout cloud save failed",error); return false; }
    return true;
  }
  async function deleteJob(id){
    if(!client||!user||!navigator.onLine) return false;
    const {error}=await client.from("jobs").delete().eq("id",id);
    return !error;
  }
  async function syncJobs(){
    if(!client||!user||!navigator.onLine) return false;
    const {data,error}=await client.from("jobs").select("id,payload,updated_at");
    if(error){console.warn("WireScout cloud sync failed",error);return false;}
    const local=WSDB.getJobs();
    const map=new Map(local.map(j=>[j.id,j]));
    for(const row of (data||[])){
      const remote=row.payload||{}; const current=map.get(row.id);
      const rt=Date.parse(row.updated_at)||remote.updatedAt||0, lt=current?.updatedAt||0;
      if(!current||rt>lt) map.set(row.id,remote);
    }
    WSDB.saveJobs([...map.values()].sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)));
    for(const j of WSDB.getJobs()){
      const remote=(data||[]).find(r=>r.id===j.id);
      if(!remote || (j.updatedAt||0)>(Date.parse(remote.updated_at)||0)) await saveJob(j);
    }
    return true;
  }

  async function saveFile(record){
    if(!client||!user||!navigator.onLine||!record?.blob) return false;
    const safe=(record.name||"file").replace(/[^a-zA-Z0-9._-]/g,"_");
    const path=`${user.id}/${record.jobId}/${record.scopeId||"general"}/${record.id}-${safe}`;
    const {error:uploadError}=await client.storage.from("job-files").upload(path,record.blob,{contentType:record.type||"application/octet-stream",upsert:true});
    if(uploadError){console.warn("WireScout file upload failed",uploadError);return false;}
    const {error}=await client.from("job_files").upsert({id:record.id,user_id:user.id,job_id:record.jobId,scope_id:record.scopeId||null,name:record.name||"file",mime_type:record.type||"",kind:record.kind||"photo",storage_path:path,created_at:new Date(record.createdAt||Date.now()).toISOString()});
    return !error;
  }
  async function getFiles(jobId,scopeId){
    if(!client||!user||!navigator.onLine) return [];
    let q=client.from("job_files").select("*").eq("job_id",jobId);
    if(scopeId) q=q.eq("scope_id",scopeId);
    const {data,error}=await q.order("created_at",{ascending:true});
    if(error) return [];
    const out=[];
    for(const f of data||[]){
      const {data:signed}=await client.storage.from("job-files").createSignedUrl(f.storage_path,3600);
      if(signed?.signedUrl) out.push({...f,url:signed.signedUrl});
    }
    return out;
  }

  return {configured,isReady,getUser,getClient,init,signUp,signIn,signOut,getProfile,saveJob,deleteJob,syncJobs,saveFile,getFiles};
})();
