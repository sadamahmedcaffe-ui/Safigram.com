import { useEffect, useMemo, useState } from 'react';
import {
  BatteryCharging,
  Bell,
  Bot,
  Laptop,
  Megaphone,
  MonitorSmartphone,
  PhoneCall,
  Plus,
  QrCode,
  RefreshCw,
  Smartphone,
  Sparkles,
  Trash2,
  Volume2,
  Zap,
} from 'lucide-react';
import { playNotificationChime } from '../utils/formatters';
import type {
  AppSettings,
  ChatAutomationRule,
  ConnectedDeviceItem,
  PowerSavingMode,
  UserProfile,
} from '../types/sarigram';

function PanelToggleRow({
  label,
  subtitle,
  checked,
  onChange,
}: {
  label: string;
  subtitle?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-100/70 dark:hover:bg-[#1E2B38] transition-colors"
    >
      <div className="min-w-0">
        <div className="font-medium text-sm">{label}</div>
        {subtitle && (
          <div className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</div>
        )}
      </div>
      <div
        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors shrink-0 ${
          checked ? 'bg-[#5B5CE6]' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <div
          className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-4.5' : 'translate-x-0'
          }`}
        />
      </div>
    </button>
  );
}

export function NotificationsSettingsPanel({
  settings,
  unreadCount,
  onUpdateSettings,
  onToggleNotifications,
}: {
  settings: AppSettings;
  unreadCount: number;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onToggleNotifications: (next: boolean) => void;
}) {
  return (
    <div className="space-y-4 text-sm">
      {/* Notifications for chats */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] overflow-hidden divide-y divide-slate-200/80 dark:divide-[#242F3D]">
        <div className="px-4 py-2.5 text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA]">
          Notifications for Chats
        </div>
        <PanelToggleRow
          label="Desktop & Toast Notifications"
          subtitle="Show pop-up notifications when messages arrive"
          checked={settings.notificationsEnabled}
          onChange={onToggleNotifications}
        />
        <PanelToggleRow
          label="Private Chats"
          subtitle="Direct 1-on-1 message alerts"
          checked={settings.notifyPrivateChats !== false}
          onChange={(v) => onUpdateSettings({ notifyPrivateChats: v })}
        />
        <PanelToggleRow
          label="Groups"
          subtitle="Group conversation alerts"
          checked={settings.notifyGroups !== false}
          onChange={(v) => onUpdateSettings({ notifyGroups: v })}
        />
        <PanelToggleRow
          label="Channels"
          subtitle="Broadcast channel post alerts"
          checked={settings.notifyChannels !== false}
          onChange={(v) => onUpdateSettings({ notifyChannels: v })}
        />
      </div>

      {/* Sound & Calls */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] overflow-hidden divide-y divide-slate-200/80 dark:divide-[#242F3D]">
        <div className="px-4 py-2.5 text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA] flex items-center justify-between">
          <span>Sounds &amp; Calls</span>
          <button
            type="button"
            onClick={() => playNotificationChime()}
            className="text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA] hover:underline flex items-center gap-1"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Preview Sound</span>
          </button>
        </div>

        <PanelToggleRow
          label="Message Sound Effects"
          checked={settings.soundEnabled}
          onChange={(v) => onUpdateSettings({ soundEnabled: v })}
        />
        <PanelToggleRow
          label="Incoming Call Notifications"
          subtitle="Ring and show incoming audio/video call overlay"
          checked={settings.callNotifications !== false}
          onChange={(v) => onUpdateSettings({ callNotifications: v })}
        />

        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <PhoneCall className="w-4 h-4 text-[#5B5CE6] dark:text-[#60A5FA] shrink-0" />
            <span className="font-medium">Call Ringtone</span>
          </div>
          <select
            aria-label="Call Ringtone"
            value={settings.callRingtone || 'default'}
            onChange={(e) => {
              const val = e.target.value as AppSettings['callRingtone'];
              onUpdateSettings({ callRingtone: val });
              if (val !== 'silent') playNotificationChime();
            }}
            className="h-8 px-2.5 rounded-lg bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA] focus:outline-none"
          >
            <option value="default">Sarigram Default</option>
            <option value="chime">Crystal Chime</option>
            <option value="pulse">Soft Pulse</option>
            <option value="silent">Silent</option>
          </select>
        </div>

        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Bell className="w-4 h-4 text-[#5B5CE6] dark:text-[#60A5FA] shrink-0" />
            <span className="font-medium">Vibrate on Calls</span>
          </div>
          <select
            aria-label="Vibrate on Calls"
            value={settings.callVibrate || 'default'}
            onChange={(e) =>
              onUpdateSettings({ callVibrate: e.target.value as AppSettings['callVibrate'] })
            }
            className="h-8 px-2.5 rounded-lg bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA] focus:outline-none"
          >
            <option value="default">Default</option>
            <option value="short">Only When Silent</option>
            <option value="long">Long Pulse</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>

      {/* Badge Counter */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] overflow-hidden divide-y divide-slate-200/80 dark:divide-[#242F3D]">
        <div className="px-4 py-2.5 text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA] flex items-center justify-between">
          <span>Badge Counter</span>
          <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
            Current unread: {unreadCount}
          </span>
        </div>

        <PanelToggleRow
          label="Show Badge Icon"
          subtitle="Display unread count in browser tab & app icon"
          checked={settings.badgeEnabled !== false}
          onChange={(v) => onUpdateSettings({ badgeEnabled: v })}
        />
        <PanelToggleRow
          label="Include Muted Chats"
          checked={Boolean(settings.badgeIncludeMuted)}
          onChange={(v) => onUpdateSettings({ badgeIncludeMuted: v })}
        />
        <PanelToggleRow
          label="Count Unread Messages"
          subtitle="Count total messages instead of unread chat threads"
          checked={settings.badgeCountMessages !== false}
          onChange={(v) => onUpdateSettings({ badgeCountMessages: v })}
        />
      </div>

      {/* Composer */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] overflow-hidden">
        <PanelToggleRow
          label="Press Enter to Send Message"
          checked={settings.enterToSend}
          onChange={(v) => onUpdateSettings({ enterToSend: v })}
        />
      </div>
    </div>
  );
}

const DEFAULT_OTHER_DEVICES: ConnectedDeviceItem[] = [
  {
    id: 'dev-android-1',
    deviceName: 'Sarigram Android',
    platform: 'Android 15 · Mobile App',
    location: 'Addis Ababa · Active 18m ago',
    lastActive: '18m ago',
  },
  {
    id: 'dev-desktop-1',
    deviceName: 'Sarigram Desktop Web',
    platform: 'Chrome · Cloud Sync',
    location: 'Session active · Yesterday',
    lastActive: 'Yesterday',
  },
];

export function DevicesSettingsPanel({
  settings,
  onUpdateSettings,
}: {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
}) {
  const [showQrLink, setShowQrLink] = useState(false);
  const [linkCode, setLinkCode] = useState(() =>
    Math.floor(100000 + Math.random() * 900000).toString()
  );
  const [notice, setNotice] = useState('');

  const thisDeviceLabel = useMemo(() => {
    if (typeof navigator === 'undefined') return 'Sarigram Web Client';
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) return 'Android Browser · Sarigram PWA';
    if (/iPhone|iPad/i.test(ua)) return 'iOS Safari · Sarigram Web';
    if (/Mac/i.test(ua)) return 'macOS Web · Sarigram Cloud';
    if (/Win/i.test(ua)) return 'Windows Web · Sarigram Cloud';
    return 'Linux Web · Sarigram Cloud';
  }, []);

  const otherDevices = settings.connectedDevices ?? DEFAULT_OTHER_DEVICES;

  const terminateDevice = (id: string) => {
    const next = otherDevices.filter((d) => d.id !== id);
    onUpdateSettings({ connectedDevices: next });
    setNotice('Device session terminated.');
    setTimeout(() => setNotice(''), 2200);
  };

  const terminateAllOthers = () => {
    onUpdateSettings({ connectedDevices: [] });
    setNotice('All other connected devices terminated.');
    setTimeout(() => setNotice(''), 2400);
  };

  return (
    <div className="space-y-4 text-sm">
      {notice && (
        <div className="px-3.5 py-2 rounded-xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          {notice}
        </div>
      )}

      {/* Link Desktop / Android Device */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#5B5CE6]/12 text-[#5B5CE6] dark:text-[#60A5FA] flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-display font-semibold text-sm">
                Manage Connected Devices
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Link Sarigram Android, Desktop, or Tablet via pairing code
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowQrLink((p) => !p)}
            className="h-9 px-3.5 rounded-xl bg-[#5B5CE6] hover:bg-[#4F46E5] text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
          >
            {showQrLink ? 'Hide Pairing' : 'Link Device'}
          </button>
        </div>

        {showQrLink && (
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#17212B] border border-slate-200 dark:border-[#2C3B4B] flex flex-col sm:flex-row items-center gap-4">
            {/* Crisp deterministic QR pattern */}
            <svg
              viewBox="0 0 100 100"
              className="w-24 h-24 shrink-0 rounded-lg bg-white p-1.5 border border-slate-200"
              aria-label="Sarigram device pairing QR code"
            >
              <rect x="6" y="6" width="24" height="24" rx="3" fill="none" stroke="#022A8E" strokeWidth="5" />
              <rect x="13" y="13" width="10" height="10" fill="#022A8E" />
              <rect x="70" y="6" width="24" height="24" rx="3" fill="none" stroke="#022A8E" strokeWidth="5" />
              <rect x="77" y="13" width="10" height="10" fill="#022A8E" />
              <rect x="6" y="70" width="24" height="24" rx="3" fill="none" stroke="#022A8E" strokeWidth="5" />
              <rect x="13" y="77" width="10" height="10" fill="#022A8E" />
              <path
                d="M40 10h8v8h-8zM54 10h8v14h-8zM40 24h10v10H40zM10 40h14v8H10zM32 40h18v10H32zM58 40h12v8H58zM78 40h14v12H78zM40 58h14v14H40zM62 58h10v10H62zM78 62h14v10H78zM44 78h16v14H44zM68 78h22v14H68z"
                fill="#022A8E"
              />
            </svg>
            <div className="min-w-0 flex-1 text-center sm:text-left space-y-1.5">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Scan QR or enter pairing code on your new device
              </div>
              <div className="font-mono font-bold text-lg tracking-[0.25em] text-[#022A8E] dark:text-[#60A5FA] tabular-nums">
                {linkCode}
              </div>
              <button
                type="button"
                onClick={() =>
                  setLinkCode(Math.floor(100000 + Math.random() * 900000).toString())
                }
                className="text-xs font-semibold text-[#5B5CE6] dark:text-[#A78BFA] hover:underline inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Pairing Code</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* This Device */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] overflow-hidden divide-y divide-slate-200/80 dark:divide-[#242F3D]">
        <div className="px-4 py-2.5 text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA]">
          This Device
        </div>
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Laptop className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <div className="font-semibold truncate">{thisDeviceLabel}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Sarigram Web · Online now
              </div>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0">
            Current
          </span>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] overflow-hidden divide-y divide-slate-200/80 dark:divide-[#242F3D]">
        <div className="px-4 py-2.5 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA]">
            Active Sessions ({otherDevices.length})
          </span>
          {otherDevices.length > 0 && (
            <button
              type="button"
              onClick={terminateAllOthers}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline whitespace-nowrap"
            >
              Terminate All Other Sessions
            </button>
          )}
        </div>

        {otherDevices.length === 0 ? (
          <div className="px-4 py-5 text-xs text-slate-500 dark:text-slate-400 text-center">
            Only this device is currently connected to your Sarigram account.
          </div>
        ) : (
          otherDevices.map((dev) => (
            <div key={dev.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {dev.deviceName.toLowerCase().includes('android') ? (
                  <Smartphone className="w-4.5 h-4.5 text-[#5B5CE6] dark:text-[#60A5FA] shrink-0" />
                ) : (
                  <MonitorSmartphone className="w-4.5 h-4.5 text-[#5B5CE6] dark:text-[#60A5FA] shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="font-medium truncate">{dev.deviceName}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {dev.platform} · {dev.location}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => terminateDevice(dev.id)}
                aria-label={`Terminate ${dev.deviceName}`}
                className="h-8 px-2.5 rounded-lg bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] hover:border-rose-400 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Terminate</span>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Auto-Terminate Inactive Sessions */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium">Automatically Terminate Old Sessions</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">If inactive for</div>
        </div>
        <select
          aria-label="Automatically terminate inactive sessions"
          value={settings.autoTerminatePeriod || '6months'}
          onChange={(e) =>
            onUpdateSettings({
              autoTerminatePeriod: e.target.value as AppSettings['autoTerminatePeriod'],
            })
          }
          className="h-8 px-2.5 rounded-lg bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA] focus:outline-none"
        >
          <option value="1week">1 Week</option>
          <option value="1month">1 Month</option>
          <option value="3months">3 Months</option>
          <option value="6months">6 Months</option>
          <option value="1year">1 Year</option>
        </select>
      </div>
    </div>
  );
}

export function PowerSavingSettingsPanel({
  settings,
  onUpdateSettings,
}: {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
}) {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [charging, setCharging] = useState<boolean>(false);

  useEffect(() => {
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<{ level: number; charging: boolean }>;
    };
    if (typeof nav.getBattery === 'function') {
      nav
        .getBattery()
        .then((bat) => {
          setBatteryLevel(Math.round(bat.level * 100));
          setCharging(bat.charging);
        })
        .catch(() => {});
    }
  }, []);

  const mode: PowerSavingMode = settings.powerSavingMode || 'auto';
  const threshold = settings.powerSavingThreshold ?? 20;

  const setMode = (nextMode: PowerSavingMode) => {
    if (nextMode === 'always') {
      onUpdateSettings({
        powerSavingMode: 'always',
        powerAutoplayVideos: false,
        powerAutoplayGifs: false,
        powerAnimatedEmoji: false,
        powerAnimations: false,
        powerBackgroundSync: false,
      });
    } else if (nextMode === 'off') {
      onUpdateSettings({
        powerSavingMode: 'off',
        powerAutoplayVideos: true,
        powerAutoplayGifs: true,
        powerAnimatedEmoji: true,
        powerAnimations: true,
        powerBackgroundSync: true,
      });
    } else {
      onUpdateSettings({ powerSavingMode: 'auto' });
    }
  };

  return (
    <div className="space-y-4 text-sm">
      {/* Telegram-style Power Saving Hero Header Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-display font-semibold text-sm">Power Saving Mode</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Reduce battery consumption and disable resource-heavy animations
              </div>
            </div>
          </div>
          {batteryLevel !== null && (
            <div className="flex items-center gap-1 text-xs font-mono tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">
              <BatteryCharging className="w-4 h-4" />
              <span>
                {batteryLevel}%{charging ? ' · Charging' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Mode Segmented Selector */}
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: 'off', label: 'Disabled' },
              { id: 'auto', label: `Below ${threshold}%` },
              { id: 'always', label: 'Always On' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`py-2 px-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors tabular-nums ${
                mode === m.id
                  ? 'border-[#5B5CE6] bg-[#5B5CE6]/10 text-[#5B5CE6] dark:text-[#60A5FA]'
                  : 'border-slate-200 dark:border-[#2C3B4B] bg-white dark:bg-[#1E2B38]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === 'auto' && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                Activate automatically below battery level
              </span>
              <span className="font-mono tabular-nums font-bold text-[#5B5CE6] dark:text-[#60A5FA]">
                {threshold}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={70}
              step={5}
              value={threshold}
              onChange={(e) =>
                onUpdateSettings({ powerSavingThreshold: Number(e.target.value) })
              }
              aria-label="Power saving battery threshold"
              className="w-full accent-[#5B5CE6]"
            />
          </div>
        )}
      </div>

      {/* Power Saving Options */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] overflow-hidden divide-y divide-slate-200/80 dark:divide-[#242F3D]">
        <div className="px-4 py-2.5 text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA]">
          Animations &amp; Autoplay Options
        </div>

        <PanelToggleRow
          label="Autoplay Videos"
          checked={settings.powerAutoplayVideos !== false}
          onChange={(v) => onUpdateSettings({ powerAutoplayVideos: v })}
        />
        <PanelToggleRow
          label="Autoplay GIFs & Stickers"
          checked={settings.powerAutoplayGifs !== false}
          onChange={(v) => onUpdateSettings({ powerAutoplayGifs: v })}
        />
        <PanelToggleRow
          label="Animated Emoji & Reactions"
          checked={settings.powerAnimatedEmoji !== false}
          onChange={(v) => onUpdateSettings({ powerAnimatedEmoji: v })}
        />
        <PanelToggleRow
          label="Animations in Chats & UI"
          subtitle="Disable transitions across drawers, messages, and modals when off"
          checked={settings.powerAnimations !== false}
          onChange={(v) => onUpdateSettings({ powerAnimations: v })}
        />
        <PanelToggleRow
          label="Background Media Preload"
          checked={settings.powerBackgroundSync !== false}
          onChange={(v) => onUpdateSettings({ powerBackgroundSync: v })}
        />
      </div>
    </div>
  );
}

const DEFAULT_AUTOMATION_RULES: ChatAutomationRule[] = [
  {
    id: 'rule-hello',
    keyword: 'hello',
    replyText: 'Hello! Thanks for messaging me on Sarigram. How can I help you?',
    enabled: true,
  },
  {
    id: 'rule-hours',
    keyword: 'hours',
    replyText: 'Our team is available Monday–Friday, 09:00–18:00.',
    enabled: true,
  },
];

export function ChatAutomationPanel({
  currentUser,
  settings,
  onUpdateSettings,
  onOpenPersonalChannel,
}: {
  currentUser: UserProfile;
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onOpenPersonalChannel?: () => void;
}) {
  const [keyword, setKeyword] = useState('');
  const [replyText, setReplyText] = useState('');
  const [testInput, setTestInput] = useState('');
  const [notice, setNotice] = useState('');

  const rules = settings.automationRules ?? DEFAULT_AUTOMATION_RULES;
  const masterEnabled = Boolean(settings.chatAutomationEnabled);

  const handleAddRule = () => {
    const cleanKey = keyword.trim().toLowerCase();
    const cleanReply = replyText.trim();
    if (!cleanKey || !cleanReply) return;
    const nextRule: ChatAutomationRule = {
      id: `rule-${Date.now()}`,
      keyword: cleanKey,
      replyText: cleanReply,
      enabled: true,
    };
    onUpdateSettings({
      chatAutomationEnabled: true,
      automationRules: [...rules, nextRule],
    });
    setKeyword('');
    setReplyText('');
    setNotice(`Added auto-reply trigger for "${cleanKey}".`);
    setTimeout(() => setNotice(''), 2200);
  };

  const matchedPreview = useMemo(() => {
    const q = testInput.trim().toLowerCase();
    if (!q) return null;
    const matched = rules.find((r) => r.enabled && q.includes(r.keyword.toLowerCase()));
    if (matched) return { source: `Keyword "${matched.keyword}"`, text: matched.replyText };
    if (settings.autoAwayEnabled) {
      return {
        source: 'Away Auto-Reply',
        text:
          settings.businessAway ||
          'We are currently away and will reply as soon as we return.',
      };
    }
    if (settings.autoGreetingEnabled) {
      return {
        source: 'Welcome Auto-Greeting',
        text:
          settings.businessGreeting ||
          'Welcome! How can our Sarigram Business team help you today?',
      };
    }
    return null;
  }, [
    testInput,
    rules,
    settings.autoAwayEnabled,
    settings.autoGreetingEnabled,
    settings.businessAway,
    settings.businessGreeting,
  ]);

  return (
    <div className="space-y-4 text-sm">
      {notice && (
        <div className="px-3.5 py-2 rounded-xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          {notice}
        </div>
      )}

      {/* Master Chat Automation Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] overflow-hidden divide-y divide-slate-200/80 dark:divide-[#242F3D]">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5B5CE6]/12 text-[#5B5CE6] dark:text-[#60A5FA] flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display font-semibold text-sm">Chat Automation</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Automatic greetings, away messages, and keyword auto-responders for DMs
            </div>
          </div>
        </div>
        <PanelToggleRow
          label="Enable Chat Automation"
          subtitle="Automatically respond to incoming private messages based on active rules"
          checked={masterEnabled}
          onChange={(v) => onUpdateSettings({ chatAutomationEnabled: v })}
        />
        <PanelToggleRow
          label="Welcome Auto-Greeting"
          subtitle="Send a welcome greeting when contacts message you"
          checked={Boolean(settings.autoGreetingEnabled)}
          onChange={(v) =>
            onUpdateSettings({
              autoGreetingEnabled: v,
              chatAutomationEnabled: v ? true : settings.chatAutomationEnabled,
            })
          }
        />
        <PanelToggleRow
          label="Away Mode Auto-Reply"
          subtitle="Reply automatically when you are away or offline"
          checked={Boolean(settings.autoAwayEnabled)}
          onChange={(v) =>
            onUpdateSettings({
              autoAwayEnabled: v,
              chatAutomationEnabled: v ? true : settings.chatAutomationEnabled,
            })
          }
        />
      </div>

      {/* Linked Personal Channel Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Megaphone className="w-4.5 h-4.5 text-[#5B5CE6] dark:text-[#60A5FA] shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Personal Channel Link
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {currentUser.personalChannelTitle
                ? `${currentUser.personalChannelTitle} (@${currentUser.personalChannelUsername || 'channel'})`
                : 'No personal channel linked yet'}
            </div>
          </div>
        </div>
        {onOpenPersonalChannel && (
          <button
            type="button"
            onClick={onOpenPersonalChannel}
            className="h-8 px-3 rounded-lg bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA] whitespace-nowrap shrink-0"
          >
            {currentUser.personalChannelId ? 'Manage Channel' : 'Link Channel'}
          </button>
        )}
      </div>

      {/* Greeting & Away Templates */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] p-4 space-y-3">
        <div className="text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA]">
          Automated Templates
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Greeting Message
          </label>
          <textarea
            rows={2}
            value={
              settings.businessGreeting ??
              'Welcome! How can our Sarigram Business team help you today?'
            }
            onChange={(e) => onUpdateSettings({ businessGreeting: e.target.value })}
            className="w-full p-2.5 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs focus:outline-none focus:ring-2 focus:ring-[#5B5CE6] resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Away Reply Message
          </label>
          <textarea
            rows={2}
            value={
              settings.businessAway ??
              'We are currently away and will reply as soon as we return.'
            }
            onChange={(e) => onUpdateSettings({ businessAway: e.target.value })}
            className="w-full p-2.5 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs focus:outline-none focus:ring-2 focus:ring-[#5B5CE6] resize-none"
          />
        </div>
      </div>

      {/* Keyword Auto-Reply Rules */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA]">
            Keyword Auto-Reply Rules ({rules.length})
          </span>
        </div>

        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="p-3 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200/80 dark:border-[#2C3B4B] flex items-start justify-between gap-3"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#5B5CE6] dark:text-[#60A5FA]">
                    when text includes &ldquo;{rule.keyword}&rdquo;
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {rule.replyText}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      automationRules: rules.map((r) =>
                        r.id === rule.id ? { ...r, enabled: !r.enabled } : r
                      ),
                    })
                  }
                  aria-label={`Toggle rule ${rule.keyword}`}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                    rule.enabled ? 'bg-[#5B5CE6]' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                      rule.enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      automationRules: rules.filter((r) => r.id !== rule.id),
                    })
                  }
                  aria-label={`Delete rule ${rule.keyword}`}
                  className="text-rose-500 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Keyword (e.g. price)"
            className="h-9 px-3 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
          />
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Automated reply..."
            className="sm:col-span-2 h-9 px-3 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
          />
        </div>
        <button
          type="button"
          onClick={handleAddRule}
          disabled={!keyword.trim() || !replyText.trim()}
          className="w-full h-9 rounded-xl bg-[#5B5CE6] disabled:opacity-45 hover:bg-[#4F46E5] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Automation Rule</span>
        </button>
      </div>

      {/* Live Test Simulator */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] p-4 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Test Automation Match</span>
        </div>
        <input
          type="text"
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          placeholder='Type a sample incoming message (e.g. "hello, what are your hours?")'
          className="w-full h-9 px-3 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
        />
        {testInput.trim() && (
          <div className="p-2.5 rounded-xl bg-white dark:bg-[#1E2B38] text-xs">
            {matchedPreview ? (
              <div>
                <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Matched: {matchedPreview.source}
                </div>
                <div className="text-slate-700 dark:text-slate-200 mt-0.5">
                  {matchedPreview.text}
                </div>
              </div>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">
                No keyword or away/greeting rule matched this sample message.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
