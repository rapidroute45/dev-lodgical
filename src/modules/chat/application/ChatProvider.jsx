import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { CONFIG } from "@/shared/utils/constants.js";
import { getStoredApiEnvironment } from "@/shared/utils/apiEnvironment.js";
import { tokenStorage } from "@/shared/utils/storage.js";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { chatKeys } from "../infrastructure/api/chat.queries.js";
import { markConversationDelivered } from "../infrastructure/api/chat.api.js";

const ChatSocketContext = createContext(null);

function resolveSocketUrl() {
  const socketUrl = CONFIG.SOCKET_URL;
  if (socketUrl) return socketUrl;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

function appendMessage(qc, message) {
  qc.setQueryData(chatKeys.messages(message.conversationId), (old) => {
    if (!old) return [message];
    if (old.some((m) => m.id === message.id)) return old;
    return [...old, message];
  });
}

function patchReceipts(qc, conversationId, field, userId) {
  qc.setQueryData(chatKeys.messages(conversationId), (old) => {
    if (!old) return old;
    return old.map((m) => {
      const list = m[field] ?? [];
      if (list.includes(userId)) return m;
      return { ...m, [field]: [...list, userId] };
    });
  });
}

export function ChatProvider({ children }) {
  const { user, status } = useAuth();
  const qc = useQueryClient();
  const socketRef = useRef(null);
  const pendingJoinsRef = useRef(new Set());
  const [connected, setConnected] = useState(false);
  const [typingMap, setTypingMap] = useState({});

  // Web chat is ops-only, but the socket also powers groups.
  const canConnect = status === "authenticated" && Boolean(user?.id);

  useEffect(() => {
    if (!canConnect) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return undefined;
    }

    const token = tokenStorage.get();
    if (!token) return undefined;

    const dbEnvironment = getStoredApiEnvironment();
    const socket = io(resolveSocketUrl(), {
      auth: { token, dbEnvironment },
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 15,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      for (const id of pendingJoinsRef.current) {
        socket.emit("conversation:join", { conversationId: id });
      }
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    socket.on("message:new", (message) => {
      appendMessage(qc, message);
      void qc.invalidateQueries({ queryKey: chatKeys.conversations() });
      if (message.senderId !== user.id) {
        socket.emit("message:delivered", { conversationId: message.conversationId });
        void markConversationDelivered(message.conversationId).catch(() => {});
      }
    });

    socket.on("message:updated", (message) => {
      qc.setQueryData(chatKeys.messages(message.conversationId), (old) => {
        if (!old) return old;
        return old.map((m) => (m.id === message.id ? { ...m, ...message } : m));
      });
    });

    socket.on("message:deleted", (payload) => {
      if (!payload?.conversationId || !payload.messageId) return;
      if (payload.deletedForAll) {
        qc.setQueryData(chatKeys.messages(payload.conversationId), (old) => {
          if (!old) return old;
          return old.map((m) =>
            m.id === payload.messageId
              ? { ...m, deletedForAll: true, body: "This message was deleted" }
              : m
          );
        });
        return;
      }
      if (payload.deletedFor?.includes(user.id)) {
        qc.setQueryData(chatKeys.messages(payload.conversationId), (old) =>
          old ? old.filter((m) => m.id !== payload.messageId) : old
        );
      }
    });

    socket.on("conversation:updated", () => {
      void qc.invalidateQueries({ queryKey: chatKeys.conversations() });
    });

    socket.on("messages:read", ({ conversationId, readerId }) => {
      patchReceipts(qc, conversationId, "readBy", readerId);
    });

    socket.on("messages:delivered", ({ conversationId, userId: deliveredUserId }) => {
      patchReceipts(qc, conversationId, "deliveredTo", deliveredUserId);
    });

    socket.on("typing:update", ({ conversationId, userId: typingUserId, isTyping }) => {
      if (typingUserId === user.id) return;
      setTypingMap((prev) => {
        const current = new Set(prev[conversationId] ?? []);
        if (isTyping) current.add(typingUserId);
        else current.delete(typingUserId);
        return { ...prev, [conversationId]: [...current] };
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [canConnect, user?.id, qc]);

  const joinConversation = useCallback((conversationId) => {
    if (!conversationId) return;
    pendingJoinsRef.current.add(conversationId);
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit("conversation:join", { conversationId });
    }
  }, []);

  const emitTypingStart = useCallback((conversationId) => {
    socketRef.current?.emit("typing:start", { conversationId });
  }, []);

  const emitTypingStop = useCallback((conversationId) => {
    socketRef.current?.emit("typing:stop", { conversationId });
  }, []);

  const value = useMemo(
    () => ({ connected, typingMap, joinConversation, emitTypingStart, emitTypingStop }),
    [connected, typingMap, joinConversation, emitTypingStart, emitTypingStop]
  );

  return <ChatSocketContext.Provider value={value}>{children}</ChatSocketContext.Provider>;
}

export function useChatSocket() {
  return useContext(ChatSocketContext) ?? {
    connected: false,
    typingMap: {},
    joinConversation: () => {},
    emitTypingStart: () => {},
    emitTypingStop: () => {},
  };
}
