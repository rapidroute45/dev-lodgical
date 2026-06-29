import { useCallback, useEffect, useState } from "react";

let hasAutoEntered = false;

function getFullscreenElement() {
  return (
    document.fullscreenElement ??
    document.webkitFullscreenElement ??
    document.mozFullScreenElement ??
    document.msFullscreenElement ??
    null
  );
}

async function requestDocumentFullscreen() {
  const el = document.documentElement;
  if (el.requestFullscreen) return el.requestFullscreen();
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
  if (el.mozRequestFullScreen) return el.mozRequestFullScreen();
  if (el.msRequestFullscreen) return el.msRequestFullscreen();
}

async function exitDocumentFullscreen() {
  if (document.exitFullscreen) return document.exitFullscreen();
  if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
  if (document.mozCancelFullScreen) return document.mozCancelFullScreen();
  if (document.msExitFullscreen) return document.msExitFullscreen();
}

function shouldIgnoreKeyboardShortcut(event) {
  if (event.metaKey || event.ctrlKey || event.altKey) return true;
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (target.isContentEditable) return true;
  return false;
}

/**
 * Browser fullscreen API with optional one-time auto-enter per session.
 */
export function useFullscreen({ autoEnter = false, keyboardShortcut = false } = {}) {
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(getFullscreenElement()));

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(Boolean(getFullscreenElement()));
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
    };
  }, []);

  const enter = useCallback(async () => {
    if (getFullscreenElement()) return;
    try {
      await requestDocumentFullscreen();
    } catch {
      // Browsers may block without a user gesture.
    }
  }, []);

  const exit = useCallback(async () => {
    if (!getFullscreenElement()) return;
    try {
      await exitDocumentFullscreen();
    } catch {
      // Ignore if exit is not allowed.
    }
  }, []);

  const toggle = useCallback(async () => {
    if (getFullscreenElement()) await exit();
    else await enter();
  }, [enter, exit]);

  useEffect(() => {
    if (!autoEnter || hasAutoEntered) return;
    hasAutoEntered = true;
    void enter();
  }, [autoEnter, enter]);

  useEffect(() => {
    if (!keyboardShortcut) return;

    function onKeyDown(event) {
      if (!event.key || event.key.toLowerCase() !== "f") return;
      if (shouldIgnoreKeyboardShortcut(event)) return;
      event.preventDefault();
      void toggle();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [keyboardShortcut, toggle]);

  return { isFullscreen, enter, exit, toggle };
}
