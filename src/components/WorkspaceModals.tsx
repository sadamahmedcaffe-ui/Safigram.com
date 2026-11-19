import { useEffect, useRef, useState } from 'react';
import {
  Ban,
  Bot,
  Briefcase,
  Calendar,
  Camera,
  Check,
  ChevronRight,
  Copy,
  Crown,
  FileText,
  Gift,
  Heart,
  HelpCircle,
  Image as ImageIcon,
  KeyRound,
  Lock,
  Megaphone,
  Mic,
  MicOff,
  MonitorSmartphone,
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  PhoneOutgoing,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UserPlus,
  Video,
  VideoOff,
  Volume2,
  X,
} from 'lucide-react';
import { Avatar } from './Avatar';
import { CountryCodeSelect } from './CountryCodeSelect';
import { DataStorageSettingsPanel } from './DataStorageSettingsPanel';
import {
  ChatAutomationPanel,
  DevicesSettingsPanel,
  NotificationsSettingsPanel,
  PowerSavingSettingsPanel,
} from './TelegramSettingsPanels';
import {
  formatPhoneWithCode,
  splitPhoneNumber,
  type CountryCode,
} from '../utils/countryCodes';
import { formatChatListTime, formatDuration, formatLastSeen } from '../utils/formatters';
import type {
  AppSettings,
  CallRecord,
  ChatMessage,
  ChatThread,
  ContactItem,
  PrivacyVisibility,
  SearchUserResult,
  StoryItem,
  UserProfile,
} from '../types/sarigram';

const AVATAR_COLORS = ['#5B5CE6', '#7C3AED', '#2563EB', '#E17076', '#7BC862', '#EE7AAE'];

const STORY_GRADIENTS = [
  'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
  'linear-gradient(135deg, #4F46E5 0%, #9333EA 100%)',
  'linear-gradient(135deg, #059669 0%, #10B981 100%)',
  'linear-gradient(135deg, #334155 0%, #0F172A 100%)',
];

function ModalShell({
  title,
  onClose,
  children,
  maxWidth = 'max-w-lg',
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-[1px]" />
      <div
        className={`relative z-10 w-full ${maxWidth} max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#17212B] text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-200 dark:border-[#242F3D] overflow-hidden`}
      >
        <div className="px-5 py-4 bg-gradient-to-r from-[#2563EB] via-[#5B5CE6] to-[#7C3AED] text-white flex items-center justify-between shrink-0">
          <h2 className="font-display font-semibold text-base">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/90 hover:bg-white/15"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

export function ContactsModal({
  currentUserId,
  contacts,
  onlineUserIds,
  onClose,
  onStartPrivateChat,
  onSelectSearchUser,
  onAddContact,
}: {
  currentUserId: string;
  contacts: ContactItem[];
  onlineUserIds: string[];
  onClose: () => void;
  onStartPrivateChat: (contact: ContactItem) => void;
  onSelectSearchUser: (result: SearchUserResult) => void;
  onAddContact: (contact: ContactItem) => void;
}) {
  const [query, setQuery] = useState('');
  const [serverUsers, setServerUsers] = useState<SearchUserResult[]>([]);
  const [adding, setAdding] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('+1 415 ');
  const [bio, setBio] = useState('');

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setServerUsers([]);
      return;
    }
    let cancelled = false;
    fetch(
      `/api/users/search?q=${encodeURIComponent(q)}&excludeUserId=${encodeURIComponent(
        currentUserId
      )}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.results)) {
          setServerUsers(data.results.filter((r: SearchUserResult) => r.kind === 'user'));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [query, currentUserId]);

  const filtered = contacts.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${c.firstName} ${c.lastName} ${c.username} ${c.phone}`.toLowerCase().includes(q);
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) return;
    const newContact: ContactItem = {
      id: `contact-${crypto.randomUUID().slice(0, 8)}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: (username || firstName).trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
      phone: phone.trim() || '+1 415 555 0100',
      bio: bio.trim() || 'Sarigram contact',
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      lastSeen: 'last seen recently',
    };
    onAddContact(newContact);
    setAdding(false);
    setFirstName('');
    setLastName('');
    setUsername('');
    setBio('');
  };

  return (
    <ModalShell title="Contacts & People Search" onClose={onClose}>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contacts or @username..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
            />
          </div>
          <button
            type="button"
            onClick={() => setAdding((p) => !p)}
            className="h-10 px-3.5 rounded-xl bg-[#5B5CE6] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>{adding ? 'Back' : 'Add Contact'}</span>
          </button>
        </div>

        {adding ? (
          <form onSubmit={handleCreate} className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name *"
                required
                className="h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
              />
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className="h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@username"
                className="h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
              />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
              />
            </div>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Note / Bio"
              className="w-full h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#5B5CE6] text-white text-sm font-semibold"
              >
                Save Contact
              </button>
            </div>
          </form>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-1">
            {serverUsers.length > 0 && (
              <div className="pb-2 mb-2 border-b border-slate-100 dark:border-[#242F3D]">
                <div className="px-3 pb-1 text-xs font-semibold text-[#5B5CE6]">
                  Registered Sarigram Users
                </div>
                {serverUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      onSelectSearchUser(u);
                      onClose();
                    }}
                    className="w-full px-3 py-2 rounded-xl flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-[#202B36] text-left transition-colors"
                  >
                    <Avatar
                      name={`${u.firstName} ${u.lastName}`}
                      color={u.avatarColor}
                      imageUrl={u.avatarUrl}
                      size="sm"
                      isOnline={u.isOnline}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold truncate">
                        {u.firstName} {u.lastName}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        @{u.username} · {u.isOnline ? 'online' : formatLastSeen(u.lastSeen)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {filtered.map((contact) => {
              const online = onlineUserIds.includes(contact.id);
              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => {
                    onStartPrivateChat(contact);
                    onClose();
                  }}
                  className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-[#202B36] text-left transition-colors"
                >
                  <Avatar
                    name={`${contact.firstName} ${contact.lastName}`}
                    color={contact.avatarColor}
                    imageUrl={contact.avatarUrl}
                    size="sm"
                    isOnline={online}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">
                      {contact.firstName} {contact.lastName}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {online ? 'online' : formatLastSeen(contact.lastSeen)} · @{contact.username}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </ModalShell>
  );
}

export interface ActiveCallUIState {
  callId: string;
  peerId: string;
  peerName: string;
  peerColor: string;
  peerAvatar?: string;
  kind: 'voice' | 'video';
  direction: 'outgoing' | 'incoming';
  status: 'ringing' | 'connected';
}

export function CallsModal({
  calls,
  contacts = [],
  activeCall,
  localStream,
  remoteStream,
  onClose,
  onAcceptIncoming,
  onDeclineIncoming,
  onEndActiveCall,
  onStartCallFromLog,
  onStartNewCall,
}: {
  calls: CallRecord[];
  contacts?: ContactItem[];
  activeCall: ActiveCallUIState | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onClose: () => void;
  onAcceptIncoming: () => void;
  onDeclineIncoming: () => void;
  onEndActiveCall: (durationSeconds: number) => void;
  onStartCallFromLog: (record: CallRecord) => void;
  onStartNewCall?: (contact: ContactItem, kind: 'voice' | 'video') => void;
}) {
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [callFilter, setCallFilter] = useState<'all' | 'missed'>('all');
  const [pickingContact, setPickingContact] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!activeCall) {
      setSeconds(0);
      setMuted(false);
      setCameraOff(false);
      return;
    }
    const timer = setInterval(() => {
      setSeconds((s) => (activeCall.status === 'connected' ? s + 1 : s));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeCall?.callId, activeCall?.status]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, activeCall?.kind]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleMic = () => {
    const next = !muted;
    setMuted(next);
    localStream?.getAudioTracks().forEach((t) => {
      t.enabled = !next;
    });
  };

  const toggleCamera = () => {
    const next = !cameraOff;
    setCameraOff(next);
    localStream?.getVideoTracks().forEach((t) => {
      t.enabled = !next;
    });
  };

  if (activeCall) {
    const isVideo = activeCall.kind === 'video';
    const isIncomingRinging =
      activeCall.direction === 'incoming' && activeCall.status === 'ringing';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />
        <div className="relative z-10 w-full max-w-md rounded-3xl bg-gradient-to-b from-[#1E2A5E] via-[#1C1D4A] to-[#0F1326] text-white overflow-hidden shadow-2xl border border-white/10">
          <audio ref={remoteAudioRef} autoPlay className="hidden" />

          {isVideo && (
            <div className="relative h-72 bg-black/50 flex items-center justify-center">
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <Avatar
                    name={activeCall.peerName}
                    color={activeCall.peerColor}
                    imageUrl={activeCall.peerAvatar}
                    size="xl"
                  />
                  <span className="text-xs text-sky-200 mt-3">
                    {activeCall.status === 'ringing' ? 'Waiting for video...' : 'Camera active'}
                  </span>
                </div>
              )}

              {localStream && !cameraOff && (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="absolute bottom-3 right-3 w-24 h-32 rounded-xl object-cover border-2 border-white/30 shadow-lg bg-black"
                />
              )}
            </div>
          )}

          <div className="p-7 flex flex-col items-center text-center">
            {!isVideo && (
              <Avatar
                name={activeCall.peerName}
                color={activeCall.peerColor}
                imageUrl={activeCall.peerAvatar}
                size="xl"
              />
            )}

            <div className="text-xs font-medium text-sky-300 mt-3">
              Sarigram {isVideo ? 'Video Call' : 'Audio Call'}
            </div>
            <h3 className="font-display font-bold text-xl mt-1">{activeCall.peerName}</h3>
            <p className="text-sm font-mono tabular-nums text-sky-200 mt-1">
              {isIncomingRinging
                ? 'Incoming call...'
                : activeCall.status === 'ringing'
                  ? 'Ringing...'
                  : formatDuration(seconds)}
            </p>

            {isIncomingRinging ? (
              <div className="flex items-center gap-8 mt-8">
                <button
                  type="button"
                  onClick={onDeclineIncoming}
                  aria-label="Decline call"
                  className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={onAcceptIncoming}
                  aria-label="Accept call"
                  className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center shadow-lg"
                >
                  <Phone className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 mt-8">
                <button
                  type="button"
                  onClick={toggleMic}
                  aria-label="Toggle microphone"
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    muted ? 'bg-white text-slate-900' : 'bg-white/15 hover:bg-white/25'
                  }`}
                >
                  {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                {isVideo && (
                  <button
                    type="button"
                    onClick={toggleCamera}
                    aria-label="Toggle camera"
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      cameraOff ? 'bg-white text-slate-900' : 'bg-white/15 hover:bg-white/25'
                    }`}
                  >
                    {cameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onEndActiveCall(seconds)}
                  aria-label="End call"
                  className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setSpeaker((s) => !s)}
                  aria-label="Toggle speaker"
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    speaker ? 'bg-white/25' : 'bg-white/10'
                  }`}
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const missedCalls = calls.filter((c) => c.direction === 'missed');
  const visibleCalls = callFilter === 'missed' ? missedCalls : calls;

  return (
    <ModalShell title="Recent Calls" onClose={onClose}>
      <div className="px-4 py-3 border-b border-slate-200 dark:border-[#242F3D] flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-[#141D26]">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-[#202B36]">
          <button
            type="button"
            onClick={() => {
              setCallFilter('all');
              setPickingContact(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors tabular-nums ${
              callFilter === 'all' && !pickingContact
                ? 'bg-white dark:bg-[#17212B] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All ({calls.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setCallFilter('missed');
              setPickingContact(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors tabular-nums ${
              callFilter === 'missed' && !pickingContact
                ? 'bg-white dark:bg-[#17212B] text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Missed ({missedCalls.length})
          </button>
        </div>

        {onStartNewCall && contacts.length > 0 && (
          <button
            type="button"
            onClick={() => setPickingContact((p) => !p)}
            className="h-8 px-3 rounded-xl bg-[#5B5CE6] hover:bg-[#4F46E5] text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{pickingContact ? 'Back to History' : 'New Call'}</span>
          </button>
        )}
      </div>

      {pickingContact ? (
        <div className="p-3 max-h-96 overflow-y-auto space-y-1">
          <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Choose a contact to call
          </div>
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-100 dark:hover:bg-[#202B36]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  name={`${contact.firstName} ${contact.lastName}`}
                  color={contact.avatarColor}
                  imageUrl={contact.avatarUrl}
                  size="sm"
                />
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {contact.firstName} {contact.lastName}
                  </div>
                  <div className="text-xs text-slate-400 font-mono truncate">
                    @{contact.username}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onStartNewCall?.(contact, 'voice')}
                  aria-label={`Voice call ${contact.firstName}`}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#5B5CE6] hover:bg-[#5B5CE6]/10"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onStartNewCall?.(contact, 'video')}
                  aria-label={`Video call ${contact.firstName}`}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#5B5CE6] hover:bg-[#5B5CE6]/10"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 max-h-96 overflow-y-auto space-y-1">
          {visibleCalls.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              {callFilter === 'missed' ? 'No missed calls.' : 'No recent calls yet.'}
            </p>
          ) : (
            visibleCalls.map((c) => (
              <div
                key={c.id}
                className="px-3 py-2.5 rounded-xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-[#202B36]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    name={c.peerName}
                    color={c.peerAvatarColor}
                    imageUrl={c.peerAvatarUrl}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div
                      className={`text-sm font-semibold truncate ${
                        c.direction === 'missed' ? 'text-rose-600 dark:text-rose-400' : ''
                      }`}
                    >
                      {c.peerName}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {c.direction === 'missed' ? (
                        <PhoneMissed className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      ) : c.direction === 'incoming' ? (
                        <PhoneIncoming className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <PhoneOutgoing className="w-3.5 h-3.5 text-[#5B5CE6] shrink-0" />
                      )}
                      <span className="truncate">
                        {c.direction === 'missed'
                          ? 'Missed'
                          : c.direction === 'incoming'
                            ? 'Incoming'
                            : 'Outgoing'}{' '}
                        · {c.kind === 'video' ? 'Video' : 'Voice'} · {formatChatListTime(c.timestamp)}
                        {c.durationSeconds > 0 ? ` · ${formatDuration(c.durationSeconds)}` : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onStartCallFromLog(c)}
                  aria-label={`Call ${c.peerName}`}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#5B5CE6] hover:bg-[#5B5CE6]/10 shrink-0"
                >
                  {c.kind === 'video' ? (
                    <Video className="w-4.5 h-4.5" />
                  ) : (
                    <Phone className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </ModalShell>
  );
}

export function SettingsModal({
  currentUser,
  settings,
  initialTab = 'profile',
  contacts = [],
  messages = [],
  calls = [],
  chats = [],
  savedAccounts = [],
  unreadCount = 0,
  onClose,
  onUpdateProfile,
  onUpdateSettings,
  onSwitchAccount,
  onOpenAddAccount,
  onCreatePersonalChannel,
  onOpenChat,
  onOpenHelp,
  onOpenPlus,
  onLockApp,
}: {
  currentUser: UserProfile;
  settings: AppSettings;
  initialTab?:
    | 'profile'
    | 'appearance'
    | 'privacy'
    | 'data'
    | 'notifications'
    | 'devices'
    | 'power'
    | 'automation';
  contacts?: ContactItem[];
  messages?: ChatMessage[];
  calls?: CallRecord[];
  chats?: ChatThread[];
  savedAccounts?: UserProfile[];
  unreadCount?: number;
  onClose: () => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onSwitchAccount?: (user: UserProfile) => void;
  onOpenAddAccount?: () => void;
  onCreatePersonalChannel?: (title: string, username: string) => ChatThread;
  onOpenChat?: (chatId: string) => void;
  onOpenHelp?: (tab: 'faq' | 'features' | 'policy') => void;
  onOpenPlus?: (tab: 'premium' | 'business' | 'stars' | 'gift') => void;
  onLockApp?: () => void;
}) {
  const initialSplit = splitPhoneNumber(currentUser.phone);
  const [tab, setTab] = useState<
    | 'profile'
    | 'appearance'
    | 'privacy'
    | 'data'
    | 'notifications'
    | 'devices'
    | 'power'
    | 'automation'
  >(initialTab);
  const [sessionsNotice, setSessionsNotice] = useState('');
  const [showBlockedList, setShowBlockedList] = useState(false);
  const [firstName, setFirstName] = useState(currentUser.firstName);
  const [lastName, setLastName] = useState(currentUser.lastName);
  const [username, setUsername] = useState(currentUser.username);
  const [email, setEmail] = useState(currentUser.email || '');
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(initialSplit.country);
  const [localPhone, setLocalPhone] = useState(initialSplit.localNumber);
  const [birthdate, setBirthdate] = useState(currentUser.birthdate || '');
  const [personalChannelId, setPersonalChannelId] = useState(
    currentUser.personalChannelId || ''
  );
  const [showNewPersonalChannel, setShowNewPersonalChannel] = useState(false);
  const [newChannelTitle, setNewChannelTitle] = useState('');
  const [newChannelUsername, setNewChannelUsername] = useState('');
  const [copiedUsernameLink, setCopiedUsernameLink] = useState(false);
  const [bio, setBio] = useState(currentUser.bio);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(currentUser.avatarUrl);
  const [savedNotice, setSavedNotice] = useState(false);

  const photoRef = useRef<HTMLInputElement | null>(null);
  const birthdateInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const split = splitPhoneNumber(currentUser.phone);
    setFirstName(currentUser.firstName);
    setLastName(currentUser.lastName);
    setUsername(currentUser.username);
    setEmail(currentUser.email || '');
    setPhoneCountry(split.country);
    setLocalPhone(split.localNumber);
    setBirthdate(currentUser.birthdate || '');
    setPersonalChannelId(currentUser.personalChannelId || '');
    setBio(currentUser.bio);
    setAvatarUrl(currentUser.avatarUrl);
  }, [currentUser]);

  const channelOptions = chats.filter((c) => c.type === 'channel');
  const linkedChannel =
    channelOptions.find((c) => c.id === personalChannelId) ||
    (currentUser.personalChannelId === personalChannelId && currentUser.personalChannelTitle
      ? {
          id: currentUser.personalChannelId,
          title: currentUser.personalChannelTitle,
          username: currentUser.personalChannelUsername,
        }
      : undefined);

  const formattedBirthdate = birthdate
    ? new Date(`${birthdate}T00:00:00`).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const handleAvatarUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) return;
    const formattedPhone = localPhone.trim()
      ? formatPhoneWithCode(phoneCountry.dialCode, localPhone)
      : '';
    const selectedChan = channelOptions.find((c) => c.id === personalChannelId);
    onUpdateProfile({
      ...currentUser,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || currentUser.username,
      email: email.trim().toLowerCase() || undefined,
      phone: formattedPhone || currentUser.phone,
      birthdate: birthdate || undefined,
      personalChannelId: personalChannelId || undefined,
      personalChannelTitle: selectedChan
        ? selectedChan.title
        : personalChannelId
          ? currentUser.personalChannelTitle
          : undefined,
      personalChannelUsername: selectedChan
        ? selectedChan.username
        : personalChannelId
          ? currentUser.personalChannelUsername
          : undefined,
      bio: bio.trim(),
      avatarUrl,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1800);
  };

  const handleCreateAndLinkChannel = () => {
    const cleanTitle = newChannelTitle.trim();
    if (!cleanTitle || !onCreatePersonalChannel) return;
    const cleanHandle =
      newChannelUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') ||
      `${username}_channel`;
    const created = onCreatePersonalChannel(cleanTitle, cleanHandle);
    setPersonalChannelId(created.id);
    setShowNewPersonalChannel(false);
    setNewChannelTitle('');
    setNewChannelUsername('');
    onUpdateProfile({
      ...currentUser,
      personalChannelId: created.id,
      personalChannelTitle: created.title,
      personalChannelUsername: created.username,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1800);
  };

  const handleNotificationToggle = async (next: boolean) => {
    if (next && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch {
        // ignore
      }
    }
    onUpdateSettings({ notificationsEnabled: next });
  };

  const blockedIds = settings.blockedUserIds || [];

  const toggleBlockedUser = (id: string) => {
    const next = blockedIds.includes(id)
      ? blockedIds.filter((x) => x !== id)
      : [...blockedIds, id];
    onUpdateSettings({ blockedUserIds: next });
  };

  return (
    <ModalShell title="Sarigram Settings" onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex border-b border-slate-200 dark:border-[#242F3D] px-4 overflow-x-auto">
        {(
          [
            { id: 'profile', label: 'Account' },
            { id: 'automation', label: 'Automation' },
            { id: 'appearance', label: 'Chat Settings' },
            { id: 'privacy', label: 'Privacy & Security' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'data', label: 'Data & Storage' },
            { id: 'devices', label: 'Devices' },
            { id: 'power', label: 'Power Saving' },
          ] as {
            id:
              | 'profile'
              | 'appearance'
              | 'privacy'
              | 'data'
              | 'notifications'
              | 'devices'
              | 'power'
              | 'automation';
            label: string;
          }[]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              tab === t.id
                ? 'border-[#5B5CE6] text-[#5B5CE6] dark:text-[#5EB5F7]'
                : 'border-transparent text-slate-500 dark:text-slate-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar
                  name={`${firstName} ${lastName}`}
                  color={currentUser.avatarColor}
                  imageUrl={avatarUrl}
                  size="lg"
                />
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  aria-label="Change profile picture"
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#5B5CE6] text-white flex items-center justify-center shadow ring-2 ring-white dark:ring-[#17212B]"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold text-base truncate">
                  {firstName} {lastName}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  @{username}
                  {email ? ` · ${email}` : ''}
                  {localPhone ? ` · ${formatPhoneWithCode(phoneCountry.dialCode, localPhone)}` : ''}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => photoRef.current?.click()}
                    className="text-xs font-semibold text-[#5B5CE6] hover:underline"
                  >
                    Upload Photo
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl(undefined)}
                      className="text-xs text-red-500 hover:underline flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Telegram-style Account Info Summary */}
            <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] overflow-hidden divide-y divide-slate-200/80 dark:divide-[#242F3D] text-xs">
              <div className="px-4 py-2 font-semibold text-[#5B5CE6] dark:text-[#60A5FA] flex items-center justify-between gap-2">
                <span>Account Info</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(`https://sarigram.app/@${username}`).catch(() => {});
                    setCopiedUsernameLink(true);
                    setTimeout(() => setCopiedUsernameLink(false), 1600);
                  }}
                  className="font-mono text-[11px] text-[#5B5CE6] dark:text-[#60A5FA] hover:underline flex items-center gap-1"
                >
                  {copiedUsernameLink ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copied Link</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>sarigram.app/@{username}</span>
                    </>
                  )}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-[#242F3D]">
                <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Phone</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {localPhone
                      ? formatPhoneWithCode(phoneCountry.dialCode, localPhone)
                      : currentUser.phone || 'Not linked'}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Username</span>
                  <span className="font-mono font-semibold text-[#5B5CE6] dark:text-[#60A5FA] truncate">
                    @{username}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-[#242F3D]">
                <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Birthdate</span>
                  {formattedBirthdate ? (
                    <span className="font-medium tabular-nums text-slate-900 dark:text-slate-100">
                      {formattedBirthdate}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => birthdateInputRef.current?.focus()}
                      className="font-semibold text-[#5B5CE6] dark:text-[#60A5FA] hover:underline"
                    >
                      Add Birthdate
                    </button>
                  )}
                </div>
                <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Personal Channel</span>
                  {linkedChannel ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenChat) {
                          onClose();
                          onOpenChat(linkedChannel.id);
                        }
                      }}
                      className="font-semibold text-[#5B5CE6] dark:text-[#60A5FA] hover:underline truncate"
                    >
                      @{linkedChannel.username || linkedChannel.title}
                    </button>
                  ) : (
                    <span className="text-slate-400">Not linked</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-[#242F3D]">
                <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Email</span>
                  <span className="font-medium truncate">
                    {email || currentUser.email || 'Not set'}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Account Tier</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {settings.premiumActive ? 'Sarigram Premium' : 'Standard'}
                    {settings.businessEnabled ? ' · Business' : ''}
                    {currentUser.role === 'admin' ? ' · Admin' : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Username (@username)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#5B5CE6]">
                    @
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                    }
                    className="w-full h-10 pl-7 pr-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                    Birthdate
                  </label>
                  {birthdate && (
                    <button
                      type="button"
                      onClick={() => setBirthdate('')}
                      className="text-[11px] font-semibold text-rose-500 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={birthdateInputRef}
                    type="date"
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Phone Number (All Countries)
                </label>
                <div className="flex items-center gap-2">
                  <CountryCodeSelect value={phoneCountry} onChange={setPhoneCountry} />
                  <input
                    type="tel"
                    value={localPhone}
                    onChange={(e) => setLocalPhone(e.target.value.replace(/[^\d\s-]/g, ''))}
                    placeholder="911 223 344"
                    className="flex-1 min-w-0 h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Bio
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6] resize-none"
              />
            </div>

            {/* Telegram-style Personal Channel & Chat Automation Section */}
            <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-[#5B5CE6] dark:text-[#60A5FA]" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Personal Channel
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTab('automation')}
                    className="text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA] hover:underline flex items-center gap-1"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Chat Automation</span>
                  </button>
                  {onCreatePersonalChannel && (
                    <button
                      type="button"
                      onClick={() => setShowNewPersonalChannel((p) => !p)}
                      className="text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA] hover:underline"
                    >
                      {showNewPersonalChannel ? 'Cancel' : '+ Create Channel'}
                    </button>
                  )}
                </div>
              </div>

              <select
                aria-label="Select personal channel"
                value={personalChannelId}
                onChange={(e) => setPersonalChannelId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
              >
                <option value="">No personal channel linked</option>
                {channelOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} {c.username ? `(@${c.username})` : ''}
                  </option>
                ))}
              </select>

              {showNewPersonalChannel && onCreatePersonalChannel && (
                <div className="p-3 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newChannelTitle}
                      onChange={(e) => setNewChannelTitle(e.target.value)}
                      placeholder="Channel title (e.g. Sari Updates)"
                      className="h-9 px-3 rounded-lg bg-[#F4F4F5] dark:bg-[#242F3D] text-xs focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                    />
                    <input
                      type="text"
                      value={newChannelUsername}
                      onChange={(e) => setNewChannelUsername(e.target.value)}
                      placeholder="@channel_username"
                      className="h-9 px-3 rounded-lg bg-[#F4F4F5] dark:bg-[#242F3D] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateAndLinkChannel}
                    disabled={!newChannelTitle.trim()}
                    className="w-full h-8 rounded-lg bg-[#5B5CE6] disabled:opacity-45 text-white text-xs font-semibold"
                  >
                    Create &amp; Link Personal Channel
                  </button>
                </div>
              )}
            </div>

            {/* Accounts Switcher & Add Account */}
            {(savedAccounts.length > 0 || onOpenAddAccount) && (
              <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA]">
                    Accounts ({savedAccounts.length})
                  </span>
                  {onOpenAddAccount && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAddAccount();
                      }}
                      className="h-8 px-3 rounded-lg bg-[#5B5CE6] hover:bg-[#4F46E5] text-white text-xs font-semibold flex items-center gap-1 whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Account</span>
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {savedAccounts.map((acc) => {
                    const isActive = acc.id === currentUser.id;
                    return (
                      <div
                        key={acc.id}
                        className="px-3 py-2 rounded-xl bg-white dark:bg-[#1E2B38] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar
                            name={`${acc.firstName} ${acc.lastName}`}
                            color={acc.avatarColor}
                            imageUrl={acc.avatarUrl}
                            size="xs"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">
                              {acc.firstName} {acc.lastName}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                              @{acc.username}
                            </div>
                          </div>
                        </div>
                        {isActive ? (
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            Active
                          </span>
                        ) : (
                          onSwitchAccount && (
                            <button
                              type="button"
                              onClick={() => onSwitchAccount(acc)}
                              className="h-7 px-2.5 rounded-lg bg-[#5B5CE6]/10 text-[#5B5CE6] dark:text-[#60A5FA] text-[11px] font-semibold whitespace-nowrap"
                            >
                              Switch
                            </button>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {savedNotice ? 'Profile saved and synced.' : ''}
              </span>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#5B5CE6] hover:bg-[#7C3AED] text-white text-sm font-semibold"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {tab === 'appearance' && (
          <div className="space-y-5">
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Color Theme
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ theme: 'light' })}
                  className={`p-3 rounded-xl border text-left ${
                    settings.theme === 'light'
                      ? 'border-[#5B5CE6] bg-[#5B5CE6]/10'
                      : 'border-slate-200 dark:border-[#2C3B4B]'
                  }`}
                >
                  <div className="text-sm font-semibold">Day Classic</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Crisp white & sage bubbles
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ theme: 'dark' })}
                  className={`p-3 rounded-xl border text-left ${
                    settings.theme === 'dark'
                      ? 'border-[#5B5CE6] bg-[#5B5CE6]/10'
                      : 'border-slate-200 dark:border-[#2C3B4B]'
                  }`}
                >
                  <div className="text-sm font-semibold">Night Blue</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Deep slate blue workspace
                  </div>
                </button>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Chat Wallpaper
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    { id: 'classic', label: 'Classic' },
                    { id: 'sky', label: 'Sky' },
                    { id: 'minimal', label: 'Minimal' },
                    { id: 'midnight', label: 'Slate' },
                  ] as const
                ).map((wp) => (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => onUpdateSettings({ wallpaper: wp.id })}
                    className={`p-2 rounded-xl border text-center ${
                      settings.wallpaper === wp.id
                        ? 'border-[#5B5CE6] ring-1 ring-[#5B5CE6]'
                        : 'border-slate-200 dark:border-[#2C3B4B]'
                    }`}
                  >
                    <div className={`h-10 rounded-lg mb-1.5 sarigram-wallpaper-${wp.id}`} />
                    <span className="text-xs font-medium">{wp.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Message Text Size
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'sm', label: 'Compact' },
                    { id: 'md', label: 'Default' },
                    { id: 'lg', label: 'Large' },
                  ] as const
                ).map((sz) => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => onUpdateSettings({ fontSize: sz.id })}
                    className={`py-2 rounded-xl border text-xs font-semibold ${
                      settings.fontSize === sz.id
                        ? 'border-[#5B5CE6] bg-[#5B5CE6]/10 text-[#5B5CE6]'
                        : 'border-slate-200 dark:border-[#2C3B4B]'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Language (En / Ao)
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'English', label: 'En · English' },
                    { id: 'Afaan Oromoo', label: 'Ao · Afaan Oromoo' },
                  ] as const
                ).map((lang) => {
                  const active =
                    (lang.id === 'Afaan Oromoo' &&
                      settings.language.toLowerCase().includes('orom')) ||
                    (lang.id === 'English' && !settings.language.toLowerCase().includes('orom'));
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => onUpdateSettings({ language: lang.id })}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold ${
                        active
                          ? 'border-[#5B5CE6] bg-[#5B5CE6]/10 text-[#5B5CE6] dark:text-[#A78BFA]'
                          : 'border-slate-200 dark:border-[#2C3B4B]'
                      }`}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'privacy' && (
          <div className="space-y-5 text-sm">
            {/* Telegram-style Security Group */}
            <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] overflow-hidden divide-y divide-slate-200/80 dark:divide-[#242F3D]">
              <div className="px-4 py-2.5 text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA]">
                Security
              </div>

              <div className="px-4 py-3 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <KeyRound className="w-4.5 h-4.5 text-[#5B5CE6] dark:text-[#60A5FA] shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium">Two-Step Verification</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Extra password check when signing in on a new device
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ twoStepEnabled: !settings.twoStepEnabled })
                    }
                    aria-label="Toggle two-step verification"
                    className={`w-10 h-5.5 rounded-full p-0.5 transition-colors shrink-0 ${
                      settings.twoStepEnabled ? 'bg-[#5B5CE6]' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div
                      className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${
                        settings.twoStepEnabled ? 'translate-x-4.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                {settings.twoStepEnabled && (
                  <input
                    type="text"
                    value={settings.twoStepHint || ''}
                    onChange={(e) => onUpdateSettings({ twoStepHint: e.target.value })}
                    placeholder="Recovery hint (optional)"
                    className="w-full h-9 px-3 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                  />
                )}
              </div>

              <div className="px-4 py-3 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Lock className="w-4.5 h-4.5 text-[#5B5CE6] dark:text-[#60A5FA] shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium">Passcode Lock</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Lock Sarigram locally with a 4-digit PIN
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        passcodeEnabled: !settings.passcodeEnabled,
                        passcodePin: settings.passcodePin || '1234',
                      })
                    }
                    aria-label="Toggle passcode lock"
                    className={`w-10 h-5.5 rounded-full p-0.5 transition-colors shrink-0 ${
                      settings.passcodeEnabled ? 'bg-[#5B5CE6]' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div
                      className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${
                        settings.passcodeEnabled ? 'translate-x-4.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                {settings.passcodeEnabled && (
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={8}
                      value={settings.passcodePin || '1234'}
                      onChange={(e) =>
                        onUpdateSettings({ passcodePin: e.target.value.replace(/\D/g, '') })
                      }
                      placeholder="4-digit PIN"
                      className="flex-1 h-9 px-3 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                    />
                    {onLockApp && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onLockApp();
                        }}
                        className="h-9 px-3 rounded-xl bg-[#022A8E] hover:bg-[#0B46C8] text-white text-xs font-semibold whitespace-nowrap shrink-0"
                      >
                        Lock App Now
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <MonitorSmartphone className="w-4.5 h-4.5 text-[#5B5CE6] dark:text-[#60A5FA] shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium">Active Sessions</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Current Web Session · Active now
                    </div>
                    {sessionsNotice && (
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {sessionsNotice}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSessionsNotice('All other sessions terminated.');
                    setTimeout(() => setSessionsNotice(''), 2500);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] hover:border-rose-400 text-xs font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap shrink-0"
                >
                  Terminate Others
                </button>
              </div>

              <div className="px-4 py-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowBlockedList((p) => !p)}
                  className="w-full flex items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <Ban className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                    <div>
                      <div className="font-medium">Blocked Users</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {blockedIds.length} blocked
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      showBlockedList ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {showBlockedList && (
                  <div className="pt-2 space-y-1 max-h-40 overflow-y-auto">
                    {contacts.map((c) => {
                      const isBlocked = blockedIds.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white dark:bg-[#1E2B38]"
                        >
                          <span className="text-xs font-medium truncate">
                            {c.firstName} {c.lastName} (@{c.username})
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleBlockedUser(c.id)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap ${
                              isBlocked
                                ? 'bg-slate-200 dark:bg-[#2C3B4B] text-slate-700 dark:text-slate-200'
                                : 'bg-rose-500/12 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Telegram-style Privacy Visibility Group */}
            <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] overflow-hidden divide-y divide-slate-200/80 dark:divide-[#242F3D]">
              <div className="px-4 py-2.5 text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA]">
                Privacy
              </div>

              {(
                [
                  {
                    key: 'privacyPhone',
                    label: 'Phone Number',
                    value: settings.privacyPhone || 'contacts',
                  },
                  {
                    key: 'privacyLastSeen',
                    label: 'Last Seen & Online',
                    value: settings.showOnlineStatus
                      ? settings.privacyLastSeen || 'everybody'
                      : 'nobody',
                  },
                  {
                    key: 'privacyProfilePhoto',
                    label: 'Profile Photos',
                    value: settings.privacyProfilePhoto || 'everybody',
                  },
                  {
                    key: 'privacyBirthdate',
                    label: 'Birthdate',
                    value: settings.privacyBirthdate || 'contacts',
                  },
                  {
                    key: 'privacyForwarded',
                    label: 'Forwarded Messages',
                    value: settings.privacyForwarded || 'everybody',
                  },
                  {
                    key: 'privacyCalls',
                    label: 'Calls',
                    value: settings.privacyCalls || 'contacts',
                  },
                  {
                    key: 'privacyGroups',
                    label: 'Groups & Channels',
                    value: settings.privacyGroups || 'everybody',
                  },
                ] as const
              ).map((row) => (
                <div key={row.key} className="px-4 py-2.5 flex items-center justify-between gap-3">
                  <span className="font-medium text-sm">{row.label}</span>
                  <select
                    aria-label={row.label}
                    value={row.value}
                    onChange={(e) => {
                      const val = e.target.value as PrivacyVisibility;
                      if (row.key === 'privacyLastSeen') {
                        onUpdateSettings({
                          privacyLastSeen: val,
                          showOnlineStatus: val !== 'nobody',
                        });
                      } else {
                        onUpdateSettings({ [row.key]: val } as Partial<AppSettings>);
                      }
                    }}
                    className="h-8 px-2.5 rounded-lg bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA] focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                  >
                    <option value="everybody">Everybody</option>
                    <option value="contacts">My Contacts</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>
              ))}

              <div className="px-4 py-2.5">
                <ToggleRow
                  label="Read Receipts (✓✓)"
                  checked={settings.readReceiptsEnabled !== false}
                  onChange={(v) => onUpdateSettings({ readReceiptsEnabled: v })}
                />
              </div>
            </div>
          </div>
        )}

        {tab === 'data' && (
          <DataStorageSettingsPanel
            settings={settings}
            messages={messages}
            calls={calls}
            onUpdateSettings={onUpdateSettings}
          />
        )}

        {tab === 'notifications' && (
          <NotificationsSettingsPanel
            settings={settings}
            unreadCount={unreadCount}
            onUpdateSettings={onUpdateSettings}
            onToggleNotifications={handleNotificationToggle}
          />
        )}

        {tab === 'devices' && (
          <DevicesSettingsPanel settings={settings} onUpdateSettings={onUpdateSettings} />
        )}

        {tab === 'power' && (
          <PowerSavingSettingsPanel settings={settings} onUpdateSettings={onUpdateSettings} />
        )}

        {tab === 'automation' && (
          <ChatAutomationPanel
            currentUser={currentUser}
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            onOpenPersonalChannel={() => setTab('profile')}
          />
        )}

        {/* Sarigram Premium, Business, Stars & Send a Gift */}
        {onOpenPlus && (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-[#242F3D] space-y-2">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1 flex items-center justify-between">
              <span>Sarigram Ecosystem</span>
              <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400">
                ★ {settings.starBalance ?? 250} Stars
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPlus('premium');
                }}
                className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141D26] hover:bg-slate-100 dark:hover:bg-[#1E2B38] border border-slate-200 dark:border-[#242F3D] text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Crown className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Premium</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPlus('business');
                }}
                className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141D26] hover:bg-slate-100 dark:hover:bg-[#1E2B38] border border-slate-200 dark:border-[#242F3D] text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Briefcase className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Business</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPlus('stars');
                }}
                className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141D26] hover:bg-slate-100 dark:hover:bg-[#1E2B38] border border-slate-200 dark:border-[#242F3D] text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>My Stars</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPlus('gift');
                }}
                className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141D26] hover:bg-slate-100 dark:hover:bg-[#1E2B38] border border-slate-200 dark:border-[#242F3D] text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Gift className="w-3.5 h-3.5 text-rose-500" />
                <span>Send a Gift</span>
              </button>
            </div>
          </div>
        )}

        {/* Telegram-style Help & Attribution Footer inside Settings */}
        {onOpenHelp && (
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-[#242F3D] space-y-2">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
              Help &amp; Information
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenHelp('faq');
                }}
                className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141D26] hover:bg-slate-100 dark:hover:bg-[#1E2B38] border border-slate-200 dark:border-[#242F3D] text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#5B5CE6]" />
                <span>Sarigram FAQ</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenHelp('features');
                }}
                className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141D26] hover:bg-slate-100 dark:hover:bg-[#1E2B38] border border-slate-200 dark:border-[#242F3D] text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#5B5CE6]" />
                <span>Features</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenHelp('policy');
                }}
                className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141D26] hover:bg-slate-100 dark:hover:bg-[#1E2B38] border border-slate-200 dark:border-[#242F3D] text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <FileText className="w-3.5 h-3.5 text-[#5B5CE6]" />
                <span>Android Terms</span>
              </button>
            </div>
            <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              Sarigram Cloud Platform ·{' '}
              <span className="font-bold italic text-red-600 dark:text-red-400">
                Developed by Sadam A Qaallicha
              </span>
            </p>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

function ToggleRow({
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
      className="w-full py-2 flex items-center justify-between text-left"
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

export function StoryModal({
  mode,
  stories,
  activeStoryId,
  currentUser,
  onClose,
  onSelectStory,
  onViewStory,
  onCreateStory,
  onReplyToStory,
}: {
  mode: 'view' | 'create';
  stories: StoryItem[];
  activeStoryId: string | null;
  currentUser: UserProfile;
  onClose: () => void;
  onSelectStory: (storyId: string) => void;
  onViewStory: (storyId: string, react?: boolean) => void;
  onCreateStory: (story: StoryItem) => void;
  onReplyToStory: (story: StoryItem, text: string) => void;
}) {
  const [caption, setCaption] = useState('');
  const [gradient, setGradient] = useState(STORY_GRADIENTS[0]);
  const [mediaUrl, setMediaUrl] = useState<string | undefined>(undefined);
  const [replyText, setReplyText] = useState('');
  const [replySent, setReplySent] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const currentIndex = stories.findIndex((s) => s.id === activeStoryId);
  const activeStory = currentIndex >= 0 ? stories[currentIndex] : stories[0] || null;

  useEffect(() => {
    if (mode === 'view' && activeStory) {
      onViewStory(activeStory.id, false);
    }
  }, [mode, activeStory?.id]);

  if (mode === 'create') {
    const handleImage = (file: File | undefined) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') setMediaUrl(reader.result);
      };
      reader.readAsDataURL(file);
    };

    const handlePublish = (e: React.FormEvent) => {
      e.preventDefault();
      if (!caption.trim() && !mediaUrl) return;
      onCreateStory({
        id: `story-${crypto.randomUUID().slice(0, 8)}`,
        authorId: currentUser.id,
        authorName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
        authorUsername: currentUser.username,
        authorAvatarColor: currentUser.avatarColor,
        authorAvatarUrl: currentUser.avatarUrl,
        mediaUrl,
        gradient: mediaUrl ? undefined : gradient,
        caption: caption.trim(),
        createdAt: new Date().toISOString(),
        viewedBy: [currentUser.id],
        reactions: 0,
      });
      onClose();
    };

    return (
      <ModalShell title="Post Sarigram Story" onClose={onClose} maxWidth="max-w-md">
        <form onSubmit={handlePublish} className="p-5 space-y-4">
          <div
            className="h-64 rounded-2xl overflow-hidden relative flex items-center justify-center p-6 text-center text-white"
            style={!mediaUrl ? { background: gradient } : undefined}
          >
            {mediaUrl && (
              <img
                src={mediaUrl}
                alt="Story preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className="relative z-10 bg-black/30 backdrop-blur-[2px] px-4 py-2 rounded-xl text-sm font-medium max-w-xs">
              {caption || 'Your story caption appears here'}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {STORY_GRADIENTS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setMediaUrl(undefined);
                    setGradient(g);
                  }}
                  aria-label="Choose story gradient"
                  className="w-7 h-7 rounded-full border border-white shadow-sm"
                  style={{ background: g }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#242F3D] text-xs font-semibold flex items-center gap-1.5"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#5B5CE6]" />
              <span>Upload Photo</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImage(e.target.files?.[0])}
            />
          </div>

          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a story caption..."
            className="w-full h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#5B5CE6] text-white text-sm font-semibold flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4" />
              <span>Share Story</span>
            </button>
          </div>
        </form>
      </ModalShell>
    );
  }

  if (!activeStory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
      <div className="relative w-full max-w-sm h-[620px] max-h-[90vh] rounded-3xl overflow-hidden bg-slate-900 text-white shadow-2xl flex flex-col justify-between">
        {activeStory.mediaUrl ? (
          <img
            src={activeStory.mediaUrl}
            alt={activeStory.caption}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: activeStory.gradient || STORY_GRADIENTS[0] }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/75 pointer-events-none" />

        <div className="relative z-10 p-4 space-y-3">
          <div className="flex gap-1">
            {stories.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Story ${idx + 1}`}
                onClick={() => onSelectStory(s.id)}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s.id === activeStory.id ? 'bg-white' : 'bg-white/35'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Avatar
                name={activeStory.authorName}
                color={activeStory.authorAvatarColor}
                imageUrl={activeStory.authorAvatarUrl}
                size="sm"
              />
              <div>
                <div className="text-sm font-semibold">{activeStory.authorName}</div>
                <div className="text-[11px] text-white/75 tabular-nums">
                  {formatChatListTime(activeStory.createdAt)} · @{activeStory.authorUsername}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close story"
              className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center hover:bg-black/50"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex">
          <button
            type="button"
            aria-label="Previous story"
            onClick={() => {
              const prevIdx = (currentIndex - 1 + stories.length) % stories.length;
              onSelectStory(stories[prevIdx].id);
            }}
            className="w-1/3 h-full"
          />
          <div className="w-1/3 h-full" />
          <button
            type="button"
            aria-label="Next story"
            onClick={() => {
              const nextIdx = (currentIndex + 1) % stories.length;
              onSelectStory(stories[nextIdx].id);
            }}
            className="w-1/3 h-full"
          />
        </div>

        <div className="relative z-10 p-4 space-y-3">
          {activeStory.caption && (
            <p className="text-sm leading-relaxed text-white drop-shadow">{activeStory.caption}</p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!replyText.trim()) return;
              onReplyToStory(activeStory, replyText.trim());
              setReplyText('');
              setReplySent(true);
              setTimeout(() => setReplySent(false), 1800);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={replySent ? 'Reply sent!' : 'Reply to story...'}
              className="flex-1 h-10 px-4 rounded-full bg-white/15 backdrop-blur-md text-sm text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            <button
              type="button"
              onClick={() => onViewStory(activeStory.id, true)}
              className="h-10 px-3 rounded-full bg-white/15 hover:bg-white/25 flex items-center gap-1.5 text-xs font-semibold tabular-nums"
            >
              <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
              <span>{activeStory.reactions}</span>
            </button>
            <button
              type="submit"
              aria-label="Send story reply"
              className="w-10 h-10 rounded-full bg-[#5B5CE6] flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function LightboxModal({
  imageUrl,
  caption,
  onClose,
}: {
  imageUrl: string;
  caption?: string;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close photo"
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
      >
        <X className="w-5 h-5" />
      </button>
      <img
        src={imageUrl}
        alt={caption || 'Shared photo'}
        referrerPolicy="no-referrer"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[82vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
      />
      {caption && (
        <p className="mt-3 text-sm text-white/90 text-center max-w-lg">{caption}</p>
      )}
    </div>
  );
}
