import type { ChatThread } from '../types/sarigram';

export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatChatListTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return formatMessageTime(iso);
  }
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function formatDateDivider(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  ) {
    return 'Yesterday';
  }
  return date.toLocaleDateString([], { month: 'long', day: 'numeric' });
}

export function formatLastSeen(value?: string): string {
  if (!value) return 'last seen recently';
  if (value === 'online' || value.startsWith('last seen')) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (diffMins < 1) return 'last seen just now';
  if (diffMins < 60) return `last seen ${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `last seen ${diffHours}h ago`;
  return `last seen ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
}

export function formatCompactCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'S';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function getChatDisplay(
  chat: ChatThread,
  currentUserId: string
): { title: string; avatarColor: string; avatarUrl?: string; peerId?: string } {
  if (chat.type !== 'private') {
    return {
      title: chat.title,
      avatarColor: chat.avatarColor,
      avatarUrl: chat.avatarUrl,
    };
  }
  const peerId = chat.memberIds.find((id) => id !== currentUserId);
  if (!peerId) {
    return {
      title: chat.title,
      avatarColor: chat.avatarColor,
      avatarUrl: chat.avatarUrl,
    };
  }
  const resolvedName = chat.participantNames?.[peerId] || chat.title;
  const resolvedAvatar = chat.participantAvatars?.[peerId];
  return {
    title: resolvedName,
    avatarColor: resolvedAvatar?.color || chat.avatarColor,
    avatarUrl: resolvedAvatar?.url ?? chat.avatarUrl,
    peerId,
  };
}

export function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  } catch {
    // ignore autoplay restriction
  }
}
