import { MiniKit, VerificationLevel } from "@worldcoin/minikit-js";
import { useRef, useState } from "react";
const api = import.meta.env.VITE_API_BASE_URL || "/api";
const action = import.meta.env.VITE_WORLD_ID_ACTION;
export const VerifyBlock = () => {
  const busy = useRef(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const handleVerify = async () => {
    if (busy.current) return;
    if (!action || !MiniKit.isInstalled()) { setMessage("Verification unavailable. Open in World App and check configuration."); return; }
    busy.current = true; setLoading(true); setMessage("");
    try {
      const { finalPayload } = await MiniKit.commandsAsync.verify({ action, signal: "", verification_level: VerificationLevel.Orb });
      if (finalPayload.status === "error") throw new Error("Verification cancelled");
      const response = await fetch(api + "/verify", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payload: finalPayload }) });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error("Verification failed");
      setMessage("Proof verified. This does not create a login session.");
    } catch { setMessage("Verification unsuccessful. Please try again."); }
    finally { busy.current = false; setLoading(false); }
  };
  return <div><h1>World ID Verification</h1><button className="bg-yellow-500 p-4" disabled={loading} onClick={handleVerify}>{loading ? "Verifying..." : "Verify identity"}</button><p role="status">{message}</p></div>;
};
