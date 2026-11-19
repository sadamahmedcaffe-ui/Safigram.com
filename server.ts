import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import type {
  AppConfig,
  CallRecord,
  CallSessionInfo,
  ChatMessage,
  ChatThread,
  CommentItem,
  ContactItem,
  SarigramStateSnapshot,
  SearchUserResult,
  StoryItem,
  UserProfile,
} from './src/types/sarigram.ts';

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'sarigram-state.json');

interface StoredUser extends UserProfile {
  passwordHash: string;
  firebaseUid?: string;
}

interface PersistedStore {
  users: Record<string, StoredUser>;
  sessions: Record<string, string>;
  lastSeenByUser: Record<string, string>;
  chats: ChatThread[];
  messages: ChatMessage[];
  contacts: ContactItem[];
  stories: StoryItem[];
  comments: CommentItem[];
  calls: CallRecord[];
  appConfig: AppConfig;
}

const DEFAULT_APP_CONFIG: AppConfig = {
  appName: 'Sarigram',
  appSubtitle: 'Cloud Sync',
  welcomeTitle: 'Welcome to Sarigram',
  welcomeBody: 'Select a chat, group, or channel from the left sidebar to start messaging.',
  announcementText: '',
  showAnnouncement: false,
  brandPreset: 'blue-purple',
  compactMode: false,
  showStories: true,
};

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, expected] = storedHash.split(':');
  if (!salt || !expected) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expected, 'hex');
  if (derived.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(derived, expectedBuf);
}

function sanitizeUser(user: StoredUser, onlineIds?: Set<string>): UserProfile {
  const { passwordHash: _ignored, ...safe } = user;
  return {
    ...safe,
    isOnline: onlineIds ? onlineIds.has(user.id) : safe.isOnline,
  };
}

function createInitialStore(): PersistedStore {
  const now = Date.now();
  const minsAgo = (m: number) => new Date(now - m * 60_000).toISOString();
  const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();

  const defaultUserId = 'user-sari-1';

  const users: Record<string, StoredUser> = {
    [defaultUserId]: {
      id: defaultUserId,
      firstName: 'Sari',
      lastName: 'Explorer',
      username: 'sari_explorer',
      email: 'kallichamio@gmail.com',
      phone: '+1 415 890 2341',
      bio: 'Designing calm, fast communication spaces on Sarigram.',
      avatarColor: '#5B5CE6',
      role: 'admin',
      status: 'active',
      passwordHash: hashPassword('sadam12!@'),
      lastSeen: new Date().toISOString(),
    },
  };

  const contacts: ContactItem[] = [
    {
      id: 'contact-elena',
      firstName: 'Elena',
      lastName: 'Rostova',
      username: 'elena_rostova',
      phone: '+1 415 392 8810',
      bio: 'Product Architect · Copenhagen & SF',
      avatarColor: '#E17076',
      lastSeen: 'online',
    },
    {
      id: 'contact-marcus',
      firstName: 'Marcus',
      lastName: 'Vance',
      username: 'mvance',
      phone: '+1 646 218 4409',
      bio: 'Distributed systems & realtime protocols',
      avatarColor: '#7BC862',
      lastSeen: minsAgo(14),
    },
    {
      id: 'contact-nadia',
      firstName: 'Nadia',
      lastName: 'Khoury',
      username: 'nadiak',
      phone: '+44 20 7946 0921',
      bio: 'Typography, editorial layout & motion craft',
      avatarColor: '#65AADD',
      lastSeen: minsAgo(45),
    },
    {
      id: 'contact-kenji',
      firstName: 'Kenji',
      lastName: 'Takahashi',
      username: 'kenji_t',
      phone: '+81 3 5550 1982',
      bio: 'Audio DSP & mobile interfaces',
      avatarColor: '#EE7AAE',
      lastSeen: hoursAgo(2),
    },
    {
      id: 'contact-sofia',
      firstName: 'Sofia',
      lastName: 'Alvarez',
      username: 'sofia_a',
      phone: '+34 91 555 0147',
      bio: 'Community lead & documentary photographer',
      avatarColor: '#FAA774',
      lastSeen: 'online',
    },
  ];

  const lastSeenByUser: Record<string, string> = {
    'contact-marcus': minsAgo(14),
    'contact-nadia': minsAgo(45),
    'contact-kenji': hoursAgo(2),
  };

  const chats: ChatThread[] = [
    {
      id: 'chat-saved',
      type: 'saved',
      title: 'Saved Messages',
      description: 'Your personal cloud storage on Sarigram. Forward messages, links, files, and notes here.',
      avatarColor: '#3390EC',
      isPinned: true,
      memberIds: [defaultUserId],
      adminIds: [defaultUserId],
      unreadBy: {},
    },
    {
      id: 'chat-sarigram-news',
      type: 'channel',
      title: 'Sarigram News',
      username: 'sarigram_news',
      description: 'Official announcements, release notes, and platform milestones from the Sarigram team.',
      avatarUrl: '/brand/sarigram-profile-512.png',
      avatarColor: '#1E5B88',
      verified: true,
      isPinned: true,
      subscriberCount: 48290,
      memberIds: [defaultUserId],
      adminIds: [defaultUserId],
      pinnedMessageId: 'msg-news-2',
      unreadBy: {},
    },
    {
      id: 'chat-core-team',
      type: 'group',
      title: 'Sarigram Core Studio',
      username: 'sarigram_studio',
      description: 'Daily design critiques, WebSocket sync testing, and product architecture.',
      avatarUrl: '/src/assets/images/avatar_design_studio_1795015829890.jpg',
      avatarColor: '#C59B6D',
      memberCount: 6,
      memberIds: [defaultUserId, 'contact-elena', 'contact-marcus', 'contact-nadia', 'contact-kenji', 'contact-sofia'],
      adminIds: [defaultUserId, 'contact-elena'],
      pinnedMessageId: 'msg-group-1',
      unreadBy: {},
    },
    {
      id: 'chat-elena',
      type: 'private',
      title: 'Elena Rostova',
      username: 'elena_rostova',
      description: 'Product Architect · Copenhagen & SF',
      avatarColor: '#E17076',
      memberIds: [defaultUserId, 'contact-elena'],
      adminIds: [defaultUserId],
      unreadBy: {},
      participantNames: {
        [defaultUserId]: 'Sari Explorer',
        'contact-elena': 'Elena Rostova',
      },
      participantAvatars: {
        [defaultUserId]: { color: '#3390EC' },
        'contact-elena': { color: '#E17076' },
      },
    },
    {
      id: 'chat-design-channel',
      type: 'channel',
      title: 'Architecture & Light',
      username: 'arch_light',
      description: 'Curated architectural spaces, travertine studies, and creative studio setups.',
      avatarUrl: '/src/assets/images/avatar_design_studio_1795015829890.jpg',
      avatarColor: '#A68A64',
      verified: true,
      subscriberCount: 19430,
      memberIds: [defaultUserId],
      adminIds: ['contact-nadia', defaultUserId],
      unreadBy: {},
    },
    {
      id: 'chat-tech-digest',
      type: 'channel',
      title: 'Systems & Craft Digest',
      username: 'systems_digest',
      description: 'Notes on distributed state, WebSocket resilience, and modern web engineering.',
      avatarUrl: '/src/assets/images/avatar_tech_digest_1795015829586.jpg',
      avatarColor: '#3B4D5E',
      subscriberCount: 12840,
      memberIds: [defaultUserId],
      adminIds: ['contact-marcus', defaultUserId],
      unreadBy: {},
    },
    {
      id: 'chat-runners',
      type: 'group',
      title: 'Waterfront Runners',
      username: 'waterfront_run',
      description: 'Weekly 8K morning runs along the promenade. All paces welcome.',
      avatarColor: '#6EC9CB',
      memberCount: 28,
      memberIds: [defaultUserId, 'contact-sofia', 'contact-kenji'],
      adminIds: ['contact-sofia', defaultUserId],
      unreadBy: {},
    },
    {
      id: 'chat-marcus',
      type: 'private',
      title: 'Marcus Vance',
      username: 'mvance',
      description: 'Distributed systems & realtime protocols',
      avatarColor: '#7BC862',
      memberIds: [defaultUserId, 'contact-marcus'],
      adminIds: [defaultUserId],
      unreadBy: {},
      participantNames: {
        [defaultUserId]: 'Sari Explorer',
        'contact-marcus': 'Marcus Vance',
      },
      participantAvatars: {
        [defaultUserId]: { color: '#3390EC' },
        'contact-marcus': { color: '#7BC862' },
      },
    },
    {
      id: 'chat-saribot',
      type: 'bot',
      title: 'SariBot',
      username: 'saribot',
      description: 'Official Sarigram utility bot. Send /help, /stats, /shortcuts, or /about.',
      avatarUrl: '/brand/sarigram-profile-512.png',
      avatarColor: '#2AABEE',
      verified: true,
      memberIds: [defaultUserId],
      adminIds: ['bot-saribot'],
      unreadBy: {},
    },
  ];

  const messages: ChatMessage[] = [
    {
      id: 'msg-saved-1',
      chatId: 'chat-saved',
      senderId: defaultUserId,
      senderName: 'Sari Explorer',
      senderAvatarColor: '#3390EC',
      type: 'text',
      text: 'Welcome to your Sarigram Saved Messages. Drop links, notes, photos, videos, or forward posts from any channel to keep them synced in your personal cloud.',
      timestamp: hoursAgo(12),
      reactions: [],
      readBy: [defaultUserId],
    },
    {
      id: 'msg-saved-2',
      chatId: 'chat-saved',
      senderId: defaultUserId,
      senderName: 'Sari Explorer',
      senderAvatarColor: '#3390EC',
      type: 'image',
      text: 'Studio desk inspiration for Q4 refresh.',
      mediaUrl: '/src/assets/images/media_workspace_desk_1795015832036.jpg',
      forwardedFrom: 'Architecture & Light',
      timestamp: hoursAgo(3),
      reactions: [{ emoji: '🔖', userIds: [defaultUserId] }],
      readBy: [defaultUserId],
    },
    {
      id: 'msg-news-1',
      chatId: 'chat-sarigram-news',
      senderId: 'channel-sarigram-news',
      senderName: 'Sarigram News',
      senderAvatarColor: '#1E5B88',
      senderAvatarUrl: '/brand/sarigram-profile-512.png',
      type: 'text',
      text: 'Sarigram Cloud Messaging 2.0 is live: account registration & login, profile pictures, WebRTC audio & video calls, photo/video/document sharing, Chat Folders, and live Polls.',
      timestamp: hoursAgo(9),
      views: 34120,
      commentsCount: 2,
      reactions: [
        { emoji: '🔥', userIds: ['contact-elena', 'contact-marcus'] },
        { emoji: '❤️', userIds: ['contact-sofia'] },
        { emoji: '👏', userIds: ['contact-kenji'] },
      ],
      readBy: [defaultUserId],
    },
    {
      id: 'msg-news-2',
      chatId: 'chat-sarigram-news',
      senderId: 'channel-sarigram-news',
      senderName: 'Sarigram News',
      senderAvatarColor: '#1E5B88',
      senderAvatarUrl: '/brand/sarigram-profile-512.png',
      type: 'poll',
      text: 'Which Sarigram workspace feature do you rely on most every day?',
      poll: {
        question: 'Which Sarigram feature do you rely on most?',
        isAnonymous: false,
        multipleChoice: false,
        options: [
          { id: 'opt-1', text: 'Broadcast Channels & Discussions', voterIds: ['contact-elena', 'contact-nadia'] },
          { id: 'opt-2', text: 'Instant Group Sync & Audio/Video Calls', voterIds: ['contact-marcus', 'contact-sofia'] },
          { id: 'opt-3', text: 'Saved Messages Cloud Notes', voterIds: ['contact-kenji'] },
          { id: 'opt-4', text: 'Stories & Custom Wallpapers', voterIds: [] },
        ],
      },
      timestamp: hoursAgo(4),
      views: 28940,
      commentsCount: 1,
      reactions: [{ emoji: '👍', userIds: ['contact-marcus'] }],
      readBy: [defaultUserId],
    },
    {
      id: 'msg-group-1',
      chatId: 'chat-core-team',
      senderId: 'contact-elena',
      senderName: 'Elena Rostova',
      senderAvatarColor: '#E17076',
      type: 'text',
      text: 'Pinned reminder: We are reviewing the new message bubble geometry, folder tabs, and real-time typing states in today’s design sync.',
      timestamp: hoursAgo(6),
      reactions: [{ emoji: '👍', userIds: ['contact-marcus', 'contact-nadia'] }],
      readBy: [defaultUserId, 'contact-elena'],
    },
    {
      id: 'msg-group-2',
      chatId: 'chat-core-team',
      senderId: 'contact-marcus',
      senderName: 'Marcus Vance',
      senderAvatarColor: '#7BC862',
      type: 'text',
      text: 'WebSocket state reconciliation is verified — messages, reactions, pins, and poll votes sync in sub-20ms across every connected client.',
      replyToId: 'msg-group-1',
      timestamp: hoursAgo(2),
      reactions: [{ emoji: '⚡', userIds: ['contact-elena'] }],
      readBy: [defaultUserId, 'contact-marcus'],
    },
    {
      id: 'msg-group-3',
      chatId: 'chat-core-team',
      senderId: 'contact-nadia',
      senderName: 'Nadia Khoury',
      senderAvatarColor: '#65AADD',
      type: 'image',
      text: 'Here is the clean studio setup reference we used for the light-mode surface palette.',
      mediaUrl: '/src/assets/images/media_workspace_desk_1795015832036.jpg',
      timestamp: minsAgo(48),
      reactions: [{ emoji: '❤️', userIds: ['contact-elena', 'contact-sofia'] }],
      readBy: [defaultUserId, 'contact-nadia'],
    },
    {
      id: 'msg-elena-1',
      chatId: 'chat-elena',
      senderId: 'contact-elena',
      senderName: 'Elena Rostova',
      senderAvatarColor: '#E17076',
      type: 'text',
      text: 'Hey! Just checked the new Sarigram layout in Night Blue mode — the contrast on the outgoing bubbles feels super crisp.',
      timestamp: minsAgo(95),
      reactions: [],
      readBy: [defaultUserId, 'contact-elena'],
    },
    {
      id: 'msg-elena-2',
      chatId: 'chat-elena',
      senderId: defaultUserId,
      senderName: 'Sari Explorer',
      senderAvatarColor: '#3390EC',
      type: 'text',
      text: 'Thanks Elena! Try opening the channel comments drawer or creating a live poll right from the paperclip menu.',
      replyToId: 'msg-elena-1',
      timestamp: minsAgo(82),
      reactions: [{ emoji: '🔥', userIds: ['contact-elena'] }],
      readBy: [defaultUserId, 'contact-elena'],
    },
    {
      id: 'msg-elena-3',
      chatId: 'chat-elena',
      senderId: 'contact-elena',
      senderName: 'Elena Rostova',
      senderAvatarColor: '#E17076',
      type: 'voice',
      text: 'Voice message · Quick note about tomorrow’s studio walk-through',
      voiceDuration: 18,
      timestamp: minsAgo(24),
      reactions: [],
      readBy: [defaultUserId, 'contact-elena'],
    },
    {
      id: 'msg-design-1',
      chatId: 'chat-design-channel',
      senderId: 'channel-design',
      senderName: 'Architecture & Light',
      senderAvatarColor: '#A68A64',
      senderAvatarUrl: '/src/assets/images/avatar_design_studio_1795015829890.jpg',
      type: 'image',
      text: 'Morning light across raw travertine arches. Notice how warm directional shadows define depth without heavy borders.',
      mediaUrl: '/src/assets/images/avatar_design_studio_1795015829890.jpg',
      timestamp: hoursAgo(5),
      views: 14820,
      commentsCount: 1,
      reactions: [
        { emoji: '🤩', userIds: ['contact-nadia', 'contact-elena'] },
        { emoji: '❤️', userIds: ['contact-sofia'] },
      ],
      readBy: [defaultUserId],
    },
    {
      id: 'msg-tech-1',
      chatId: 'chat-tech-digest',
      senderId: 'channel-tech',
      senderName: 'Systems & Craft Digest',
      senderAvatarColor: '#3B4D5E',
      senderAvatarUrl: '/src/assets/images/avatar_tech_digest_1795015829586.jpg',
      type: 'file',
      text: 'Field guide attached: Designing idempotent WebSocket event streams for multi-tab messaging clients.',
      fileName: 'Sarigram-Realtime-Architecture-Notes.pdf',
      fileSize: '1.8 MB',
      timestamp: hoursAgo(7),
      views: 9640,
      commentsCount: 0,
      reactions: [{ emoji: '👍', userIds: ['contact-marcus'] }],
      readBy: [defaultUserId],
    },
    {
      id: 'msg-runners-1',
      chatId: 'chat-runners',
      senderId: 'contact-sofia',
      senderName: 'Sofia Alvarez',
      senderAvatarColor: '#FAA774',
      type: 'poll',
      text: 'Who is joining Sunday 7:30 AM along the Embarcadero promenade?',
      poll: {
        question: 'Sunday 7:30 AM Waterfront 8K?',
        isAnonymous: false,
        multipleChoice: false,
        options: [
          { id: 'run-1', text: 'In for the full 8K', voterIds: ['contact-sofia', 'contact-kenji'] },
          { id: 'run-2', text: 'Joining for 5K + coffee', voterIds: ['contact-elena'] },
          { id: 'run-3', text: 'Next weekend!', voterIds: [] },
        ],
      },
      timestamp: hoursAgo(4),
      reactions: [],
      readBy: [defaultUserId],
    },
    {
      id: 'msg-marcus-1',
      chatId: 'chat-marcus',
      senderId: 'contact-marcus',
      senderName: 'Marcus Vance',
      senderAvatarColor: '#7BC862',
      type: 'text',
      text: 'Let me know when you want to test multi-client message syncing — register a second account in another browser tab to chat and call live.',
      timestamp: minsAgo(140),
      reactions: [],
      readBy: [defaultUserId, 'contact-marcus'],
    },
    {
      id: 'msg-bot-1',
      chatId: 'chat-saribot',
      senderId: 'bot-saribot',
      senderName: 'SariBot',
      senderAvatarColor: '#2AABEE',
      senderAvatarUrl: '/brand/sarigram-profile-512.png',
      type: 'text',
      text: 'Hello! I am SariBot, your Sarigram workspace assistant.\n\nTry sending:\n/stats — Live workspace counts\n/shortcuts — Keyboard shortcuts\n/about — About Sarigram\n/help — All available commands',
      timestamp: hoursAgo(10),
      reactions: [],
      readBy: [defaultUserId],
    },
  ];

  const stories: StoryItem[] = [
    {
      id: 'story-sofia',
      authorId: 'contact-sofia',
      authorName: 'Sofia Alvarez',
      authorUsername: 'sofia_a',
      authorAvatarColor: '#FAA774',
      mediaUrl: '/src/assets/images/story_city_sunset_1795015830244.jpg',
      caption: 'Golden hour walk along the waterfront promenade before sunset.',
      createdAt: hoursAgo(2),
      viewedBy: [],
      reactions: 24,
    },
    {
      id: 'story-elena',
      authorId: 'contact-elena',
      authorName: 'Elena Rostova',
      authorUsername: 'elena_rostova',
      authorAvatarColor: '#E17076',
      mediaUrl: '/src/assets/images/media_workspace_desk_1795015832036.jpg',
      caption: 'Morning sketch session for the Sarigram desktop composer.',
      createdAt: hoursAgo(4),
      viewedBy: [],
      reactions: 18,
    },
    {
      id: 'story-sarigram',
      authorId: 'channel-sarigram-news',
      authorName: 'Sarigram News',
      authorUsername: 'sarigram_news',
      authorAvatarColor: '#1E5B88',
      authorAvatarUrl: '/brand/sarigram-profile-512.png',
      gradient: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 50%, #0ea5e9 100%)',
      caption: 'Sarigram 2.0 is live: Cloud folders, live polls, stories, and instant WebSocket sync.',
      createdAt: hoursAgo(6),
      viewedBy: [defaultUserId],
      reactions: 142,
    },
  ];

  const comments: CommentItem[] = [
    {
      id: 'cmt-1',
      messageId: 'msg-news-1',
      chatId: 'chat-sarigram-news',
      authorId: 'contact-elena',
      authorName: 'Elena Rostova',
      authorAvatarColor: '#E17076',
      text: 'The Night Blue theme and folder tabs feel remarkably clean.',
      timestamp: hoursAgo(8),
    },
    {
      id: 'cmt-2',
      messageId: 'msg-news-1',
      chatId: 'chat-sarigram-news',
      authorId: 'contact-marcus',
      authorName: 'Marcus Vance',
      authorAvatarColor: '#7BC862',
      text: 'Pinned messages and message forwarding work instantaneously too.',
      timestamp: hoursAgo(7),
    },
    {
      id: 'cmt-3',
      messageId: 'msg-news-2',
      chatId: 'chat-sarigram-news',
      authorId: 'contact-sofia',
      authorName: 'Sofia Alvarez',
      authorAvatarColor: '#FAA774',
      text: 'Broadcast channels + discussion threads are my favorite combo.',
      timestamp: hoursAgo(3),
    },
    {
      id: 'cmt-4',
      messageId: 'msg-design-1',
      chatId: 'chat-design-channel',
      authorId: 'contact-nadia',
      authorName: 'Nadia Khoury',
      authorAvatarColor: '#65AADD',
      text: 'Love the natural warm daylight across the stone arches.',
      timestamp: hoursAgo(4),
    },
  ];

  const calls: CallRecord[] = [
    {
      id: 'call-1',
      peerId: 'contact-elena',
      peerName: 'Elena Rostova',
      peerAvatarColor: '#E17076',
      direction: 'incoming',
      kind: 'video',
      durationSeconds: 742,
      timestamp: hoursAgo(5),
    },
    {
      id: 'call-2',
      peerId: 'contact-marcus',
      peerName: 'Marcus Vance',
      peerAvatarColor: '#7BC862',
      direction: 'outgoing',
      kind: 'voice',
      durationSeconds: 318,
      timestamp: hoursAgo(18),
    },
    {
      id: 'call-3',
      peerId: 'contact-sofia',
      peerName: 'Sofia Alvarez',
      peerAvatarColor: '#FAA774',
      direction: 'missed',
      kind: 'voice',
      durationSeconds: 0,
      timestamp: hoursAgo(27),
    },
  ];

  return {
    users,
    sessions: {},
    lastSeenByUser,
    chats,
    messages,
    contacts,
    stories,
    comments,
    calls,
    appConfig: { ...DEFAULT_APP_CONFIG },
  };
}

function loadStore(): PersistedStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<PersistedStore>;
      if (parsed && Array.isArray(parsed.chats) && Array.isArray(parsed.messages)) {
        const users: Record<string, StoredUser> = {};
        for (const [id, u] of Object.entries(parsed.users || {})) {
          users[id] = {
            ...u,
            role: (u as StoredUser).role || (id === 'user-sari-1' ? 'admin' : 'member'),
            status: (u as StoredUser).status || 'active',
            passwordHash: (u as StoredUser).passwordHash || hashPassword('sarigram'),
          };
        }
        const legacyBrandUrls = new Set([
          '/src/assets/images/sarigram_logo_emblem_1795015828280.jpg',
          '/src/assets/images/avatar_sarigram_news_1795015828920.jpg',
        ]);
        const migrateAvatar = (url?: string) =>
          url && legacyBrandUrls.has(url) ? '/brand/sarigram-profile-512.png' : url;

        return {
          users,
          sessions: parsed.sessions || {},
          lastSeenByUser: parsed.lastSeenByUser || {},
          chats: parsed.chats.map((c) => ({ ...c, avatarUrl: migrateAvatar(c.avatarUrl) })),
          messages: parsed.messages.map((m) => ({
            ...m,
            senderAvatarUrl: migrateAvatar(m.senderAvatarUrl),
          })),
          contacts: parsed.contacts || [],
          stories: (parsed.stories || []).map((s) => ({
            ...s,
            authorAvatarUrl: migrateAvatar(s.authorAvatarUrl),
          })),
          comments: parsed.comments || [],
          calls: parsed.calls || [],
          appConfig: { ...DEFAULT_APP_CONFIG, ...(parsed.appConfig || {}) },
        };
      }
    }
  } catch (err) {
    console.error('Failed to load Sarigram store, initializing fresh store:', err);
  }
  const initial = createInitialStore();
  saveStoreSync(initial);
  return initial;
}

function saveStoreSync(data: PersistedStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DATA_FILE);
  } catch (err) {
    console.error('Failed to persist Sarigram store:', err);
  }
}

let store = loadStore();
let saveTimer: NodeJS.Timeout | null = null;
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveStoreSync(store);
  }, 250);
}

const activeSockets = new Map<WebSocket, { userId: string; userName: string; showOnline: boolean }>();
const typingByChat = new Map<string, Map<string, { userId: string; userName: string }>>();

function getOnlineUserSet(): Set<string> {
  const set = new Set<string>(['contact-elena', 'contact-sofia']);
  for (const info of activeSockets.values()) {
    if (info.showOnline) {
      set.add(info.userId);
    }
  }
  return set;
}

function getOnlineUserIds(): string[] {
  return Array.from(getOnlineUserSet());
}

function getTypingSnapshot(): Record<string, { userId: string; userName: string }[]> {
  const out: Record<string, { userId: string; userName: string }[]> = {};
  for (const [chatId, userMap] of typingByChat.entries()) {
    if (userMap.size > 0) {
      out[chatId] = Array.from(userMap.values());
    }
  }
  return out;
}

function getStateSnapshot(): SarigramStateSnapshot {
  return {
    chats: store.chats,
    messages: store.messages,
    contacts: store.contacts,
    stories: store.stories,
    comments: store.comments,
    calls: store.calls,
    onlineUserIds: getOnlineUserIds(),
    lastSeenByUser: store.lastSeenByUser,
    typingByChat: getTypingSnapshot(),
    appConfig: store.appConfig,
  };
}

function broadcast(event: string, payload: unknown, excludeWs?: WebSocket) {
  const frame = JSON.stringify({ event, payload });
  for (const client of activeSockets.keys()) {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(frame);
    }
  }
}

function sendToUser(userId: string, event: string, payload: unknown) {
  const frame = JSON.stringify({ event, payload });
  for (const [client, info] of activeSockets.entries()) {
    if (info.userId === userId && client.readyState === WebSocket.OPEN) {
      client.send(frame);
    }
  }
}

function handleBotCommand(chatId: string, commandText: string): ChatMessage | null {
  if (chatId !== 'chat-saribot') return null;
  const cmd = commandText.trim().toLowerCase();
  let reply = '';

  if (cmd === '/start' || cmd === '/help') {
    reply =
      'SariBot Commands:\n• /stats — Live Sarigram chats, messages, and active story counts\n• /shortcuts — Keyboard shortcuts\n• /about — Architecture & design notes\n• /help — Show this menu';
  } else if (cmd === '/stats') {
    reply = `Sarigram Live Workspace:\n• Registered Accounts: ${Object.keys(store.users).length}\n• Chats & Channels: ${store.chats.length}\n• Stored Messages: ${store.messages.length}\n• Contacts: ${store.contacts.length}\n• Active Stories: ${store.stories.length}\n• Connected Sessions: ${activeSockets.size}`;
  } else if (cmd === '/shortcuts') {
    reply =
      'Keyboard Shortcuts:\n• Enter — Send message\n• Shift + Enter — Insert new line\n• Esc — Close modal or clear reply/edit';
  } else if (cmd === '/about') {
    reply =
      'Sarigram (Developed by Sadam A Qaallicha) is a real-time cloud messaging platform featuring user registration/login, profile pictures, 1-on-1 DMs, groups, channels, photo/video/document sharing, voice notes, WebRTC audio & video calls, and Telegram-style privacy & security controls.';
  } else {
    reply = `Received "${commandText.trim()}". Send /help to list SariBot commands.`;
  }

  return {
    id: `msg-${crypto.randomUUID()}`,
    chatId,
    senderId: 'bot-saribot',
    senderName: 'SariBot',
    senderAvatarColor: '#2AABEE',
    senderAvatarUrl: '/brand/sarigram-profile-512.png',
    type: 'text',
    text: reply,
    timestamp: new Date().toISOString(),
    reactions: [],
    readBy: ['bot-saribot'],
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'sarigram', sessions: activeSockets.size });
  });

  app.get('/api/state', (_req, res) => {
    res.json(getStateSnapshot());
  });

  // Real User Registration (supports international phone codes & email)
  app.post('/api/auth/register', (req, res) => {
    const body = req.body as Partial<UserProfile> & { password?: string };
    const firstName = body.firstName?.trim() || '';
    const lastName = body.lastName?.trim() || '';
    const email = (body.email || '').trim().toLowerCase();
    const rawPhone = (body.phone || '').trim();
    const e164Phone = rawPhone ? `+${rawPhone.replace(/\D/g, '')}` : '';
    const formattedPhone = rawPhone
      ? rawPhone.startsWith('+')
        ? rawPhone.replace(/\s+/g, ' ').trim()
        : e164Phone
      : '';
    const password = body.password || '';

    if (!firstName) {
      res.status(400).json({ error: 'First name is required.' });
      return;
    }
    if (!email && !e164Phone) {
      res.status(400).json({ error: 'Provide an email address or international phone number.' });
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      res.status(400).json({ error: 'Enter a valid email address.' });
      return;
    }
    if (rawPhone && !/^\+[1-9]\d{6,14}$/.test(e164Phone)) {
      res
        .status(400)
        .json({ error: 'Enter a valid international phone number with country code (e.g. +251 911 223344).' });
      return;
    }
    if (!password || password.length < 4) {
      res.status(400).json({ error: 'Password must be at least 4 characters.' });
      return;
    }

    let rawUsername = (body.username || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!rawUsername) {
      const seedBase =
        (email ? email.split('@')[0] : firstName)
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '') || 'user';
      rawUsername = seedBase.length >= 3 ? seedBase : `${seedBase}_${e164Phone.slice(-4) || 'sari'}`;
      let suffix = 1;
      while (Object.values(store.users).some((u) => u.username.toLowerCase() === rawUsername)) {
        rawUsername = `${seedBase}${suffix++}`;
      }
    } else if (rawUsername.length < 3) {
      res.status(400).json({ error: 'Username must be at least 3 letters/numbers.' });
      return;
    }

    const usernameTaken = Object.values(store.users).some(
      (u) => u.username.toLowerCase() === rawUsername
    );
    if (usernameTaken) {
      res
        .status(409)
        .json({ error: `@${rawUsername} is already registered. Try logging in or pick another username.` });
      return;
    }

    if (
      email &&
      Object.values(store.users).some((u) => u.email && u.email.toLowerCase() === email)
    ) {
      res.status(409).json({ error: `${email} is already registered. Try signing in.` });
      return;
    }

    if (
      e164Phone &&
      Object.values(store.users).some((u) => {
        const digits = u.phone.replace(/\D/g, '');
        return digits && `+${digits}` === e164Phone;
      })
    ) {
      res.status(409).json({ error: `Phone number ${formattedPhone} is already registered.` });
      return;
    }

    const id = `user-${crypto.randomUUID().slice(0, 8)}`;
    const newUser: StoredUser = {
      id,
      firstName,
      lastName,
      username: rawUsername,
      email: email || undefined,
      phone: formattedPhone,
      bio: (body.bio || 'Available on Sarigram').trim(),
      avatarColor: body.avatarColor || '#5B5CE6',
      avatarUrl: body.avatarUrl,
      role: 'member',
      status: 'active',
      birthdate: body.birthdate?.trim() || undefined,
      personalChannelId: body.personalChannelId || undefined,
      personalChannelTitle: body.personalChannelTitle || undefined,
      personalChannelUsername: body.personalChannelUsername || undefined,
      passwordHash: hashPassword(password),
      lastSeen: 'online',
    };

    store.users[id] = newUser;
    const token = crypto.randomBytes(24).toString('hex');
    store.sessions[token] = id;

    // Create personal Saved Messages chat for the new user
    const savedChat: ChatThread = {
      id: `chat-saved-${id}`,
      type: 'saved',
      title: 'Saved Messages',
      description: 'Your personal cloud storage on Sarigram.',
      avatarColor: '#5B5CE6',
      isPinned: true,
      memberIds: [id],
      adminIds: [id],
      unreadBy: {},
    };
    store.chats.unshift(savedChat);

    // Ensure new user is also subscribed to Sarigram News & SariBot
    for (const c of store.chats) {
      if (c.id === 'chat-sarigram-news' || c.id === 'chat-saribot') {
        if (!c.memberIds.includes(id)) c.memberIds.push(id);
      }
    }

    scheduleSave();
    const safeUser = sanitizeUser(newUser, getOnlineUserSet());
    broadcast('user:registered', { user: safeUser });
    broadcast('chat:created', { chat: savedChat });
    res.json({ user: safeUser, token });
  });

  // Real User Login (supports @username, email, or international phone)
  app.post('/api/auth/login', (req, res) => {
    const { identifier, password } = req.body as { identifier?: string; password?: string };
    const clean = (identifier || '').trim().toLowerCase().replace(/^@/, '');
    const cleanDigits = clean.replace(/\D/g, '');
    if (!clean || !password) {
      res.status(400).json({ error: 'Enter your @username, email, or phone number and password.' });
      return;
    }

    const found = Object.values(store.users).find((u) => {
      if (u.username.toLowerCase() === clean) return true;
      if (u.email && u.email.toLowerCase() === clean) return true;
      const userDigits = u.phone.replace(/\D/g, '');
      return Boolean(cleanDigits && userDigits && userDigits === cleanDigits);
    });

    if (!found || !verifyPassword(password, found.passwordHash)) {
      res.status(401).json({ error: 'Invalid credentials. Check username, email, phone, or password.' });
      return;
    }

    if (found.status === 'suspended') {
      res.status(403).json({ error: 'This account has been suspended by an administrator.' });
      return;
    }

    const token = crypto.randomBytes(24).toString('hex');
    store.sessions[token] = found.id;
    scheduleSave();

    res.json({ user: sanitizeUser(found, getOnlineUserSet()), token });
  });

  // Sync Firebase Authentication session into Sarigram workspace session
  app.post('/api/auth/firebase', async (req, res) => {
    const body = req.body as Partial<UserProfile> & {
      idToken?: string;
      password?: string;
    };
    const idToken = (body.idToken || '').trim();
    if (!idToken) {
      res.status(400).json({ error: 'Firebase ID token is required.' });
      return;
    }

    const firebaseApiKey =
      process.env.FIREBASE_API_KEY || 'AIzaSyCCFnR4Vx_qigbLWtMEoqSMH45sfOf_I8o';
    let fbUid = '';
    let fbEmail = '';
    let fbDisplayName = '';

    try {
      const verifyRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(
          firebaseApiKey
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        }
      );
      if (!verifyRes.ok) {
        res.status(401).json({ error: 'Invalid or expired Firebase authentication token.' });
        return;
      }
      const verifyData = (await verifyRes.json()) as {
        users?: Array<{
          localId?: string;
          email?: string;
          displayName?: string;
          emailVerified?: boolean;
        }>;
      };
      const fbUser = verifyData.users?.[0];
      if (!fbUser?.localId || !fbUser?.email) {
        res.status(401).json({ error: 'Firebase user account not found.' });
        return;
      }
      if (!fbUser.emailVerified) {
        res.status(403).json({ error: 'Check your email & verify, then log in' });
        return;
      }
      fbUid = fbUser.localId;
      fbEmail = fbUser.email.trim().toLowerCase();
      fbDisplayName = (fbUser.displayName || '').trim();
    } catch {
      res.status(502).json({ error: 'Unable to verify Firebase authentication token.' });
      return;
    }

    let existing = Object.values(store.users).find(
      (u) =>
        (u.firebaseUid && u.firebaseUid === fbUid) ||
        (u.email && u.email.toLowerCase() === fbEmail)
    );

    if (existing) {
      if (existing.status === 'suspended') {
        res.status(403).json({ error: 'This account has been suspended by an administrator.' });
        return;
      }
      existing.firebaseUid = fbUid;
      if (!existing.email) existing.email = fbEmail;
      if (body.firstName?.trim()) existing.firstName = body.firstName.trim();
      if (body.lastName !== undefined) existing.lastName = body.lastName.trim();
      if (body.phone?.trim()) existing.phone = body.phone.trim();
      if (body.bio?.trim()) existing.bio = body.bio.trim();
      if (body.birthdate?.trim()) existing.birthdate = body.birthdate.trim();
      if (body.avatarUrl) existing.avatarUrl = body.avatarUrl;
      if (body.avatarColor) existing.avatarColor = body.avatarColor;
      if (body.password && body.password.length >= 4) {
        existing.passwordHash = hashPassword(body.password);
      }

      const token = crypto.randomBytes(24).toString('hex');
      store.sessions[token] = existing.id;
      scheduleSave();
      const safeUser = sanitizeUser(existing, getOnlineUserSet());
      broadcast('user:updated', { user: safeUser });
      res.json({ user: safeUser, token });
      return;
    }

    const nameParts = fbDisplayName.split(/\s+/).filter(Boolean);
    const firstName =
      body.firstName?.trim() || nameParts[0] || fbEmail.split('@')[0] || 'User';
    const lastName =
      body.lastName?.trim() || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');

    let rawUsername = (body.username || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');
    if (!rawUsername) {
      const seedBase =
        fbEmail
          .split('@')[0]
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '') || 'user';
      rawUsername = seedBase.length >= 3 ? seedBase : `${seedBase}_sari`;
      let suffix = 1;
      while (Object.values(store.users).some((u) => u.username.toLowerCase() === rawUsername)) {
        rawUsername = `${seedBase}${suffix++}`;
      }
    } else if (Object.values(store.users).some((u) => u.username.toLowerCase() === rawUsername)) {
      let suffix = 1;
      const base = rawUsername;
      while (Object.values(store.users).some((u) => u.username.toLowerCase() === rawUsername)) {
        rawUsername = `${base}${suffix++}`;
      }
    }

    const rawPhone = (body.phone || '').trim();
    const formattedPhone = rawPhone
      ? rawPhone.startsWith('+')
        ? rawPhone.replace(/\s+/g, ' ').trim()
        : `+${rawPhone.replace(/\D/g, '')}`
      : '';

    const id = `user-${crypto.randomUUID().slice(0, 8)}`;
    const newUser: StoredUser = {
      id,
      firebaseUid: fbUid,
      firstName,
      lastName,
      username: rawUsername,
      email: fbEmail,
      phone: formattedPhone,
      bio: (body.bio || 'Available on Sarigram').trim(),
      avatarColor: body.avatarColor || '#5B5CE6',
      avatarUrl: body.avatarUrl,
      role: fbEmail === 'kallichamio@gmail.com' ? 'admin' : 'member',
      status: 'active',
      birthdate: body.birthdate?.trim() || undefined,
      passwordHash: hashPassword(body.password || crypto.randomBytes(16).toString('hex')),
      lastSeen: 'online',
    };

    store.users[id] = newUser;
    const token = crypto.randomBytes(24).toString('hex');
    store.sessions[token] = id;

    const savedChat: ChatThread = {
      id: `chat-saved-${id}`,
      type: 'saved',
      title: 'Saved Messages',
      description: 'Your personal cloud storage on Sarigram.',
      avatarColor: '#5B5CE6',
      isPinned: true,
      memberIds: [id],
      adminIds: [id],
      unreadBy: {},
    };
    store.chats.unshift(savedChat);
    for (const c of store.chats) {
      if (c.id === 'chat-sarigram-news' || c.id === 'chat-saribot') {
        if (!c.memberIds.includes(id)) c.memberIds.push(id);
      }
    }

    scheduleSave();
    const safeUser = sanitizeUser(newUser, getOnlineUserSet());
    broadcast('user:registered', { user: safeUser });
    broadcast('chat:created', { chat: savedChat });
    res.json({ user: safeUser, token });
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
    if (token && store.sessions[token]) {
      delete store.sessions[token];
      scheduleSave();
    }
    res.json({ ok: true });
  });

  app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const userId = store.sessions[token];
    if (!token || !userId || !store.users[userId]) {
      res.status(401).json({ error: 'Invalid session' });
      return;
    }
    res.json({ user: sanitizeUser(store.users[userId], getOnlineUserSet()) });
  });

  const requireAdmin = (
    req: express.Request,
    res: express.Response
  ): StoredUser | null => {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
    const userId = store.sessions[token];
    const user = userId ? store.users[userId] : undefined;
    if (!user || user.status === 'suspended') {
      res.status(401).json({ error: 'Authentication required. Please sign in.' });
      return null;
    }
    if (user.role !== 'admin') {
      res.status(403).json({ error: 'Administrator access required.' });
      return null;
    }
    return user;
  };

  // Admin Dashboard Endpoints
  app.get('/api/admin/overview', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const onlineSet = getOnlineUserSet();
    const users = Object.values(store.users).map((u) => sanitizeUser(u, onlineSet));
    const channels = store.chats.filter((c) => c.type === 'channel' || c.type === 'group');
    res.json({
      stats: {
        totalUsers: users.length,
        onlineUsers: users.filter((u) => u.isOnline).length,
        totalChannels: store.chats.filter((c) => c.type === 'channel').length,
        totalGroups: store.chats.filter((c) => c.type === 'group').length,
        totalMessages: store.messages.length,
      },
      users,
      channels,
      appConfig: store.appConfig,
    });
  });

  app.patch('/api/admin/app-config', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const body = req.body as Partial<AppConfig>;
    const next: AppConfig = {
      appName:
        typeof body.appName === 'string' && body.appName.trim()
          ? body.appName.trim().slice(0, 40)
          : store.appConfig.appName,
      appSubtitle:
        typeof body.appSubtitle === 'string'
          ? body.appSubtitle.trim().slice(0, 60)
          : store.appConfig.appSubtitle,
      welcomeTitle:
        typeof body.welcomeTitle === 'string' && body.welcomeTitle.trim()
          ? body.welcomeTitle.trim().slice(0, 80)
          : store.appConfig.welcomeTitle,
      welcomeBody:
        typeof body.welcomeBody === 'string' && body.welcomeBody.trim()
          ? body.welcomeBody.trim().slice(0, 400)
          : store.appConfig.welcomeBody,
      announcementText:
        typeof body.announcementText === 'string'
          ? body.announcementText.trim().slice(0, 240)
          : store.appConfig.announcementText,
      showAnnouncement:
        typeof body.showAnnouncement === 'boolean'
          ? body.showAnnouncement
          : store.appConfig.showAnnouncement,
      brandPreset:
        body.brandPreset === 'blue-purple' ||
        body.brandPreset === 'indigo-violet' ||
        body.brandPreset === 'cobalt-cyan'
          ? body.brandPreset
          : store.appConfig.brandPreset,
      compactMode:
        typeof body.compactMode === 'boolean' ? body.compactMode : store.appConfig.compactMode,
      showStories:
        typeof body.showStories === 'boolean' ? body.showStories : store.appConfig.showStories,
    };
    store.appConfig = next;
    scheduleSave();
    broadcast('appConfig:updated', { appConfig: next });
    res.json({ appConfig: next });
  });

  app.post('/api/admin/users', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const body = req.body as Partial<UserProfile> & { password?: string };
    const firstName = (body.firstName || '').trim();
    const lastName = (body.lastName || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const rawPhone = (body.phone || '').trim();
    const e164Phone = rawPhone ? `+${rawPhone.replace(/\D/g, '')}` : '';
    const password = body.password || '';
    const role: 'admin' | 'member' = body.role === 'member' ? 'member' : 'admin';

    if (!firstName) {
      res.status(400).json({ error: 'First name is required.' });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      res.status(400).json({ error: 'A valid admin email address is required.' });
      return;
    }
    if (!password || password.length < 4) {
      res.status(400).json({ error: 'Password must be at least 4 characters.' });
      return;
    }
    if (Object.values(store.users).some((u) => u.email && u.email.toLowerCase() === email)) {
      res.status(409).json({ error: `${email} is already registered.` });
      return;
    }

    let rawUsername = (body.username || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!rawUsername) {
      const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') || 'admin';
      rawUsername = base.length >= 3 ? base : `${base}_admin`;
      let suffix = 1;
      while (Object.values(store.users).some((u) => u.username.toLowerCase() === rawUsername)) {
        rawUsername = `${base}${suffix++}`;
      }
    } else if (Object.values(store.users).some((u) => u.username.toLowerCase() === rawUsername)) {
      res.status(409).json({ error: `@${rawUsername} is already taken.` });
      return;
    }

    const id = `user-${crypto.randomUUID().slice(0, 8)}`;
    const newUser: StoredUser = {
      id,
      firstName,
      lastName,
      username: rawUsername,
      email,
      phone: e164Phone || rawPhone,
      bio: (body.bio || (role === 'admin' ? 'Sarigram Administrator' : 'Available on Sarigram')).trim(),
      avatarColor: body.avatarColor || '#5B5CE6',
      avatarUrl: body.avatarUrl,
      role,
      status: 'active',
      passwordHash: hashPassword(password),
      lastSeen: 'online',
    };

    store.users[id] = newUser;
    const savedChat: ChatThread = {
      id: `chat-saved-${id}`,
      type: 'saved',
      title: 'Saved Messages',
      description: 'Your personal cloud storage on Sarigram.',
      avatarColor: '#5B5CE6',
      isPinned: true,
      memberIds: [id],
      adminIds: [id],
      unreadBy: {},
    };
    store.chats.unshift(savedChat);
    for (const c of store.chats) {
      if (c.id === 'chat-sarigram-news' || c.id === 'chat-saribot') {
        if (!c.memberIds.includes(id)) c.memberIds.push(id);
      }
    }

    scheduleSave();
    const safeUser = sanitizeUser(newUser, getOnlineUserSet());
    broadcast('user:registered', { user: safeUser });
    broadcast('chat:created', { chat: savedChat });
    res.json({ user: safeUser });
  });

  app.patch('/api/admin/users/:id', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const target = store.users[req.params.id];
    if (!target) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const { role, status, email, password } = req.body as {
      role?: 'admin' | 'member';
      status?: 'active' | 'suspended';
      email?: string;
      password?: string;
    };
    if (typeof email === 'string') {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
        res.status(400).json({ error: 'Enter a valid email address.' });
        return;
      }
      if (
        cleanEmail &&
        Object.values(store.users).some(
          (u) => u.id !== target.id && u.email && u.email.toLowerCase() === cleanEmail
        )
      ) {
        res.status(409).json({ error: `${cleanEmail} is already used by another account.` });
        return;
      }
      target.email = cleanEmail || undefined;
    }
    if (typeof password === 'string' && password.length > 0) {
      if (password.length < 4) {
        res.status(400).json({ error: 'Password must be at least 4 characters.' });
        return;
      }
      target.passwordHash = hashPassword(password);
    }
    if (role === 'admin' || role === 'member') {
      target.role = role;
    }
    if (status === 'active' || status === 'suspended') {
      if (target.id === admin.id && status === 'suspended') {
        res.status(400).json({ error: 'You cannot suspend your own admin account.' });
        return;
      }
      target.status = status;
      if (status === 'suspended') {
        for (const [tok, uid] of Object.entries(store.sessions)) {
          if (uid === target.id) delete store.sessions[tok];
        }
      }
    }
    scheduleSave();
    const safe = sanitizeUser(target, getOnlineUserSet());
    broadcast('user:updated', { user: safe });
    res.json({ user: safe });
  });

  app.delete('/api/admin/users/:id', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const targetId = req.params.id;
    if (targetId === admin.id) {
      res.status(400).json({ error: 'You cannot delete your own active admin account.' });
      return;
    }
    if (!store.users[targetId]) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    delete store.users[targetId];
    for (const [tok, uid] of Object.entries(store.sessions)) {
      if (uid === targetId) delete store.sessions[tok];
    }
    scheduleSave();
    res.json({ ok: true });
  });

  app.patch('/api/admin/channels/:id', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const chat = store.chats.find((c) => c.id === req.params.id);
    if (!chat) {
      res.status(404).json({ error: 'Channel or group not found.' });
      return;
    }
    const { verified, isPinned, title, description } = req.body as Partial<ChatThread>;
    if (typeof verified === 'boolean') chat.verified = verified;
    if (typeof isPinned === 'boolean') chat.isPinned = isPinned;
    if (typeof title === 'string' && title.trim()) chat.title = title.trim();
    if (typeof description === 'string') chat.description = description.trim();
    scheduleSave();
    broadcast('chat:updated', { chat });
    res.json({ chat });
  });

  app.delete('/api/admin/channels/:id', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const idx = store.chats.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Channel or group not found.' });
      return;
    }
    const [removed] = store.chats.splice(idx, 1);
    store.messages = store.messages.filter((m) => m.chatId !== removed.id);
    scheduleSave();
    broadcast('chat:deleted', { chatId: removed.id });
    res.json({ ok: true });
  });

  // Update Profile & Profile Picture
  app.post('/api/profile', (req, res) => {
    const profile = req.body as Partial<UserProfile>;
    if (!profile || !profile.firstName?.trim()) {
      res.status(400).json({ error: 'First name is required.' });
      return;
    }
    const id = profile.id || `user-${crypto.randomUUID().slice(0, 8)}`;
    const existing = store.users[id];
    const nextUsername =
      (profile.username || existing?.username || profile.firstName)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '') || 'sarigram_user';

    const nextUser: StoredUser = {
      id,
      firstName: profile.firstName.trim(),
      lastName: (profile.lastName || '').trim(),
      username: nextUsername,
      email:
        profile.email !== undefined
          ? profile.email.trim().toLowerCase() || undefined
          : existing?.email,
      phone:
        profile.phone !== undefined
          ? profile.phone.trim()
          : existing?.phone || '+1 415 000 0000',
      bio: (profile.bio ?? existing?.bio ?? 'Available on Sarigram').trim(),
      avatarColor: profile.avatarColor || existing?.avatarColor || '#5B5CE6',
      avatarUrl: profile.avatarUrl !== undefined ? profile.avatarUrl : existing?.avatarUrl,
      role: existing?.role || (id === 'user-sari-1' ? 'admin' : 'member'),
      status: existing?.status || 'active',
      birthdate:
        profile.birthdate !== undefined
          ? profile.birthdate.trim() || undefined
          : existing?.birthdate,
      personalChannelId:
        profile.personalChannelId !== undefined
          ? profile.personalChannelId || undefined
          : existing?.personalChannelId,
      personalChannelTitle:
        profile.personalChannelTitle !== undefined
          ? profile.personalChannelTitle || undefined
          : existing?.personalChannelTitle,
      personalChannelUsername:
        profile.personalChannelUsername !== undefined
          ? profile.personalChannelUsername || undefined
          : existing?.personalChannelUsername,
      passwordHash: existing?.passwordHash || hashPassword('sarigram'),
    };
    store.users[id] = nextUser;

    // Sync updated display name and avatar across existing DM chats
    const fullName = `${nextUser.firstName} ${nextUser.lastName}`.trim();
    for (const chat of store.chats) {
      if (chat.type === 'private' && chat.memberIds.includes(id)) {
        chat.participantNames = chat.participantNames || {};
        chat.participantNames[id] = fullName;
        chat.participantAvatars = chat.participantAvatars || {};
        chat.participantAvatars[id] = { color: nextUser.avatarColor, url: nextUser.avatarUrl };
        broadcast('chat:updated', { chat });
      }
    }

    scheduleSave();
    const safe = sanitizeUser(nextUser, getOnlineUserSet());
    broadcast('user:updated', { user: safe });
    res.json({ user: safe });
  });

  // Search Registered Users, Contacts, and Public Channels
  app.get('/api/users/search', (req, res) => {
    const q = String(req.query.q || '').trim().toLowerCase().replace(/^@/, '');
    const currentId = String(req.query.excludeUserId || '');
    const onlineSet = getOnlineUserSet();
    const results: SearchUserResult[] = [];
    const seenUsernames = new Set<string>();

    for (const user of Object.values(store.users)) {
      if (user.id === currentId || user.status === 'suspended') continue;
      const full = `${user.firstName} ${user.lastName}`.toLowerCase();
      if (
        !q ||
        user.username.toLowerCase().includes(q) ||
        full.includes(q) ||
        user.phone.toLowerCase().includes(q) ||
        (user.email && user.email.toLowerCase().includes(q))
      ) {
        seenUsernames.add(user.username.toLowerCase());
        results.push({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          phone: user.phone,
          bio: user.bio,
          avatarColor: user.avatarColor,
          avatarUrl: user.avatarUrl,
          isOnline: onlineSet.has(user.id),
          lastSeen: onlineSet.has(user.id)
            ? 'online'
            : store.lastSeenByUser[user.id] || 'last seen recently',
          kind: 'user',
        });
      }
    }

    for (const c of store.contacts) {
      if (seenUsernames.has(c.username.toLowerCase())) continue;
      const full = `${c.firstName} ${c.lastName}`.toLowerCase();
      if (
        !q ||
        full.includes(q) ||
        c.username.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
      ) {
        seenUsernames.add(c.username.toLowerCase());
        results.push({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          username: c.username,
          phone: c.phone,
          bio: c.bio,
          avatarColor: c.avatarColor,
          avatarUrl: c.avatarUrl,
          isOnline: onlineSet.has(c.id),
          lastSeen: onlineSet.has(c.id)
            ? 'online'
            : store.lastSeenByUser[c.id] || c.lastSeen,
          kind: 'contact',
        });
      }
    }

    for (const ch of store.chats) {
      if (ch.type !== 'channel' || !ch.username) continue;
      if (
        !q ||
        ch.title.toLowerCase().includes(q) ||
        ch.username.toLowerCase().includes(q)
      ) {
        results.push({
          id: ch.id,
          firstName: ch.title,
          lastName: '',
          username: ch.username,
          phone: '',
          bio: ch.description || 'Public Sarigram Channel',
          avatarColor: ch.avatarColor,
          avatarUrl: ch.avatarUrl,
          isOnline: false,
          lastSeen: `${(ch.subscriberCount || 1).toLocaleString()} subscribers`,
          kind: 'channel',
        });
      }
    }

    if (q) {
      results.sort((a, b) => {
        const aExact = a.username.toLowerCase() === q ? 0 : a.username.toLowerCase().startsWith(q) ? 1 : 2;
        const bExact = b.username.toLowerCase() === q ? 0 : b.username.toLowerCase().startsWith(q) ? 1 : 2;
        if (aExact !== bExact) return aExact - bExact;
        return Number(b.isOnline) - Number(a.isOnline);
      });
    }

    res.json({ results: results.slice(0, 30) });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    let currentUserId = 'user-sari-1';
    let currentUserName = 'Sari Explorer';
    activeSockets.set(ws, { userId: currentUserId, userName: currentUserName, showOnline: true });

    ws.send(
      JSON.stringify({
        event: 'init',
        payload: {
          ...getStateSnapshot(),
          defaultUser: sanitizeUser(store.users['user-sari-1'], getOnlineUserSet()),
        },
      })
    );
    broadcast('presence:update', {
      onlineUserIds: getOnlineUserIds(),
      lastSeenByUser: store.lastSeenByUser,
    });

    ws.on('message', (raw) => {
      try {
        const parsed = JSON.parse(raw.toString()) as { event: string; payload: any };
        const { event, payload } = parsed;

        switch (event) {
          case 'user:identify': {
            const { profile, showOnline = true } = (payload?.profile ? payload : { profile: payload }) as {
              profile: UserProfile;
              showOnline?: boolean;
            };
            if (profile?.id) {
              currentUserId = profile.id;
              currentUserName = `${profile.firstName} ${profile.lastName || ''}`.trim();
              const existing = store.users[profile.id];
              store.users[profile.id] = {
                ...profile,
                role: existing?.role || (profile.id === 'user-sari-1' ? 'admin' : 'member'),
                status: existing?.status || 'active',
                passwordHash: existing?.passwordHash || hashPassword('sarigram'),
              };
              activeSockets.set(ws, {
                userId: currentUserId,
                userName: currentUserName,
                showOnline: Boolean(showOnline),
              });
              if (!showOnline) {
                store.lastSeenByUser[currentUserId] = new Date().toISOString();
              }
              scheduleSave();
              broadcast('presence:update', {
                onlineUserIds: getOnlineUserIds(),
                lastSeenByUser: store.lastSeenByUser,
              });
            }
            break;
          }

          case 'typing:start': {
            const { chatId, userId, userName } = payload;
            if (!chatId || !userId) break;
            if (!typingByChat.has(chatId)) typingByChat.set(chatId, new Map());
            typingByChat.get(chatId)!.set(userId, { userId, userName: userName || 'Someone' });
            broadcast('typing:update', {
              chatId,
              users: Array.from(typingByChat.get(chatId)!.values()),
            });
            break;
          }

          case 'typing:stop': {
            const { chatId, userId } = payload;
            if (!chatId || !userId) break;
            typingByChat.get(chatId)?.delete(userId);
            broadcast('typing:update', {
              chatId,
              users: Array.from(typingByChat.get(chatId)?.values() || []),
            });
            break;
          }

          case 'message:send': {
            const msg = payload as ChatMessage;
            if (!msg?.chatId) break;
            const exists = store.messages.some((m) => m.id === msg.id);
            if (exists) break;

            const safeMsg: ChatMessage = {
              ...msg,
              id: msg.id || `msg-${crypto.randomUUID()}`,
              timestamp: msg.timestamp || new Date().toISOString(),
              reactions: msg.reactions || [],
              readBy: msg.readBy || [msg.senderId],
              views:
                store.chats.find((c) => c.id === msg.chatId)?.type === 'channel'
                  ? msg.views ?? 1
                  : msg.views,
            };
            store.messages.push(safeMsg);

            const targetChat = store.chats.find((c) => c.id === safeMsg.chatId);
            if (targetChat) {
              targetChat.unreadBy = targetChat.unreadBy || {};
              for (const uid of Object.keys(store.users)) {
                if (uid !== safeMsg.senderId) {
                  targetChat.unreadBy[uid] = (targetChat.unreadBy[uid] || 0) + 1;
                }
              }
            }

            typingByChat.get(safeMsg.chatId)?.delete(safeMsg.senderId);
            broadcast('typing:update', {
              chatId: safeMsg.chatId,
              users: Array.from(typingByChat.get(safeMsg.chatId)?.values() || []),
            });

            broadcast('message:created', { message: safeMsg, chat: targetChat });

            if (safeMsg.chatId === 'chat-saribot' && safeMsg.senderId !== 'bot-saribot') {
              if (!safeMsg.readBy.includes('bot-saribot')) {
                safeMsg.readBy.push('bot-saribot');
                broadcast('messages:read', {
                  chatId: safeMsg.chatId,
                  userId: 'bot-saribot',
                  messageIds: [safeMsg.id],
                });
              }
              const botReply = handleBotCommand(safeMsg.chatId, safeMsg.text);
              if (botReply) {
                store.messages.push(botReply);
                broadcast('message:created', { message: botReply, chat: targetChat });
              }
            }
            scheduleSave();
            break;
          }

          case 'message:edit': {
            const { messageId, text } = payload;
            const target = store.messages.find((m) => m.id === messageId);
            if (target && typeof text === 'string' && text.trim()) {
              target.text = text.trim();
              target.editedAt = new Date().toISOString();
              scheduleSave();
              broadcast('message:updated', { message: target });
            }
            break;
          }

          case 'message:delete': {
            const { messageId } = payload;
            const idx = store.messages.findIndex((m) => m.id === messageId);
            if (idx !== -1) {
              const [removed] = store.messages.splice(idx, 1);
              for (const c of store.chats) {
                if (c.pinnedMessageId === messageId) {
                  c.pinnedMessageId = undefined;
                  broadcast('chat:updated', { chat: c });
                }
              }
              scheduleSave();
              broadcast('message:deleted', { messageId, chatId: removed.chatId });
            }
            break;
          }

          case 'message:react': {
            const { messageId, emoji, userId } = payload;
            const target = store.messages.find((m) => m.id === messageId);
            if (target && emoji && userId) {
              const existing = target.reactions.find((r) => r.emoji === emoji);
              if (existing) {
                if (existing.userIds.includes(userId)) {
                  existing.userIds = existing.userIds.filter((id) => id !== userId);
                  if (existing.userIds.length === 0) {
                    target.reactions = target.reactions.filter((r) => r.emoji !== emoji);
                  }
                } else {
                  existing.userIds.push(userId);
                }
              } else {
                target.reactions.push({ emoji, userIds: [userId] });
              }
              scheduleSave();
              broadcast('message:updated', { message: target });
            }
            break;
          }

          case 'message:pin': {
            const { chatId, messageId } = payload;
            const chat = store.chats.find((c) => c.id === chatId);
            if (chat) {
              chat.pinnedMessageId = chat.pinnedMessageId === messageId ? undefined : messageId;
              scheduleSave();
              broadcast('chat:updated', { chat });
            }
            break;
          }

          case 'poll:vote': {
            const { messageId, optionId, userId } = payload;
            const target = store.messages.find((m) => m.id === messageId);
            if (target?.poll && userId) {
              if (!target.poll.multipleChoice) {
                for (const opt of target.poll.options) {
                  opt.voterIds = opt.voterIds.filter((id) => id !== userId);
                }
              }
              const chosen = target.poll.options.find((o) => o.id === optionId);
              if (chosen) {
                if (chosen.voterIds.includes(userId)) {
                  chosen.voterIds = chosen.voterIds.filter((id) => id !== userId);
                } else {
                  chosen.voterIds.push(userId);
                }
              }
              scheduleSave();
              broadcast('message:updated', { message: target });
            }
            break;
          }

          case 'chat:create': {
            const chat = payload as ChatThread;
            if (!chat?.title?.trim()) break;
            const exists = store.chats.some((c) => c.id === chat.id);
            if (exists) break;
            const created: ChatThread = {
              ...chat,
              id: chat.id || `chat-${crypto.randomUUID().slice(0, 8)}`,
              unreadBy: {},
            };
            store.chats.unshift(created);
            scheduleSave();
            broadcast('chat:created', { chat: created });
            break;
          }

          case 'chat:update': {
            const { chatId, patch } = payload as { chatId: string; patch: Partial<ChatThread> };
            const chat = store.chats.find((c) => c.id === chatId);
            if (chat && patch) {
              Object.assign(chat, patch);
              scheduleSave();
              broadcast('chat:updated', { chat });
            }
            break;
          }

          case 'chat:read': {
            const { chatId, userId } = payload;
            const chat = store.chats.find((c) => c.id === chatId);
            if (chat && userId) {
              chat.unreadBy = chat.unreadBy || {};
              const hadUnread = (chat.unreadBy[userId] || 0) > 0;
              chat.unreadBy[userId] = 0;
              const updatedMessageIds: string[] = [];
              for (const m of store.messages) {
                if (m.chatId === chatId && !m.readBy.includes(userId)) {
                  m.readBy.push(userId);
                  updatedMessageIds.push(m.id);
                }
              }
              if (hadUnread || updatedMessageIds.length > 0) {
                scheduleSave();
                broadcast('chat:updated', { chat });
                if (updatedMessageIds.length > 0) {
                  broadcast('messages:read', {
                    chatId,
                    userId,
                    messageIds: updatedMessageIds,
                  });
                }
              }
            }
            break;
          }

          case 'chat:clear': {
            const { chatId } = payload;
            store.messages = store.messages.filter((m) => m.chatId !== chatId);
            const chat = store.chats.find((c) => c.id === chatId);
            if (chat) {
              chat.pinnedMessageId = undefined;
              broadcast('chat:updated', { chat });
            }
            scheduleSave();
            broadcast('chat:cleared', { chatId });
            break;
          }

          case 'contact:create': {
            const contact = payload as ContactItem;
            if (!contact?.firstName?.trim()) break;
            const created: ContactItem = {
              ...contact,
              id: contact.id || `contact-${crypto.randomUUID().slice(0, 8)}`,
              lastSeen: contact.lastSeen || 'last seen recently',
            };
            store.contacts.unshift(created);
            scheduleSave();
            broadcast('contact:created', { contact: created });
            break;
          }

          case 'story:create': {
            const story = payload as StoryItem;
            if (!story?.caption?.trim() && !story?.mediaUrl) break;
            const created: StoryItem = {
              ...story,
              id: story.id || `story-${crypto.randomUUID().slice(0, 8)}`,
              createdAt: new Date().toISOString(),
              viewedBy: [],
              reactions: 0,
            };
            store.stories.unshift(created);
            scheduleSave();
            broadcast('story:created', { story: created });
            break;
          }

          case 'story:view': {
            const { storyId, userId, react } = payload;
            const story = store.stories.find((s) => s.id === storyId);
            if (story) {
              if (userId && !story.viewedBy.includes(userId)) {
                story.viewedBy.push(userId);
              }
              if (react) {
                story.reactions += 1;
              }
              scheduleSave();
              broadcast('story:updated', { story });
            }
            break;
          }

          case 'comment:add': {
            const comment = payload as CommentItem;
            if (!comment?.text?.trim() || !comment?.messageId) break;
            const created: CommentItem = {
              ...comment,
              id: comment.id || `cmt-${crypto.randomUUID().slice(0, 8)}`,
              timestamp: new Date().toISOString(),
            };
            store.comments.push(created);
            const msg = store.messages.find((m) => m.id === comment.messageId);
            if (msg) {
              msg.commentsCount = (msg.commentsCount || 0) + 1;
              broadcast('message:updated', { message: msg });
            }
            scheduleSave();
            broadcast('comment:created', { comment: created });
            break;
          }

          case 'call:log': {
            const record = payload as CallRecord;
            if (!record?.peerName) break;
            const created: CallRecord = {
              ...record,
              id: record.id || `call-${crypto.randomUUID().slice(0, 8)}`,
              timestamp: new Date().toISOString(),
            };
            store.calls.unshift(created);
            scheduleSave();
            broadcast('call:created', { call: created });
            break;
          }

          // Real-Time WebRTC Call Signaling
          case 'call:invite': {
            const session = payload as CallSessionInfo;
            if (!session?.calleeId) break;
            sendToUser(session.calleeId, 'call:incoming', session);
            break;
          }

          case 'call:accept': {
            const { callId, callerId, calleeId } = payload;
            if (callerId) sendToUser(callerId, 'call:accepted', { callId, calleeId });
            break;
          }

          case 'call:decline': {
            const { callId, callerId } = payload;
            if (callerId) sendToUser(callerId, 'call:declined', { callId });
            break;
          }

          case 'call:end': {
            const { callId, targetUserId } = payload;
            if (targetUserId) sendToUser(targetUserId, 'call:ended', { callId });
            break;
          }

          case 'call:rtc_signal': {
            const { targetUserId, callId, signalType, data } = payload;
            if (targetUserId) {
              sendToUser(targetUserId, 'call:rtc_signal', {
                callId,
                fromUserId: currentUserId,
                signalType,
                data,
              });
            }
            break;
          }
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });

    ws.on('close', () => {
      const info = activeSockets.get(ws);
      activeSockets.delete(ws);
      if (info) {
        const stillConnected = Array.from(activeSockets.values()).some(
          (s) => s.userId === info.userId
        );
        if (!stillConnected) {
          store.lastSeenByUser[info.userId] = new Date().toISOString();
          scheduleSave();
        }
        for (const [chatId, userMap] of typingByChat.entries()) {
          if (userMap.delete(info.userId)) {
            broadcast('typing:update', { chatId, users: Array.from(userMap.values()) });
          }
        }
      }
      broadcast('presence:update', {
        onlineUserIds: getOnlineUserIds(),
        lastSeenByUser: store.lastSeenByUser,
      });
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Sarigram server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
