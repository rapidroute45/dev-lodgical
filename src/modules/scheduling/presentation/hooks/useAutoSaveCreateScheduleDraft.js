import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { persistCreateScheduleDraft } from "@/modules/scheduling/utils/persistCreateScheduleDraft.js";
import { apiErrorMessage } from "@/shared/utils/api.js";

/**
 * Auto-save create-schedule progress as draft when leaving the page
 * (back button, sidebar links, browser back, or any in-app navigation).
 */
export function useAutoSaveCreateScheduleDraft({
  selectedStore,
  city,
  state,
  date,
  rows,
  scheduleId,
  teams,
  isCityLocked,
  assignedCity,
  saving,
  setSaving,
  setError,
  setScheduleId,
  setRows,
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const exitingAfterSaveRef = useRef(false);
  const savingRef = useRef(false);

  const hasUnsavedWork = Boolean(selectedStore && rows.length > 0);

  const snapshotRef = useRef({});
  snapshotRef.current = {
    selectedStore,
    city,
    state,
    date,
    rows,
    scheduleId,
    teams,
    isCityLocked,
    assignedCity,
    onlyUnsaved: true,
    allowFallbackTeam: true,
  };

  const persistDraft = useCallback(async () => {
    if (savingRef.current) return { saved: false };
    if (!selectedStore || rows.length === 0) {
      return { saved: false, skipped: true };
    }

    savingRef.current = true;
    setSaving(true);
    setError(null);

    try {
      const result = await persistCreateScheduleDraft(snapshotRef.current);

      if (result.scheduleId) {
        setScheduleId?.(result.scheduleId);
        snapshotRef.current.scheduleId = result.scheduleId;
        setRows?.((prev) =>
          prev.map((row) => {
            const teamId = row.teamId || teams[0]?.id;
            if (!row.routeName?.trim() || !teamId || row.isNew === false) return row;
            return { ...row, isNew: false };
          })
        );
      }

      await queryClient.invalidateQueries({ queryKey: ["schedules"] });
      await queryClient.invalidateQueries({ queryKey: ["routes"] });
      return { saved: true, ...result };
    } catch (err) {
      setError(apiErrorMessage(err, "Could not save draft before leaving"));
      throw err;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [selectedStore, rows.length, teams, setSaving, setError, setScheduleId, setRows, queryClient]);

  const leaveTo = useCallback(
    async (href) => {
      if (exitingAfterSaveRef.current || savingRef.current) return;

      if (!hasUnsavedWork) {
        exitingAfterSaveRef.current = true;
        navigate(href, { replace: href === "/schedules" });
        return;
      }

      try {
        await persistDraft();
        exitingAfterSaveRef.current = true;
        navigate(href, { replace: href === "/schedules" });
      } catch {
        exitingAfterSaveRef.current = false;
      }
    },
    [hasUnsavedWork, navigate, persistDraft]
  );

  const leaveAfterSave = useCallback(() => leaveTo("/schedules"), [leaveTo]);

  // Browser back button
  useEffect(() => {
    if (!hasUnsavedWork) return;
    window.history.pushState({ createScheduleDraft: true }, "");
  }, [hasUnsavedWork]);

  useEffect(() => {
    if (!hasUnsavedWork) return;

    const onPopState = () => {
      if (exitingAfterSaveRef.current || savingRef.current) return;
      window.history.pushState({ createScheduleDraft: true }, "");
      void leaveAfterSave();
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [hasUnsavedWork, leaveAfterSave]);

  // Sidebar / in-app links (BrowserRouter has no useBlocker)
  useEffect(() => {
    if (!hasUnsavedWork) return;

    const onClickCapture = (event) => {
      if (exitingAfterSaveRef.current || savingRef.current) return;

      const anchor = event.target.closest("a[href]");
      if (!anchor || anchor.getAttribute("target") === "_blank") return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("#")) {
        return;
      }
      if (!href.startsWith("/")) return;

      const current = `${window.location.pathname}${window.location.search}`;
      if (href === current) return;

      event.preventDefault();
      event.stopPropagation();
      void leaveTo(href);
    };

    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, [hasUnsavedWork, leaveTo]);

  // Last resort when the screen unmounts (programmatic navigation)
  useEffect(() => {
    return () => {
      if (exitingAfterSaveRef.current || savingRef.current) return;
      const snap = snapshotRef.current;
      if (!snap.selectedStore?.id || !snap.rows?.length) return;
      void persistCreateScheduleDraft(snap)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["schedules"] });
          queryClient.invalidateQueries({ queryKey: ["routes"] });
        })
        .catch(() => {});
    };
  }, [queryClient]);

  return {
    hasUnsavedWork,
    handleBack: () => {
      if (saving) return;
      void leaveAfterSave();
    },
    markExitingAfterSave: () => {
      exitingAfterSaveRef.current = true;
    },
    persistDraft,
  };
}
