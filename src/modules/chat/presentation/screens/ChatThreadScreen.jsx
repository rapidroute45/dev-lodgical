import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { PAGE_CONTENT, PAGE_HEADER_INNER } from "@/shared/layout/pageLayout.js";
import {
  useChatMessagesQuery,
  useConversationsQuery,
  useSendChatMessageMutation,
} from "../../infrastructure/api/chat.queries.js";

function formatMessageTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function ChatThreadScreen() {
  const { id: conversationId = "" } = useParams();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const [draft, setDraft] = useState("");

  const { data: conversations = [] } = useConversationsQuery();
  const conversation = conversations.find((c) => c.id === conversationId);
  const { data: messages = [], isLoading } = useChatMessagesQuery(
    conversationId,
    Boolean(conversationId)
  );
  const sendMutation = useSendChatMessageMutation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    const body = draft.trim();
    if (!conversationId || !body || sendMutation.isPending) return;

    setDraft("");
    try {
      await sendMutation.mutateAsync({ conversationId, body });
    } catch {
      setDraft(body);
    }
  };

  const title = conversation?.otherName ?? "Chat";

  const topBar = (
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 backdrop-blur-md">
      <div className={PAGE_HEADER_INNER}>
        <div className="flex items-center gap-3">
          <Link
            to="/chat"
            className="rounded-lg border border-dispatch-border px-3 py-2 text-sm font-medium text-dispatch-muted transition hover:bg-dispatch-bg"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-dispatch-text">{title}</h1>
            {conversation?.otherEmail ? (
              <p className="text-sm text-dispatch-muted">{conversation.otherEmail}</p>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={`${PAGE_CONTENT} flex min-h-[calc(100svh-12rem)] flex-col`}>
        <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-dispatch-border bg-dispatch-surface p-4 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-dispatch-muted">
              Loading messages…
            </div>
          ) : messages.length === 0 ? (
            <p className="py-12 text-center text-sm text-dispatch-muted">
              No messages yet. Say hello!
            </p>
          ) : (
            messages.map((item) => {
              const mine = item.senderId === user?.id;
              return (
                <div
                  key={item.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 sm:max-w-[70%] ${
                      mine
                        ? "bg-dispatch-primary text-white"
                        : "border border-dispatch-border bg-dispatch-bg text-dispatch-text"
                    }`}
                  >
                    {item.type === "system" ? (
                      <p className="text-xs italic opacity-80">{item.body}</p>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm">{item.body}</p>
                    )}
                    <p
                      className={`mt-1 text-[11px] ${
                        mine ? "text-white/70" : "text-dispatch-light"
                      }`}
                    >
                      {formatMessageTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={(e) => void handleSend(e)}
          className="mt-4 flex items-end gap-3 rounded-2xl border border-dispatch-border bg-dispatch-surface p-3"
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend(e);
              }
            }}
            rows={2}
            placeholder="Type a message…"
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-dispatch-border bg-dispatch-bg px-4 py-2.5 text-sm text-dispatch-text outline-none placeholder:text-dispatch-light focus:border-dispatch-primary"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sendMutation.isPending}
            className="shrink-0 rounded-xl bg-dispatch-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-dispatch-indigo-pressed disabled:opacity-50"
          >
            {sendMutation.isPending ? "Sending…" : "Send"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
