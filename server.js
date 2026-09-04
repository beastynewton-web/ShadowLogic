import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import crypto from "node:crypto";

const app = express();
app.use(express.json({ limit: "5mb" }));

const PORT = Number(process.env.PORT || 8787);
const TOKEN = process.env.RUNNER_TOKEN || "";
const ROOT = path.resolve("./projects");
const jobs = new Map();
const logs = new Map();

if (TOKEN.length < 24) {
  console.error("RUNNER_TOKEN must be set and at least 24 characters long.");
  process.exit(1);
}

function auth(req,res,next){
  const got=(req.headers.authorization||"").replace(/^Bearer\s+/,"");
  const a=Buffer.from(got), b=Buffer.from(TOKEN);
  if(a.length!==b.length || !crypto.timingSafeEqual(a,b)) return res.status(401).json({error:"Unauthorized"});
  next();
}
app.use("/v1", auth);

function cleanProjectId(id){return /^[a-zA-Z0-9_-]{1,80}$/.test(id||"")?id:null}
function cleanRel(p){p=String(p||"").replace(/\\/g,"/").replace(/^\/+/,"");if(!p||p.includes("..")||p.includes("\0"))return null;return p}
function addLog(id,msg){const a=logs.get(id)||[];a.push(String(msg));while(a.length>500)a.shift();logs.set(id,a)}

app.post("/v1/run", async(req,res)=>{
  const id=cleanProjectId(req.body.projectId);
  if(!id)return res.status(400).json({error:"Invalid project id"});
  if(jobs.has(id))return res.status(409).json({error:"Project already running"});
  const files=req.body.files||{};
  const dir=path.join(ROOT,id);
  await fs.rm(dir,{recursive:true,force:true});
  await fs.mkdir(dir,{recursive:true});
  for(const [name,content] of Object.entries(files)){
    const rel=cleanRel(name); if(!rel)continue;
    const target=path.resolve(dir,rel);
    if(!target.startsWith(dir+path.sep))continue;
    await fs.mkdir(path.dirname(target),{recursive:true});
    await fs.writeFile(target,String(content??""));
  }
  let entry="index.js";
  try{
    const pkg=JSON.parse(await fs.readFile(path.join(dir,"package.json"),"utf8"));
    if(cleanRel(pkg.main))entry=pkg.main;
  }catch{}
  try{await fs.access(path.join(dir,entry))}catch{return res.status(400).json({error:`Entry file ${entry} not found`})}

  logs.set(id,[]);
  const child=spawn(process.execPath,[entry],{cwd:dir,env:{...process.env,SHADOW_PROJECT_ID:id},stdio:["ignore","pipe","pipe"],shell:false});
  jobs.set(id,child);
  addLog(id,`[Shadow Logic] Started ${entry} (pid ${child.pid})`);
  child.stdout.on("data",d=>addLog(id,d.toString().trimEnd()));
  child.stderr.on("data",d=>addLog(id,"[stderr] "+d.toString().trimEnd()));
  child.on("exit",(code,signal)=>{addLog(id,`[Shadow Logic] Exited code=${code} signal=${signal}`);jobs.delete(id)});
  res.json({ok:true,status:"running",message:`Started ${entry}`});
});

app.post("/v1/stop",(req,res)=>{
  const id=cleanProjectId(req.body.projectId);
  if(!id)return res.status(400).json({error:"Invalid project id"});
  const child=jobs.get(id);
  if(!child)return res.json({ok:true,status:"stopped",message:"Project is not running"});
  child.kill("SIGTERM");
  setTimeout(()=>{if(jobs.get(id)===child)child.kill("SIGKILL")},5000).unref();
  res.json({ok:true,status:"stopping",message:"Stop signal sent"});
});

app.get("/v1/logs",(req,res)=>{
  const id=cleanProjectId(req.query.projectId);
  if(!id)return res.status(400).json({error:"Invalid project id"});
  res.json({status:jobs.has(id)?"running":"stopped",logs:logs.get(id)||[]});
});

app.get("/health",(req,res)=>res.json({ok:true,running:jobs.size}));
app.listen(PORT,()=>console.log(`Shadow Logic Runner listening on :${PORT}`));
