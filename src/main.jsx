import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "@/shared/i18n/index.js";
import { hydrateMediaConfig } from "@/shared/utils/mediaUrl.js";
import App from "./app/App.jsx";

async function bootstrap() {
  await hydrateMediaConfig();
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

bootstrap();
