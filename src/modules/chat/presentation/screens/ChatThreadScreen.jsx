import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { mediaUrl } from "@/shared/utils/mediaUrl.js";
import { hasPhone, openWhatsApp } from "@/shared/utils/whatsapp.js";
import { useChatSocket } from "../../application/ChatProvider.jsx";
import { VoiceMessageBubble } from "../components/VoiceMessageBubble.jsx";
import {
  useChatMessagesQuery,
  useConversationsQuery,
  useLeaveGroupMutation,
  useSendChatMessageMutation,
  useSendDocumentMutation,
  useSendVoiceMessageMutation,
} from "../../infrastructure/api/chat.queries.js";

function formatMessageTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const WhatsAppIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.82 9.82 0 001.523 5.26l-.999 3.648 3.965-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

export function ChatThreadScreen() {
  const { id: conversationId = "" } = useParams();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [draft, setDraft] = useState("");
  const [showMembers, setShowMembers] = useState(false);

  const { joinConversation, emitTypingStart, emitTypingStop, typingMap } = useChatSocket();

  const { data: conversations = [] } = useConversationsQuery();
  const conversation = conversations.find((c) => c.id === conversationId);
  const isGroup = Boolean(conversation?.isGroup);
  const members = conversation?.members ?? [];

  const {
    data: messages = [],
    isLoading,
    isFetching,
    refetch,
  } = useChatMessagesQuery(conversationId, Boolean(conversationId));

  const sendMutation = useSendChatMessageMutation();
  const voiceMutation = useSendVoiceMessageMutation();
  const documentMutation = useSendDocumentMutation();
  const leaveMutation = useLeaveGroupMutation();

  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordStartRef = useRef(0);
  const recordTimerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (conversationId) joinConversation(conversationId);
  }, [conversationId, joinConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, []);

  const typingUsers = typingMap?.[conversationId] ?? [];
  const someoneTyping = typingUsers.length > 0;

  const handleDraftChange = (value) => {
    setDraft(value);
    emitTypingStart(conversationId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTypingStop(conversationId), 1500);
  };

  const handleSend = async (e) => {
    e?.preventDefault?.();
    const body = draft.trim();
    if (!conversationId || !body || sendMutation.isPending) return;
    setDraft("");
    emitTypingStop(conversationId);
    try {
      await sendMutation.mutateAsync({ conversationId, body });
    } catch {
      setDraft(body);
    }
  };

  const handleFilePick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !conversationId) return;
    try {
      await documentMutation.mutateAsync({ conversationId, file });
    } catch {
      /* surfaced by mutation */
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const durationMs = Date.now() - recordStartRef.current;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (blob.size > 0 && durationMs > 600) {
          try {
            await voiceMutation.mutateAsync({ conversationId, blob, durationMs });
          } catch {
            /* surfaced by mutation */
          }
        }
      };
      mediaRecorderRef.current = recorder;
      recordStartRef.current = Date.now();
      recorder.start();
      setRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      alert("Microphone access is required to record voice messages.");
    }
  };

  const stopRecording = (send) => {
    const recorder = mediaRecorderRef.current;
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setRecording(false);
    if (!recorder) return;
    if (!send) {
      chunksRef.current = [];
      recorder.onstop = () => recorder.stream.getTracks().forEach((t) => t.stop());
    }
    recorder.stop();
    mediaRecorderRef.current = null;
  };

  const title = isGroup ? conversation?.title ?? "Group" : conversation?.otherName ?? "Chat";
  const subtitle = isGroup
    ? `${conversation?.memberCount ?? members.length} members`
    : conversation?.otherEmail ?? "";
  const canCall1to1 = !isGroup && hasPhone(conversation?.otherPhone);

  const topBar = <OpsTopBar showDate={false} onRefresh={refetch} refreshing={isFetching} />;

  return (
    <DashboardLayout topBar={topBar}>
      <div className="ops-chat-thread ops-fade">
        <div className="ops-chat-shell">
          <header className="ops-chat-header">
            <Link to="/chat" className="ops-btn p-2" aria-label="Back to messages">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="ops-avatar flex h-10 w-10 shrink-0 items-center justify-center text-base font-bold">
              {isGroup ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ) : (
                (title || "?").charAt(0).toUpperCase()
              )}
            </div>
            <div className="ops-chat-header__info">
              <h1 className="ops-chat-header__title truncate">{title}</h1>
              <button
                type="button"
                onClick={() => isGroup && setShowMembers((v) => !v)}
                className="ops-chat-header__sub truncate text-left"
                style={{ cursor: isGroup ? "pointer" : "default" }}
              >
                {someoneTyping ? "typing…" : subtitle || " "}
              </button>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {canCall1to1 ? (
                <button
                  type="button"
                  onClick={() => openWhatsApp(conversation?.otherPhone)}
                  className="ops-chat-icon-btn"
                  style={{ color: "#25D366" }}
                  title="Call on WhatsApp"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                </button>
              ) : null}
              {isGroup ? (
                <button
                  type="button"
                  onClick={() => setShowMembers((v) => !v)}
                  className="ops-chat-icon-btn"
                  title="Group members"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </button>
              ) : null}
            </div>
          </header>

          {isGroup && showMembers ? (
            <div className="ops-chat-members">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
                  {members.length} members
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Leave this group?")) {
                      void leaveMutation.mutateAsync({ conversationId });
                    }
                  }}
                  className="text-xs font-semibold"
                  style={{ color: "var(--red, #f87171)" }}
                >
                  Leave group
                </button>
              </div>
              <ul className="space-y-0.5">
                {members.map((m) => {
                  const phoneOk = hasPhone(m.phone);
                  const isMe = m.id === user?.id;
                  return (
                    <li key={m.id} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
                      <div className="ops-avatar flex h-8 w-8 shrink-0 items-center justify-center text-xs font-bold">
                        {(m.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" style={{ color: "var(--text)" }}>
                          {m.name}
                          {isMe ? " (you)" : ""}
                        </p>
                        <p className="truncate text-[11px] capitalize" style={{ color: "var(--text-dim)" }}>
                          {m.role ?? ""}
                        </p>
                      </div>
                      {!isMe ? (
                        phoneOk ? (
                          <button
                            type="button"
                            onClick={() => openWhatsApp(m.phone)}
                            className="ops-btn flex items-center gap-1 px-2 py-1 text-[11px] font-semibold"
                            style={{ color: "#25D366" }}
                          >
                            <WhatsAppIcon className="h-3.5 w-3.5" />
                            Call
                          </button>
                        ) : (
                          <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>
                            No number
                          </span>
                        )
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <div className="ops-chat-messages">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="ops-skel h-14 rounded-2xl" />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="ops-chat-empty">
                <span className="text-3xl opacity-60" aria-hidden="true">
                  💬
                </span>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  No messages yet
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Send a message to start the conversation
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((item) => {
                  const mine = item.senderId === user?.id;
                  if (item.type === "system") {
                    return (
                      <div key={item.id} className="ops-chat-system">
                        <span>{item.body}</span>
                      </div>
                    );
                  }
                  const delivered = (item.deliveredTo ?? []).some((id) => id !== item.senderId);
                  const read = (item.readBy ?? []).some((id) => id !== item.senderId);
                  return (
                    <div key={item.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`ops-chat-bubble ${mine ? "ops-chat-bubble--mine" : "ops-chat-bubble--other"}`}
                        style={{ color: "var(--text)" }}
                      >
                        {isGroup && !mine ? (
                          <p className="mb-0.5 text-[11px] font-bold" style={{ color: "var(--accent)" }}>
                            {item.senderName}
                          </p>
                        ) : null}

                        {item.type === "voice" ? (
                          <VoiceMessageBubble
                            audioUrl={item.meta?.audioUrl}
                            durationMs={item.meta?.durationMs}
                            mine={mine}
                          />
                        ) : item.type === "document" ? (
                          <a
                            href={mediaUrl(item.meta?.fileUrl) ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3"
                            style={{ minWidth: 200 }}
                          >
                            <span
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                              style={{ background: "rgba(34,211,238,0.18)", color: "var(--accent)" }}
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
                              </svg>
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium underline">
                                {item.meta?.fileName || "Document"}
                              </span>
                              <span className="block text-[11px]" style={{ color: "var(--text-dim)" }}>
                                {formatFileSize(item.meta?.fileSize)}
                              </span>
                            </span>
                          </a>
                        ) : item.type === "delivery_photo" ? (
                          <a href={mediaUrl(item.meta?.photoUrl) ?? "#"} target="_blank" rel="noopener noreferrer">
                            <img
                              src={mediaUrl(item.meta?.photoUrl) ?? ""}
                              alt={item.meta?.stopName || "Delivery photo"}
                              className="max-h-56 rounded-lg"
                            />
                            {item.meta?.stopName ? (
                              <span className="mt-1 block text-xs" style={{ color: "var(--text-muted)" }}>
                                {item.meta.stopName}
                              </span>
                            ) : null}
                          </a>
                        ) : (
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{item.body}</p>
                        )}

                        <span className="mt-1 flex items-center justify-end gap-1">
                          <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>
                            {formatMessageTime(item.createdAt)}
                          </span>
                          {mine ? (
                            <span
                              className="text-[10px]"
                              style={{ color: read ? "var(--accent)" : "var(--text-dim)" }}
                              title={read ? "Read" : delivered ? "Delivered" : "Sent"}
                            >
                              {delivered || read ? "✓✓" : "✓"}
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {someoneTyping ? (
              <div className="mt-2 flex justify-start">
                <span
                  className="ops-chat-bubble ops-chat-bubble--other text-sm italic"
                  style={{ color: "var(--text-muted)" }}
                >
                  typing…
                </span>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={(e) => void handleSend(e)} className="ops-chat-composer">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => void handleFilePick(e)}
            />
            {recording ? (
              <div className="flex flex-1 items-center gap-3 px-1">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full" style={{ background: "#f87171" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, "0")}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Recording…
                </span>
                <button
                  type="button"
                  onClick={() => stopRecording(false)}
                  className="ops-btn ml-auto px-3 py-1.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => stopRecording(true)}
                  className="ops-chat-icon-btn ops-chat-icon-btn--accent"
                  aria-label="Send voice message"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={documentMutation.isPending}
                  className="ops-chat-icon-btn"
                  aria-label="Attach document"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <textarea
                  value={draft}
                  onChange={(e) => handleDraftChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend(e);
                    }
                  }}
                  rows={1}
                  placeholder="Type a message…"
                  className="ops-chat-composer__input"
                />
                {draft.trim() ? (
                  <button
                    type="submit"
                    disabled={sendMutation.isPending}
                    className="ops-chat-icon-btn ops-chat-icon-btn--accent"
                    aria-label="Send message"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void startRecording()}
                    disabled={voiceMutation.isPending}
                    className="ops-chat-icon-btn ops-chat-icon-btn--accent"
                    aria-label="Record voice message"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2M12 19v4" />
                    </svg>
                  </button>
                )}
              </>
            )}
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
