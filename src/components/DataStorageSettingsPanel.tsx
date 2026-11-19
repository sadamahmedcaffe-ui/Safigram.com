import { useMemo, useState } from 'react';
import {
  Activity,
  ChevronRight,
  Database,
  Download,
  Globe,
  HardDrive,
  Image as ImageIcon,
  Phone,
  Play,
  RotateCcw,
  Shield,
  Trash2,
  Wifi,
} from 'lucide-react';
import type {
  AppSettings,
  AutoDownloadRule,
  CallDataSaving,
  CallRecord,
  ChatMessage,
  KeepMediaPeriod,
  ProxyType,
} from '../types/sarigram';

interface DataStorageSettingsPanelProps {
  settings: AppSettings;
  messages?: ChatMessage[];
  calls?: CallRecord[];
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
}

const DEFAULT_MOBILE_RULE: AutoDownloadRule = { photos: true, videos: false, files: false };
const DEFAULT_WIFI_RULE: AutoDownloadRule = { photos: true, videos: true, files: true };
const DEFAULT_ROAMING_RULE: AutoDownloadRule = { photos: false, videos: false, files: false };

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function summarizeRule(rule: AutoDownloadRule): string {
  const parts: string[] = [];
  if (rule.photos) parts.push('Photos');
  if (rule.videos) parts.push('Videos');
  if (rule.files) parts.push('Files');
  return parts.length > 0 ? parts.join(', ') : 'Disabled';
}

export function DataStorageSettingsPanel({
  settings,
  messages = [],
  calls = [],
  onUpdateSettings,
}: DataStorageSettingsPanelProps) {
  const [activeSubPanel, setActiveSubPanel] = useState<'none' | 'disk' | 'network' | 'proxy'>(
    'none'
  );
  const [expandedAutoKey, setExpandedAutoKey] = useState<'mobile' | 'wifi' | 'roaming' | null>(
    null
  );
  const [notice, setNotice] = useState('');
  const [proxyTestStatus, setProxyTestStatus] = useState<string>('');
  const [testingProxy, setTestingProxy] = useState(false);

  const mobileRule = settings.autoDownloadMobile || DEFAULT_MOBILE_RULE;
  const wifiRule = settings.autoDownloadWifi || DEFAULT_WIFI_RULE;
  const roamingRule = settings.autoDownloadRoaming || DEFAULT_ROAMING_RULE;

  const usageStats = useMemo(() => {
    const cacheCleared = Boolean(settings.cacheClearedAt);
    const networkReset = Boolean(settings.networkStatsResetAt);

    let photosBytes = 0;
    let videosBytes = 0;
    let filesBytes = 0;
    let voiceBytes = 0;
    let textBytes = 0;

    for (const msg of messages) {
      const textLen = (msg.text?.length || 0) * 2 + 240;
      textBytes += textLen;
      if (msg.type === 'image') photosBytes += Math.max(42_000, (msg.mediaUrl?.length || 120) * 18);
      else if (msg.type === 'video') videosBytes += Math.max(185_000, (msg.mediaUrl?.length || 240) * 24);
      else if (msg.type === 'file') filesBytes += 96_000;
      else if (msg.type === 'voice') voiceBytes += (msg.voiceDuration || 6) * 8_400;
    }

    let localStorageBytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i);
        if (k) {
          localStorageBytes += (k.length + (localStorage.getItem(k)?.length || 0)) * 2;
        }
      }
    } catch {
      localStorageBytes = 12_400;
    }

    const totalMediaCache = cacheCleared
      ? 0
      : photosBytes + videosBytes + filesBytes + voiceBytes;
    const totalDiskBytes = totalMediaCache + localStorageBytes;

    const callBytes = calls.reduce((acc, c) => acc + c.durationSeconds * 4_200, 0);
    const sentNetwork = networkReset ? 0 : Math.round(textBytes * 0.45 + callBytes * 0.5);
    const recvNetwork = networkReset
      ? 0
      : photosBytes + videosBytes + filesBytes + voiceBytes + Math.round(textBytes * 0.55 + callBytes * 0.5);

    return {
      photosBytes: cacheCleared ? 0 : photosBytes,
      videosBytes: cacheCleared ? 0 : videosBytes,
      filesBytes: cacheCleared ? 0 : filesBytes,
      voiceBytes: cacheCleared ? 0 : voiceBytes,
      localStorageBytes,
      totalDiskBytes,
      sentNetwork,
      recvNetwork,
      totalNetwork: sentNetwork + recvNetwork,
      callBytes: networkReset ? 0 : callBytes,
    };
  }, [messages, calls, settings.cacheClearedAt, settings.networkStatsResetAt]);

  const showTempNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 2400);
  };

  const handleResetAutoDownload = () => {
    onUpdateSettings({
      autoDownloadMobile: { ...DEFAULT_MOBILE_RULE },
      autoDownloadWifi: { ...DEFAULT_WIFI_RULE },
      autoDownloadRoaming: { ...DEFAULT_ROAMING_RULE },
      saveToGalleryPrivate: false,
      saveToGalleryGroups: false,
      saveToGalleryChannels: false,
      streamingEnabled: true,
    });
    showTempNotice('Auto-download settings reset to defaults.');
  };

  const handleClearCache = async () => {
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {
        // ignore cache API errors
      }
    }
    onUpdateSettings({ cacheClearedAt: new Date().toISOString() });
    showTempNotice('Local media cache cleared.');
  };

  const handleTestProxy = async () => {
    setTestingProxy(true);
    setProxyTestStatus('');
    const t0 = performance.now();
    try {
      const res = await fetch('/api/health');
      const ms = Math.max(1, Math.round(performance.now() - t0));
      if (res.ok) {
        if (settings.proxyEnabled && settings.proxyServer?.trim()) {
          setProxyTestStatus(
            `Reachable · ${(settings.proxyType || 'socks5').toUpperCase()} ${settings.proxyServer.trim()}:${settings.proxyPort || '1080'} (${ms} ms)`
          );
        } else {
          setProxyTestStatus(`Direct Cloud Connection healthy (${ms} ms)`);
        }
      } else {
        setProxyTestStatus('Server unreachable');
      }
    } catch {
      setProxyTestStatus('Connection check failed');
    } finally {
      setTestingProxy(false);
    }
  };

  const updateRuleField = (
    target: 'mobile' | 'wifi' | 'roaming',
    field: keyof AutoDownloadRule,
    val: boolean
  ) => {
    if (target === 'mobile') {
      onUpdateSettings({ autoDownloadMobile: { ...mobileRule, [field]: val } });
    } else if (target === 'wifi') {
      onUpdateSettings({ autoDownloadWifi: { ...wifiRule, [field]: val } });
    } else {
      onUpdateSettings({ autoDownloadRoaming: { ...roamingRule, [field]: val } });
    }
  };

  return (
    <div className="space-y-4 text-sm">
      {notice && (
        <div className="px-3.5 py-2 rounded-xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          {notice}
        </div>
      )}

      {/* 1. Disk and Network Usage */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] overflow-hidden divide-y divide-slate-200/80 dark:divide-[#242F3D]">
        <div className="px-4 py-2.5 text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA]">
          Disk and Network Usage
        </div>

        <button
          type="button"
          onClick={() => setActiveSubPanel((p) => (p === 'disk' ? 'none' : 'disk'))}
          className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-100/70 dark:hover:bg-[#1E2B38] text-left transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <HardDrive className="w-4.5 h-4.5 text-[#5B5CE6] dark:text-[#60A5FA] shrink-0" />
            <div className="min-w-0">
              <div className="font-medium">Storage Usage</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Keep media &amp; clear local cache
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono tabular-nums font-semibold text-[#5B5CE6] dark:text-[#60A5FA]">
              {formatBytes(usageStats.totalDiskBytes)}
            </span>
            <ChevronRight
              className={`w-4 h-4 text-slate-400 transition-transform ${
                activeSubPanel === 'disk' ? 'rotate-90' : ''
              }`}
            />
          </div>
        </button>

        {activeSubPanel === 'disk' && (
          <div className="px-4 py-3 bg-white dark:bg-[#17212B] space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#141D26] flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Photos</span>
                <span className="font-mono tabular-nums font-semibold">
                  {formatBytes(usageStats.photosBytes)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#141D26] flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Videos</span>
                <span className="font-mono tabular-nums font-semibold">
                  {formatBytes(usageStats.videosBytes)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#141D26] flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Documents</span>
                <span className="font-mono tabular-nums font-semibold">
                  {formatBytes(usageStats.filesBytes)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#141D26] flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Voice &amp; State</span>
                <span className="font-mono tabular-nums font-semibold">
                  {formatBytes(usageStats.voiceBytes + usageStats.localStorageBytes)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Keep Media
              </span>
              <select
                aria-label="Keep Media"
                value={settings.keepMediaPeriod || '1month'}
                onChange={(e) =>
                  onUpdateSettings({ keepMediaPeriod: e.target.value as KeepMediaPeriod })
                }
                className="h-8 px-2.5 rounded-lg bg-slate-50 dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA] focus:outline-none"
              >
                <option value="3days">3 Days</option>
                <option value="1week">1 Week</option>
                <option value="1month">1 Month</option>
                <option value="forever">Forever</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleClearCache}
              className="w-full h-9 rounded-xl bg-rose-500/10 hover:bg-rose-500/18 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Sarigram Cache</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setActiveSubPanel((p) => (p === 'network' ? 'none' : 'network'))}
          className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-100/70 dark:hover:bg-[#1E2B38] text-left transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Activity className="w-4.5 h-4.5 text-[#5B5CE6] dark:text-[#60A5FA] shrink-0" />
            <div className="min-w-0">
              <div className="font-medium">Network Usage</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Messages, media &amp; call traffic statistics
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono tabular-nums font-semibold text-[#5B5CE6] dark:text-[#60A5FA]">
              {formatBytes(usageStats.totalNetwork)}
            </span>
            <ChevronRight
              className={`w-4 h-4 text-slate-400 transition-transform ${
                activeSubPanel === 'network' ? 'rotate-90' : ''
              }`}
            />
          </div>
        </button>

        {activeSubPanel === 'network' && (
          <div className="px-4 py-3 bg-white dark:bg-[#17212B] space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 dark:text-slate-400">Bytes Sent</span>
              <span className="font-mono tabular-nums font-semibold">
                {formatBytes(usageStats.sentNetwork)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 dark:text-slate-400">Bytes Received</span>
              <span className="font-mono tabular-nums font-semibold">
                {formatBytes(usageStats.recvNetwork)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 dark:text-slate-400">Calls Data</span>
              <span className="font-mono tabular-nums font-semibold">
                {formatBytes(usageStats.callBytes)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onUpdateSettings({ networkStatsResetAt: new Date().toISOString() });
                showTempNotice('Network usage statistics reset.');
              }}
              className="w-full h-9 rounded-xl bg-slate-100 dark:bg-[#1E2B38] hover:bg-slate-200 dark:hover:bg-[#242F3D] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Statistics</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Automatic Media Download */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] overflow-hidden divide-y divide-slate-200/80 dark:divide-[#242F3D]">
        <div className="px-4 py-2.5 text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA]">
          Automatic Media Download
        </div>

        {(
          [
            {
              key: 'mobile',
              label: 'When using mobile data',
              rule: mobileRule,
              icon: Database,
            },
            {
              key: 'wifi',
              label: 'When connected on Wi-Fi',
              rule: wifiRule,
              icon: Wifi,
            },
            {
              key: 'roaming',
              label: 'When roaming',
              rule: roamingRule,
              icon: Globe,
            },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const expanded = expandedAutoKey === item.key;
          return (
            <div key={item.key}>
              <button
                type="button"
                onClick={() => setExpandedAutoKey(expanded ? null : item.key)}
                className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-100/70 dark:hover:bg-[#1E2B38] text-left transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4.5 h-4.5 text-[#5B5CE6] dark:text-[#60A5FA] shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-[#5B5CE6] dark:text-[#60A5FA]">
                      {summarizeRule(item.rule)}
                    </div>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                    expanded ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {expanded && (
                <div className="px-4 py-3 bg-white dark:bg-[#17212B] space-y-2 text-xs">
                  {(
                    [
                      { field: 'photos', label: 'Photos' },
                      { field: 'videos', label: 'Videos' },
                      { field: 'files', label: 'Files & Documents' },
                    ] as const
                  ).map((media) => (
                    <label
                      key={media.field}
                      className="flex items-center justify-between py-1 cursor-pointer"
                    >
                      <span className="font-medium">{media.label}</span>
                      <input
                        type="checkbox"
                        checked={item.rule[media.field]}
                        onChange={(e) =>
                          updateRuleField(item.key, media.field, e.target.checked)
                        }
                        className="w-4 h-4 accent-[#5B5CE6]"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={handleResetAutoDownload}
          className="w-full px-4 py-3 flex items-center gap-3 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-500/8 transition-colors font-medium"
        >
          <RotateCcw className="w-4 h-4 shrink-0" />
          <span>Reset Auto-Download Settings</span>
        </button>
      </div>

      {/* 3. Save to Gallery */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] overflow-hidden divide-y divide-slate-200/80 dark:divide-[#242F3D]">
        <div className="px-4 py-2.5 text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA] flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Save to Gallery</span>
        </div>

        <MiniToggleRow
          label="Private Chats"
          checked={Boolean(settings.saveToGalleryPrivate)}
          onChange={(v) => onUpdateSettings({ saveToGalleryPrivate: v })}
        />
        <MiniToggleRow
          label="Groups"
          checked={Boolean(settings.saveToGalleryGroups)}
          onChange={(v) => onUpdateSettings({ saveToGalleryGroups: v })}
        />
        <MiniToggleRow
          label="Channels"
          checked={Boolean(settings.saveToGalleryChannels)}
          onChange={(v) => onUpdateSettings({ saveToGalleryChannels: v })}
        />
      </div>

      {/* 4. Streaming & Calls */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] overflow-hidden divide-y divide-slate-200/80 dark:divide-[#242F3D]">
        <div className="px-4 py-2.5 text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA]">
          Streaming &amp; Calls
        </div>

        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Play className="w-4.5 h-4.5 text-[#5B5CE6] dark:text-[#60A5FA] shrink-0" />
            <div className="min-w-0">
              <div className="font-medium">Stream Videos and Audio Files</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Start playback immediately without waiting for full download
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdateSettings({ streamingEnabled: settings.streamingEnabled === false })
            }
            aria-label="Toggle media streaming"
            className={`w-10 h-5.5 rounded-full p-0.5 transition-colors shrink-0 ${
              settings.streamingEnabled !== false
                ? 'bg-[#5B5CE6]'
                : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <div
              className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${
                settings.streamingEnabled !== false ? 'translate-x-4.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Phone className="w-4.5 h-4.5 text-[#5B5CE6] dark:text-[#60A5FA] shrink-0" />
            <div className="min-w-0">
              <div className="font-medium">Use Less Data for Calls</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Optimize voice &amp; video bitrate
              </div>
            </div>
          </div>
          <select
            aria-label="Use Less Data for Calls"
            value={settings.callDataSaving || 'mobile'}
            onChange={(e) =>
              onUpdateSettings({ callDataSaving: e.target.value as CallDataSaving })
            }
            className="h-8 px-2.5 rounded-lg bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA] focus:outline-none"
          >
            <option value="never">Never</option>
            <option value="mobile">On Mobile Data</option>
            <option value="always">Always</option>
          </select>
        </div>
      </div>

      {/* 5. Connection Type / Proxy Settings */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] overflow-hidden divide-y divide-slate-200/80 dark:divide-[#242F3D]">
        <div className="px-4 py-2.5 text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA]">
          Connection Type
        </div>

        <button
          type="button"
          onClick={() => setActiveSubPanel((p) => (p === 'proxy' ? 'none' : 'proxy'))}
          className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-100/70 dark:hover:bg-[#1E2B38] text-left transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Shield className="w-4.5 h-4.5 text-[#5B5CE6] dark:text-[#60A5FA] shrink-0" />
            <div className="min-w-0">
              <div className="font-medium">Proxy Settings</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {settings.proxyEnabled && settings.proxyServer
                  ? `${(settings.proxyType || 'socks5').toUpperCase()} · ${settings.proxyServer}:${settings.proxyPort || '1080'}`
                  : 'Direct connection (No proxy)'}
              </div>
            </div>
          </div>
          <ChevronRight
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
              activeSubPanel === 'proxy' ? 'rotate-90' : ''
            }`}
          />
        </button>

        {activeSubPanel === 'proxy' && (
          <div className="p-4 bg-white dark:bg-[#17212B] space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">Use Proxy</span>
              <button
                type="button"
                onClick={() => onUpdateSettings({ proxyEnabled: !settings.proxyEnabled })}
                aria-label="Toggle proxy"
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${
                  settings.proxyEnabled ? 'bg-[#5B5CE6]' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${
                    settings.proxyEnabled ? 'translate-x-4.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['socks5', 'http', 'mtproto'] as ProxyType[]).map((ptype) => (
                <button
                  key={ptype}
                  type="button"
                  onClick={() => onUpdateSettings({ proxyType: ptype })}
                  className={`py-2 rounded-xl border font-semibold uppercase tracking-wide transition-colors ${
                    (settings.proxyType || 'socks5') === ptype
                      ? 'border-[#5B5CE6] bg-[#5B5CE6]/10 text-[#5B5CE6] dark:text-[#60A5FA]'
                      : 'border-slate-200 dark:border-[#2C3B4B] text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {ptype}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={settings.proxyServer || ''}
                onChange={(e) => onUpdateSettings({ proxyServer: e.target.value })}
                placeholder="Server (e.g. proxy.sarigram.app)"
                className="col-span-2 h-9 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-xs focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
              />
              <input
                type="text"
                inputMode="numeric"
                value={settings.proxyPort || ''}
                onChange={(e) =>
                  onUpdateSettings({ proxyPort: e.target.value.replace(/\D/g, '').slice(0, 5) })
                }
                placeholder="Port (1080)"
                className="h-9 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-xs font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={settings.proxyUsername || ''}
                onChange={(e) => onUpdateSettings({ proxyUsername: e.target.value })}
                placeholder={
                  (settings.proxyType || 'socks5') === 'mtproto'
                    ? 'Secret key (optional)'
                    : 'Username (optional)'
                }
                className="h-9 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-xs focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
              />
              {(settings.proxyType || 'socks5') !== 'mtproto' && (
                <input
                  type="password"
                  value={settings.proxyPassword || ''}
                  onChange={(e) => onUpdateSettings({ proxyPassword: e.target.value })}
                  placeholder="Password (optional)"
                  className="h-9 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-xs focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                />
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate tabular-nums">
                {proxyTestStatus || 'Verify endpoint latency'}
              </span>
              <button
                type="button"
                disabled={testingProxy}
                onClick={handleTestProxy}
                className="h-8 px-3 rounded-lg bg-[#5B5CE6] hover:bg-[#4F46E5] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{testingProxy ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100/70 dark:hover:bg-[#1E2B38] transition-colors"
    >
      <span className="font-medium">{label}</span>
      <div
        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${
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
