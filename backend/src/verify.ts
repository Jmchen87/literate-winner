import { verifyCloudProof, ISuccessResult } from "@worldcoin/minikit-js";
import { RequestHandler } from "express";
export const verifyHandler: RequestHandler = async (req, res) => {
  const appId = process.env.APP_ID;
  const action = process.env.WORLD_ID_ACTION;
  if (!appId || !appId.startsWith("app_") || !action) {
    res.status(503).json({ success: false, message: "Verification not configured" }); return;
  }
  const p = req.body?.payload;
  if (!p || p.status !== "success" || p.verification_level !== "orb" ||
      !["proof", "merkle_root", "nullifier_hash"].every(k => typeof p[k] === "string" && p[k].length > 0 && p[k].length <= 16000)) {
    res.status(400).json({ success: false, message: "Invalid proof" }); return;
  }
  try {
    const result = await verifyCloudProof(p as ISuccessResult, appId as `app_${string}`, action, "");
    res.status(result.success ? 200 : 400).json({ success: result.success === true });
  } catch {
    res.status(502).json({ success: false, message: "Verification unavailable" });
  }
};
