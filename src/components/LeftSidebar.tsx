import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  BellOff,
  Bot,
  Camera,
  Check,
  CheckCheck,
  CircleUserRound,
  Compass,
  Edit,
  FolderPlus,
  Megaphone,
  Menu,
  MessageCircle,
  MessageSquarePlus,
  Pin,
  Plus,
  Search,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react';
import { Avatar } from './Avatar';
import { FolderManagerModal, doesChatMatchCustomFolder } from './FolderManagerModal';
import {
  TelegramContactsView,
  TelegramProfileView,
  TelegramSettingsView,
  type SettingsSectionTab,
} from './TelegramTabViews';
import { formatChatListTime, formatLastSeen, getChatDisplay } from '../utils/formatters';
import {
  DEFAULT_APP_CONFIG,
  getBrandGradient,
  getTranslations,
  normalizeLanguage,
} from '../utils/i18n';
import type {
  AppConfig,
  AppSettings,
  ChatFolder,
  ChatMessage,
  ChatThread,
  ContactItem,
  CustomChatFolder,
  SearchUserResult,
  StoryItem,
  UserProfile,
} from '../types/sarigram';

export type SidebarBottomTab = 'chats' | 'contacts' | 'settings' | 'profile';

interface LeftSidebarProps {
  currentUser: UserProfile;
  savedAccounts?: UserProfile[];
  chats: ChatThread[];
  contacts?: ContactItem[];
  messages: ChatMessage[];
  stories: StoryItem[];
  activeChatId: string | null;
  onlineUserIds: string[];
  typingByChat: Record<string, { userId: string; userName: string }[]>;
  language: string;
  settings: AppSettings;
  totalUnreadBadgeCount: number;
  appConfig?: AppConfig;
  customFolders?: CustomChatFolder[];
  activeBottomTab: SidebarBottomTab;
  onChangeBottomTab: (tab: SidebarBottomTab) => void;
  onUpdateCustomFolders?: (folders: CustomChatFolder[]) => void;
  onToggleLanguage: () => void;
  onToggleTheme: () => void;
  onSelectChat: (chatId: string) => void;
  onStartPrivateChat: (contact: ContactItem) => void;
  onSelectSearchResult: (result: SearchUserResult) => void;
  onOpenDrawer: () => void;
  onOpenStory: (storyId: string) => void;
  onOpenCreateStory: () => void;
  onOpenNewGroup: () => void;
  onOpenNewChannel: () => void;
  onOpenContacts: () => void;
  onOpenDiscover: () => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onOpenSettingsSection: (tab: SettingsSectionTab) => void;
  onSwitchAccount: (user: UserProfile) => void;
  onOpenAddAccount: () => void;
  onOpenPlus: (tab: 'premium' | 'business' | 'stars' | 'gift') => void;
  onOpenHelp: (tab: 'faq' | 'features' | 'policy') => void;
  onOpenInviteFriends: () => void;
  onOpenSavedMessages: () => void;
  onOpenBrandKit: () => void;
  onOpenAdmin?: () => void;
  onOpenEditApps?: () => void;
}

const BUILTIN_FOLDERS: { id: ChatFolder; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'personal', label: 'Personal' },
  { id: 'groups', label: 'Groups' },
  { id: 'channels', label: 'Channels' },
  { id: 'bots', label: 'Bots' },
];

export function LeftSidebar({
  currentUser,
  savedAccounts = [],
  chats,
  contacts = [],
  messages,
  stories,
  activeChatId,
  onlineUserIds,
  typingByChat,
  language,
  settings,
  totalUnreadBadgeCount,
  appConfig = DEFAULT_APP_CONFIG,
  customFolders = [],
  activeBottomTab,
  onChangeBottomTab,
  onUpdateCustomFolders,
  onToggleLanguage,
  onToggleTheme,
  onSelectChat,
  onStartPrivateChat,
  onSelectSearchResult,
  onOpenDrawer,
  onOpenStory,
  onOpenCreateStory,
  onOpenNewGroup,
  onOpenNewChannel,
  onOpenContacts,
  onOpenDiscover,
  onUpdateProfile,
  onOpenSettingsSection,
  onSwitchAccount,
  onOpenAddAccount,
  onOpenPlus,
  onOpenHelp,
  onOpenInviteFriends,
  onOpenSavedMessages,
  onOpenBrandKit,
  onOpenAdmin,
  onOpenEditApps,
}: LeftSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [globalResults, setGlobalResults] = useState<SearchUserResult[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [composeOpen, setComposeOpen] = useState(false);
  const [folderManagerOpen, setFolderManagerOpen] = useState(false);
  const [editFolderId, setEditFolderId] = useState<string | null>(null);
  const [chatFolderMenu, setChatFolderMenu] = useState<{
    chatId: string;
    x: number;
    y: number;
  } | null>(null);

  const t = getTranslations(language);
  const langCode = normalizeLanguage(language);
  const brandGrad = getBrandGradient(appConfig.brandPreset);

  useEffect(() => {
    const isBuiltin = BUILTIN_FOLDERS.some((f) => f.id === activeFolder);
    if (!isBuiltin && !customFolders.some((f) => f.id === activeFolder)) {
      setActiveFolder('all');
    }
  }, [activeFolder, customFolders]);

  useEffect(() => {
    if (!chatFolderMenu) return;
    const close = () => setChatFolderMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [chatFolderMenu]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setGlobalResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      fetch(
        `/api/users/search?q=${encodeURIComponent(q)}&excludeUserId=${encodeURIComponent(
          currentUser.id
        )}`
      )
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled && Array.isArray(data.results)) {
            setGlobalResults(data.results);
          }
        })
        .catch(() => {});
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, currentUser.id]);

  const lastMessageByChat = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    for (const msg of messages) {
      const prev = map.get(msg.chatId);
      if (!prev || new Date(msg.timestamp).getTime() >= new Date(prev.timestamp).getTime()) {
        map.set(msg.chatId, msg);
      }
    }
    return map;
  }, [messages]);

  const folderUnreadCount = useMemo(() => {
    const counts: Record<string, number> = {
      all: 0,
      unread: 0,
      personal: 0,
      groups: 0,
      channels: 0,
      bots: 0,
    };
    for (const folder of customFolders) {
      counts[folder.id] = 0;
    }
    for (const chat of chats) {
      const unread = chat.unreadBy?.[currentUser.id] || 0;
      if (unread > 0) {
        counts.all += unread;
        counts.unread += unread;
        if (chat.type === 'private' || chat.type === 'saved') counts.personal += unread;
        if (chat.type === 'group') counts.groups += unread;
        if (chat.type === 'channel') counts.channels += unread;
        if (chat.type === 'bot') counts.bots += unread;
        for (const folder of customFolders) {
          if (doesChatMatchCustomFolder(chat, folder)) {
            counts[folder.id] = (counts[folder.id] || 0) + unread;
          }
        }
      }
    }
    return counts;
  }, [chats, currentUser.id, customFolders]);

  const orderedFolderTabs = useMemo(() => {
    const firstBuiltins = BUILTIN_FOLDERS.slice(0, 2).map((f) => ({
      id: f.id,
      label: t.folders[f.id],
      isCustom: false,
    }));
    const customTabs = customFolders.map((f) => ({
      id: f.id,
      label: f.name,
      isCustom: true,
    }));
    const restBuiltins = BUILTIN_FOLDERS.slice(2).map((f) => ({
      id: f.id,
      label: t.folders[f.id],
      isCustom: false,
    }));
    return [...firstBuiltins, ...customTabs, ...restBuiltins];
  }, [customFolders, t]);

  const activeCustomFolder = useMemo(
    () => customFolders.find((f) => f.id === activeFolder) || null,
    [customFolders, activeFolder]
  );

  const activeFolderLabel = useMemo(() => {
    if (activeCustomFolder) return activeCustomFolder.name;
    const builtin = BUILTIN_FOLDERS.find((f) => f.id === activeFolder);
    return builtin ? t.folders[builtin.id] : t.folders.all;
  }, [activeCustomFolder, activeFolder, t]);

  const handleToggleChatInCustomFolder = (chat: ChatThread, folderId: string) => {
    if (!onUpdateCustomFolders) return;
    const updated = customFolders.map((folder) => {
      if (folder.id !== folderId) return folder;
      const currentlyIn = doesChatMatchCustomFolder(chat, folder);
      const matchedByType =
        (folder.includedTypes?.includes(chat.type) ?? false) ||
        (chat.type === 'saved' && (folder.includedTypes?.includes('private') ?? false));

      if (currentlyIn) {
        const nextChatIds = folder.chatIds.filter((id) => id !== chat.id);
        const nextExcluded = matchedByType
          ? Array.from(new Set([...(folder.excludedChatIds || []), chat.id]))
          : folder.excludedChatIds || [];
        return { ...folder, chatIds: nextChatIds, excludedChatIds: nextExcluded };
      }

      const nextExcluded = (folder.excludedChatIds || []).filter((id) => id !== chat.id);
      const nextChatIds = matchedByType
        ? folder.chatIds
        : Array.from(new Set([...folder.chatIds, chat.id]));
      return { ...folder, chatIds: nextChatIds, excludedChatIds: nextExcluded };
    });
    onUpdateCustomFolders(updated);
    setChatFolderMenu(null);
  };

  const filteredChats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = chats.filter((chat) => {
      const unread = chat.unreadBy?.[currentUser.id] || 0;
      if (activeCustomFolder) {
        if (!doesChatMatchCustomFolder(chat, activeCustomFolder)) return false;
      } else {
        if (activeFolder === 'unread' && unread === 0) return false;
        if (activeFolder === 'personal' && chat.type !== 'private' && chat.type !== 'saved')
          return false;
        if (activeFolder === 'groups' && chat.type !== 'group') return false;
        if (activeFolder === 'channels' && chat.type !== 'channel') return false;
        if (activeFolder === 'bots' && chat.type !== 'bot') return false;
      }

      if (!q) return true;
      const display = getChatDisplay(chat, currentUser.id);
      const titleMatch = display.title.toLowerCase().includes(q);
      const userMatch = chat.username?.toLowerCase().includes(q);
      const lastMsg = lastMessageByChat.get(chat.id);
      const msgMatch = lastMsg?.text.toLowerCase().includes(q);
      return titleMatch || userMatch || msgMatch;
    });

    return [...list].sort((a, b) => {
      if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
        return a.isPinned ? -1 : 1;
      }
      const timeA = lastMessageByChat.get(a.id)?.timestamp || '';
      const timeB = lastMessageByChat.get(b.id)?.timestamp || '';
      return timeB.localeCompare(timeA);
    });
  }, [chats, activeFolder, activeCustomFolder, searchQuery, currentUser.id, lastMessageByChat]);

  return (
    <aside className="relative flex flex-col h-full w-full md:w-[360px] lg:w-[385px] shrink-0 bg-white dark:bg-[#17212B] border-r border-slate-200 dark:border-[#101921] select-none">
      {activeBottomTab === 'contacts' ? (
        <TelegramContactsView
          contacts={contacts}
          onlineUserIds={onlineUserIds}
          language={language}
          brandPreset={appConfig.brandPreset}
          onStartPrivateChat={onStartPrivateChat}
          onOpenAddContactModal={onOpenContacts}
          onOpenInviteFriends={onOpenInviteFriends}
          onOpenDiscover={onOpenDiscover}
        />
      ) : activeBottomTab === 'settings' ? (
        <TelegramSettingsView
          currentUser={currentUser}
          savedAccounts={savedAccounts.length > 0 ? savedAccounts : [currentUser]}
          settings={settings}
          totalUnreadBadgeCount={totalUnreadBadgeCount}
          language={language}
          onUpdateProfile={onUpdateProfile}
          onToggleTheme={onToggleTheme}
          onOpenSettingsSection={onOpenSettingsSection}
          onSwitchAccount={onSwitchAccount}
          onOpenAddAccount={onOpenAddAccount}
          onOpenPlus={onOpenPlus}
          onOpenHelp={onOpenHelp}
          onOpenDrawer={onOpenDrawer}
          onOpenAdmin={onOpenAdmin}
          onOpenEditApps={onOpenEditApps}
        />
      ) : activeBottomTab === 'profile' ? (
        <TelegramProfileView
          currentUser={currentUser}
          chats={chats}
          language={language}
          brandPreset={appConfig.brandPreset}
          onUpdateProfile={onUpdateProfile}
          onEditProfile={() => onOpenSettingsSection('profile')}
          onOpenChat={onSelectChat}
          onOpenSavedMessages={onOpenSavedMessages}
          onOpenBrandKit={onOpenBrandKit}
        />
      ) : (
        <>
          {/* Top Bar: Menu + Search + En/Ao + Discover */}
          <div className="px-3 pt-3 pb-2 flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Open menu"
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#232E3C] transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full h-10 pl-9 pr-8 rounded-full bg-[#F4F4F5] dark:bg-[#242F3D] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]/45 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleLanguage}
          aria-label="Toggle English / Afaan Oromoo"
          title="Switch language: En / Ao"
          className="h-10 px-2.5 rounded-full border border-slate-200 dark:border-[#2C3B4B] bg-slate-50 dark:bg-[#202B36] hover:border-[#5B5CE6] text-xs font-display font-bold tracking-tight flex items-center gap-0.5 shrink-0 whitespace-nowrap transition-colors"
        >
          <span
            className={
              langCode === 'en'
                ? 'text-[#5B5CE6] dark:text-[#A78BFA]'
                : 'text-slate-400 dark:text-slate-500'
            }
          >
            En
          </span>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span
            className={
              langCode === 'ao'
                ? 'text-[#7C3AED] dark:text-[#C4B5FD]'
                : 'text-slate-400 dark:text-slate-500'
            }
          >
            Ao
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenDiscover}
          aria-label="Discover people by @username"
          title="Discover @username"
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#5B5CE6] dark:text-[#A78BFA] bg-[#5B5CE6]/10 hover:bg-[#5B5CE6]/18 transition-colors shrink-0"
        >
          <Compass className="w-5 h-5" />
        </button>
      </div>

      {/* Stories Strip */}
      {appConfig.showStories && !searchQuery.trim() && (
        <div className="px-3 py-2 flex items-center gap-3 overflow-x-auto border-b border-slate-100 dark:border-[#1F2C38]">
          <button
            type="button"
            onClick={onOpenCreateStory}
            className="flex flex-col items-center gap-1 shrink-0 group"
          >
            <div className="relative w-12 h-12 rounded-full p-0.5 border border-dashed border-[#5B5CE6]/60 flex items-center justify-center bg-slate-50 dark:bg-[#1E2B38] group-hover:bg-[#5B5CE6]/10 transition-colors">
              <Avatar
                name={`${currentUser.firstName} ${currentUser.lastName}`}
                color={currentUser.avatarColor}
                imageUrl={currentUser.avatarUrl}
                size="sm"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-gradient-to-r ${brandGrad} text-white flex items-center justify-center ring-2 ring-white dark:ring-[#17212B]`}
              >
                <Plus className="w-3.5 h-3.5" />
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 max-w-[60px] truncate">
              {t.myStory}
            </span>
          </button>

          {stories.map((story) => {
            const viewed = story.viewedBy.includes(currentUser.id);
            return (
              <button
                key={story.id}
                type="button"
                onClick={() => onOpenStory(story.id)}
                className="flex flex-col items-center gap-1 shrink-0 group"
              >
                <div
                  className={`w-12 h-12 rounded-full p-[2px] transition-transform group-hover:scale-105 ${
                    viewed
                      ? 'bg-slate-300 dark:bg-slate-600'
                      : 'bg-gradient-to-tr from-[#2563EB] via-[#5B5CE6] to-[#9333EA]'
                  }`}
                >
                  <div className="w-full h-full rounded-full p-[1.5px] bg-white dark:bg-[#17212B] flex items-center justify-center">
                    <Avatar
                      name={story.authorName}
                      color={story.authorAvatarColor}
                      imageUrl={story.authorAvatarUrl}
                      size="sm"
                    />
                  </div>
                </div>
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 max-w-[58px] truncate">
                  {story.authorName.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Folder Tabs + Manage Folders Button */}
      <div className="flex items-center border-b border-slate-200 dark:border-[#101921]">
        <div className="px-2 flex-1 min-w-0 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {orderedFolderTabs.map((folder) => {
            const isActive = activeFolder === folder.id;
            const unread = folderUnreadCount[folder.id] || 0;
            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => setActiveFolder(folder.id)}
                onDoubleClick={() => {
                  if (folder.isCustom && onUpdateCustomFolders) {
                    setEditFolderId(folder.id);
                    setFolderManagerOpen(true);
                  }
                }}
                title={folder.isCustom ? `${folder.label} (double-click to edit)` : folder.label}
                className={`relative px-3 py-2.5 text-[13px] font-medium whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? 'text-[#5B5CE6] dark:text-[#A78BFA]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span>{folder.label}</span>
                {unread > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[11px] font-semibold tabular-nums ${
                      isActive
                        ? `bg-gradient-to-r ${brandGrad} text-white`
                        : 'bg-slate-200 dark:bg-[#2B3948] text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {unread}
                  </span>
                )}
                {isActive && (
                  <span
                    className={`absolute bottom-0 left-2 right-2 h-[2.5px] rounded-t-full bg-gradient-to-r ${brandGrad}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {onUpdateCustomFolders && (
          <button
            type="button"
            onClick={() => {
              setEditFolderId(null);
              setFolderManagerOpen(true);
            }}
            aria-label={t.manageFolders}
            title={t.manageFolders}
            className="w-9 h-9 mr-1.5 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#5B5CE6] dark:hover:text-[#A78BFA] hover:bg-slate-100 dark:hover:bg-[#232E3C] transition-colors shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Chat List + Global User/Contact Search */}
      <div className="flex-1 overflow-y-auto px-2 pt-1.5 pb-24 space-y-0.5">
        {filteredChats.length === 0 && globalResults.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {t.noChatsMatch} &quot;{searchQuery || activeFolderLabel}&quot;
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {activeCustomFolder && !searchQuery.trim()
                ? 'Assign chats or chat types to populate this folder.'
                : t.tryAnotherSearch}
            </p>
            {activeCustomFolder && onUpdateCustomFolders && !searchQuery.trim() && (
              <button
                type="button"
                onClick={() => {
                  setEditFolderId(activeCustomFolder.id);
                  setFolderManagerOpen(true);
                }}
                className={`mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r ${brandGrad} text-white text-xs font-semibold shadow-sm hover:opacity-95`}
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>{t.addChatsToFolder}</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {filteredChats.map((chat) => {
              const isSelected = chat.id === activeChatId;
              const lastMsg = lastMessageByChat.get(chat.id);
              const unread = chat.unreadBy?.[currentUser.id] || 0;
              const typingUsers = (typingByChat[chat.id] || []).filter(
                (u) => u.userId !== currentUser.id
              );

              const display = getChatDisplay(chat, currentUser.id);
              const peerOnline = display.peerId ? onlineUserIds.includes(display.peerId) : false;

              const isOutgoing = lastMsg?.senderId === currentUser.id;
              const isReadByOthers =
                Boolean(lastMsg) &&
                (chat.type === 'saved' ||
                  lastMsg!.readBy.some((id) => id !== lastMsg!.senderId));

              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => onSelectChat(chat.id)}
                  onContextMenu={(e) => {
                    if (!onUpdateCustomFolders || customFolders.length === 0) return;
                    e.preventDefault();
                    setChatFolderMenu({
                      chatId: chat.id,
                      x: Math.min(e.clientX, window.innerWidth - 210),
                      y: Math.min(e.clientY, window.innerHeight - 220),
                    });
                  }}
                  className={`w-full px-2.5 ${
                    appConfig.compactMode ? 'py-1.5' : 'py-2.5'
                  } rounded-xl flex items-center gap-3 text-left transition-colors ${
                    isSelected
                      ? `bg-gradient-to-r ${brandGrad} text-white shadow-xs`
                      : 'hover:bg-slate-100 dark:hover:bg-[#202B36] text-slate-900 dark:text-slate-100'
                  }`}
                >
                  <Avatar
                    name={display.title}
                    color={display.avatarColor}
                    imageUrl={display.avatarUrl}
                    type={chat.type}
                    size="md"
                    isOnline={peerOnline}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 min-w-0">
                        {chat.type === 'channel' && (
                          <Megaphone
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected ? 'text-white/90' : 'text-slate-400 dark:text-slate-500'
                            }`}
                          />
                        )}
                        {chat.type === 'group' && (
                          <Users
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected ? 'text-white/90' : 'text-slate-400 dark:text-slate-500'
                            }`}
                          />
                        )}
                        {chat.type === 'bot' && (
                          <Bot
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected ? 'text-white/90' : 'text-[#5B5CE6] dark:text-[#A78BFA]'
                            }`}
                          />
                        )}
                        <span className="font-display font-semibold text-[14.5px] truncate">
                          {display.title}
                        </span>
                        {chat.verified && (
                          <BadgeCheck
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? 'text-white' : 'text-[#5B5CE6] dark:text-[#A78BFA]'
                            }`}
                          />
                        )}
                        {chat.isMuted && (
                          <BellOff
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected ? 'text-white/75' : 'text-slate-400 dark:text-slate-500'
                            }`}
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isOutgoing && lastMsg && (
                          <span
                            title={isReadByOthers ? 'Read' : 'Sent'}
                            aria-label={isReadByOthers ? 'Read' : 'Sent'}
                            className={
                              isSelected
                                ? isReadByOthers
                                  ? 'text-white'
                                  : 'text-white/70'
                                : isReadByOthers
                                  ? 'text-[#2563EB] dark:text-[#60A5FA]'
                                  : 'text-slate-400 dark:text-slate-500'
                            }
                          >
                            {isReadByOthers ? (
                              <CheckCheck className="w-3.5 h-3.5" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </span>
                        )}
                        <span
                          className={`text-xs tabular-nums ${
                            isSelected ? 'text-white/85' : 'text-slate-400 dark:text-slate-400'
                          }`}
                        >
                          {lastMsg ? formatChatListTime(lastMsg.timestamp) : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p
                        className={`text-[13.5px] truncate ${
                          isSelected
                            ? 'text-white/90'
                            : typingUsers.length > 0
                              ? 'text-[#5B5CE6] dark:text-[#A78BFA] font-medium'
                              : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {typingUsers.length > 0 ? (
                          `${typingUsers[0].userName.split(' ')[0]} is typing...`
                        ) : lastMsg ? (
                          <>
                            {chat.type === 'group' && lastMsg.senderId !== currentUser.id && (
                              <span
                                className={`font-medium mr-1 ${
                                  isSelected ? 'text-white' : 'text-[#5B5CE6] dark:text-[#A78BFA]'
                                }`}
                              >
                                {lastMsg.senderName.split(' ')[0]}:
                              </span>
                            )}
                            {lastMsg.type === 'image' && !lastMsg.text
                              ? 'Photo'
                              : lastMsg.type === 'video' && !lastMsg.text
                                ? 'Video'
                                : lastMsg.type === 'voice'
                                  ? 'Voice message'
                                  : lastMsg.type === 'poll'
                                    ? `Poll: ${lastMsg.poll?.question}`
                                    : lastMsg.type === 'file'
                                      ? `File: ${lastMsg.fileName}`
                                      : lastMsg.text}
                          </>
                        ) : (
                          chat.description || 'No messages yet'
                        )}
                      </p>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {unread > 0 ? (
                          <span
                            className={`min-w-5 h-5 px-1.5 rounded-full text-xs font-semibold tabular-nums flex items-center justify-center ${
                              isSelected
                                ? 'bg-white text-[#5B5CE6]'
                                : chat.isMuted
                                  ? 'bg-slate-300 dark:bg-[#3A4A5A] text-white'
                                  : 'bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white'
                            }`}
                          >
                            {unread}
                          </span>
                        ) : (
                          chat.isPinned && (
                            <Pin
                              className={`w-3.5 h-3.5 rotate-45 ${
                                isSelected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
                              }`}
                            />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {searchQuery.trim() && globalResults.length > 0 && (
              <div className="pt-3 pb-2">
                <div className="px-3 pb-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                  Global Users, Contacts & Channels
                </div>
                {globalResults.map((res) => (
                  <button
                    key={`${res.kind}-${res.id}`}
                    type="button"
                    onClick={() => {
                      onSelectSearchResult(res);
                      setSearchQuery('');
                    }}
                    className="w-full px-2.5 py-2 rounded-xl flex items-center gap-3 text-left hover:bg-slate-100 dark:hover:bg-[#202B36] transition-colors"
                  >
                    <Avatar
                      name={`${res.firstName} ${res.lastName}`}
                      color={res.avatarColor}
                      imageUrl={res.avatarUrl}
                      type={res.kind === 'channel' ? 'channel' : 'private'}
                      size="sm"
                      isOnline={res.isOnline}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {res.firstName} {res.lastName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        @{res.username} · {res.isOnline ? 'online' : formatLastSeen(res.lastSeen)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Compose Button (FAB) */}
      <div className="absolute bottom-22 right-4 z-20">
        {composeOpen && (
          <div className="mb-3 w-48 rounded-xl bg-white dark:bg-[#1E2B38] shadow-xl border border-slate-200 dark:border-[#2C3B4B] py-1.5 text-sm">
            <button
              type="button"
              onClick={() => {
                setComposeOpen(false);
                onOpenNewGroup();
              }}
              className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-[#283848] text-slate-800 dark:text-slate-100 text-left"
            >
              <Users className="w-4 h-4 text-[#5B5CE6] dark:text-[#A78BFA]" />
              <span>{t.newGroup}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setComposeOpen(false);
                onOpenNewChannel();
              }}
              className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-[#283848] text-slate-800 dark:text-slate-100 text-left"
            >
              <Megaphone className="w-4 h-4 text-[#5B5CE6] dark:text-[#A78BFA]" />
              <span>{t.newChannel}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setComposeOpen(false);
                onOpenContacts();
              }}
              className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-[#283848] text-slate-800 dark:text-slate-100 text-left"
            >
              <MessageSquarePlus className="w-4 h-4 text-[#5B5CE6] dark:text-[#A78BFA]" />
              <span>{t.newMessage}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setComposeOpen(false);
                onOpenCreateStory();
              }}
              className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-[#283848] text-slate-800 dark:text-slate-100 text-left"
            >
              <Camera className="w-4 h-4 text-[#7C3AED] dark:text-[#C4B5FD]" />
              <span>{t.postStory}</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setComposeOpen((prev) => !prev)}
          aria-label="Compose new chat, group, or channel"
          className={`w-13 h-13 rounded-full bg-gradient-to-br ${brandGrad} hover:opacity-95 active:scale-95 text-white shadow-lg flex items-center justify-center transition-all ml-auto`}
        >
          {composeOpen ? <X className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
        </button>
      </div>
        </>
      )}

      {/* Telegram-style Floating Pill Bottom Navigation Bar */}
      <nav
        aria-label="Primary navigation"
        className="absolute bottom-3 inset-x-3 z-30 rounded-full bg-white/92 dark:bg-[#1E2B38]/92 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 shadow-[0_8px_28px_rgba(15,23,42,0.16)] p-1 grid grid-cols-4 gap-0.5"
      >
        <button
          type="button"
          onClick={() => onChangeBottomTab('chats')}
          className={`relative rounded-full py-1.5 flex flex-col items-center justify-center gap-0.5 transition-colors ${
            activeBottomTab === 'chats'
              ? 'bg-[#2AABEE]/14 dark:bg-white/10 text-[#2AABEE]'
              : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5" />
            {totalUnreadBadgeCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[16px] px-1 rounded-full bg-[#2AABEE] text-white text-[10px] font-bold tabular-nums flex items-center justify-center ring-2 ring-white dark:ring-[#1E2B38]">
                {totalUnreadBadgeCount > 99 ? '99+' : totalUnreadBadgeCount}
              </span>
            )}
          </div>
          <span className="text-[11px] font-semibold leading-tight">{t.chats}</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeBottomTab('contacts')}
          className={`rounded-full py-1.5 flex flex-col items-center justify-center gap-0.5 transition-colors ${
            activeBottomTab === 'contacts'
              ? 'bg-[#2AABEE]/14 dark:bg-white/10 text-[#2AABEE]'
              : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CircleUserRound className="w-5 h-5" />
          <span className="text-[11px] font-semibold leading-tight">{t.contacts}</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeBottomTab('settings')}
          className={`rounded-full py-1.5 flex flex-col items-center justify-center gap-0.5 transition-colors ${
            activeBottomTab === 'settings'
              ? 'bg-[#2AABEE]/14 dark:bg-white/10 text-[#2AABEE]'
              : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <SettingsIcon className="w-5 h-5" />
          <span className="text-[11px] font-semibold leading-tight">{t.settings}</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeBottomTab('profile')}
          className={`rounded-full py-1.5 flex flex-col items-center justify-center gap-0.5 transition-colors ${
            activeBottomTab === 'profile'
              ? 'bg-[#2AABEE]/14 dark:bg-white/10 text-[#2AABEE]'
              : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div
            className={`rounded-full ${
              activeBottomTab === 'profile' ? 'ring-2 ring-[#2AABEE]' : ''
            }`}
          >
            <Avatar
              name={`${currentUser.firstName} ${currentUser.lastName}`}
              color={currentUser.avatarColor}
              imageUrl={currentUser.avatarUrl}
              size="xs"
            />
          </div>
          <span className="text-[11px] font-semibold leading-tight">{t.profile}</span>
        </button>
      </nav>

      {/* Right-click Quick Folder Assignment Popover */}
      {chatFolderMenu && onUpdateCustomFolders && (
        <div
          style={{ top: chatFolderMenu.y, left: chatFolderMenu.x }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 w-52 rounded-xl bg-white dark:bg-[#1E2B38] shadow-xl border border-slate-200 dark:border-[#2C3B4B] py-1.5 text-xs"
        >
          <div className="px-3 py-1.5 font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#2A3848]">
            {t.addChatsToFolder}
          </div>
          {(() => {
            const targetChat = chats.find((c) => c.id === chatFolderMenu.chatId);
            if (!targetChat) return null;
            return customFolders.map((folder) => {
              const inFolder = doesChatMatchCustomFolder(targetChat, folder);
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => handleToggleChatInCustomFolder(targetChat, folder.id)}
                  className="w-full px-3 py-2 flex items-center justify-between gap-2 hover:bg-slate-100 dark:hover:bg-[#283848] text-slate-800 dark:text-slate-100 text-left"
                >
                  <span className="truncate font-medium">{folder.name}</span>
                  {inFolder && <Check className="w-3.5 h-3.5 text-[#5B5CE6] dark:text-[#A78BFA] shrink-0" />}
                </button>
              );
            });
          })()}
          <button
            type="button"
            onClick={() => {
              setChatFolderMenu(null);
              setEditFolderId(null);
              setFolderManagerOpen(true);
            }}
            className="w-full px-3 py-2 mt-0.5 border-t border-slate-100 dark:border-[#2A3848] flex items-center gap-2 text-[#5B5CE6] dark:text-[#A78BFA] font-semibold hover:bg-slate-100 dark:hover:bg-[#283848] text-left"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>{t.manageFolders}</span>
          </button>
        </div>
      )}

      {/* Custom Chat Folder Manager Modal */}
      {onUpdateCustomFolders && (
        <FolderManagerModal
          open={folderManagerOpen}
          initialEditFolderId={editFolderId}
          chats={chats}
          currentUserId={currentUser.id}
          customFolders={customFolders}
          language={language}
          brandPreset={appConfig.brandPreset}
          onClose={() => {
            setFolderManagerOpen(false);
            setEditFolderId(null);
          }}
          onSaveFolders={onUpdateCustomFolders}
        />
      )}
    </aside>
  );
}
