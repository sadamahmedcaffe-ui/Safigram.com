import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Check,
  KeyRound,
  LayoutGrid,
  Lock,
  Megaphone,
  Pencil,
  Pin,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  Type,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Avatar } from './Avatar';
import { DEFAULT_APP_CONFIG, getBrandGradient } from '../utils/i18n';
import type { AdminOverviewData, AppConfig, ChatThread, UserProfile } from '../types/sarigram';

interface AdminDashboardModalProps {
  authToken: string | null;
  currentUser: UserProfile;
  initialTab?: 'users' | 'channels' | 'apps';
  onClose: () => void;
  onRequireAuth: () => void;
  onSelectChat: (chatId: string) => void;
}

export function AdminDashboardModal({
  authToken,
  currentUser,
  initialTab = 'users',
  onClose,
  onRequireAuth,
  onSelectChat,
}: AdminDashboardModalProps) {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authRequired, setAuthRequired] = useState(false);
  const [tab, setTab] = useState<'users' | 'channels' | 'apps'>(initialTab);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [appDraft, setAppDraft] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [savingApp, setSavingApp] = useState(false);

  // Create Admin / User form state
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'member'>('admin');
  const [creatingUser, setCreatingUser] = useState(false);

  // Edit user email & password state
  const [credUser, setCredUser] = useState<UserProfile | null>(null);
  const [credEmail, setCredEmail] = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [savingCreds, setSavingCreds] = useState(false);

  const fetchOverview = useCallback(async () => {
    if (currentUser.role !== 'admin') {
      setAuthRequired(true);
      setError('Administrator access is restricted to admin accounts.');
      setLoading(false);
      return;
    }
    if (!authToken) {
      setAuthRequired(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    setAuthRequired(false);
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.status === 401 || res.status === 403) {
        const body = await res.json().catch(() => ({}));
        setAuthRequired(true);
        setError(body.error || 'Administrator session required.');
        setLoading(false);
        return;
      }
      const json = (await res.json()) as AdminOverviewData & { error?: string };
      if (!res.ok) {
        setError(json.error || 'Failed to load admin overview.');
      } else {
        setData(json);
        if (json.appConfig) {
          setAppDraft(json.appConfig);
        }
      }
    } catch {
      setError('Unable to reach Sarigram admin service.');
    } finally {
      setLoading(false);
    }
  }, [authToken, currentUser.role]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const showNotice = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 2600);
  };

  const handleUpdateUser = async (
    user: UserProfile,
    patch: {
      role?: 'admin' | 'member';
      status?: 'active' | 'suspended';
      email?: string;
      password?: string;
    }
  ) => {
    if (!authToken) return;
    setBusyId(user.id);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to update user.');
        return false;
      } else {
        setData((prev) =>
          prev
            ? {
                ...prev,
                users: prev.users.map((u) => (u.id === user.id ? json.user : u)),
              }
            : prev
        );
        showNotice(`Updated @${user.username}`);
        return true;
      }
    } catch {
      setError('Network error updating user.');
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    setCreatingUser(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          firstName: newFirstName.trim(),
          lastName: newLastName.trim(),
          email: newEmail.trim(),
          password: newPassword,
          role: newRole,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to create user.');
      } else {
        setShowCreateUser(false);
        setNewFirstName('');
        setNewLastName('');
        setNewEmail('');
        setNewPassword('');
        setNewRole('admin');
        await fetchOverview();
        showNotice(`Created ${json.user.role} account (${json.user.email})`);
      }
    } catch {
      setError('Network error creating user.');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credUser) return;
    setSavingCreds(true);
    const patch: { email?: string; password?: string } = { email: credEmail.trim() };
    if (credPassword.trim()) {
      patch.password = credPassword;
    }
    const ok = await handleUpdateUser(credUser, patch);
    setSavingCreds(false);
    if (ok) {
      setCredUser(null);
      setCredEmail('');
      setCredPassword('');
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (!authToken) return;
    setBusyId(user.id);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to delete user.');
      } else {
        await fetchOverview();
        showNotice(`Removed @${user.username}`);
      }
    } catch {
      setError('Network error removing user.');
    } finally {
      setBusyId(null);
    }
  };

  const handleUpdateChannel = async (channel: ChatThread, patch: Partial<ChatThread>) => {
    if (!authToken) return;
    setBusyId(channel.id);
    setError('');
    try {
      const res = await fetch(`/api/admin/channels/${encodeURIComponent(channel.id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to update channel.');
      } else {
        setData((prev) =>
          prev
            ? {
                ...prev,
                channels: prev.channels.map((c) => (c.id === channel.id ? json.chat : c)),
              }
            : prev
        );
        showNotice(`Updated ${channel.title}`);
      }
    } catch {
      setError('Network error updating channel.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteChannel = async (channel: ChatThread) => {
    if (!authToken) return;
    setBusyId(channel.id);
    setError('');
    try {
      const res = await fetch(`/api/admin/channels/${encodeURIComponent(channel.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to delete channel.');
      } else {
        await fetchOverview();
        showNotice(`Deleted ${channel.title}`);
      }
    } catch {
      setError('Network error deleting channel.');
    } finally {
      setBusyId(null);
    }
  };

  const saveAppConfig = async (nextConfig: AppConfig) => {
    if (!authToken) return;
    setSavingApp(true);
    setError('');
    try {
      const res = await fetch('/api/admin/app-config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(nextConfig),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to save app settings.');
      } else {
        setAppDraft(json.appConfig);
        setData((prev) => (prev ? { ...prev, appConfig: json.appConfig } : prev));
        showNotice('App body & EditText changes applied to all users.');
      }
    } catch {
      setError('Network error saving app configuration.');
    } finally {
      setSavingApp(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase().replace(/^@/, '');
    if (!q) return data.users;
    return data.users.filter(
      (u) =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
    );
  }, [data, query]);

  const filteredChannels = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase().replace(/^@/, '');
    if (!q) return data.channels;
    return data.channels.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.username || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q)
    );
  }, [data, query]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/55 backdrop-blur-[1px]" />
      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] rounded-2xl bg-white dark:bg-[#17212B] text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-200 dark:border-[#242F3D] flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className={`px-5 py-4 bg-gradient-to-r ${getBrandGradient(
            appDraft.brandPreset
          )} text-white flex items-center justify-between gap-3 shrink-0`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-base sm:text-lg truncate">
                {appDraft.appName || 'Sarigram'} Admin Dashboard
              </h2>
              <p className="text-xs text-white/80 truncate">
                Manage users, channels, EditText content & overall app body
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!authRequired && (
              <>
                <button
                  type="button"
                  onClick={() => setTab('apps')}
                  className={`h-9 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                    tab === 'apps'
                      ? 'bg-white text-[#5B5CE6] shadow-xs'
                      : 'bg-white/15 hover:bg-white/25 text-white'
                  }`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Apps</span>
                </button>
                <button
                  type="button"
                  onClick={fetchOverview}
                  aria-label="Refresh admin data"
                  className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close admin dashboard"
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        {authRequired ? (
          <div className="p-8 flex flex-col items-center text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#5B5CE6]/12 text-[#5B5CE6] dark:text-[#A78BFA] flex items-center justify-center mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="font-display font-semibold text-lg">Administrator Sign-In Required</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
              {error ||
                'To protect user accounts and overall app editing, sign in with an administrator account.'}
            </p>
            <div className="mt-4 px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs text-slate-600 dark:text-slate-300 w-full">
              Sign in with your administrator email (
              <span className="font-mono font-semibold">kallichamio@gmail.com</span>) and password.
            </div>
            <div className="flex items-center gap-2.5 mt-5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#232E3C]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequireAuth();
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white shadow-sm hover:opacity-95 whitespace-nowrap"
              >
                Sign In as Admin
              </button>
            </div>
          </div>
        ) : loading && !data ? (
          <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">
            Loading Sarigram platform records...
          </div>
        ) : data ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* KPI Row */}
            <div className="p-4 sm:px-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] shrink-0">
              <StatCard label="Registered Users" value={data.stats.totalUsers} />
              <StatCard label="Online Now" value={data.stats.onlineUsers} accent />
              <StatCard
                label="Channels & Groups"
                value={data.stats.totalChannels + data.stats.totalGroups}
              />
              <StatCard label="Stored Messages" value={data.stats.totalMessages} />
            </div>

            {/* Filter & Tabs */}
            <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-[#242F3D] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#202B36] p-1 rounded-xl self-start overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => setTab('users')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    tab === 'users'
                      ? 'bg-white dark:bg-[#17212B] text-[#5B5CE6] dark:text-[#A78BFA] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="tabular-nums">Users ({data.users.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('channels')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    tab === 'channels'
                      ? 'bg-white dark:bg-[#17212B] text-[#5B5CE6] dark:text-[#A78BFA] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span className="tabular-nums">Channels ({data.channels.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('apps')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    tab === 'apps'
                      ? 'bg-white dark:bg-[#17212B] text-[#7C3AED] dark:text-[#C4B5FD] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Edit Apps</span>
                </button>
              </div>

              {tab !== 'apps' && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {tab === 'users' && (
                    <button
                      type="button"
                      onClick={() => setShowCreateUser((prev) => !prev)}
                      className="h-9 px-3 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 hover:opacity-95"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{showCreateUser ? 'Close Form' : 'Create Admin'}</span>
                    </button>
                  )}
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={
                        tab === 'users' ? 'Filter @username or email...' : 'Filter channels...'
                      }
                      className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]/50"
                    />
                  </div>
                </div>
              )}
            </div>

            {(error || actionMessage) && (
              <div
                className={`px-5 py-2 text-xs font-medium border-b shrink-0 ${
                  error
                    ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/40'
                    : 'bg-indigo-50 dark:bg-indigo-950/30 text-[#4F46E5] dark:text-[#A78BFA] border-indigo-200 dark:border-indigo-900/40'
                }`}
              >
                {error || actionMessage}
              </div>
            )}

            {/* List / Editor Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:px-5 space-y-2">
              {tab === 'apps' ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveAppConfig(appDraft);
                  }}
                  className="space-y-5 max-w-3xl"
                >
                  {/* EditText Section */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/50 dark:bg-[#141D26] space-y-4">
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-[#5B5CE6] dark:text-[#A78BFA]" />
                      <h3 className="font-display font-semibold text-sm">
                        EditText — Overall App Body Copy
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                          App Title
                        </label>
                        <input
                          type="text"
                          value={appDraft.appName}
                          onChange={(e) =>
                            setAppDraft((p) => ({ ...p, appName: e.target.value }))
                          }
                          placeholder="Sarigram"
                          className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                          App Subtitle
                        </label>
                        <input
                          type="text"
                          value={appDraft.appSubtitle}
                          onChange={(e) =>
                            setAppDraft((p) => ({ ...p, appSubtitle: e.target.value }))
                          }
                          placeholder="Cloud Sync"
                          className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Welcome Screen Title
                      </label>
                      <input
                        type="text"
                        value={appDraft.welcomeTitle}
                        onChange={(e) =>
                          setAppDraft((p) => ({ ...p, welcomeTitle: e.target.value }))
                        }
                        placeholder="Welcome to Sarigram"
                        className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Overall App Body Text
                      </label>
                      <textarea
                        rows={3}
                        value={appDraft.welcomeBody}
                        onChange={(e) =>
                          setAppDraft((p) => ({ ...p, welcomeBody: e.target.value }))
                        }
                        placeholder="Describe your Sarigram workspace..."
                        className="w-full p-3 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6] resize-none"
                      />
                    </div>

                    <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-[#242F3D]">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          Global App Banner Text
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setAppDraft((p) => ({
                              ...p,
                              showAnnouncement: !p.showAnnouncement,
                            }))
                          }
                          className="flex items-center gap-2 text-xs font-semibold text-[#5B5CE6] dark:text-[#A78BFA]"
                        >
                          <span>{appDraft.showAnnouncement ? 'Banner On' : 'Banner Off'}</span>
                          <div
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                              appDraft.showAnnouncement
                                ? 'bg-gradient-to-r from-[#2563EB] to-[#7C3AED]'
                                : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                appDraft.showAnnouncement ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </div>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={appDraft.announcementText}
                        onChange={(e) =>
                          setAppDraft((p) => ({ ...p, announcementText: e.target.value }))
                        }
                        placeholder="Announcement shown across the top of the app..."
                        className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                      />
                    </div>
                  </div>

                  {/* Apps Layout & Brand Controls */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/50 dark:bg-[#141D26] space-y-4">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-[#7C3AED] dark:text-[#C4B5FD]" />
                      <h3 className="font-display font-semibold text-sm">
                        Apps — Layout & Theme Controls
                      </h3>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                        Blue & Purple Brand Theme
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {(
                          [
                            {
                              id: 'blue-purple',
                              label: 'Blue → Purple',
                              grad: 'from-[#2563EB] via-[#5B5CE6] to-[#7C3AED]',
                            },
                            {
                              id: 'indigo-violet',
                              label: 'Indigo → Violet',
                              grad: 'from-[#4338CA] via-[#6D28D9] to-[#9333EA]',
                            },
                            {
                              id: 'cobalt-cyan',
                              label: 'Cobalt → Indigo',
                              grad: 'from-[#1D4ED8] via-[#3B82F6] to-[#6366F1]',
                            },
                          ] as const
                        ).map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() =>
                              setAppDraft((p) => ({ ...p, brandPreset: preset.id }))
                            }
                            className={`p-2.5 rounded-xl border text-left transition-colors ${
                              appDraft.brandPreset === preset.id
                                ? 'border-[#5B5CE6] bg-white dark:bg-[#192430] ring-1 ring-[#5B5CE6]'
                                : 'border-slate-200 dark:border-[#2C3B4B] bg-white dark:bg-[#192430]'
                            }`}
                          >
                            <div
                              className={`h-6 rounded-lg bg-gradient-to-r ${preset.grad} mb-1.5`}
                            />
                            <div className="text-xs font-semibold">{preset.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setAppDraft((p) => ({ ...p, showStories: !p.showStories }))
                        }
                        className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2C3B4B] bg-white dark:bg-[#192430] flex items-center justify-between text-left"
                      >
                        <span className="text-xs font-semibold">Show Stories Strip</span>
                        <span
                          className={`text-xs font-semibold ${
                            appDraft.showStories
                              ? 'text-[#5B5CE6] dark:text-[#A78BFA]'
                              : 'text-slate-400'
                          }`}
                        >
                          {appDraft.showStories ? 'Visible' : 'Hidden'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setAppDraft((p) => ({ ...p, compactMode: !p.compactMode }))
                        }
                        className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2C3B4B] bg-white dark:bg-[#192430] flex items-center justify-between text-left"
                      >
                        <span className="text-xs font-semibold">Compact Chat Rows</span>
                        <span
                          className={`text-xs font-semibold ${
                            appDraft.compactMode
                              ? 'text-[#7C3AED] dark:text-[#C4B5FD]'
                              : 'text-slate-400'
                          }`}
                        >
                          {appDraft.compactMode ? 'Compact' : 'Standard'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      disabled={savingApp}
                      onClick={() => saveAppConfig(DEFAULT_APP_CONFIG)}
                      className="h-10 px-4 rounded-xl border border-slate-200 dark:border-[#2C3B4B] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#232E3C] flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Defaults</span>
                    </button>

                    <button
                      type="submit"
                      disabled={savingApp}
                      className={`h-10 px-5 rounded-xl bg-gradient-to-r ${getBrandGradient(
                        appDraft.brandPreset
                      )} text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:opacity-95 disabled:opacity-50`}
                    >
                      <Check className="w-4 h-4" />
                      <span>{savingApp ? 'Saving...' : 'Save & Apply to App Body'}</span>
                    </button>
                  </div>
                </form>
              ) : tab === 'users' ? (
                <div className="space-y-3">
                  {showCreateUser && (
                    <form
                      onSubmit={handleCreateAdminUser}
                      className="p-4 rounded-xl border border-[#5B5CE6]/30 bg-slate-50 dark:bg-[#141D26] space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4 text-[#5B5CE6]" />
                          <h3 className="font-display font-semibold text-sm">
                            Create Admin / User Email &amp; Password
                          </h3>
                        </div>
                        <select
                          aria-label="User role"
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value as 'admin' | 'member')}
                          className="h-8 px-2.5 rounded-lg bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs font-semibold"
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          value={newFirstName}
                          onChange={(e) => setNewFirstName(e.target.value)}
                          placeholder="First Name *"
                          required
                          className="h-9 px-3 rounded-lg bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                        />
                        <input
                          type="text"
                          value={newLastName}
                          onChange={(e) => setNewLastName(e.target.value)}
                          placeholder="Last Name"
                          className="h-9 px-3 rounded-lg bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                        />
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="Admin Email * (e.g. admin@sarigram.app)"
                          required
                          className="h-9 px-3 rounded-lg bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                        />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Password * (min 4 chars)"
                          required
                          minLength={4}
                          className="h-9 px-3 rounded-lg bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowCreateUser(false)}
                          className="h-8 px-3 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-[#232E3C]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={creatingUser}
                          className="h-8 px-4 rounded-lg bg-[#5B5CE6] hover:bg-[#4F46E5] disabled:opacity-50 text-white text-xs font-semibold"
                        >
                          {creatingUser ? 'Creating...' : 'Create Account'}
                        </button>
                      </div>
                    </form>
                  )}

                  {credUser && (
                    <form
                      onSubmit={handleSaveCredentials}
                      className="p-4 rounded-xl border border-amber-300/60 dark:border-amber-700/50 bg-amber-50/40 dark:bg-amber-950/20 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <KeyRound className="w-4 h-4 text-[#5B5CE6]" />
                          <span>
                            Update Email &amp; Password for {credUser.firstName} {credUser.lastName}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCredUser(null)}
                          className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          Close
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="email"
                          value={credEmail}
                          onChange={(e) => setCredEmail(e.target.value)}
                          placeholder="Email address"
                          className="h-9 px-3 rounded-lg bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                        />
                        <input
                          type="password"
                          value={credPassword}
                          onChange={(e) => setCredPassword(e.target.value)}
                          placeholder="New password (leave blank to keep)"
                          className="h-9 px-3 rounded-lg bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={savingCreds}
                          className="h-8 px-4 rounded-lg bg-[#5B5CE6] hover:bg-[#4F46E5] disabled:opacity-50 text-white text-xs font-semibold"
                        >
                          {savingCreds ? 'Saving...' : 'Save Credentials'}
                        </button>
                      </div>
                    </form>
                  )}

                  {filteredUsers.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-10">No matching users.</p>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelf = u.id === currentUser.id;
                      const isAdmin = u.role === 'admin';
                      const isSuspended = u.status === 'suspended';
                      return (
                        <div
                          key={u.id}
                          className="p-3 rounded-xl border border-slate-200 dark:border-[#242F3D] bg-white dark:bg-[#192430] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar
                              name={`${u.firstName} ${u.lastName}`}
                              color={u.avatarColor}
                              imageUrl={u.avatarUrl}
                              size="sm"
                              isOnline={Boolean(u.isOnline)}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-display font-semibold text-sm truncate">
                                  {u.firstName} {u.lastName}
                                </span>
                                {isSelf && (
                                  <span className="text-[11px] font-medium text-[#5B5CE6] dark:text-[#A78BFA]">
                                    (You)
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                @{u.username}
                                {u.email ? ` · ${u.email}` : ''}
                                {u.phone ? ` · ${u.phone}` : ''} · {isAdmin ? 'Admin' : 'Member'} ·{' '}
                                <span
                                  className={
                                    isSuspended
                                      ? 'text-red-500 font-medium'
                                      : u.isOnline
                                        ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                                        : ''
                                  }
                                >
                                  {isSuspended ? 'Suspended' : u.isOnline ? 'Online' : 'Active'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                setCredUser(u);
                                setCredEmail(u.email || '');
                                setCredPassword('');
                              }}
                              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-[#2C3B4B] text-xs font-medium hover:bg-slate-50 dark:hover:bg-[#232E3C] flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-[#5B5CE6] dark:text-[#A78BFA]" />
                              <span>Email &amp; Password</span>
                            </button>

                            <button
                              type="button"
                              disabled={busyId === u.id || isSelf}
                              onClick={() =>
                                handleUpdateUser(u, { role: isAdmin ? 'member' : 'admin' })
                              }
                              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-[#2C3B4B] text-xs font-medium hover:bg-slate-50 dark:hover:bg-[#232E3C] disabled:opacity-45 flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-[#5B5CE6] dark:text-[#A78BFA]" />
                              <span>{isAdmin ? 'Set Member' : 'Make Admin'}</span>
                            </button>

                            <button
                              type="button"
                              disabled={busyId === u.id || isSelf}
                              onClick={() =>
                                handleUpdateUser(u, {
                                  status: isSuspended ? 'active' : 'suspended',
                                })
                              }
                              className={`h-9 px-3 rounded-lg border text-xs font-medium disabled:opacity-45 flex items-center gap-1.5 whitespace-nowrap ${
                                isSuspended
                                  ? 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                  : 'border-amber-300 dark:border-amber-800/70 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                              }`}
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>{isSuspended ? 'Activate' : 'Suspend'}</span>
                            </button>

                            {!isSelf && (
                              <button
                                type="button"
                                disabled={busyId === u.id}
                                onClick={() => handleDeleteUser(u)}
                                aria-label={`Delete ${u.username}`}
                                className="w-9 h-9 rounded-lg border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : filteredChannels.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-10">
                  No matching channels or groups.
                </p>
              ) : (
                filteredChannels.map((ch) => (
                  <div
                    key={ch.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-[#242F3D] bg-white dark:bg-[#192430] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelectChat(ch.id);
                        onClose();
                      }}
                      className="flex items-center gap-3 min-w-0 text-left flex-1 group"
                    >
                      <Avatar
                        name={ch.title}
                        color={ch.avatarColor}
                        imageUrl={ch.avatarUrl}
                        type={ch.type}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-semibold text-sm truncate group-hover:text-[#5B5CE6] dark:group-hover:text-[#A78BFA]">
                            {ch.title}
                          </span>
                          {ch.verified && (
                            <BadgeCheck className="w-4 h-4 text-[#5B5CE6] dark:text-[#A78BFA] shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate tabular-nums">
                          {ch.type === 'channel' ? 'Channel' : 'Group'}
                          {ch.username ? ` · @${ch.username}` : ''} ·{' '}
                          {ch.type === 'channel'
                            ? `${(ch.subscriberCount || 1).toLocaleString()} subscribers`
                            : `${(ch.memberCount || ch.memberIds.length).toLocaleString()} members`}
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        type="button"
                        disabled={busyId === ch.id}
                        onClick={() => handleUpdateChannel(ch, { verified: !ch.verified })}
                        className={`h-9 px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 whitespace-nowrap ${
                          ch.verified
                            ? 'border-[#5B5CE6] bg-[#5B5CE6]/10 text-[#5B5CE6] dark:text-[#A78BFA]'
                            : 'border-slate-200 dark:border-[#2C3B4B] hover:bg-slate-50 dark:hover:bg-[#232E3C]'
                        }`}
                      >
                        <BadgeCheck className="w-3.5 h-3.5" />
                        <span>{ch.verified ? 'Verified' : 'Verify'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={busyId === ch.id}
                        onClick={() => handleUpdateChannel(ch, { isPinned: !ch.isPinned })}
                        className={`h-9 px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 whitespace-nowrap ${
                          ch.isPinned
                            ? 'border-[#7C3AED] bg-[#7C3AED]/10 text-[#7C3AED] dark:text-[#C4B5FD]'
                            : 'border-slate-200 dark:border-[#2C3B4B] hover:bg-slate-50 dark:hover:bg-[#232E3C]'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                        <span>{ch.isPinned ? 'Pinned' : 'Pin'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={busyId === ch.id}
                        onClick={() => handleDeleteChannel(ch)}
                        aria-label={`Delete ${ch.title}`}
                        className="w-9 h-9 rounded-lg border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="px-3.5 py-3 rounded-xl bg-white dark:bg-[#192430] border border-slate-200 dark:border-[#242F3D]">
      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{label}</div>
      <div
        className={`mt-1 font-display font-bold text-xl tabular-nums ${
          accent
            ? 'text-[#5B5CE6] dark:text-[#A78BFA]'
            : 'text-slate-900 dark:text-slate-100'
        }`}
      >
        {value.toLocaleString()}
      </div>
    </div>
  );
}
