import { randomBytes, createHash } from "node:crypto";
import { Router, Request, RequestHandler } from "express";
import { verifySiweMessage } from "@worldcoin/minikit-js";
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export const auth = Router();
function config() {
 const url = process.env.SUPABASE_URL;
 const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
 const origin = process.env.AUTH_ORIGIN;
 if (!url || !key || !origin || !origin.startsWith("https://")) throw new Error("Auth unavailable");
 return { url, key, origin };
}
async function db(path: string, method = "GET", body?: unknown) {
 const {url,key} = config();
 const r = await fetch(url.replace(/\/$/, "") + "/rest/v1/" + path, { method, headers: {apikey:key, Authorization:"Bearer "+key,"Content-Type":"application/json"}, body:body===undefined?undefined:JSON.stringify(body), signal:AbortSignal.timeout(8000) });
 if (!r.ok) throw new Error("Database unavailable");
 const t = await r.text(); return t ? JSON.parse(t) : null;
}
const wrap = (fn: (req: Request,res: Parameters<RequestHandler>[1])=>Promise<void>): RequestHandler => (req,res) => { fn(req,res).catch(()=>res.status(503).json({success:false})); };
let start=Date.now(), count=0;
auth.use((req,res,next)=>{
 try {
  const {origin}=config();
  if (req.method!=="GET" && (req.headers.origin!==origin || !req.is("application/json"))) {res.status(403).json({success:false});return;}
  if(Date.now()-start>60000){start=Date.now();count=0;}
  if(++count>120){res.status(429).json({success:false});return;}
  next();
 } catch {res.status(503).json({success:false});}
});
auth.post("/nonce",wrap(async (_req,res)=>{
 const nonce=randomBytes(16).toString("hex");
 await db("auth_challenges","POST",{nonce,expires_at:new Date(Date.now()+300000).toISOString()});
 res.json({nonce});
}));
auth.post("/wallet",wrap(async (req,res)=>{
 const {payload,nonce}=req.body??{};
 if(typeof nonce!=="string"|| !/^[a-f0-9]{32}$/.test(nonce)||payload?.status!=="success"||typeof payload.message!=="string"||typeof payload.signature!=="string"||typeof payload.address!=="string"){res.status(400).json({success:false});return;}
 const {origin}=config();
 const lines=payload.message.split("\n");
 const domain=new URL(origin).host;
 if(lines[0]!==domain+" wants you to sign in with your Ethereum account:" || !lines.includes("URI: "+origin) && !lines.includes("URI: "+origin+"/") || !lines.includes("Chain ID: 480") || !lines.includes("Nonce: "+nonce) || lines[1]?.toLowerCase()!==payload.address.toLowerCase() || !/^0x[0-9a-fA-F]{40}$/.test(payload.address)){res.status(401).json({success:false});return;}
 const verified=await verifySiweMessage(payload,nonce);
 if(!verified.isValid){res.status(401).json({success:false});return;}
 const token=randomBytes(32).toString("hex");
 const uid=await db("rpc/complete_wallet_login","POST",{p_nonce:nonce,p_wallet:payload.address.toLowerCase(),p_hash:hash(token)});
 if(!uid){res.status(401).json({success:false});return;}
 res.cookie("__Host-jm_session",token,{secure:true,httpOnly:true,sameSite:"strict",path:"/",maxAge:86400000});
 res.json({success:true});
}));
function sessionHash(req:Request) {
 const t=(req.headers.cookie??"").split(";").map(x=>x.trim()).find(x=>x.startsWith("__Host-jm_session="))?.split("=")[1];
 return t && /^[a-f0-9]{64}$/.test(t) ? hash(t):null;
}
async function user(req:Request){
 const h=sessionHash(req); if(!h)return null;
 const rows=await db("app_sessions?token_hash=eq."+h+"&expires_at=gt."+encodeURIComponent(new Date().toISOString())+"&select=app_users(id,wallet,role)");
 return rows?.[0]?.app_users??null;
}
auth.get("/session",wrap(async(req,res)=>{const u=await user(req);res.status(u?200:401).json({user:u});}));
auth.post("/logout",wrap(async(req,res)=>{const h=sessionHash(req);if(h)await db("app_sessions?token_hash=eq."+h,"DELETE");res.clearCookie("__Host-jm_session",{secure:true,httpOnly:true,sameSite:"strict",path:"/"});res.json({success:true});}));
auth.get("/admin",wrap(async(req,res)=>{const u=await user(req);if(!u){res.status(401).json({success:false});return;}if(!["owner","admin"].includes(u.role)){res.status(403).json({success:false});return;}res.json({success:true,role:u.role});}));
