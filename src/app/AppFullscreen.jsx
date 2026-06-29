import { useFullscreen } from "@/shared/hooks/useFullscreen.js";

/** Press F to toggle browser fullscreen (user gesture required to enter). */
export function AppFullscreen() {
  useFullscreen({ keyboardShortcut: true });
  return null;
}
