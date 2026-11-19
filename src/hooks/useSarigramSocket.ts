import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AppConfig,
  CallRecord,
  CallSessionInfo,
  ChatMessage,
  ChatThread,
  CommentItem,
  ContactItem,
  SarigramStateSnapshot,
  StoryItem,
  UserProfile,
} from '../types/sarigram';
import { DEFAULT_APP_CONFIG } from '../utils/i18n';

const EMPTY_STATE: SarigramStateSnapshot = {
  chats: [],
  messages: [],
  contacts: [],
  stories: [],
  comments: [],
  calls: [],
  onlineUserIds: [],
  lastSeenByUser: {},
  typingByChat: {},
  appConfig: DEFAULT_APP_CONFIG,
};

interface SocketHandlers {
  onIncomingMessage?: (message: ChatMessage, chat?: ChatThread) => void;
  onIncomingCall?: (session: CallSessionInfo) => void;
  onCallAccepted?: (payload: { callId: string; calleeId: string }) => void;
  onCallDeclined?: (payload: { callId: string }) => void;
  onCallEnded?: (payload: { callId: string }) => void;
  onRtcSignal?: (payload: {
    callId: string;
    fromUserId: string;
    signalType: 'offer' | 'answer' | 'ice-candidate';
    data: any;
  }) => void;
}

export function useSarigramSocket(
  currentUser: UserProfile | null,
  showOnlineStatus = true,
  handlers: SocketHandlers = {}
) {
  const [state, setState] = useState<SarigramStateSnapshot>(EMPTY_STATE);
  const [ready, setReady] = useState(false);
  const [connected, setConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const queueRef = useRef<string[]>([]);
  const currentUserRef = useRef<UserProfile | null>(currentUser);
  currentUserRef.current = currentUser;
  const showOnlineRef = useRef(showOnlineStatus);
  showOnlineRef.current = showOnlineStatus;
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const emit = useCallback((event: string, payload: unknown) => {
    const frame = JSON.stringify({ event, payload });
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(frame);
    } else {
      queueRef.current.push(frame);
    }
  }, []);

  useEffect(() => {
    let disposed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (disposed) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (disposed) return;
        setConnected(true);
        if (currentUserRef.current) {
          ws.send(
            JSON.stringify({
              event: 'user:identify',
              payload: { profile: currentUserRef.current, showOnline: showOnlineRef.current },
            })
          );
        }
        while (queueRef.current.length > 0) {
          const next = queueRef.current.shift();
          if (next) ws.send(next);
        }
      };

      ws.onmessage = (evt) => {
        try {
          const { event, payload } = JSON.parse(evt.data) as { event: string; payload: any };
          switch (event) {
            case 'init': {
              setState({
                chats: payload.chats || [],
                messages: payload.messages || [],
                contacts: payload.contacts || [],
                stories: payload.stories || [],
                comments: payload.comments || [],
                calls: payload.calls || [],
                onlineUserIds: payload.onlineUserIds || [],
                lastSeenByUser: payload.lastSeenByUser || {},
                typingByChat: payload.typingByChat || {},
                appConfig: payload.appConfig || DEFAULT_APP_CONFIG,
              });
              setReady(true);
              break;
            }
            case 'appConfig:updated': {
              const cfg = payload.appConfig as AppConfig;
              if (cfg) {
                setState((prev) => ({ ...prev, appConfig: cfg }));
              }
              break;
            }
            case 'presence:update': {
              setState((prev) => ({
                ...prev,
                onlineUserIds: payload.onlineUserIds || [],
                lastSeenByUser: payload.lastSeenByUser || prev.lastSeenByUser,
              }));
              break;
            }
            case 'typing:update': {
              const { chatId, users } = payload;
              setState((prev) => ({
                ...prev,
                typingByChat: {
                  ...prev.typingByChat,
                  [chatId]: users || [],
                },
              }));
              break;
            }
            case 'message:created': {
              const incoming = payload.message as ChatMessage;
              const updatedChat = payload.chat as ChatThread | undefined;
              let wasNew = false;
              setState((prev) => {
                const exists = prev.messages.some((m) => m.id === incoming.id);
                wasNew = !exists;
                const nextMessages = exists ? prev.messages : [...prev.messages, incoming];
                const nextChats = updatedChat
                  ? prev.chats.map((c) => (c.id === updatedChat.id ? updatedChat : c))
                  : prev.chats;
                return { ...prev, messages: nextMessages, chats: nextChats };
              });
              if (wasNew && incoming.senderId !== currentUserRef.current?.id) {
                handlersRef.current.onIncomingMessage?.(incoming, updatedChat);
              }
              break;
            }
            case 'message:updated': {
              const updated = payload.message as ChatMessage;
              setState((prev) => ({
                ...prev,
                messages: prev.messages.map((m) => (m.id === updated.id ? updated : m)),
              }));
              break;
            }
            case 'messages:read': {
              const { chatId, userId, messageIds } = payload as {
                chatId: string;
                userId: string;
                messageIds?: string[];
              };
              if (!chatId || !userId) break;
              const idSet = messageIds && messageIds.length > 0 ? new Set(messageIds) : null;
              setState((prev) => ({
                ...prev,
                messages: prev.messages.map((m) =>
                  m.chatId === chatId &&
                  (!idSet || idSet.has(m.id)) &&
                  !m.readBy.includes(userId)
                    ? { ...m, readBy: [...m.readBy, userId] }
                    : m
                ),
              }));
              break;
            }
            case 'message:deleted': {
              const { messageId } = payload;
              setState((prev) => ({
                ...prev,
                messages: prev.messages.filter((m) => m.id !== messageId),
              }));
              break;
            }
            case 'chat:created': {
              const created = payload.chat as ChatThread;
              setState((prev) => {
                if (prev.chats.some((c) => c.id === created.id)) return prev;
                return { ...prev, chats: [created, ...prev.chats] };
              });
              break;
            }
            case 'chat:updated': {
              const updated = payload.chat as ChatThread;
              setState((prev) => ({
                ...prev,
                chats: prev.chats.map((c) => (c.id === updated.id ? updated : c)),
              }));
              break;
            }
            case 'chat:cleared': {
              const { chatId } = payload;
              setState((prev) => ({
                ...prev,
                messages: prev.messages.filter((m) => m.chatId !== chatId),
              }));
              break;
            }
            case 'chat:deleted': {
              const { chatId } = payload;
              setState((prev) => ({
                ...prev,
                chats: prev.chats.filter((c) => c.id !== chatId),
                messages: prev.messages.filter((m) => m.chatId !== chatId),
              }));
              break;
            }
            case 'contact:created': {
              const contact = payload.contact as ContactItem;
              setState((prev) => {
                if (prev.contacts.some((c) => c.id === contact.id)) return prev;
                return { ...prev, contacts: [contact, ...prev.contacts] };
              });
              break;
            }
            case 'story:created': {
              const story = payload.story as StoryItem;
              setState((prev) => {
                if (prev.stories.some((s) => s.id === story.id)) return prev;
                return { ...prev, stories: [story, ...prev.stories] };
              });
              break;
            }
            case 'story:updated': {
              const story = payload.story as StoryItem;
              setState((prev) => ({
                ...prev,
                stories: prev.stories.map((s) => (s.id === story.id ? story : s)),
              }));
              break;
            }
            case 'comment:created': {
              const comment = payload.comment as CommentItem;
              setState((prev) => {
                if (prev.comments.some((c) => c.id === comment.id)) return prev;
                return { ...prev, comments: [...prev.comments, comment] };
              });
              break;
            }
            case 'call:created': {
              const call = payload.call as CallRecord;
              setState((prev) => {
                if (prev.calls.some((c) => c.id === call.id)) return prev;
                return { ...prev, calls: [call, ...prev.calls] };
              });
              break;
            }
            case 'call:incoming': {
              handlersRef.current.onIncomingCall?.(payload as CallSessionInfo);
              break;
            }
            case 'call:accepted': {
              handlersRef.current.onCallAccepted?.(payload);
              break;
            }
            case 'call:declined': {
              handlersRef.current.onCallDeclined?.(payload);
              break;
            }
            case 'call:ended': {
              handlersRef.current.onCallEnded?.(payload);
              break;
            }
            case 'call:rtc_signal': {
              handlersRef.current.onRtcSignal?.(payload);
              break;
            }
          }
        } catch (err) {
          console.error('Failed to process WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        if (disposed) return;
        setConnected(false);
        reconnectTimer = setTimeout(connect, 1500);
      };
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (connected && currentUser) {
      emit('user:identify', { profile: currentUser, showOnline: showOnlineStatus });
    }
  }, [connected, currentUser, showOnlineStatus, emit]);

  return {
    state,
    ready,
    connected,
    sendMessage: (msg: ChatMessage) => {
      setState((prev) => {
        if (prev.messages.some((m) => m.id === msg.id)) return prev;
        return { ...prev, messages: [...prev.messages, msg] };
      });
      emit('message:send', msg);
    },
    editMessage: (messageId: string, text: string) => emit('message:edit', { messageId, text }),
    deleteMessage: (messageId: string) => emit('message:delete', { messageId }),
    reactToMessage: (messageId: string, emoji: string, userId: string) =>
      emit('message:react', { messageId, emoji, userId }),
    pinMessage: (chatId: string, messageId: string) => emit('message:pin', { chatId, messageId }),
    votePoll: (messageId: string, optionId: string, userId: string) =>
      emit('poll:vote', { messageId, optionId, userId }),
    createChat: (chat: ChatThread) => {
      setState((prev) => {
        if (prev.chats.some((c) => c.id === chat.id)) return prev;
        return { ...prev, chats: [chat, ...prev.chats] };
      });
      emit('chat:create', chat);
    },
    updateChat: (chatId: string, patch: Partial<ChatThread>) => emit('chat:update', { chatId, patch }),
    markChatRead: (chatId: string, userId: string) => {
      setState((prev) => ({
        ...prev,
        chats: prev.chats.map((c) =>
          c.id === chatId ? { ...c, unreadBy: { ...c.unreadBy, [userId]: 0 } } : c
        ),
        messages: prev.messages.map((m) =>
          m.chatId === chatId && !m.readBy.includes(userId)
            ? { ...m, readBy: [...m.readBy, userId] }
            : m
        ),
      }));
      emit('chat:read', { chatId, userId });
    },
    clearChat: (chatId: string) => emit('chat:clear', { chatId }),
    createContact: (contact: ContactItem) => emit('contact:create', contact),
    createStory: (story: StoryItem) => emit('story:create', story),
    viewStory: (storyId: string, userId: string, react = false) =>
      emit('story:view', { storyId, userId, react }),
    addComment: (comment: CommentItem) => emit('comment:add', comment),
    logCall: (record: CallRecord) => emit('call:log', record),
    sendTyping: (chatId: string, userId: string, userName: string, isTyping: boolean) =>
      emit(isTyping ? 'typing:start' : 'typing:stop', { chatId, userId, userName }),
    identifyUser: (profile: UserProfile) =>
      emit('user:identify', { profile, showOnline: showOnlineRef.current }),
    inviteCall: (session: CallSessionInfo) => emit('call:invite', session),
    acceptCall: (callId: string, callerId: string, calleeId: string) =>
      emit('call:accept', { callId, callerId, calleeId }),
    declineCall: (callId: string, callerId: string) =>
      emit('call:decline', { callId, callerId }),
    endCallSignal: (callId: string, targetUserId: string) =>
      emit('call:end', { callId, targetUserId }),
    sendRtcSignal: (
      targetUserId: string,
      callId: string,
      signalType: 'offer' | 'answer' | 'ice-candidate',
      data: unknown
    ) => emit('call:rtc_signal', { targetUserId, callId, signalType, data }),
  };
}
