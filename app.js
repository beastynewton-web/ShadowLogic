const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
async function api(path,opts={}){
  const r=await fetch("/api/"+path,{credentials:"same-origin",...opts});
  const text=await r.text(); let d={}; try{d=JSON.parse(text)}catch{d={error:text}}
  if(!r.ok)throw new Error(d.error+(d.detail?": "+d.detail:""));
  return d;
}
async function boot(){
  try{
    const {user}=await api("me");
    $("#login").classList.add("hidden");$("#app").classList.remove("hidden");$("#user").textContent=user.email;loadProjects();
  }catch{}
}
$("#loginForm").onsubmit=async e=>{
  e.preventDefault();$("#loginError").textContent="";
  try{
    await api("login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:$("#email").value,password:$("#password").value})});
    location.reload();
  }catch(err){$("#loginError").textContent=err.message}
};
$("#logoutBtn").onclick=async()=>{await api("logout",{method:"POST"}).catch(()=>{});location.reload()};
$("#newProject").onclick=()=>$("#projectModal").classList.remove("hidden");
$("#closeModal").onclick=()=>$("#projectModal").classList.add("hidden");
$("#projectForm").onsubmit=async e=>{
  e.preventDefault();$("#projectError").textContent="";
  try{
    const {project}=await api("projects",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:$("#projectName").value,type:$("#projectType").value})});
    location.href="/project.html?id="+encodeURIComponent(project.id);
  }catch(err){$("#projectError").textContent=err.message}
};
async function loadProjects(){
  const box=$("#projects");box.innerHTML='<div class="muted">Loading…</div>';
  try{
    const {projects}=await api("projects");
    if(!projects.length){box.innerHTML='<div class="empty">No projects yet.<br><br>Create your first project.</div>';return}
    box.innerHTML=projects.map(p=>`<div class="card project-card" onclick="location.href='/project.html?id=${encodeURIComponent(p.id)}'">
      <div class="row"><div class="project-name">${esc(p.name)}</div><span class="pill ${p.status==="running"?"running":""} right">${esc(p.status)}</span></div>
      <div class="muted" style="font-size:12px;margin-top:8px">${esc(p.type.toUpperCase())}</div>
      <div class="muted" style="font-size:11px;margin-top:14px">Updated ${new Date(p.updatedAt).toLocaleString()}</div>
    </div>`).join("");
  }catch(err){box.innerHTML=`<div class="error">${esc(err.message)}</div>`}
}
boot();
