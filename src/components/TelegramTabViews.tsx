import { useMemo, useRef, useState } from 'react';
import {
  BatteryCharging,
  Bookmark,
  Bot,
  Briefcase,
  Calendar,
  Camera,
  Check,
  ChevronRight,
  Copy,
  Crown,
  Database,
  Gift,
  HelpCircle,
  KeyRound,
  Megaphone,
  MessageCircle,
  MonitorSmartphone,
  Moon,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  QrCode,
  Search,
  Shield,
  Sparkles,
  Sun,
  ThumbsUp,
  User,
  UserPlus,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import { Avatar } from './Avatar';
import { formatLastSeen } from '../utils/formatters';
import { getBrandGradient, getTranslations } from '../utils/i18n';
import type {
  AppConfig,
  AppSettings,
  ChatThread,
  ContactItem,
  UserProfile,
} from '../types/sarigram';

export type SettingsSectionTab =
  | 'profile'
  | 'appearance'
  | 'privacy'
  | 'data'
  | 'notifications'
  | 'devices'
  | 'power'
  | 'automation';

interface TelegramContactsViewProps {
  contacts: ContactItem[];
  onlineUserIds: string[];
  language: string;
  brandPreset?: AppConfig['brandPreset'];
  onStartPrivateChat: (contact: ContactItem) => void;
  onOpenAddContactModal: () => void;
  onOpenInviteFriends: () => void;
  onOpenDiscover: () => void;
}

export function TelegramContactsView({
  contacts,
  onlineUserIds,
  language,
  brandPreset,
  onStartPrivateChat,
  onOpenAddContactModal,
  onOpenInviteFriends,
  onOpenDiscover,
}: TelegramContactsViewProps) {
  const [query, setQuery] = useState('');
  const t = getTranslations(language);
  const brandGrad = getBrandGradient(brandPreset);

  const sortedFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = contacts.filter((c) => {
      if (!q) return true;
      return `${c.firstName} ${c.lastName} ${c.username} ${c.phone}`.toLowerCase().includes(q);
    });
    return [...list].sort((a, b) => {
      const aOnline = onlineUserIds.includes(a.id) ? 1 : 0;
      const bOnline = onlineUserIds.includes(b.id) ? 1 : 0;
      if (aOnline !== bOnline) return bOnline - aOnline;
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    });
  }, [contacts, onlineUserIds, query]);

  return (
    <div className="flex-1 overflow-y-auto px-3 pt-3 pb-24 space-y-3 bg-[#F4F6FA] dark:bg-[#0E1621]">
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
          {t.contacts}
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenDiscover}
            aria-label={t.discover}
            title={t.discoverMenu}
            className="h-9 px-3 rounded-full bg-white dark:bg-[#1C2733] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#2AABEE] transition-colors whitespace-nowrap"
          >
            @{t.discover}
          </button>
          <button
            type="button"
            onClick={onOpenAddContactModal}
            aria-label="Add Contact"
            className={`w-9 h-9 rounded-full bg-gradient-to-br ${brandGrad} text-white flex items-center justify-center shadow-sm hover:opacity-95 shrink-0`}
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts..."
          className="w-full h-10 pl-9 pr-8 rounded-full bg-white dark:bg-[#1C2733] border border-slate-200/80 dark:border-white/10 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2AABEE]/40"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear contact search"
            className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-2.5 top-1/2 -translate-y-1/2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#17212B] border border-slate-200/80 dark:border-white/5 overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
        <button
          type="button"
          onClick={onOpenInviteFriends}
          className="w-full px-3.5 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-[#1E2B38] text-left transition-colors"
        >
          <span className="w-9 h-9 rounded-full bg-[#2AABEE]/15 text-[#2AABEE] flex items-center justify-center shrink-0">
            <Users className="w-4.5 h-4.5" />
          </span>
          <span className="text-sm font-semibold text-[#2AABEE]">{t.inviteFriends}</span>
        </button>

        {sortedFiltered.length === 0 ? (
          <div className="py-10 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
            No contacts match &quot;{query}&quot;
          </div>
        ) : (
          sortedFiltered.map((contact) => {
            const online = onlineUserIds.includes(contact.id);
            return (
              <button
                key={contact.id}
                type="button"
                onClick={() => onStartPrivateChat(contact)}
                className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-[#1E2B38] text-left transition-colors"
              >
                <Avatar
                  name={`${contact.firstName} ${contact.lastName}`}
                  color={contact.avatarColor}
                  imageUrl={contact.avatarUrl}
                  size="sm"
                  isOnline={online}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {contact.firstName} {contact.lastName}
                  </div>
                  <div
                    className={`text-xs truncate ${
                      online
                        ? 'text-[#2AABEE] font-medium'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {online ? t.online : formatLastSeen(contact.lastSeen)}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

interface TelegramSettingsViewProps {
  currentUser: UserProfile;
  savedAccounts: UserProfile[];
  settings: AppSettings;
  totalUnreadBadgeCount: number;
  language: string;
  onUpdateProfile: (profile: UserProfile) => void;
  onToggleTheme: () => void;
  onOpenSettingsSection: (tab: SettingsSectionTab) => void;
  onSwitchAccount: (user: UserProfile) => void;
  onOpenAddAccount: () => void;
  onOpenPlus: (tab: 'premium' | 'business' | 'stars' | 'gift') => void;
  onOpenHelp: (tab: 'faq' | 'features' | 'policy') => void;
  onOpenDrawer: () => void;
  onOpenAdmin?: () => void;
  onOpenEditApps?: () => void;
}

export function TelegramSettingsView({
  currentUser,
  savedAccounts,
  settings,
  totalUnreadBadgeCount,
  language,
  onUpdateProfile,
  onToggleTheme,
  onOpenSettingsSection,
  onSwitchAccount,
  onOpenAddAccount,
  onOpenPlus,
  onOpenHelp,
  onOpenDrawer,
  onOpenAdmin,
  onOpenEditApps,
}: TelegramSettingsViewProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsQuery, setSettingsQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [phoneConfirmed, setPhoneConfirmed] = useState(() => {
    try {
      return localStorage.getItem('sarigram_phone_confirmed_v1') === currentUser.phone;
    } catch {
      return false;
    }
  });
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const t = getTranslations(language);

  const handlePhotoChange = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateProfile({ ...currentUser, avatarUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmPhone = () => {
    setPhoneConfirmed(true);
    try {
      localStorage.setItem('sarigram_phone_confirmed_v1', currentUser.phone || '');
    } catch {
      // ignore
    }
  };

  const settingRows: {
    id: SettingsSectionTab;
    title: string;
    subtitle: string;
    bg: string;
    icon: typeof User;
  }[] = [
    {
      id: 'profile',
      title: 'Account',
      subtitle: 'Number, Username, Bio, Birthdate',
      bg: 'bg-[#2AABEE]',
      icon: User,
    },
    {
      id: 'appearance',
      title: 'Chat Settings',
      subtitle: 'Wallpaper, Night Mode, Animations',
      bg: 'bg-[#F59E0B]',
      icon: MessageCircle,
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      subtitle: 'Last Seen, Devices, Passkeys',
      bg: 'bg-[#22C55E]',
      icon: KeyRound,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Sounds, Calls, Badges',
      bg: 'bg-[#EF4444]',
      icon: Volume2,
    },
    {
      id: 'data',
      title: 'Data & Storage',
      subtitle: 'Disk & Network, Auto-download, Proxy',
      bg: 'bg-[#06B6D4]',
      icon: Database,
    },
    {
      id: 'devices',
      title: 'Devices',
      subtitle: 'Manage Connected Devices & QR',
      bg: 'bg-[#6366F1]',
      icon: MonitorSmartphone,
    },
    {
      id: 'power',
      title: 'Power Saving',
      subtitle: 'Animations, Battery & Performance',
      bg: 'bg-[#F97316]',
      icon: BatteryCharging,
    },
    {
      id: 'automation',
      title: 'Chat Automation',
      subtitle: 'Greeting, Away & Auto-Replies',
      bg: 'bg-[#8B5CF6]',
      icon: Bot,
    },
  ];

  const filteredRows = settingRows.filter((row) => {
    const q = settingsQuery.trim().toLowerCase();
    if (!q) return true;
    return `${row.title} ${row.subtitle}`.toLowerCase().includes(q);
  });

  const fullName = `${currentUser.firstName} ${currentUser.lastName}`.trim();

  return (
    <div className="flex-1 overflow-y-auto px-3 pt-3 pb-24 space-y-3.5 bg-[#F2F4F8] dark:bg-[#0E1621]">
      {/* Top Action Pill Row (QR on left, Search + More on right — Telegram style) */}
      <div className="flex items-center justify-between gap-2 relative">
        <button
          type="button"
          onClick={() => onOpenSettingsSection('devices')}
          aria-label="QR Code & Devices"
          title="Scan QR / Connected Devices"
          className="w-10 h-10 rounded-full bg-white/90 dark:bg-[#1C2733]/90 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-[#2AABEE] transition-colors"
        >
          <QrCode className="w-5 h-5" />
        </button>

        {searchOpen && (
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={settingsQuery}
              onChange={(e) => setSettingsQuery(e.target.value)}
              placeholder="Search settings..."
              autoFocus
              className="w-full h-10 px-3.5 rounded-full bg-white dark:bg-[#1C2733] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2AABEE]/40"
            />
          </div>
        )}

        <div className="h-10 px-1.5 rounded-full bg-white/90 dark:bg-[#1C2733]/90 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => {
              setSearchOpen((prev) => !prev);
              if (searchOpen) setSettingsQuery('');
            }}
            aria-label="Search settings"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="More settings options"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {menuOpen && (
          <div className="absolute right-0 top-12 z-30 w-48 rounded-2xl bg-white dark:bg-[#1E2B38] shadow-xl border border-slate-200 dark:border-white/10 py-1.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onOpenSettingsSection('profile');
              }}
              className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-800 dark:text-slate-100 text-left"
            >
              <Pencil className="w-3.5 h-3.5 text-[#2AABEE]" />
              <span>Edit Profile Info</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onToggleTheme();
              }}
              className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-800 dark:text-slate-100 text-left"
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
              )}
              <span>{settings.theme === 'dark' ? 'Switch to Day' : 'Switch to Night'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onOpenDrawer();
              }}
              className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-800 dark:text-slate-100 text-left"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Open Full Menu</span>
            </button>
          </div>
        )}
      </div>

      {/* Centered Avatar + Name + Phone */}
      <div className="flex flex-col items-center text-center pt-1 pb-1">
        <div className="relative">
          <Avatar
            name={fullName}
            color={currentUser.avatarColor}
            imageUrl={currentUser.avatarUrl}
            size="xl"
          />
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            aria-label="Update profile photo"
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#2AABEE] text-white flex items-center justify-center shadow-md ring-2 ring-[#F2F4F8] dark:ring-[#0E1621] hover:opacity-95"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handlePhotoChange(e.target.files?.[0])}
          />
        </div>
        <h2 className="mt-2.5 font-display font-bold text-xl text-slate-900 dark:text-white tracking-tight">
          {fullName}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
          {currentUser.phone || `@${currentUser.username}`}
        </p>
      </div>

      {/* Telegram-style Phone Confirmation Card */}
      {!phoneConfirmed && currentUser.phone && !settingsQuery.trim() && (
        <div className="rounded-2xl bg-white dark:bg-[#17212B] border border-slate-200/80 dark:border-white/5 p-4 text-center shadow-xs">
          <h3 className="font-display font-bold text-[15px] text-slate-900 dark:text-white">
            Is {currentUser.phone} still your number?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Keep your number up to date to ensure you can always log into Sarigram.{' '}
            <button
              type="button"
              onClick={() => onOpenHelp('policy')}
              className="text-[#2AABEE] font-medium hover:underline"
            >
              Learn more
            </button>
          </p>
          <div className="grid grid-cols-2 gap-2.5 mt-3.5">
            <button
              type="button"
              onClick={() => onOpenSettingsSection('profile')}
              className="h-10 rounded-full bg-[#2AABEE] hover:bg-[#229ED9] text-white text-sm font-semibold transition-colors"
            >
              No
            </button>
            <button
              type="button"
              onClick={handleConfirmPhone}
              className="h-10 rounded-full bg-[#2AABEE] hover:bg-[#229ED9] text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Yes</span>
            </button>
          </div>
        </div>
      )}

      {/* Accounts Section Card */}
      {!settingsQuery.trim() && (
        <div className="rounded-2xl bg-white dark:bg-[#17212B] border border-slate-200/80 dark:border-white/5 overflow-hidden shadow-xs">
          <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
            <span className="text-xs font-bold text-[#2AABEE]">Accounts</span>
            <button
              type="button"
              onClick={onOpenAddAccount}
              className="text-xs font-semibold text-[#2AABEE] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addAccount}</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {savedAccounts.map((acc) => {
              const isCurrent = acc.id === currentUser.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    if (!isCurrent) onSwitchAccount(acc);
                  }}
                  className="w-full px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-[#1E2B38] text-left transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      name={`${acc.firstName} ${acc.lastName}`}
                      color={acc.avatarColor}
                      imageUrl={acc.avatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {acc.firstName} {acc.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                        @{acc.username}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isCurrent ? (
                      totalUnreadBadgeCount > 0 ? (
                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#2AABEE] text-white text-[11px] font-bold tabular-nums flex items-center justify-center">
                          {totalUnreadBadgeCount}
                        </span>
                      ) : (
                        <Check className="w-4 h-4 text-[#2AABEE]" />
                      )
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin Controls & Edit Apps (Admins only) */}
      {currentUser.role === 'admin' && !settingsQuery.trim() && (onOpenEditApps || onOpenAdmin) && (
        <div className="rounded-2xl bg-white dark:bg-[#17212B] border border-slate-200/80 dark:border-white/5 overflow-hidden divide-y divide-slate-100 dark:divide-white/5 shadow-xs">
          <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
            <span className="text-xs font-bold text-[#7C3AED] dark:text-[#C4B5FD]">
              Admin Controls
            </span>
          </div>
          {onOpenEditApps && (
            <button
              type="button"
              onClick={onOpenEditApps}
              className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-slate-50 dark:hover:bg-[#1E2B38] text-left transition-colors"
            >
              <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Pencil className="w-4.5 h-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-semibold text-slate-900 dark:text-white truncate">
                  Edit Apps
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  App title, welcome body, banner &amp; theme
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          )}
          {onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-slate-50 dark:hover:bg-[#1E2B38] text-left transition-colors"
            >
              <span className="w-9 h-9 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Shield className="w-4.5 h-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-semibold text-slate-900 dark:text-white truncate">
                  {t.adminDashboard}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Users, channels, roles &amp; credentials
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          )}
        </div>
      )}

      {/* Main Telegram Settings List Card */}
      <div className="rounded-2xl bg-white dark:bg-[#17212B] border border-slate-200/80 dark:border-white/5 overflow-hidden divide-y divide-slate-100 dark:divide-white/5 shadow-xs">
        {filteredRows.map((row) => {
          const Icon = row.icon;
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => onOpenSettingsSection(row.id)}
              className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-slate-50 dark:hover:bg-[#1E2B38] text-left transition-colors"
            >
              <span
                className={`w-9 h-9 rounded-full ${row.bg} text-white flex items-center justify-center shrink-0 shadow-xs`}
              >
                <Icon className="w-4.5 h-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-semibold text-slate-900 dark:text-white truncate">
                  {row.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {row.subtitle}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Sarigram Premium, Business, Stars & FAQ */}
      {!settingsQuery.trim() && (
        <div className="rounded-2xl bg-white dark:bg-[#17212B] border border-slate-200/80 dark:border-white/5 overflow-hidden divide-y divide-slate-100 dark:divide-white/5 shadow-xs">
          <button
            type="button"
            onClick={() => onOpenPlus('premium')}
            className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-slate-50 dark:hover:bg-[#1E2B38] text-left transition-colors"
          >
            <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366F1] to-[#A855F7] text-white flex items-center justify-center shrink-0">
              <Crown className="w-4.5 h-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14.5px] font-semibold text-slate-900 dark:text-white">
                {t.sarigramPremium}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {settings.premiumActive ? 'Active subscription' : 'Badges, boosts & fast downloads'}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => onOpenPlus('business')}
            className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-slate-50 dark:hover:bg-[#1E2B38] text-left transition-colors"
          >
            <span className="w-9 h-9 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shrink-0">
              <Briefcase className="w-4.5 h-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14.5px] font-semibold text-slate-900 dark:text-white">
                {t.sarigramBusiness}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Hours, greetings & quick replies
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => onOpenPlus('gift')}
            className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-slate-50 dark:hover:bg-[#1E2B38] text-left transition-colors"
          >
            <span className="w-9 h-9 rounded-full bg-[#EC4899] text-white flex items-center justify-center shrink-0">
              <Gift className="w-4.5 h-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14.5px] font-semibold text-slate-900 dark:text-white">
                {t.starsAndGifts}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {settings.starBalance ?? 250} Stars available
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => onOpenHelp('faq')}
            className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-slate-50 dark:hover:bg-[#1E2B38] text-left transition-colors"
          >
            <span className="w-9 h-9 rounded-full bg-slate-500 text-white flex items-center justify-center shrink-0">
              <HelpCircle className="w-4.5 h-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14.5px] font-semibold text-slate-900 dark:text-white">
                {t.faqAndPolicy}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Features, Terms & Privacy Policy
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>
      )}

      {/* Developer Attribution */}
      <div className="pt-1 pb-2 text-center">
        <p className="text-xs font-bold italic text-red-600 dark:text-red-400">
          {t.developedBy}
        </p>
      </div>
    </div>
  );
}

interface TelegramProfileViewProps {
  currentUser: UserProfile;
  chats: ChatThread[];
  language: string;
  brandPreset?: AppConfig['brandPreset'];
  onUpdateProfile: (profile: UserProfile) => void;
  onEditProfile: () => void;
  onOpenChat: (chatId: string) => void;
  onOpenSavedMessages: () => void;
  onOpenBrandKit: () => void;
}

export function TelegramProfileView({
  currentUser,
  chats,
  language,
  brandPreset,
  onUpdateProfile,
  onEditProfile,
  onOpenChat,
  onOpenSavedMessages,
  onOpenBrandKit,
}: TelegramProfileViewProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const photoRef = useRef<HTMLInputElement | null>(null);
  const t = getTranslations(language);
  const brandGrad = getBrandGradient(brandPreset);
  const fullName = `${currentUser.firstName} ${currentUser.lastName}`.trim();

  const personalChannel = useMemo(
    () =>
      chats.find((c) => c.id === currentUser.personalChannelId) ||
      (currentUser.personalChannelTitle
        ? {
            id: currentUser.personalChannelId || '',
            title: currentUser.personalChannelTitle,
            username: currentUser.personalChannelUsername,
          }
        : null),
    [chats, currentUser]
  );

  const handlePhotoUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateProfile({ ...currentUser, avatarUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 pt-4 pb-24 space-y-3.5 bg-[#F2F4F8] dark:bg-[#0E1621]">
      {/* Profile Hero */}
      <div className="rounded-2xl bg-white dark:bg-[#17212B] border border-slate-200/80 dark:border-white/5 p-5 flex flex-col items-center text-center shadow-xs">
        <div className="relative">
          <Avatar
            name={fullName}
            color={currentUser.avatarColor}
            imageUrl={currentUser.avatarUrl}
            size="xl"
          />
          <button
            type="button"
            onClick={() => photoRef.current?.click()}
            aria-label="Change profile photo"
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#2AABEE] text-white flex items-center justify-center shadow ring-2 ring-white dark:ring-[#17212B]"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
          />
        </div>

        <h2 className="mt-3 font-display font-bold text-xl text-slate-900 dark:text-white">
          {fullName}
        </h2>
        <p className="text-xs text-[#2AABEE] font-medium mt-0.5">{t.online}</p>

        <div className="flex items-center gap-2 mt-4">
          <button
            type="button"
            onClick={onEditProfile}
            className={`px-4 py-2 rounded-full bg-gradient-to-r ${brandGrad} text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:opacity-95`}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
          <button
            type="button"
            onClick={onOpenSavedMessages}
            className="px-4 py-2 rounded-full bg-slate-100 dark:bg-[#232E3C] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-200/80 dark:hover:bg-[#2B3848]"
          >
            <Bookmark className="w-3.5 h-3.5 text-[#2AABEE]" />
            <span>{t.savedMessages}</span>
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-2xl bg-white dark:bg-[#17212B] border border-slate-200/80 dark:border-white/5 overflow-hidden divide-y divide-slate-100 dark:divide-white/5 shadow-xs">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-900 dark:text-white font-mono tabular-nums">
              {currentUser.phone || 'Not linked'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Mobile</div>
          </div>
          <Phone className="w-4 h-4 text-[#2AABEE] shrink-0" />
        </div>

        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(`https://sarigram.app/@${currentUser.username}`).catch(() => {});
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 1600);
          }}
          className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-[#1E2B38] text-left transition-colors"
        >
          <div className="min-w-0">
            <div className="text-sm font-medium text-[#2AABEE] font-mono truncate">
              @{currentUser.username}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {copiedLink ? 'Link copied!' : 'Username · Tap to copy link'}
            </div>
          </div>
          {copiedLink ? (
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <Copy className="w-4 h-4 text-slate-400 shrink-0" />
          )}
        </button>

        <div className="px-4 py-3">
          <div className="text-sm text-slate-900 dark:text-slate-100">
            {currentUser.bio || 'No bio added yet.'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Bio</div>
        </div>

        <button
          type="button"
          onClick={onEditProfile}
          className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-[#1E2B38] text-left transition-colors"
        >
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white tabular-nums">
              {currentUser.birthdate
                ? new Date(`${currentUser.birthdate}T00:00:00`).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Add Birthdate'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Date of birth</div>
          </div>
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => {
            if (personalChannel?.id && chats.some((c) => c.id === personalChannel.id)) {
              onOpenChat(personalChannel.id);
            } else {
              onEditProfile();
            }
          }}
          className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-[#1E2B38] text-left transition-colors"
        >
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {personalChannel
                ? `${personalChannel.title}${personalChannel.username ? ` (@${personalChannel.username})` : ''}`
                : 'Add Personal Channel'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Personal Channel</div>
          </div>
          <Megaphone className="w-4 h-4 text-[#2AABEE] shrink-0" />
        </button>
      </div>

      {/* Brand Kit & Splash Preview Shortcut */}
      <button
        type="button"
        onClick={onOpenBrandKit}
        className="w-full rounded-2xl bg-white dark:bg-[#17212B] border border-slate-200/80 dark:border-white/5 px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-[#1E2B38] text-left shadow-xs transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`w-9 h-9 rounded-full bg-gradient-to-br ${brandGrad} text-white flex items-center justify-center shrink-0`}>
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              App Icon &amp; Splash Branding
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Preview Sarigram branding &amp; profile badge
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      <div className="pt-1 pb-2 text-center">
        <p className="text-xs font-bold italic text-red-600 dark:text-red-400">
          {t.developedBy}
        </p>
      </div>
    </div>
  );
}
