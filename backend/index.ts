import express from "express";
import { verifyHandler } from "./src/verify";
import { auth } from "./src/auth";
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});
app.use("/auth", auth);
app.get("/ping", (_, res) => { res.send("minikit-example pong v1"); });
let windowStart = Date.now();
let requests = 0;
app.post("/verify", (req, res, next) => {
  if (Date.now() - windowStart >= 60000) { windowStart = Date.now(); requests = 0; }
  if (++requests > 60) { res.status(429).json({ success: false }); return; }
  if (!req.is("application/json")) { res.status(415).json({ success: false }); return; }
  next();
}, verifyHandler);
// Payment routes deliberately disabled pending a separate security review.
app.post(["/initiate-payment", "/confirm-payment"], (_, res) => {
  res.status(503).json({ success: false, message: "Payments disabled" });
});
app.listen(Number(process.env.PORT || 3000), () => console.log("API listening"));
