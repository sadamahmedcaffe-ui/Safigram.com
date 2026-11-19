export type ChatType = 'private' | 'group' | 'channel' | 'bot' | 'saved';

export type ChatFolder = 'all' | 'unread' | 'personal' | 'groups' | 'channels' | 'bots';

export interface CustomChatFolder {
  id: string;
  name: string;
  includedTypes?: ChatType[];
  chatIds: string[];
  excludedChatIds?: string[];
}

export type MessageType = 'text' | 'image' | 'video' | 'poll' | 'voice' | 'file';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email?: string;
  phone: string;
  bio: string;
  avatarColor: string;
  avatarUrl?: string;
  role?: 'admin' | 'member';
  status?: 'active' | 'suspended';
  isOnline?: boolean;
  lastSeen?: string;
  birthdate?: string;
  personalChannelId?: string;
  personalChannelTitle?: string;
  personalChannelUsername?: string;
}

export type AppLanguage = 'en' | 'ao';

export interface AppConfig {
  appName: string;
  appSubtitle: string;
  welcomeTitle: string;
  welcomeBody: string;
  announcementText: string;
  showAnnouncement: boolean;
  brandPreset: 'blue-purple' | 'indigo-violet' | 'cobalt-cyan';
  compactMode: boolean;
  showStories: boolean;
}

export interface AdminOverviewData {
  stats: {
    totalUsers: number;
    onlineUsers: number;
    totalChannels: number;
    totalGroups: number;
    totalMessages: number;
  };
  users: UserProfile[];
  channels: ChatThread[];
  appConfig: AppConfig;
}

export interface SearchUserResult {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  bio: string;
  avatarColor: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen: string;
  kind: 'user' | 'contact' | 'channel';
}

export interface PollOption {
  id: string;
  text: string;
  voterIds: string[];
}

export interface PollData {
  question: string;
  options: PollOption[];
  isAnonymous: boolean;
  multipleChoice: boolean;
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatarColor: string;
  senderAvatarUrl?: string;
  type: MessageType;
  text: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: string;
  voiceDuration?: number;
  voiceWaveform?: number[];
  poll?: PollData;
  replyToId?: string;
  forwardedFrom?: string;
  timestamp: string;
  editedAt?: string;
  views?: number;
  reactions: MessageReaction[];
  commentsCount?: number;
  readBy: string[];
}

export interface ChatThread {
  id: string;
  type: ChatType;
  title: string;
  username?: string;
  description?: string;
  avatarUrl?: string;
  avatarColor: string;
  verified?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  memberCount?: number;
  subscriberCount?: number;
  memberIds: string[];
  adminIds: string[];
  pinnedMessageId?: string;
  unreadBy: Record<string, number>;
  participantNames?: Record<string, string>;
  participantAvatars?: Record<string, { color: string; url?: string }>;
}

export interface StoryItem {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatarUrl?: string;
  authorAvatarColor: string;
  mediaUrl?: string;
  gradient?: string;
  caption: string;
  createdAt: string;
  viewedBy: string[];
  reactions: number;
}

export interface ContactItem {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  bio: string;
  avatarColor: string;
  avatarUrl?: string;
  lastSeen: string;
}

export interface CommentItem {
  id: string;
  messageId: string;
  chatId: string;
  authorId: string;
  authorName: string;
  authorAvatarColor: string;
  text: string;
  timestamp: string;
}

export interface CallRecord {
  id: string;
  peerId: string;
  peerName: string;
  peerAvatarColor: string;
  peerAvatarUrl?: string;
  direction: 'outgoing' | 'incoming' | 'missed';
  kind: 'voice' | 'video';
  durationSeconds: number;
  timestamp: string;
}

export interface CallSessionInfo {
  callId: string;
  chatId: string;
  callerId: string;
  callerName: string;
  callerAvatarColor: string;
  callerAvatarUrl?: string;
  calleeId: string;
  calleeName: string;
  calleeAvatarColor: string;
  calleeAvatarUrl?: string;
  kind: 'voice' | 'video';
}

export type PrivacyVisibility = 'everybody' | 'contacts' | 'nobody';

export interface AutoDownloadRule {
  photos: boolean;
  videos: boolean;
  files: boolean;
}

export type CallDataSaving = 'never' | 'mobile' | 'always';
export type KeepMediaPeriod = '3days' | '1week' | '1month' | 'forever';
export type ProxyType = 'socks5' | 'http' | 'mtproto';
export type PowerSavingMode = 'off' | 'auto' | 'always';

export interface ConnectedDeviceItem {
  id: string;
  deviceName: string;
  platform: string;
  location: string;
  lastActive: string;
  isCurrent?: boolean;
}

export interface BusinessQuickReply {
  id: string;
  shortcut: string;
  message: string;
}

export interface StarTransaction {
  id: string;
  title: string;
  amount: number;
  timestamp: string;
}

export interface SentGiftItem {
  id: string;
  recipientId: string;
  recipientName: string;
  giftName: string;
  starsCost: number;
  note?: string;
  timestamp: string;
}

export interface ChatAutomationRule {
  id: string;
  keyword: string;
  replyText: string;
  enabled: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  wallpaper: 'classic' | 'sky' | 'minimal' | 'midnight';
  fontSize: 'sm' | 'md' | 'lg';
  enterToSend: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  showOnlineStatus: boolean;
  language: string;
  privacyPhone?: PrivacyVisibility;
  privacyLastSeen?: PrivacyVisibility;
  privacyProfilePhoto?: PrivacyVisibility;
  privacyCalls?: PrivacyVisibility;
  privacyGroups?: PrivacyVisibility;
  privacyForwarded?: PrivacyVisibility;
  privacyBirthdate?: PrivacyVisibility;
  readReceiptsEnabled?: boolean;
  twoStepEnabled?: boolean;
  twoStepHint?: string;
  passcodeEnabled?: boolean;
  passcodePin?: string;
  blockedUserIds?: string[];
  // Data and Storage (Telegram-style)
  keepMediaPeriod?: KeepMediaPeriod;
  autoDownloadMobile?: AutoDownloadRule;
  autoDownloadWifi?: AutoDownloadRule;
  autoDownloadRoaming?: AutoDownloadRule;
  saveToGalleryPrivate?: boolean;
  saveToGalleryGroups?: boolean;
  saveToGalleryChannels?: boolean;
  streamingEnabled?: boolean;
  callDataSaving?: CallDataSaving;
  proxyEnabled?: boolean;
  proxyType?: ProxyType;
  proxyServer?: string;
  proxyPort?: string;
  proxyUsername?: string;
  proxyPassword?: string;
  networkStatsResetAt?: string;
  cacheClearedAt?: string;
  // Notifications: Calls & Badge (Telegram-style)
  notifyPrivateChats?: boolean;
  notifyGroups?: boolean;
  notifyChannels?: boolean;
  callNotifications?: boolean;
  callRingtone?: 'default' | 'chime' | 'pulse' | 'silent';
  callVibrate?: 'default' | 'short' | 'long' | 'disabled';
  badgeEnabled?: boolean;
  badgeIncludeMuted?: boolean;
  badgeCountMessages?: boolean;
  // Devices (Telegram-style)
  autoTerminatePeriod?: '1week' | '1month' | '3months' | '6months' | '1year';
  connectedDevices?: ConnectedDeviceItem[];
  // Power Saving (Telegram-style)
  powerSavingMode?: PowerSavingMode;
  powerSavingThreshold?: number;
  powerAutoplayVideos?: boolean;
  powerAutoplayGifs?: boolean;
  powerAnimatedEmoji?: boolean;
  powerAnimations?: boolean;
  powerBackgroundSync?: boolean;
  // Sarigram Premium, Business, Stars & Gifts
  premiumActive?: boolean;
  premiumPlan?: 'monthly' | 'annual';
  businessEnabled?: boolean;
  businessHours?: string;
  businessGreeting?: string;
  businessAway?: string;
  businessQuickReplies?: BusinessQuickReply[];
  // Chat Automation
  chatAutomationEnabled?: boolean;
  autoGreetingEnabled?: boolean;
  autoAwayEnabled?: boolean;
  automationRules?: ChatAutomationRule[];
  starBalance?: number;
  starTransactions?: StarTransaction[];
  sentGifts?: SentGiftItem[];
  customFolders?: CustomChatFolder[];
}

export interface SarigramStateSnapshot {
  chats: ChatThread[];
  messages: ChatMessage[];
  contacts: ContactItem[];
  stories: StoryItem[];
  comments: CommentItem[];
  calls: CallRecord[];
  onlineUserIds: string[];
  lastSeenByUser: Record<string, string>;
  typingByChat: Record<string, { userId: string; userName: string }[]>;
  appConfig?: AppConfig;
}
