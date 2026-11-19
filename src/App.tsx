import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import { LeftSidebar, type SidebarBottomTab } from './components/LeftSidebar';
import { ChatWindow } from './components/ChatWindow';
import { RightInfoPanel } from './components/RightInfoPanel';
import { DrawerMenu } from './components/DrawerMenu';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { DiscoverModal } from './components/DiscoverModal';
import {
  AuthAccountModal,
  CreatePollModal,
  ForwardModal,
  NewChannelModal,
  NewGroupModal,
} from './components/CreationModals';
import {
  ActiveCallUIState,
  CallsModal,
  ContactsModal,
  LightboxModal,
  SettingsModal,
  StoryModal,
} from './components/WorkspaceModals';
import { Avatar } from './components/Avatar';
import { SarigramSplash } from './components/SarigramSplash';
import { BrandKitModal } from './components/BrandKitModal';
import {
  HelpCenterModal,
  InviteFriendsModal,
  PasscodeLockOverlay,
} from './components/SarigramInfoModals';
import { SarigramPlusModal } from './components/SarigramPlusModal';
import { useSarigramSocket } from './hooks/useSarigramSocket';
import { getChatDisplay, playNotificationChime } from './utils/formatters';
import {
  DEFAULT_APP_CONFIG,
  getBrandGradient,
  getTranslations,
  normalizeLanguage,
} from './utils/i18n';
import { firebaseSignOut, subscribeFirebaseAuth } from './firebase';
import type {
  AppSettings,
  CallSessionInfo,
  ChatMessage,
  ChatThread,
  ContactItem,
  CustomChatFolder,
  PollData,
  SearchUserResult,
  StoryItem,
  UserProfile,
} from './types/sarigram';

const DEFAULT_USER: UserProfile = {
  id: 'user-sari-1',
  firstName: 'Sari',
  lastName: 'Explorer',
  username: 'sari_explorer',
  email: 'kallichamio@gmail.com',
  phone: '+1 415 890 2341',
  bio: 'Designing calm, fast communication spaces on Sarigram.',
  avatarColor: '#5B5CE6',
  role: 'admin',
  status: 'active',
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  wallpaper: 'classic',
  fontSize: 'md',
  enterToSend: true,
  notificationsEnabled: true,
  soundEnabled: true,
  showOnlineStatus: true,
  language: 'English',
  privacyPhone: 'contacts',
  privacyLastSeen: 'everybody',
  privacyProfilePhoto: 'everybody',
  privacyCalls: 'contacts',
  privacyGroups: 'everybody',
  privacyForwarded: 'everybody',
  readReceiptsEnabled: true,
  twoStepEnabled: false,
  twoStepHint: '',
  passcodeEnabled: false,
  passcodePin: '1234',
  blockedUserIds: [],
  keepMediaPeriod: '1month',
  autoDownloadMobile: { photos: true, videos: false, files: false },
  autoDownloadWifi: { photos: true, videos: true, files: true },
  autoDownloadRoaming: { photos: false, videos: false, files: false },
  saveToGalleryPrivate: false,
  saveToGalleryGroups: false,
  saveToGalleryChannels: false,
  streamingEnabled: true,
  callDataSaving: 'mobile',
  proxyEnabled: false,
  proxyType: 'socks5',
  proxyServer: '',
  proxyPort: '1080',
  proxyUsername: '',
  proxyPassword: '',
  notifyPrivateChats: true,
  notifyGroups: true,
  notifyChannels: true,
  callNotifications: true,
  callRingtone: 'chime',
  callVibrate: 'default',
  badgeEnabled: true,
  badgeIncludeMuted: false,
  badgeCountMessages: true,
  autoTerminatePeriod: '6months',
  powerSavingMode: 'auto',
  powerSavingThreshold: 20,
  powerAutoplayVideos: true,
  powerAutoplayGifs: true,
  powerAnimatedEmoji: true,
  powerAnimations: true,
  powerBackgroundSync: true,
  premiumActive: false,
  premiumPlan: 'monthly',
  businessEnabled: false,
  businessHours: 'Mon–Fri · 09:00 – 18:00',
  businessGreeting: 'Welcome! How can our Sarigram Business team help you today?',
  businessAway: 'We are currently away and will reply as soon as we return.',
  privacyBirthdate: 'contacts',
  chatAutomationEnabled: false,
  autoGreetingEnabled: false,
  autoAwayEnabled: false,
  starBalance: 250,
  customFolders: [
    {
      id: 'folder-work',
      name: 'Work',
      includedTypes: [],
      chatIds: ['chat-core-team', 'chat-marcus', 'chat-tech-digest', 'chat-design-channel'],
      excludedChatIds: [],
    },
    {
      id: 'folder-friends',
      name: 'Friends',
      includedTypes: [],
      chatIds: ['chat-elena', 'chat-runners'],
      excludedChatIds: [],
    },
  ] satisfies CustomChatFolder[],
};

const LS_USER_KEY = 'sarigram_current_user_v1';
const LS_ACCOUNTS_KEY = 'sarigram_saved_accounts_v1';
const LS_SETTINGS_KEY = 'sarigram_settings_v1';
const LS_TOKEN_KEY = 'sarigram_auth_token_v1';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const raw = localStorage.getItem(LS_USER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as UserProfile;
        if (parsed.id === 'user-sari-1' && !parsed.role) {
          parsed.role = 'admin';
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_USER;
  });

  const [savedAccounts, setSavedAccounts] = useState<UserProfile[]>(() => {
    try {
      const raw = localStorage.getItem(LS_ACCOUNTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as UserProfile[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [DEFAULT_USER];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const raw = localStorage.getItem(LS_SETTINGS_KEY);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  const [activeChatId, setActiveChatId] = useState<string | null>('chat-sarigram-news');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState<'closed' | 'info' | 'search' | 'comments'>(
    'closed'
  );
  const [activeCommentMessageId, setActiveCommentMessageId] = useState<string | null>(null);

  // Toast notification state
  const [toastNotice, setToastNotice] = useState<{
    chatId: string;
    senderName: string;
    senderColor: string;
    senderAvatar?: string;
    text: string;
  } | null>(null);

  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LS_TOKEN_KEY);
    } catch {
      return null;
    }
  });

  // Modals & overlays
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<'users' | 'channels' | 'apps'>('users');
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [newChannelOpen, setNewChannelOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [callsOpen, setCallsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createPollOpen, setCreatePollOpen] = useState(false);
  const [forwardMsg, setForwardMsg] = useState<ChatMessage | null>(null);
  const [storyModal, setStoryModal] = useState<{
    mode: 'view' | 'create';
    storyId: string | null;
  } | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; caption?: string } | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [brandKitOpen, setBrandKitOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [helpModalTab, setHelpModalTab] = useState<'faq' | 'features' | 'policy' | null>(null);
  const [plusModalTab, setPlusModalTab] = useState<
    'premium' | 'business' | 'stars' | 'gift' | null
  >(null);
  const [settingsInitialTab, setSettingsInitialTab] = useState<
    | 'profile'
    | 'appearance'
    | 'privacy'
    | 'data'
    | 'notifications'
    | 'devices'
    | 'power'
    | 'automation'
  >('profile');
  const [sidebarBottomTab, setSidebarBottomTab] = useState<SidebarBottomTab>('chats');
  const processedAutoMsgIdsRef = useRef<Set<string>>(new Set());
  const [appLocked, setAppLocked] = useState(false);
  const [splashPreviewOpen, setSplashPreviewOpen] = useState(false);
  const [splashDone, setSplashDone] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true;
    }
    return false;
  });

  // WebRTC Audio & Video Call state
  const [activeCall, setActiveCall] = useState<ActiveCallUIState | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const activeCallRef = useRef<ActiveCallUIState | null>(null);
  activeCallRef.current = activeCall;
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);

  const activeChatIdRef = useRef<string | null>(activeChatId);
  activeChatIdRef.current = activeChatId;
  const settingsRef = useRef<AppSettings>(settings);
  settingsRef.current = settings;

  const cleanupRtc = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    pendingIceRef.current = [];
    setLocalStream(null);
    setRemoteStream(null);
  }, []);

  const createPeerConnection = useCallback(
    (
      targetUserId: string,
      callId: string,
      sendRtcSignalFn: (
        targetUserId: string,
        callId: string,
        signalType: 'offer' | 'answer' | 'ice-candidate',
        data: unknown
      ) => void
    ) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      pcRef.current = pc;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      const incomingStream = new MediaStream();
      setRemoteStream(incomingStream);
      pc.ontrack = (evt) => {
        evt.streams[0]?.getTracks().forEach((track) => incomingStream.addTrack(track));
        setRemoteStream(new MediaStream(incomingStream.getTracks()));
      };

      pc.onicecandidate = (evt) => {
        if (evt.candidate) {
          sendRtcSignalFn(targetUserId, callId, 'ice-candidate', evt.candidate.toJSON());
        }
      };

      return pc;
    },
    []
  );

  const socketApiRef = useRef<ReturnType<typeof useSarigramSocket> | null>(null);

  const socketApi = useSarigramSocket(currentUser, settings.showOnlineStatus, {
    onIncomingMessage: (msg, chat) => {
      const cfg = settingsRef.current;
      if (chat?.isMuted) return;
      if (chat?.type === 'private' && cfg.notifyPrivateChats === false) return;
      if (chat?.type === 'group' && cfg.notifyGroups === false) return;
      if (chat?.type === 'channel' && cfg.notifyChannels === false) return;

      const preview =
        msg.type === 'image'
          ? 'Sent a photo'
          : msg.type === 'video'
            ? 'Sent a video'
            : msg.type === 'voice'
              ? 'Sent a voice message'
              : msg.type === 'file'
                ? `Sent ${msg.fileName || 'a file'}`
                : msg.poll?.question || msg.text;

      if (cfg.soundEnabled) {
        playNotificationChime();
      }

      if (cfg.notificationsEnabled && (msg.chatId !== activeChatIdRef.current || document.hidden)) {
        setToastNotice({
          chatId: msg.chatId,
          senderName: chat?.title || msg.senderName,
          senderColor: msg.senderAvatarColor,
          senderAvatar: msg.senderAvatarUrl,
          text: preview,
        });
        setTimeout(() => {
          setToastNotice((curr) => (curr?.chatId === msg.chatId ? null : curr));
        }, 4500);

        if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
          new Notification(chat?.title || msg.senderName, { body: preview });
        }
      }

      // Chat Automation auto-responder for incoming private messages
      if (
        cfg.chatAutomationEnabled &&
        chat?.type === 'private' &&
        msg.senderId !== currentUser.id &&
        msg.type === 'text' &&
        !msg.text.startsWith('🤖 ') &&
        !processedAutoMsgIdsRef.current.has(msg.id)
      ) {
        processedAutoMsgIdsRef.current.add(msg.id);
        const low = msg.text.toLowerCase();
        const rules = cfg.automationRules || [];
        const matchedRule = rules.find((r) => r.enabled && low.includes(r.keyword.toLowerCase()));
        let autoReplyText = '';
        if (matchedRule) {
          autoReplyText = matchedRule.replyText;
        } else if (cfg.autoAwayEnabled) {
          autoReplyText =
            cfg.businessAway || 'We are currently away and will reply as soon as we return.';
        } else if (cfg.autoGreetingEnabled) {
          autoReplyText =
            cfg.businessGreeting ||
            'Welcome! How can our Sarigram Business team help you today?';
        }
        if (autoReplyText) {
          window.setTimeout(() => {
            socketApiRef.current?.sendMessage({
              id: `msg-${crypto.randomUUID()}`,
              chatId: msg.chatId,
              senderId: currentUser.id,
              senderName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
              senderAvatarColor: currentUser.avatarColor,
              senderAvatarUrl: currentUser.avatarUrl,
              type: 'text',
              text: `🤖 ${autoReplyText}`,
              timestamp: new Date().toISOString(),
              reactions: [],
              readBy: [currentUser.id],
            });
          }, 600);
        }
      }
    },
    onIncomingCall: (session: CallSessionInfo) => {
      const cfg = settingsRef.current;
      if (cfg.callNotifications !== false) {
        if (cfg.soundEnabled && cfg.callRingtone !== 'silent') {
          playNotificationChime();
        }
        if (
          cfg.callVibrate !== 'disabled' &&
          typeof navigator !== 'undefined' &&
          typeof navigator.vibrate === 'function'
        ) {
          try {
            const pattern =
              cfg.callVibrate === 'short'
                ? [120]
                : cfg.callVibrate === 'long'
                  ? [400, 140, 400]
                  : [220, 120, 220];
            navigator.vibrate(pattern);
          } catch {
            // ignore
          }
        }
      }
      setActiveCall({
        callId: session.callId,
        peerId: session.callerId,
        peerName: session.callerName,
        peerColor: session.callerAvatarColor,
        peerAvatar: session.callerAvatarUrl,
        kind: session.kind,
        direction: 'incoming',
        status: 'ringing',
      });
      setCallsOpen(true);
    },
    onCallAccepted: async ({ callId }) => {
      const curr = activeCallRef.current;
      if (!curr || curr.callId !== callId) return;
      setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : prev));
      const api = socketApiRef.current;
      if (!api) return;
      const pc = createPeerConnection(curr.peerId, curr.callId, api.sendRtcSignal);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        api.sendRtcSignal(curr.peerId, curr.callId, 'offer', offer);
      } catch {
        // ignore WebRTC offer errors on restricted media devices
      }
    },
    onCallDeclined: ({ callId }) => {
      if (activeCallRef.current?.callId === callId) {
        cleanupRtc();
        setActiveCall(null);
        setCallsOpen(false);
      }
    },
    onCallEnded: ({ callId }) => {
      if (activeCallRef.current?.callId === callId) {
        cleanupRtc();
        setActiveCall(null);
        setCallsOpen(false);
      }
    },
    onRtcSignal: async ({ callId, fromUserId, signalType, data }) => {
      const curr = activeCallRef.current;
      const api = socketApiRef.current;
      if (!curr || curr.callId !== callId || !api) return;

      if (signalType === 'offer') {
        const pc = pcRef.current || createPeerConnection(fromUserId, callId, api.sendRtcSignal);
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        for (const ice of pendingIceRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(ice));
        }
        pendingIceRef.current = [];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        api.sendRtcSignal(fromUserId, callId, 'answer', answer);
      } else if (signalType === 'answer' && pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data));
        for (const ice of pendingIceRef.current) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(ice));
        }
        pendingIceRef.current = [];
      } else if (signalType === 'ice-candidate') {
        if (pcRef.current && pcRef.current.remoteDescription) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(data));
        } else {
          pendingIceRef.current.push(data);
        }
      }
    },
  });

  socketApiRef.current = socketApi;

  const {
    state,
    ready,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    pinMessage,
    votePoll,
    createChat,
    updateChat,
    markChatRead,
    clearChat,
    createContact,
    createStory,
    viewStory,
    addComment,
    logCall,
    sendTyping,
    identifyUser,
    inviteCall,
    acceptCall,
    declineCall,
    endCallSignal,
  } = socketApi;

  // Verify existing auth token on mount
  useEffect(() => {
    if (!authToken) return;
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${authToken}` } })
      .then((r) => {
        if (r.status === 401) {
          try {
            localStorage.removeItem(LS_TOKEN_KEY);
          } catch {
            // ignore
          }
          setAuthToken(null);
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, [authToken]);

  // Keep Firebase Authentication SDK listener active
  useEffect(() => {
    const unsubscribe = subscribeFirebaseAuth(() => {});
    return () => unsubscribe();
  }, []);

  // Sync Tailwind dark mode class
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_USER_KEY, JSON.stringify(currentUser));
    } catch {
      // ignore
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_ACCOUNTS_KEY, JSON.stringify(savedAccounts));
    } catch {
      // ignore
    }
  }, [savedAccounts]);

  const appConfig = state.appConfig || DEFAULT_APP_CONFIG;
  const t = useMemo(() => getTranslations(settings.language), [settings.language]);
  const isAdmin = currentUser.role === 'admin';

  // Sync Power Saving CSS class
  useEffect(() => {
    const disableAnimations =
      settings.powerAnimations === false || settings.powerSavingMode === 'always';
    document.documentElement.classList.toggle('sarigram-power-saving', disableAnimations);
  }, [settings.powerAnimations, settings.powerSavingMode]);

  const handleToggleLanguage = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      language: normalizeLanguage(prev.language) === 'ao' ? 'English' : 'Afaan Oromoo',
    }));
  }, []);

  useEffect(() => {
    setBannerDismissed(false);
  }, [appConfig.announcementText, appConfig.showAnnouncement]);

  useEffect(() => {
    if (!ready || splashDone) return;
    const timer = window.setTimeout(() => setSplashDone(true), 650);
    return () => window.clearTimeout(timer);
  }, [ready, splashDone]);

  useEffect(() => {
    if (!isAdmin && adminOpen) {
      setAdminOpen(false);
    }
  }, [isAdmin, adminOpen]);

  useEffect(() => {
    if (!ready || state.chats.length === 0) return;
    if (!activeChatId || !state.chats.some((c) => c.id === activeChatId)) {
      setActiveChatId(state.chats[0].id);
    }
  }, [ready, state.chats, activeChatId]);

  const visibleChats = useMemo(
    () =>
      state.chats.filter((chat) => {
        if (chat.type === 'saved') {
          return chat.memberIds.includes(currentUser.id) || chat.id === 'chat-saved';
        }
        return true;
      }),
    [state.chats, currentUser.id]
  );

  const totalUnreadBadgeCount = useMemo(() => {
    if (settings.badgeEnabled === false) return 0;
    const includeMuted = Boolean(settings.badgeIncludeMuted);
    const countMessages = settings.badgeCountMessages !== false;
    return visibleChats.reduce((sum, chat) => {
      if (!includeMuted && chat.isMuted) return sum;
      const unread = chat.unreadBy?.[currentUser.id] || 0;
      if (unread <= 0) return sum;
      return sum + (countMessages ? unread : 1);
    }, 0);
  }, [
    visibleChats,
    currentUser.id,
    settings.badgeEnabled,
    settings.badgeIncludeMuted,
    settings.badgeCountMessages,
  ]);

  useEffect(() => {
    const baseName = appConfig.appName?.trim() || 'Sarigram';
    document.title =
      totalUnreadBadgeCount > 0 ? `(${totalUnreadBadgeCount}) ${baseName}` : baseName;
    const nav = navigator as Navigator & {
      setAppBadge?: (count?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    if (totalUnreadBadgeCount > 0) {
      nav.setAppBadge?.(totalUnreadBadgeCount).catch(() => {});
    } else {
      nav.clearAppBadge?.().catch(() => {});
    }
  }, [appConfig.appName, totalUnreadBadgeCount]);

  const activeChat = useMemo(
    () => visibleChats.find((c) => c.id === activeChatId) || null,
    [visibleChats, activeChatId]
  );

  const activeChatMessages = useMemo(
    () =>
      state.messages
        .filter((m) => m.chatId === activeChatId)
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [state.messages, activeChatId]
  );

  // Automatically send read receipt over WebSocket whenever recipient views the active chat
  useEffect(() => {
    if (!ready || !activeChatId || !currentUser?.id) return;

    const syncRead = () => {
      if (document.hidden || settingsRef.current.readReceiptsEnabled === false) return;
      const isChatVisible =
        mobileShowChat ||
        (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches);
      if (!isChatVisible) return;

      const hasUnreadMessages = activeChatMessages.some(
        (m) => m.senderId !== currentUser.id && !m.readBy.includes(currentUser.id)
      );
      const hasUnreadBadge = (activeChat?.unreadBy?.[currentUser.id] || 0) > 0;
      if (hasUnreadMessages || hasUnreadBadge) {
        markChatRead(activeChatId, currentUser.id);
      }
    };

    syncRead();
    window.addEventListener('focus', syncRead);
    document.addEventListener('visibilitychange', syncRead);
    return () => {
      window.removeEventListener('focus', syncRead);
      document.removeEventListener('visibilitychange', syncRead);
    };
  }, [
    ready,
    activeChatId,
    activeChat?.unreadBy,
    activeChatMessages,
    currentUser.id,
    mobileShowChat,
    markChatRead,
  ]);

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setMobileShowChat(true);
    setRightPanelMode((prev) => (prev === 'comments' ? 'closed' : prev));
    markChatRead(chatId, currentUser.id);
  };

  const handleSaveOrSwitchAccount = (profile: UserProfile, token?: string) => {
    if (token) {
      try {
        localStorage.setItem(LS_TOKEN_KEY, token);
      } catch {
        // ignore
      }
      setAuthToken(token);
    }
    setCurrentUser(profile);
    setSavedAccounts((prev) => {
      const exists = prev.some((a) => a.id === profile.id);
      if (exists) return prev.map((a) => (a.id === profile.id ? profile : a));
      return [profile, ...prev];
    });
    identifyUser(profile);
    if (!token) {
      fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      }).catch(() => {});
    }
  };

  const handleSignOut = () => {
    firebaseSignOut().catch(() => {});
    if (authToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      }).catch(() => {});
    }
    try {
      localStorage.removeItem(LS_TOKEN_KEY);
    } catch {
      // ignore
    }
    setAuthToken(null);
    setAuthModalOpen(true);
  };

  const openOrCreateDM = (
    peerId: string,
    peerFullName: string,
    peerUsername: string,
    peerBio: string,
    peerAvatarColor: string,
    peerAvatarUrl?: string
  ) => {
    const existing = state.chats.find(
      (c) =>
        c.type === 'private' &&
        c.memberIds.includes(currentUser.id) &&
        c.memberIds.includes(peerId)
    );
    if (existing) {
      handleSelectChat(existing.id);
      return;
    }
    const myFullName = `${currentUser.firstName} ${currentUser.lastName}`.trim();
    const newChat: ChatThread = {
      id: `chat-dm-${crypto.randomUUID().slice(0, 8)}`,
      type: 'private',
      title: peerFullName,
      username: peerUsername,
      description: peerBio,
      avatarColor: peerAvatarColor,
      avatarUrl: peerAvatarUrl,
      memberIds: [currentUser.id, peerId],
      adminIds: [currentUser.id],
      unreadBy: {},
      participantNames: {
        [currentUser.id]: myFullName,
        [peerId]: peerFullName,
      },
      participantAvatars: {
        [currentUser.id]: { color: currentUser.avatarColor, url: currentUser.avatarUrl },
        [peerId]: { color: peerAvatarColor, url: peerAvatarUrl },
      },
    };
    createChat(newChat);
    setActiveChatId(newChat.id);
    setMobileShowChat(true);
  };

  const handleStartPrivateChat = (contact: ContactItem) => {
    openOrCreateDM(
      contact.id,
      `${contact.firstName} ${contact.lastName}`.trim(),
      contact.username,
      contact.bio,
      contact.avatarColor,
      contact.avatarUrl
    );
  };

  const handleSelectSearchResult = (res: SearchUserResult) => {
    if (res.kind === 'channel') {
      handleSelectChat(res.id);
      return;
    }
    openOrCreateDM(
      res.id,
      `${res.firstName} ${res.lastName}`.trim(),
      res.username,
      res.bio,
      res.avatarColor,
      res.avatarUrl
    );
  };

  const startOutgoingCall = async (
    peerId: string,
    peerName: string,
    peerColor: string,
    peerAvatar: string | undefined,
    kind: 'voice' | 'video',
    chatId: string
  ) => {
    const callId = `call-${crypto.randomUUID().slice(0, 8)}`;
    const mediaBlocked = localStorage.getItem('sarigram_media_denied') === 'true';
    if (!mediaBlocked) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: kind === 'video',
        });
        localStorage.removeItem('sarigram_media_denied');
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch {
        localStorage.setItem('sarigram_media_denied', 'true');
      }
    }

    const isSeededContact = peerId.startsWith('contact-') || peerId.startsWith('chat-');
    setActiveCall({
      callId,
      peerId,
      peerName,
      peerColor,
      peerAvatar,
      kind,
      direction: 'outgoing',
      status: isSeededContact ? 'connected' : 'ringing',
    });
    setCallsOpen(true);

    if (!isSeededContact) {
      inviteCall({
        callId,
        chatId,
        callerId: currentUser.id,
        callerName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
        callerAvatarColor: currentUser.avatarColor,
        callerAvatarUrl: currentUser.avatarUrl,
        calleeId: peerId,
        calleeName: peerName,
        calleeAvatarColor: peerColor,
        calleeAvatarUrl: peerAvatar,
        kind,
      });
    }
  };

  const handleAcceptIncomingCall = async () => {
    if (!activeCall) return;
    const mediaBlocked = localStorage.getItem('sarigram_media_denied') === 'true';
    if (!mediaBlocked) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: activeCall.kind === 'video',
        });
        localStorage.removeItem('sarigram_media_denied');
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch {
        localStorage.setItem('sarigram_media_denied', 'true');
      }
    }
    setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : prev));
    acceptCall(activeCall.callId, activeCall.peerId, currentUser.id);
  };

  const handleDeclineIncomingCall = () => {
    if (!activeCall) return;
    declineCall(activeCall.callId, activeCall.peerId);
    cleanupRtc();
    setActiveCall(null);
    setCallsOpen(false);
  };

  const handleCreatePoll = (poll: PollData) => {
    if (!activeChat) return;
    sendMessage({
      id: `msg-${crypto.randomUUID()}`,
      chatId: activeChat.id,
      senderId: currentUser.id,
      senderName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
      senderAvatarColor: currentUser.avatarColor,
      senderAvatarUrl: currentUser.avatarUrl,
      type: 'poll',
      text: poll.question,
      poll,
      timestamp: new Date().toISOString(),
      reactions: [],
      readBy: [currentUser.id],
    });
  };

  const handleForwardToChat = (targetChatId: string) => {
    if (!forwardMsg) return;
    sendMessage({
      id: `msg-${crypto.randomUUID()}`,
      chatId: targetChatId,
      senderId: currentUser.id,
      senderName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
      senderAvatarColor: currentUser.avatarColor,
      senderAvatarUrl: currentUser.avatarUrl,
      type: forwardMsg.type,
      text: forwardMsg.text,
      mediaUrl: forwardMsg.mediaUrl,
      fileName: forwardMsg.fileName,
      fileSize: forwardMsg.fileSize,
      poll: forwardMsg.poll,
      forwardedFrom: forwardMsg.senderName,
      timestamp: new Date().toISOString(),
      reactions: [],
      readBy: [currentUser.id],
    });
    handleSelectChat(targetChatId);
  };

  const handleReplyToStory = (story: StoryItem, text: string) => {
    const targetChat =
      state.chats.find(
        (c) => c.type === 'private' && c.memberIds.includes(story.authorId)
      ) || state.chats[0];
    if (!targetChat) return;

    sendMessage({
      id: `msg-${crypto.randomUUID()}`,
      chatId: targetChat.id,
      senderId: currentUser.id,
      senderName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
      senderAvatarColor: currentUser.avatarColor,
      senderAvatarUrl: currentUser.avatarUrl,
      type: 'text',
      text: `Replied to story "${story.caption.slice(0, 42)}": ${text}`,
      timestamp: new Date().toISOString(),
      reactions: [],
      readBy: [currentUser.id],
    });
  };

  const handleJumpToMessage = (messageId: string) => {
    const el = document.getElementById(`sarigram-msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="h-[100dvh] w-screen overflow-hidden flex flex-col bg-white dark:bg-[#0E1621] text-slate-900 dark:text-slate-100 relative">
      {/* Global Admin Announcement Banner */}
      {ready && appConfig.showAnnouncement && appConfig.announcementText?.trim() && !bannerDismissed && (
        <div
          className={`shrink-0 bg-gradient-to-r ${getBrandGradient(appConfig.brandPreset)} text-white px-4 py-2 flex items-center justify-between gap-3 text-xs font-medium shadow-sm z-20`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Megaphone className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{appConfig.announcementText}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss announcement"
            className="w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center shrink-0 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Real-Time In-App Notification Toast */}
      {toastNotice && (
        <button
          type="button"
          onClick={() => {
            handleSelectChat(toastNotice.chatId);
            setToastNotice(null);
          }}
          className="fixed top-4 right-4 z-50 max-w-xs px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#1E2B38] shadow-xl border border-slate-200 dark:border-[#2C3B4B] flex items-center gap-3 text-left hover:scale-[1.01] transition-transform"
        >
          <Avatar
            name={toastNotice.senderName}
            color={toastNotice.senderColor}
            imageUrl={toastNotice.senderAvatar}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-display font-semibold text-[#5B5CE6] dark:text-[#A78BFA] truncate">
              {toastNotice.senderName}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
              {toastNotice.text}
            </div>
          </div>
        </button>
      )}

      <div className="flex-1 min-h-0 flex relative">
      {!ready || !splashDone ? (
        <SarigramSplash
          appName={appConfig.appName || 'Sarigram'}
          loadingText={t.connecting || 'Loading...'}
        />
      ) : (
        <>
          <div className={`${mobileShowChat ? 'hidden md:flex' : 'flex'} w-full md:w-auto h-full`}>
            <LeftSidebar
              currentUser={currentUser}
              savedAccounts={savedAccounts}
              chats={visibleChats}
              contacts={state.contacts}
              messages={state.messages}
              stories={state.stories}
              activeChatId={activeChatId}
              onlineUserIds={state.onlineUserIds}
              typingByChat={state.typingByChat}
              language={settings.language}
              settings={settings}
              totalUnreadBadgeCount={totalUnreadBadgeCount}
              appConfig={appConfig}
              customFolders={settings.customFolders ?? DEFAULT_SETTINGS.customFolders}
              activeBottomTab={sidebarBottomTab}
              onChangeBottomTab={setSidebarBottomTab}
              onUpdateCustomFolders={(folders) =>
                setSettings((prev) => ({ ...prev, customFolders: folders }))
              }
              onToggleLanguage={handleToggleLanguage}
              onToggleTheme={() =>
                setSettings((prev) => ({
                  ...prev,
                  theme: prev.theme === 'dark' ? 'light' : 'dark',
                }))
              }
              onSelectChat={handleSelectChat}
              onStartPrivateChat={handleStartPrivateChat}
              onSelectSearchResult={handleSelectSearchResult}
              onOpenDrawer={() => setDrawerOpen(true)}
              onOpenStory={(storyId) => setStoryModal({ mode: 'view', storyId })}
              onOpenCreateStory={() => setStoryModal({ mode: 'create', storyId: null })}
              onOpenNewGroup={() => setNewGroupOpen(true)}
              onOpenNewChannel={() => setNewChannelOpen(true)}
              onOpenContacts={() => setContactsOpen(true)}
              onOpenDiscover={() => setDiscoverOpen(true)}
              onUpdateProfile={(profile) => handleSaveOrSwitchAccount(profile)}
              onOpenSettingsSection={(sec) => {
                setSettingsInitialTab(sec);
                setSettingsOpen(true);
              }}
              onSwitchAccount={(user) => handleSaveOrSwitchAccount(user)}
              onOpenAddAccount={() => setAuthModalOpen(true)}
              onOpenPlus={(plusTab) => setPlusModalTab(plusTab)}
              onOpenHelp={(helpTab) => setHelpModalTab(helpTab)}
              onOpenInviteFriends={() => setInviteOpen(true)}
              onOpenSavedMessages={() => {
                const personalSaved = visibleChats.find(
                  (c) => c.type === 'saved' && c.memberIds.includes(currentUser.id)
                );
                handleSelectChat(personalSaved?.id || 'chat-saved');
              }}
              onOpenBrandKit={() => setBrandKitOpen(true)}
              onOpenAdmin={() => {
                setAdminInitialTab('users');
                setAdminOpen(true);
              }}
              onOpenEditApps={() => {
                setAdminInitialTab('apps');
                setAdminOpen(true);
              }}
            />
          </div>

          <div
            className={`${
              mobileShowChat ? 'flex' : 'hidden md:flex'
            } flex-1 min-w-0 h-full`}
          >
            <ChatWindow
              chat={activeChat}
              messages={activeChatMessages}
              currentUser={currentUser}
              settings={settings}
              appConfig={appConfig}
              onlineUserIds={state.onlineUserIds}
              lastSeenByUser={state.lastSeenByUser}
              typingUsers={
                (activeChatId ? state.typingByChat[activeChatId] : [])?.filter(
                  (u) => u.userId !== currentUser.id
                ) || []
              }
              rightPanelMode={rightPanelMode}
              onBackMobile={() => setMobileShowChat(false)}
              onToggleRightPanel={setRightPanelMode}
              onOpenComments={(messageId) => {
                setActiveCommentMessageId(messageId);
                setRightPanelMode('comments');
              }}
              onSendMessage={sendMessage}
              onEditMessage={editMessage}
              onDeleteMessage={deleteMessage}
              onReactToMessage={(messageId, emoji) =>
                reactToMessage(messageId, emoji, currentUser.id)
              }
              onPinMessage={pinMessage}
              onVotePoll={(messageId, optionId) =>
                votePoll(messageId, optionId, currentUser.id)
              }
              onUpdateChat={updateChat}
              onClearChat={clearChat}
              onOpenForward={(msg) => setForwardMsg(msg)}
              onOpenCreatePoll={() => setCreatePollOpen(true)}
              onOpenCall={(kind) => {
                if (!activeChat) return;
                const display = getChatDisplay(activeChat, currentUser.id);
                const targetPeerId = display.peerId || activeChat.id;
                startOutgoingCall(
                  targetPeerId,
                  display.title,
                  display.avatarColor,
                  display.avatarUrl,
                  kind,
                  activeChat.id
                );
              }}
              onOpenLightbox={(url, caption) => setLightbox({ url, caption })}
              onTyping={(isTyping) => {
                if (!activeChat) return;
                sendTyping(
                  activeChat.id,
                  currentUser.id,
                  `${currentUser.firstName} ${currentUser.lastName}`.trim(),
                  isTyping
                );
              }}
            />

            <RightInfoPanel
              mode={rightPanelMode}
              chat={activeChat}
              messages={activeChatMessages}
              contacts={state.contacts}
              comments={state.comments}
              activeCommentMessageId={activeCommentMessageId}
              currentUser={currentUser}
              onlineUserIds={state.onlineUserIds}
              onClose={() => setRightPanelMode('closed')}
              onUpdateChat={updateChat}
              onAddComment={addComment}
              onOpenLightbox={(url, caption) => setLightbox({ url, caption })}
              onJumpToMessage={handleJumpToMessage}
            />
          </div>
        </>
      )}
      </div>

      {/* Navigation Drawer */}
      <DrawerMenu
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentUser={currentUser}
        savedAccounts={savedAccounts}
        theme={settings.theme}
        language={settings.language}
        appConfig={appConfig}
        hasAuthToken={Boolean(authToken)}
        onToggleTheme={() =>
          setSettings((prev) => ({
            ...prev,
            theme: prev.theme === 'dark' ? 'light' : 'dark',
          }))
        }
        onToggleLanguage={handleToggleLanguage}
        onSwitchAccount={(user) => handleSaveOrSwitchAccount(user)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenDiscover={() => setDiscoverOpen(true)}
        onOpenAdmin={() => {
          setAdminInitialTab('users');
          setAdminOpen(true);
        }}
        onOpenEditApps={() => {
          setAdminInitialTab('apps');
          setAdminOpen(true);
        }}
        onOpenNewGroup={() => setNewGroupOpen(true)}
        onOpenNewChannel={() => setNewChannelOpen(true)}
        onOpenContacts={() => setContactsOpen(true)}
        onOpenCalls={() => {
          setActiveCall(null);
          setCallsOpen(true);
        }}
        onOpenSavedMessages={() => {
          const personalSaved = visibleChats.find(
            (c) => c.type === 'saved' && c.memberIds.includes(currentUser.id)
          );
          handleSelectChat(personalSaved?.id || 'chat-saved');
        }}
        onOpenSettings={() => {
          setSettingsInitialTab('profile');
          setSettingsOpen(true);
        }}
        onOpenPrivacySecurity={() => {
          setSettingsInitialTab('privacy');
          setSettingsOpen(true);
        }}
        onOpenDataStorage={() => {
          setSettingsInitialTab('data');
          setSettingsOpen(true);
        }}
        onOpenDevices={() => {
          setSettingsInitialTab('devices');
          setSettingsOpen(true);
        }}
        onOpenPowerSaving={() => {
          setSettingsInitialTab('power');
          setSettingsOpen(true);
        }}
        onOpenAutomation={() => {
          setSettingsInitialTab('automation');
          setSettingsOpen(true);
        }}
        onOpenPlus={(tab) => setPlusModalTab(tab)}
        onOpenInviteFriends={() => setInviteOpen(true)}
        onOpenHelpCenter={() => setHelpModalTab('faq')}
        onOpenBrandKit={() => setBrandKitOpen(true)}
      />

      {/* Modals & Forms */}
      {authModalOpen && (
        <AuthAccountModal
          onClose={() => setAuthModalOpen(false)}
          onAuthenticated={handleSaveOrSwitchAccount}
        />
      )}

      {discoverOpen && (
        <DiscoverModal
          currentUserId={currentUser.id}
          onClose={() => setDiscoverOpen(false)}
          onSelectResult={handleSelectSearchResult}
        />
      )}

      {adminOpen && isAdmin && (
        <AdminDashboardModal
          key={adminInitialTab}
          authToken={authToken}
          currentUser={currentUser}
          initialTab={adminInitialTab}
          onClose={() => setAdminOpen(false)}
          onRequireAuth={() => setAuthModalOpen(true)}
          onSelectChat={handleSelectChat}
        />
      )}

      {newGroupOpen && (
        <NewGroupModal
          currentUser={currentUser}
          contacts={state.contacts}
          onClose={() => setNewGroupOpen(false)}
          onCreateGroup={(chat) => {
            createChat(chat);
            setActiveChatId(chat.id);
            setMobileShowChat(true);
          }}
        />
      )}

      {newChannelOpen && (
        <NewChannelModal
          currentUser={currentUser}
          onClose={() => setNewChannelOpen(false)}
          onCreateChannel={(chat) => {
            createChat(chat);
            setActiveChatId(chat.id);
            setMobileShowChat(true);
          }}
        />
      )}

      {createPollOpen && (
        <CreatePollModal
          onClose={() => setCreatePollOpen(false)}
          onCreatePoll={handleCreatePoll}
        />
      )}

      {forwardMsg && (
        <ForwardModal
          message={forwardMsg}
          chats={visibleChats}
          onClose={() => setForwardMsg(null)}
          onForwardToChat={handleForwardToChat}
        />
      )}

      {contactsOpen && (
        <ContactsModal
          currentUserId={currentUser.id}
          contacts={state.contacts}
          onlineUserIds={state.onlineUserIds}
          onClose={() => setContactsOpen(false)}
          onStartPrivateChat={handleStartPrivateChat}
          onSelectSearchUser={handleSelectSearchResult}
          onAddContact={createContact}
        />
      )}

      {callsOpen && (
        <CallsModal
          calls={state.calls}
          contacts={state.contacts}
          activeCall={activeCall}
          localStream={localStream}
          remoteStream={remoteStream}
          onClose={() => {
            cleanupRtc();
            setActiveCall(null);
            setCallsOpen(false);
          }}
          onAcceptIncoming={handleAcceptIncomingCall}
          onDeclineIncoming={handleDeclineIncomingCall}
          onEndActiveCall={(durationSeconds) => {
            if (activeCall) {
              endCallSignal(activeCall.callId, activeCall.peerId);
              logCall({
                id: `call-${crypto.randomUUID().slice(0, 8)}`,
                peerId: activeCall.peerId,
                peerName: activeCall.peerName,
                peerAvatarColor: activeCall.peerColor,
                peerAvatarUrl: activeCall.peerAvatar,
                direction: activeCall.direction,
                kind: activeCall.kind,
                durationSeconds,
                timestamp: new Date().toISOString(),
              });
            }
            cleanupRtc();
            setActiveCall(null);
          }}
          onStartCallFromLog={(record) =>
            startOutgoingCall(
              record.peerId,
              record.peerName,
              record.peerAvatarColor,
              record.peerAvatarUrl,
              record.kind,
              activeChatId || 'chat-elena'
            )
          }
          onStartNewCall={(contact, kind) =>
            startOutgoingCall(
              contact.id,
              `${contact.firstName} ${contact.lastName}`.trim(),
              contact.avatarColor,
              contact.avatarUrl,
              kind,
              activeChatId || 'chat-elena'
            )
          }
        />
      )}

      {settingsOpen && (
        <SettingsModal
          key={settingsInitialTab}
          currentUser={currentUser}
          settings={settings}
          initialTab={settingsInitialTab}
          contacts={state.contacts}
          messages={state.messages}
          calls={state.calls}
          chats={visibleChats}
          savedAccounts={savedAccounts}
          unreadCount={totalUnreadBadgeCount}
          onClose={() => setSettingsOpen(false)}
          onUpdateProfile={(profile) => handleSaveOrSwitchAccount(profile)}
          onUpdateSettings={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
          onSwitchAccount={(user) => handleSaveOrSwitchAccount(user)}
          onOpenAddAccount={() => setAuthModalOpen(true)}
          onCreatePersonalChannel={(title, chUsername) => {
            const newChan: ChatThread = {
              id: `chat-ch-${crypto.randomUUID().slice(0, 8)}`,
              type: 'channel',
              title,
              username: chUsername,
              description: `Personal channel of ${currentUser.firstName} ${currentUser.lastName}`.trim(),
              avatarColor: currentUser.avatarColor,
              avatarUrl: currentUser.avatarUrl,
              subscriberCount: 1,
              memberIds: [currentUser.id],
              adminIds: [currentUser.id],
              unreadBy: {},
            };
            createChat(newChan);
            return newChan;
          }}
          onOpenChat={(chatId) => handleSelectChat(chatId)}
          onOpenHelp={(tab) => setHelpModalTab(tab)}
          onOpenPlus={(tab) => setPlusModalTab(tab)}
          onLockApp={() => setAppLocked(true)}
        />
      )}

      {storyModal && (
        <StoryModal
          mode={storyModal.mode}
          stories={state.stories}
          activeStoryId={storyModal.storyId}
          currentUser={currentUser}
          onClose={() => setStoryModal(null)}
          onSelectStory={(storyId) => setStoryModal({ mode: 'view', storyId })}
          onViewStory={(storyId, react) => viewStory(storyId, currentUser.id, react)}
          onCreateStory={createStory}
          onReplyToStory={handleReplyToStory}
        />
      )}

      {lightbox && (
        <LightboxModal
          imageUrl={lightbox.url}
          caption={lightbox.caption}
          onClose={() => setLightbox(null)}
        />
      )}

      {brandKitOpen && (
        <BrandKitModal
          currentAvatarUrl={currentUser.avatarUrl}
          onClose={() => setBrandKitOpen(false)}
          onPreviewSplash={() => setSplashPreviewOpen(true)}
          onApplyProfilePicture={(avatarUrl) =>
            handleSaveOrSwitchAccount({ ...currentUser, avatarUrl })
          }
        />
      )}

      {splashPreviewOpen && (
        <SarigramSplash
          appName={appConfig.appName || 'Sarigram'}
          loadingText={t.connecting || 'Loading...'}
          isPreview
          onClosePreview={() => setSplashPreviewOpen(false)}
        />
      )}

      {inviteOpen && (
        <InviteFriendsModal
          currentUser={currentUser}
          contacts={state.contacts}
          onClose={() => setInviteOpen(false)}
          onStartPrivateChat={handleStartPrivateChat}
        />
      )}

      {helpModalTab && (
        <HelpCenterModal
          initialTab={helpModalTab}
          onClose={() => setHelpModalTab(null)}
        />
      )}

      {plusModalTab && (
        <SarigramPlusModal
          initialTab={plusModalTab}
          currentUser={currentUser}
          settings={settings}
          contacts={state.contacts}
          onClose={() => setPlusModalTab(null)}
          onUpdateSettings={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
          onSendGiftMessage={(contact, giftSummary) => {
            const existing = state.chats.find(
              (c) =>
                c.type === 'private' &&
                c.memberIds.includes(currentUser.id) &&
                c.memberIds.includes(contact.id)
            );
            let targetChatId = existing?.id;
            const peerFullName = `${contact.firstName} ${contact.lastName}`.trim();
            if (!targetChatId) {
              const myFullName = `${currentUser.firstName} ${currentUser.lastName}`.trim();
              targetChatId = `chat-dm-${crypto.randomUUID().slice(0, 8)}`;
              const newChat: ChatThread = {
                id: targetChatId,
                type: 'private',
                title: peerFullName,
                username: contact.username,
                description: contact.bio,
                avatarColor: contact.avatarColor,
                avatarUrl: contact.avatarUrl,
                memberIds: [currentUser.id, contact.id],
                adminIds: [currentUser.id],
                unreadBy: {},
                participantNames: {
                  [currentUser.id]: myFullName,
                  [contact.id]: peerFullName,
                },
                participantAvatars: {
                  [currentUser.id]: {
                    color: currentUser.avatarColor,
                    url: currentUser.avatarUrl,
                  },
                  [contact.id]: {
                    color: contact.avatarColor,
                    url: contact.avatarUrl,
                  },
                },
              };
              createChat(newChat);
            }
            sendMessage({
              id: `msg-${crypto.randomUUID()}`,
              chatId: targetChatId,
              senderId: currentUser.id,
              senderName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
              senderAvatarColor: currentUser.avatarColor,
              senderAvatarUrl: currentUser.avatarUrl,
              type: 'text',
              text: giftSummary,
              timestamp: new Date().toISOString(),
              reactions: [],
              readBy: [currentUser.id],
            });
            setActiveChatId(targetChatId);
            setMobileShowChat(true);
            setPlusModalTab(null);
          }}
        />
      )}

      {appLocked && (
        <PasscodeLockOverlay
          expectedPin={settings.passcodePin || '1234'}
          hint={settings.twoStepHint}
          onUnlock={() => setAppLocked(false)}
        />
      )}
    </div>
  );
}
