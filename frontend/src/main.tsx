import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import MiniKitProvider from "./minikit-provider.tsx";
import { StrictMode } from "react";
createRoot(document.getElementById("root")!).render(<StrictMode><MiniKitProvider><App /></MiniKitProvider></StrictMode>);
