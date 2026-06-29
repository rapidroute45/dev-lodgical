import { useLayoutEffect, useState } from "react";

export const PANEL_GAP = 8;
export const VIEWPORT_PAD = 16;

export function computeAnchoredPanelPosition(
  anchorEl,
  {
    align = "start",
    panelWidth,
    panelHeight,
    gap = PANEL_GAP,
    viewportPad = VIEWPORT_PAD,
  } = {}
) {
  const rect = anchorEl.getBoundingClientRect();
  const width =
    panelWidth ??
    Math.min(window.innerWidth - viewportPad * 2, 560);

  let left =
    align === "end"
      ? rect.right - width
      : align === "center"
        ? rect.left + rect.width / 2 - width / 2
        : rect.left;

  left = Math.max(
    viewportPad,
    Math.min(left, window.innerWidth - width - viewportPad)
  );

  const height = panelHeight ?? 360;
  let top = rect.bottom + gap;
  const fitsBelow = top + height <= window.innerHeight - viewportPad;
  if (!fitsBelow && rect.top - gap - height >= viewportPad) {
    top = rect.top - height - gap;
  }

  return { top, left, width };
}

/**
 * Fixed viewport position for portaled popovers anchored to a trigger element.
 */
export function useAnchoredPanelPosition(
  anchorRef,
  panelRef,
  open,
  {
    align = "start",
    maxWidth = 560,
    defaultHeight = 360,
    gap = PANEL_GAP,
    viewportPad = VIEWPORT_PAD,
    deps = [],
  } = {}
) {
  const [fixedStyle, setFixedStyle] = useState(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef?.current) {
      setFixedStyle(null);
      return undefined;
    }

    function updatePosition() {
      if (!anchorRef.current) return;
      const panelWidth = Math.min(window.innerWidth - viewportPad * 2, maxWidth);
      const panelHeight = panelRef?.current?.offsetHeight ?? defaultHeight;
      const { top, left, width } = computeAnchoredPanelPosition(anchorRef.current, {
        align,
        panelWidth,
        panelHeight,
        gap,
        viewportPad,
      });
      setFixedStyle({
        position: "fixed",
        top,
        left,
        width,
        zIndex: 100,
      });
    }

    updatePosition();
    const raf = requestAnimationFrame(updatePosition);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, align, maxWidth, defaultHeight, gap, viewportPad, anchorRef, panelRef, ...deps]);

  return fixedStyle;
}
