import { useState } from 'react';
import {
  Check,
  ChevronDown,
  Copy,
  FileText,
  HelpCircle,
  Lock,
  MessageSquare,
  Phone,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  Video,
  X,
} from 'lucide-react';
import { Avatar } from './Avatar';
import type { ContactItem, UserProfile } from '../types/sarigram';

interface InviteFriendsModalProps {
  currentUser: UserProfile;
  contacts: ContactItem[];
  onClose: () => void;
  onStartPrivateChat: (contact: ContactItem) => void;
}

export function InviteFriendsModal({
  currentUser,
  contacts,
  onClose,
  onStartPrivateChat,
}: InviteFriendsModalProps) {
  const [query, setQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [invitedIds, setInvitedIds] = useState<Record<string, boolean>>({});

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sarigram.app';
  const inviteLink = `${origin}/?invite=${encodeURIComponent(currentUser.username || 'sarigram')}`;
  const shareMessage = `Join me on Sarigram (@${currentUser.username}) — Connect · Share · Belong: ${inviteLink}`;

  const copyText = async (text: string, onDone?: () => void) => {
    try {
      await navigator.clipboard.writeText(text);
      onDone?.();
    } catch {
      onDone?.();
    }
  };

  const handleCopyInviteLink = () => {
    void copyText(inviteLink, () => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Join Sarigram',
          text: `Connect with me on Sarigram (@${currentUser.username})`,
          url: inviteLink,
        });
        return;
      } catch {
        // user cancelled or share unavailable; fall back to copy
      }
    }
    handleCopyInviteLink();
  };

  const handleInviteContact = (contact: ContactItem) => {
    const personalMsg = `Hi ${contact.firstName}, join me on Sarigram! Message me at @${currentUser.username}: ${inviteLink}`;
    void copyText(personalMsg, () => {
      setInvitedIds((prev) => ({ ...prev, [contact.id]: true }));
      setTimeout(() => {
        setInvitedIds((prev) => ({ ...prev, [contact.id]: false }));
      }, 2400);
    });
  };

  const filteredContacts = contacts.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${c.firstName} ${c.lastName} ${c.username} ${c.phone}`.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-[1px]" />
      <div className="relative z-10 w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#17212B] text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-200 dark:border-[#242F3D] overflow-hidden">
        {/* Telegram-style Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#2563EB] via-[#5B5CE6] to-[#7C3AED] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 shrink-0" />
            <h2 className="font-display font-semibold text-base">Invite Friends</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close invite friends"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/90 hover:bg-white/15"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Share Link Card */}
        <div className="p-4 border-b border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] space-y-3">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Share your personal Sarigram invite link
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              aria-label="Personal Sarigram invite link"
              className="flex-1 min-w-0 h-10 px-3 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs font-mono text-slate-700 dark:text-slate-200 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="h-10 px-3.5 rounded-xl bg-[#5B5CE6] hover:bg-[#4F46E5] text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex-1 h-9 px-3 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] hover:border-[#5B5CE6] text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-[#5B5CE6] dark:text-[#A78BFA]" />
              <span>Share Sarigram Link</span>
            </button>
            <button
              type="button"
              onClick={() => void copyText(shareMessage, () => setCopiedLink(true))}
              className="h-9 px-3 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] hover:border-[#5B5CE6] text-xs font-medium whitespace-nowrap transition-colors"
            >
              Copy Invite Text
            </button>
          </div>
        </div>

        {/* Search & Contacts List */}
        <div className="p-3 border-b border-slate-100 dark:border-[#242F3D]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search friends by name, @username, or phone..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredContacts.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-8">
              No matching contacts found. Share your invite link above!
            </p>
          ) : (
            filteredContacts.map((contact) => {
              const invited = Boolean(invitedIds[contact.id]);
              return (
                <div
                  key={contact.id}
                  className="px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-[#1E2B38] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onStartPrivateChat(contact);
                      onClose();
                    }}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left"
                  >
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
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums truncate">
                        {contact.phone} · @{contact.username}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInviteContact(contact)}
                    className={`h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                      invited
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#5B5CE6]/12 text-[#5B5CE6] dark:bg-[#5B5CE6]/25 dark:text-[#A78BFA] hover:bg-[#5B5CE6] hover:text-white'
                    }`}
                  >
                    {invited ? 'Copied Invite' : 'Invite'}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-slate-200 dark:border-[#242F3D] text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Sarigram · Connect · Share · Belong</span>
          <span className="font-bold italic text-red-600 dark:text-red-400">
            Developed by Sadam A Qaallicha
          </span>
        </div>
      </div>
    </div>
  );
}

type HelpTab = 'faq' | 'features' | 'policy';

interface FaqItem {
  id: string;
  category: string;
  q: string;
  a: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'General',
    q: 'What is Sarigram and who developed it?',
    a: 'Sarigram is a cloud-synced messaging and social platform designed for fast private chats, group discussions, broadcast channels, voice notes, stories, and live calls. Sarigram is developed by Sadam A Qaallicha.',
  },
  {
    id: 'faq-2',
    category: 'Accounts',
    q: 'How do I register with an international phone number or email?',
    a: 'Open Sign In / Register from the navigation menu, select Create Account, pick any country dial code from the worldwide country selector, and enter your phone number, email address, or both along with a password.',
  },
  {
    id: 'faq-3',
    category: 'Messaging',
    q: 'How do read receipts (single vs double checkmarks) work?',
    a: 'A single checkmark indicates your message reached the Sarigram server. A double checkmark (✓✓) updates in real time over WebSocket as soon as the recipient opens and views the conversation.',
  },
  {
    id: 'faq-4',
    category: 'Calls',
    q: 'How do voice and video calls plus Recent Calls work?',
    a: 'Tap the Phone or Video button inside any private chat, or open Recent Calls from the drawer menu to view incoming, outgoing, and missed calls, filter missed calls, and call contacts back with one tap.',
  },
  {
    id: 'faq-5',
    category: 'Languages',
    q: 'How do I switch between English and Afaan Oromoo (En/Ao)?',
    a: 'Use the EN/AO language toggle in the sidebar header, navigation drawer, or Chat Settings to switch the Sarigram workspace instantly between English and Afaan Oromoo.',
  },
  {
    id: 'faq-6',
    category: 'Privacy & Security',
    q: 'How do I protect my account with Passcode Lock and Privacy controls?',
    a: 'Open Settings → Privacy & Security to configure Two-Step Verification hints, enable a 4-digit Passcode Lock, manage who sees your phone number or online status, block unwanted contacts, or terminate other sessions.',
  },
];

const FEATURE_ITEMS = [
  {
    title: 'Private 1-on-1 Messaging & Read Receipts',
    desc: 'Instant cloud-synced DMs with typing indicators, replies, forwarding, emoji reactions, and live WebSocket ✓✓ read receipts.',
    icon: MessageSquare,
  },
  {
    title: 'Groups & Broadcast Channels',
    desc: 'Create community groups with polls and pinned posts, or launch public/private broadcast channels with discussion threads.',
    icon: Users,
  },
  {
    title: 'HD Audio & Video Calls + Recent Calls',
    desc: 'WebRTC peer-to-peer voice and video calling with camera/mic controls, call duration tracking, and Recent Calls history.',
    icon: Phone,
  },
  {
    title: 'Rich Media, Documents & Voice Notes',
    desc: 'Share photos, video clips, documents, and recorded voice notes across chats or keep personal backups in Saved Messages.',
    icon: Video,
  },
  {
    title: 'Telegram-Grade Security & Privacy Controls',
    desc: 'Granular visibility controls (Everybody, My Contacts, Nobody), 4-digit Passcode Lock, Two-Step Verification, and blocked user management.',
    icon: ShieldCheck,
  },
  {
    title: 'Bilingual (En/Ao) & Installable App',
    desc: 'Full English and Afaan Oromoo interface, Day Classic & Night Blue themes, custom wallpapers, and Android/Desktop PWA installability.',
    icon: Sparkles,
  },
];

export function HelpCenterModal({
  initialTab = 'faq',
  onClose,
}: {
  initialTab?: HelpTab;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<HelpTab>(initialTab);
  const [faqQuery, setFaqQuery] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string>('faq-1');

  const filteredFaq = FAQ_ITEMS.filter((item) => {
    const q = faqQuery.trim().toLowerCase();
    if (!q) return true;
    return `${item.category} ${item.q} ${item.a}`.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-[1px]" />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#17212B] text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-200 dark:border-[#242F3D] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#2563EB] via-[#5B5CE6] to-[#7C3AED] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/pwa-512x512.png"
              alt="Sarigram"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/25 shrink-0"
            />
            <div className="min-w-0">
              <h2 className="font-display font-semibold text-base truncate">
                Sarigram FAQ, Features &amp; Policy
              </h2>
              <p className="text-xs font-bold italic text-red-300 truncate">
                Developed by Sadam A Qaallicha
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Sarigram FAQ and Policy"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/90 hover:bg-white/15 shrink-0"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Telegram-style Sub-Tabs */}
        <div className="flex border-b border-slate-200 dark:border-[#242F3D] px-4 shrink-0 overflow-x-auto">
          {(
            [
              { id: 'faq', label: 'Sarigram FAQ', icon: HelpCircle },
              { id: 'features', label: 'Sarigram Features', icon: Sparkles },
              { id: 'policy', label: 'Policy & Android Terms', icon: FileText },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                  tab === t.id
                    ? 'border-[#5B5CE6] text-[#5B5CE6] dark:text-[#5EB5F7]'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'faq' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={faqQuery}
                  onChange={(e) => setFaqQuery(e.target.value)}
                  placeholder="Search Sarigram FAQ..."
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                />
              </div>

              <div className="divide-y divide-slate-200 dark:divide-[#242F3D] border border-slate-200 dark:border-[#242F3D] rounded-2xl overflow-hidden">
                {filteredFaq.length === 0 ? (
                  <p className="p-6 text-xs text-slate-500 dark:text-slate-400 text-center">
                    No FAQ entries match &ldquo;{faqQuery}&rdquo;.
                  </p>
                ) : (
                  filteredFaq.map((item) => {
                    const isOpen = openFaqId === item.id;
                    return (
                      <div key={item.id} className="bg-white dark:bg-[#17212B]">
                        <button
                          type="button"
                          onClick={() => setOpenFaqId(isOpen ? '' : item.id)}
                          className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-[#1E2B38] transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="text-[11px] font-medium text-[#5B5CE6] dark:text-[#60A5FA]">
                              {item.category}
                            </div>
                            <div className="text-sm font-semibold mt-0.5">{item.q}</div>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {tab === 'features' && (
            <div className="space-y-4">
              <div className="rounded-2xl p-4 bg-gradient-to-r from-[#022A8E] to-[#5B5CE6] text-white">
                <div className="font-display font-bold text-base">
                  Sarigram — Connect · Share · Belong
                </div>
                <p className="text-xs text-sky-100 mt-1">
                  Built with familiar Telegram speed, folders, channels, calls, and privacy controls.{' '}
                  <span className="font-bold italic text-red-300">
                    Developed by Sadam A Qaallicha.
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FEATURE_ITEMS.map((feat) => {
                  const Icon = feat.icon;
                  return (
                    <div
                      key={feat.title}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] space-y-1.5"
                    >
                      <div className="flex items-center gap-2 text-[#2563EB] dark:text-[#60A5FA]">
                        <Icon className="w-4 h-4 shrink-0" />
                        <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {feat.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'policy' && (
            <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <section className="space-y-1.5">
                <h3 className="font-display font-semibold text-base text-slate-900 dark:text-slate-100">
                  1. Sarigram Privacy Policy
                </h3>
                <p className="text-xs sm:text-sm">
                  Sarigram collects only the profile details you provide—such as your display name,
                  @username, optional email address, international phone number, and profile photo—to
                  authenticate your account and connect you with your contacts and channels.
                </p>
              </section>

              <section className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-[#242F3D]">
                <h3 className="font-display font-semibold text-base text-slate-900 dark:text-slate-100">
                  2. User Control &amp; Data Protection
                </h3>
                <p className="text-xs sm:text-sm">
                  You decide who can view your phone number, online status, last seen time, and
                  profile picture inside Settings → Privacy &amp; Security. Microphone and camera
                  permissions are used strictly for voice notes and WebRTC audio/video calls you
                  initiate or accept.
                </p>
              </section>

              <section className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-[#242F3D]">
                <h3 className="font-display font-semibold text-base text-slate-900 dark:text-slate-100">
                  3. Community Policy &amp; Terms of Use
                </h3>
                <p className="text-xs sm:text-sm">
                  Respect members across private chats, groups, and public broadcast channels.
                  Spam, impersonation, harassment, and abusive broadcasts are prohibited and may be
                  suspended by platform administrators.
                </p>
              </section>

              <section className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-[#242F3D]">
                <h3 className="font-display font-semibold text-base text-slate-900 dark:text-slate-100">
                  4. Terms of Android &amp; Device Permissions
                </h3>
                <p className="text-xs sm:text-sm">
                  When using Sarigram on Android (Browser, Installed PWA, or Android Package), the
                  application requests runtime access only for features you actively use:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <li>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      Microphone &amp; Camera:
                    </span>{' '}
                    Required for voice notes, stories, and live WebRTC audio/video calls. Once
                    granted, Sarigram remembers your permission without repeated prompts.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      Photos, Media &amp; Gallery Storage:
                    </span>{' '}
                    Used when sending images, videos, or documents, and when Save to Gallery is
                    enabled under Settings → Data &amp; Storage.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      Notifications &amp; App Badge:
                    </span>{' '}
                    Displays real-time message alerts, incoming call banners, and unread badge
                    counters on supported Android launchers.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      Power Saving &amp; Background Sync:
                    </span>{' '}
                    Honors Android battery saver thresholds configured in Settings → Power Saving
                    to reduce autoplay and UI animation overhead.
                  </li>
                </ul>
              </section>

              <section className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-[#242F3D]">
                <h3 className="font-display font-semibold text-base text-slate-900 dark:text-slate-100">
                  5. Developer &amp; Platform Attribution
                </h3>
                <p className="text-xs sm:text-sm">
                  Sarigram is{' '}
                  <span className="font-bold italic text-red-600 dark:text-red-400">
                    developed by Sadam A Qaallicha
                  </span>
                  . For support or feedback, contact your workspace administrator or message{' '}
                  <span className="font-mono text-[#5B5CE6] dark:text-[#60A5FA]">@saribot</span>.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span>Sarigram · Cloud Messaging</span>
          <span className="font-bold italic text-red-600 dark:text-red-400">
            Developed by Sadam A Qaallicha
          </span>
        </div>
      </div>
    </div>
  );
}

export function PasscodeLockOverlay({
  expectedPin,
  hint,
  onUnlock,
}: {
  expectedPin: string;
  hint?: string;
  onUnlock: () => void;
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === (expectedPin || '1234')) {
      setError('');
      setPin('');
      onUnlock();
    } else {
      setError('Incorrect passcode. Please try again.');
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Sarigram passcode lock"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-6 text-white"
      style={{
        background: 'radial-gradient(circle at 50% 25%, #0B46C8 0%, #022A8E 48%, #011657 100%)',
      }}
    >
      <div className="w-full max-w-xs rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-6 text-center shadow-2xl space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-white/15 mx-auto flex items-center justify-center">
          <Lock className="w-7 h-7 text-[#FACC15]" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg">Sarigram Locked</h2>
          <p className="text-xs text-sky-100/90 mt-1">
            Enter your 4-digit passcode to unlock your chats.
          </p>
          {hint && <p className="text-[11px] text-[#FACC15] mt-1">Hint: {hint}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError('');
            }}
            placeholder="Enter passcode"
            autoFocus
            className="w-full h-11 px-4 rounded-xl bg-white/15 border border-white/25 text-center text-base font-mono tracking-[0.35em] text-white placeholder:text-white/60 placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
          />
          {error && <p className="text-xs text-rose-300 font-medium">{error}</p>}
          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-[#FACC15] hover:bg-[#FDE047] text-[#011657] font-display font-bold text-sm transition-colors"
          >
            Unlock Sarigram
          </button>
        </form>
        <p className="text-[11px] font-bold italic text-red-300">
          Developed by Sadam A Qaallicha
        </p>
      </div>
    </div>
  );
}
