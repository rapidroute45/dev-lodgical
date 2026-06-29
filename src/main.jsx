import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "@/shared/i18n/index.js";
import App from "./app/App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
