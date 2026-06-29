const INBOX_MAX_ITEMS = 50;
const DEDUPE_WINDOW_MS = 60_000;

export function inboxStorageKey(userId) {
  return `dispatch_push_inbox_${userId ?? "anonymous"}`;
}

function normalizeData(raw) {
  if (!raw || typeof raw !== "object") return {};
  const data = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value == null || key === "title" || key === "body") continue;
    data[key] = typeof value === "string" ? value : String(value);
  }
  return data;
}

function dedupeKey(item) {
  const type = item.data?.type ?? "";
  const bucket = Math.floor(new Date(item.receivedAt).getTime() / DEDUPE_WINDOW_MS);
  return `${type}|${item.title}|${item.message}|${bucket}`;
}

/** Build inbox item from FCM foreground payload or service worker message. */
export function pushPayloadToInboxItem(payload) {
  const title =
    payload?.notification?.title ??
    payload?.title ??
    payload?.data?.title ??
    "Dispatch";
  const message =
    payload?.notification?.body ??
    payload?.body ??
    payload?.data?.body ??
    "";

  const rawData = payload?.data ?? payload;
  const data = normalizeData(rawData);

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: String(title),
    message: String(message),
    data,
    receivedAt: new Date().toISOString(),
    read: false,
  };
}

export function loadInboxFromStorage(userId) {
  if (typeof sessionStorage === "undefined" || !userId) return [];
  try {
    const raw = sessionStorage.getItem(inboxStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveInboxToStorage(userId, items) {
  if (typeof sessionStorage === "undefined" || !userId) return;
  try {
    sessionStorage.setItem(inboxStorageKey(userId), JSON.stringify(items.slice(0, INBOX_MAX_ITEMS)));
  } catch {
    // ignore quota errors
  }
}

export function clearInboxStorage(userId) {
  if (typeof sessionStorage === "undefined" || !userId) return;
  try {
    sessionStorage.removeItem(inboxStorageKey(userId));
  } catch {
    // ignore
  }
}

export function addItemToInbox(existing, incoming) {
  const item = pushPayloadToInboxItem(incoming);
  const key = dedupeKey(item);
  const withoutDupes = existing.filter((entry) => dedupeKey(entry) !== key);
  return [item, ...withoutDupes].slice(0, INBOX_MAX_ITEMS);
}

export function removeInboxItem(items, id) {
  if (!id) return items;
  return items.filter((entry) => entry.id !== id);
}

export function markInboxItemRead(items, id) {
  return items.map((entry) => (entry.id === id ? { ...entry, read: true } : entry));
}

export function countUnreadInbox(items) {
  return items.length;
}
