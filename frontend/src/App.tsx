import { PayBlock } from "./components/Pay";
import { VerifyBlock } from "./components/Verify";
import { MiniKit } from "@worldcoin/minikit-js";
import { useState, useRef } from "react";
const api=import.meta.env.VITE_API_BASE_URL||"/api";
async function post(path:string,body:unknown){
 const r=await fetch(api+"/auth/"+path,{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
 if(!r.ok)throw new Error("Request failed");return r.json();
}
export default function App(){
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const lock=useRef(false);
 async function run(fn:()=>Promise<void>){
  if(lock.current)return;lock.current=true;setBusy(true);
  try{await fn();}catch{setMessage("Authentication unavailable or unsuccessful.");}finally{lock.current=false;setBusy(false);}
 }
 async function login(){
  if(!MiniKit.isInstalled())throw new Error("Open World App");
  const {nonce}=await post("nonce",{});
  const {finalPayload}=await MiniKit.commandsAsync.walletAuth({nonce});
  if(finalPayload.status==="error")throw new Error("Cancelled");
  await post("wallet",{nonce,payload:finalPayload});await session();
 }
 async function session(){
  const r=await fetch(api+"/auth/session",{credentials:"same-origin"});
  if(!r.ok)throw new Error("No session");
  const {user}=await r.json();setMessage("Signed in: "+user.wallet+" ("+user.role+")");
 }
 return <main className="flex min-h-screen flex-col items-center justify-center p-6 gap-y-3">
 <h1>JM WORLD BUSINESS</h1>
 <button disabled={busy} onClick={()=>void run(login)}>Connect wallet</button>
 <button disabled={busy} onClick={()=>void run(session)}>Check session</button>
 <button disabled={busy} onClick={()=>void run(async()=>{await post("logout",{});setMessage("Signed out");})}>Sign out</button>
 <p role="status">{message}</p><VerifyBlock/><PayBlock/>
 </main>;
}
