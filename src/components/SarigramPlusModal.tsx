import { useState } from 'react';
import {
  Briefcase,
  Check,
  Clock,
  Crown,
  Gift,
  Plus,
  Send,
  Sparkles,
  Star,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { Avatar } from './Avatar';
import type {
  AppSettings,
  BusinessQuickReply,
  ContactItem,
  SentGiftItem,
  StarTransaction,
  UserProfile,
} from '../types/sarigram';

type PlusTab = 'premium' | 'business' | 'stars' | 'gift';

const GIFT_CATALOG = [
  { id: 'gift-bouquet', name: 'Starlight Bouquet', cost: 25, emoji: '💐' },
  { id: 'gift-trophy', name: 'Golden Trophy', cost: 50, emoji: '🏆' },
  { id: 'gift-globe', name: 'Crystal Globe', cost: 100, emoji: '🌍' },
  { id: 'gift-crown', name: 'Sarigram Crown', cost: 150, emoji: '👑' },
  { id: 'gift-rocket', name: 'Diamond Rocket', cost: 250, emoji: '🚀' },
];

const STAR_PACKS = [
  { amount: 50, label: 'Starter Pack', price: '$0.99' },
  { amount: 100, label: 'Popular Pack', price: '$1.99' },
  { amount: 500, label: 'Creator Pack', price: '$8.99' },
  { amount: 1000, label: 'Studio Pack', price: '$16.99' },
];

interface SarigramPlusModalProps {
  initialTab?: PlusTab;
  currentUser: UserProfile;
  settings: AppSettings;
  contacts: ContactItem[];
  onClose: () => void;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onSendGiftMessage: (contact: ContactItem, giftSummary: string) => void;
}

export function SarigramPlusModal({
  initialTab = 'premium',
  currentUser,
  settings,
  contacts,
  onClose,
  onUpdateSettings,
  onSendGiftMessage,
}: SarigramPlusModalProps) {
  const [tab, setTab] = useState<PlusTab>(initialTab);
  const [quickShortcut, setQuickShortcut] = useState('');
  const [quickMessage, setQuickMessage] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string>(contacts[0]?.id || '');
  const [selectedGiftId, setSelectedGiftId] = useState<string>(GIFT_CATALOG[0].id);
  const [giftNote, setGiftNote] = useState('');
  const [notice, setNotice] = useState('');

  const starBalance = settings.starBalance ?? 250;
  const transactions = settings.starTransactions ?? [
    {
      id: 'st-init',
      title: 'Sarigram Welcome Bonus',
      amount: 250,
      timestamp: new Date().toISOString(),
    },
  ];
  const sentGifts = settings.sentGifts ?? [];
  const quickReplies = settings.businessQuickReplies ?? [
    { id: 'qr-1', shortcut: '/hello', message: 'Thank you for reaching out on Sarigram! How can we help today?' },
    { id: 'qr-2', shortcut: '/hours', message: 'Our support hours are Mon–Sat, 09:00–18:00.' },
  ];

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 2600);
  };

  const handleTopUpStars = (amount: number, label: string) => {
    const nextBalance = starBalance + amount;
    const tx: StarTransaction = {
      id: `st-${crypto.randomUUID().slice(0, 8)}`,
      title: `Added ${label}`,
      amount,
      timestamp: new Date().toISOString(),
    };
    onUpdateSettings({
      starBalance: nextBalance,
      starTransactions: [tx, ...transactions].slice(0, 12),
    });
    showNotice(`+${amount} Sarigram Stars added to your balance.`);
  };

  const handleAddQuickReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickShortcut.trim() || !quickMessage.trim()) return;
    const cleanShortcut = quickShortcut.trim().startsWith('/')
      ? quickShortcut.trim()
      : `/${quickShortcut.trim()}`;
    const item: BusinessQuickReply = {
      id: `qr-${crypto.randomUUID().slice(0, 6)}`,
      shortcut: cleanShortcut,
      message: quickMessage.trim(),
    };
    onUpdateSettings({ businessQuickReplies: [...quickReplies, item] });
    setQuickShortcut('');
    setQuickMessage('');
    showNotice(`Quick reply ${cleanShortcut} saved.`);
  };

  const handleSendGift = (e: React.FormEvent) => {
    e.preventDefault();
    const recipient = contacts.find((c) => c.id === selectedContactId) || contacts[0];
    const gift = GIFT_CATALOG.find((g) => g.id === selectedGiftId) || GIFT_CATALOG[0];
    if (!recipient) {
      showNotice('Add a contact first to send a gift.');
      return;
    }
    if (starBalance < gift.cost) {
      showNotice(`Not enough Stars (${gift.cost} Stars required). Top up in My Stars!`);
      return;
    }

    const recipientName = `${recipient.firstName} ${recipient.lastName}`.trim();
    const newTx: StarTransaction = {
      id: `st-${crypto.randomUUID().slice(0, 8)}`,
      title: `Sent ${gift.name} to ${recipientName}`,
      amount: -gift.cost,
      timestamp: new Date().toISOString(),
    };
    const giftEntry: SentGiftItem = {
      id: `gift-${crypto.randomUUID().slice(0, 8)}`,
      recipientId: recipient.id,
      recipientName,
      giftName: gift.name,
      starsCost: gift.cost,
      note: giftNote.trim() || undefined,
      timestamp: new Date().toISOString(),
    };

    onUpdateSettings({
      starBalance: starBalance - gift.cost,
      starTransactions: [newTx, ...transactions].slice(0, 12),
      sentGifts: [giftEntry, ...sentGifts].slice(0, 12),
    });

    const chatText = `${gift.emoji} Sent a Sarigram Gift: ${gift.name} (${gift.cost} Stars)${
      giftNote.trim() ? `\n"${giftNote.trim()}"` : ''
    }`;
    onSendGiftMessage(recipient, chatText);
    setGiftNote('');
    showNotice(`${gift.name} sent to ${recipientName}!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/55 backdrop-blur-[2px]" />
      <div className="relative z-10 w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-[#17212B] text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-200 dark:border-[#242F3D] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#4338CA] via-[#6D28D9] to-[#9333EA] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Crown className="w-5 h-5 text-[#FACC15] shrink-0" />
            <div className="min-w-0">
              <h2 className="font-display font-bold text-base truncate">
                Sarigram Premium, Business, Stars &amp; Gifts
              </h2>
              <p className="text-xs text-purple-100 truncate">
                @{currentUser.username} · Balance: <span className="font-mono tabular-nums font-semibold">{starBalance} Stars</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Sarigram Plus"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/90 hover:bg-white/15 shrink-0"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Telegram-style Tabs */}
        <div className="flex border-b border-slate-200 dark:border-[#242F3D] px-4 overflow-x-auto shrink-0">
          {(
            [
              { id: 'premium', label: 'Sarigram Premium', icon: Crown },
              { id: 'business', label: 'Business', icon: Briefcase },
              { id: 'stars', label: 'My Stars', icon: Star },
              { id: 'gift', label: 'Send a Gift', icon: Gift },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-3.5 py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                  tab === t.id
                    ? 'border-[#7C3AED] text-[#7C3AED] dark:text-[#C4B5FD]'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {notice && (
            <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              {notice}
            </div>
          )}

          {/* 1. Sarigram Premium */}
          {tab === 'premium' && (
            <div className="space-y-4">
              <div className="rounded-2xl p-5 bg-gradient-to-br from-[#1D4ED8] via-[#6D28D9] to-[#A855F7] text-white space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Crown className="w-6 h-6 text-[#FACC15]" />
                    <h3 className="font-display font-bold text-lg">Sarigram Premium</h3>
                  </div>
                  <span className="text-xs font-semibold text-[#FACC15]">
                    {settings.premiumActive ? 'Active Member' : 'Free Trial Ready'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-purple-100 leading-relaxed">
                  Unlock 4 GB file uploads, faster media downloads, unlimited chat folders, custom
                  app icons, voice-to-text transcripts, and your verified star profile badge.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {(
                    [
                      { id: 'monthly', label: 'Monthly · $4.99/mo' },
                      { id: 'annual', label: 'Annual · $35.99/yr (Save 40%)' },
                    ] as const
                  ).map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => onUpdateSettings({ premiumPlan: plan.id })}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors ${
                        (settings.premiumPlan || 'annual') === plan.id
                          ? 'border-[#FACC15] bg-white/20 text-white'
                          : 'border-white/25 bg-white/5 text-purple-100'
                      }`}
                    >
                      {plan.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const next = !settings.premiumActive;
                    onUpdateSettings({ premiumActive: next });
                    showNotice(
                      next
                        ? 'Sarigram Premium activated on your account!'
                        : 'Sarigram Premium membership paused.'
                    );
                  }}
                  className="w-full h-11 rounded-xl bg-[#FACC15] hover:bg-[#FDE047] text-[#1E1B4B] font-display font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  {settings.premiumActive ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Sarigram Premium Active (Manage)</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Subscribe to Sarigram Premium</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { title: '4 GB File & Media Uploads', desc: 'Share full-resolution videos and archives.' },
                  { title: 'Faster Cloud Downloads', desc: 'Priority media streaming and document sync.' },
                  { title: 'Unlimited Chat Folders', desc: 'Organize up to 20 custom folders and 200 chats.' },
                  { title: 'Voice-to-Text Conversion', desc: 'Read any incoming voice message instantly.' },
                  { title: 'Premium Star Profile Badge', desc: 'Stand out across groups and broadcast channels.' },
                  { title: 'Custom App Icons & Themes', desc: 'Exclusive Android & desktop branding styles.' },
                ].map((perk) => (
                  <div
                    key={perk.title}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] space-y-1"
                  >
                    <div className="font-display font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                      <span>{perk.title}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">{perk.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Sarigram Business */}
          {tab === 'business' && (
            <div className="space-y-4 text-sm">
              <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Briefcase className="w-5 h-5 text-[#5B5CE6] dark:text-[#A78BFA] shrink-0" />
                  <div className="min-w-0">
                    <div className="font-display font-semibold">Sarigram Business Mode</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Opening hours, greeting &amp; away replies, and quick response shortcuts
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ businessEnabled: !settings.businessEnabled })}
                  aria-label="Toggle Sarigram Business"
                  className={`w-10 h-5.5 rounded-full p-0.5 transition-colors shrink-0 ${
                    settings.businessEnabled ? 'bg-[#5B5CE6]' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${
                      settings.businessEnabled ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Opening Hours</span>
                  </label>
                  <input
                    type="text"
                    value={settings.businessHours ?? 'Mon–Sat · 09:00 – 18:00'}
                    onChange={(e) => onUpdateSettings({ businessHours: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Greeting Message (for new customer chats)
                  </label>
                  <textarea
                    rows={2}
                    value={
                      settings.businessGreeting ??
                      'Welcome! Thanks for messaging us on Sarigram. How can we assist you?'
                    }
                    onChange={(e) => onUpdateSettings({ businessGreeting: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Away Message (outside opening hours)
                  </label>
                  <textarea
                    rows={2}
                    value={
                      settings.businessAway ??
                      'We are currently away. Leave your message and we will reply first thing in the morning.'
                    }
                    onChange={(e) => onUpdateSettings({ businessAway: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6] resize-none"
                  />
                </div>
              </div>

              {/* Quick Replies */}
              <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] p-4 space-y-3">
                <div className="text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA]">
                  Quick Replies ({quickReplies.length})
                </div>
                <div className="space-y-1.5">
                  {quickReplies.map((qr) => (
                    <div
                      key={qr.id}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-[#1E2B38] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-mono font-bold text-[#5B5CE6] dark:text-[#60A5FA]">
                          {qr.shortcut}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 ml-2">
                          {qr.message}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSettings({
                            businessQuickReplies: quickReplies.filter((x) => x.id !== qr.id),
                          })
                        }
                        aria-label={`Remove ${qr.shortcut}`}
                        className="text-slate-400 hover:text-rose-500 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddQuickReply} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={quickShortcut}
                    onChange={(e) => setQuickShortcut(e.target.value)}
                    placeholder="/shortcut"
                    className="sm:w-28 h-9 px-3 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                  />
                  <input
                    type="text"
                    value={quickMessage}
                    onChange={(e) => setQuickMessage(e.target.value)}
                    placeholder="Quick reply text..."
                    className="flex-1 h-9 px-3 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] text-xs focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                  />
                  <button
                    type="submit"
                    className="h-9 px-3 rounded-xl bg-[#5B5CE6] text-white text-xs font-semibold flex items-center justify-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 3. Sarigram Stars */}
          {tab === 'stars' && (
            <div className="space-y-4">
              <div className="rounded-2xl p-5 bg-gradient-to-r from-[#022A8E] via-[#4338CA] to-[#7C3AED] text-white flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-sky-100">Your Sarigram Stars Balance</div>
                  <div className="font-display font-bold text-3xl mt-0.5 flex items-center gap-2 tabular-nums">
                    <Star className="w-7 h-7 text-[#FACC15] fill-[#FACC15]" />
                    <span>{starBalance.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-sky-100/90 mt-1">
                    Use Stars to send Gifts, support creators, and unlock digital content.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab('gift')}
                  className="px-4 py-2.5 rounded-xl bg-[#FACC15] hover:bg-[#FDE047] text-[#011657] font-display font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Gift className="w-4 h-4" />
                  <span>Send a Gift</span>
                </button>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  Top Up Sarigram Stars
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {STAR_PACKS.map((pack) => (
                    <button
                      key={pack.amount}
                      type="button"
                      onClick={() => handleTopUpStars(pack.amount, pack.label)}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] hover:border-[#7C3AED] text-left transition-colors"
                    >
                      <div className="flex items-center gap-1 font-display font-bold text-sm tabular-nums">
                        <Star className="w-4 h-4 text-[#EAB308] fill-[#EAB308]" />
                        <span>+{pack.amount}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {pack.label} · {pack.price}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] overflow-hidden divide-y divide-slate-200/80 dark:divide-[#242F3D]">
                <div className="px-4 py-2.5 text-xs font-semibold text-[#5B5CE6] dark:text-[#60A5FA]">
                  Recent Star Activity
                </div>
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="font-medium truncate">{tx.title}</span>
                    <span
                      className={`font-mono tabular-nums font-bold shrink-0 ${
                        tx.amount >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} ★
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Send a Gift */}
          {tab === 'gift' && (
            <form onSubmit={handleSendGift} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  1. Choose Recipient
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {contacts.map((c) => {
                    const active = c.id === selectedContactId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedContactId(c.id)}
                        className={`px-3 py-2 rounded-xl border flex items-center gap-2.5 text-left transition-colors ${
                          active
                            ? 'border-[#7C3AED] bg-[#7C3AED]/10'
                            : 'border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26]'
                        }`}
                      >
                        <Avatar
                          name={`${c.firstName} ${c.lastName}`}
                          color={c.avatarColor}
                          imageUrl={c.avatarUrl}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold truncate">
                            {c.firstName} {c.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">@{c.username}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    2. Pick a Sarigram Gift
                  </span>
                  <span className="text-xs font-mono tabular-nums font-semibold text-[#7C3AED] dark:text-[#C4B5FD]">
                    Balance: {starBalance} ★
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GIFT_CATALOG.map((gift) => {
                    const active = gift.id === selectedGiftId;
                    return (
                      <button
                        key={gift.id}
                        type="button"
                        onClick={() => setSelectedGiftId(gift.id)}
                        className={`p-3 rounded-2xl border text-center space-y-1 transition-colors ${
                          active
                            ? 'border-[#7C3AED] bg-[#7C3AED]/10'
                            : 'border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26]'
                        }`}
                      >
                        <div className="text-2xl">{gift.emoji}</div>
                        <div className="text-xs font-semibold truncate">{gift.name}</div>
                        <div className="text-[11px] font-mono tabular-nums font-bold text-[#EAB308]">
                          {gift.cost} Stars
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Personal Message (optional)
                </label>
                <input
                  type="text"
                  value={giftNote}
                  onChange={(e) => setGiftNote(e.target.value)}
                  placeholder="Write a note with your gift..."
                  className="w-full h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-gradient-to-r from-[#5B5CE6] to-[#7C3AED] hover:opacity-95 text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition-opacity"
              >
                <Send className="w-4 h-4" />
                <span>Send Gift in Chat</span>
              </button>

              {sentGifts.length > 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] p-3 space-y-1.5">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Recently Sent Gifts
                  </div>
                  {sentGifts.slice(0, 3).map((g) => (
                    <div key={g.id} className="text-xs flex items-center justify-between gap-2">
                      <span className="truncate">
                        {g.giftName} → {g.recipientName}
                      </span>
                      <span className="font-mono tabular-nums text-[#EAB308] shrink-0">
                        {g.starsCost} ★
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </form>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span>Sarigram Plus · Cloud Ecosystem</span>
          <span className="font-bold italic text-red-600 dark:text-red-400">
            Developed by Sadam A Qaallicha
          </span>
        </div>
      </div>
    </div>
  );
}
