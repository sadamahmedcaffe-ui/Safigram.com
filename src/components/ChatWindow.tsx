import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  BarChart2,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Copy,
  Download,
  Edit3,
  Eye,
  FileText,
  Film,
  Forward,
  Image as ImageIcon,
  MessageCircle,
  Mic,
  MoreVertical,
  PanelRight,
  Paperclip,
  Pause,
  Phone,
  Pin,
  Play,
  Reply,
  Search,
  Send,
  Smile,
  Square,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { Avatar } from './Avatar';
import {
  formatCompactCount,
  formatDateDivider,
  formatDuration,
  formatLastSeen,
  formatMessageTime,
  getChatDisplay,
} from '../utils/formatters';
import { DEFAULT_APP_CONFIG, getTranslations } from '../utils/i18n';
import type {
  AppConfig,
  AppSettings,
  ChatMessage,
  ChatThread,
  UserProfile,
} from '../types/sarigram';

interface ChatWindowProps {
  chat: ChatThread | null;
  messages: ChatMessage[];
  currentUser: UserProfile;
  settings: AppSettings;
  appConfig?: AppConfig;
  onlineUserIds: string[];
  lastSeenByUser: Record<string, string>;
  typingUsers: { userId: string; userName: string }[];
  rightPanelMode: 'closed' | 'info' | 'search' | 'comments';
  onBackMobile: () => void;
  onToggleRightPanel: (mode: 'closed' | 'info' | 'search' | 'comments') => void;
  onOpenComments: (messageId: string) => void;
  onSendMessage: (msg: ChatMessage) => void;
  onEditMessage: (messageId: string, text: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onReactToMessage: (messageId: string, emoji: string) => void;
  onPinMessage: (chatId: string, messageId: string) => void;
  onVotePoll: (messageId: string, optionId: string) => void;
  onUpdateChat: (chatId: string, patch: Partial<ChatThread>) => void;
  onClearChat: (chatId: string) => void;
  onOpenForward: (message: ChatMessage) => void;
  onOpenCreatePoll: () => void;
  onOpenCall: (kind: 'voice' | 'video') => void;
  onOpenLightbox: (imageUrl: string, caption?: string) => void;
  onTyping: (isTyping: boolean) => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '🔥', '👏', '🤩', '🎉'];
const EMOJI_PALETTE = [
  '😀', '😂', '🥹', '😍', '🤩', '🥳', '😎', '🤔',
  '🙌', '👏', '🔥', '⚡', '❤️', '💙', '✨', '🎉',
  '🚀', '📌', '💡', '📷', '🎧', '☕️', '🌿', '✅',
];
const WAVEFORM_BAR_COUNT = 28;

function getSeededWaveform(seed: string, count = WAVEFORM_BAR_COUNT): number[] {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    hash ^= i * 31 + 17;
    hash = Math.imul(hash, 16777619);
    const norm = ((hash >>> 0) % 75) + 20; // 20..94
    bars.push(norm);
  }
  return bars;
}

function resampleWaveform(samples: number[], targetCount = WAVEFORM_BAR_COUNT): number[] {
  if (samples.length === 0) {
    return Array.from({ length: targetCount }, (_, i) => 24 + ((i * 19) % 52));
  }
  const out: number[] = [];
  for (let i = 0; i < targetCount; i++) {
    const start = Math.floor((i / targetCount) * samples.length);
    const end = Math.max(start + 1, Math.floor(((i + 1) / targetCount) * samples.length));
    let peak = 0;
    for (let j = start; j < end && j < samples.length; j++) {
      if (samples[j] > peak) peak = samples[j];
    }
    out.push(Math.max(18, Math.min(100, Math.round(peak))));
  }
  return out;
}

export function ChatWindow({
  chat,
  messages,
  currentUser,
  settings,
  appConfig = DEFAULT_APP_CONFIG,
  onlineUserIds,
  lastSeenByUser,
  typingUsers,
  rightPanelMode,
  onBackMobile,
  onToggleRightPanel,
  onOpenComments,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onReactToMessage,
  onPinMessage,
  onVotePoll,
  onUpdateChat,
  onClearChat,
  onOpenForward,
  onOpenCreatePoll,
  onOpenCall,
  onOpenLightbox,
  onTyping,
}: ChatWindowProps) {
  const t = getTranslations(settings.language);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [emojiMenuOpen, setEmojiMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [activeReactionPickerId, setActiveReactionPickerId] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const [voiceElapsed, setVoiceElapsed] = useState(0);
  const [playbackIntensity, setPlaybackIntensity] = useState(0);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordingWaveform, setRecordingWaveform] = useState<number[]>(() =>
    Array.from({ length: WAVEFORM_BAR_COUNT }, () => 18)
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const meterIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordAudioCtxRef = useRef<AudioContext | null>(null);
  const playbackAudioCtxRef = useRef<AudioContext | null>(null);
  const recordedLevelsRef = useRef<number[]>([]);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const stopPlaybackResources = () => {
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if (playbackAudioCtxRef.current) {
      playbackAudioCtxRef.current.close().catch(() => {});
      playbackAudioCtxRef.current = null;
    }
    setPlayingVoiceId(null);
    setVoiceProgress(0);
    setVoiceElapsed(0);
    setPlaybackIntensity(0);
  };

  useEffect(() => {
    setReplyTo(null);
    setEditingMsg(null);
    setDraft('');
    setAttachMenuOpen(false);
    setEmojiMenuOpen(false);
    setMoreMenuOpen(false);
    setActiveReactionPickerId(null);
    stopPlaybackResources();
  }, [chat?.id]);

  useEffect(() => {
    return () => {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
      if (meterIntervalRef.current) clearInterval(meterIntervalRef.current);
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      recordAudioCtxRef.current?.close().catch(() => {});
      playbackAudioCtxRef.current?.close().catch(() => {});
      audioPlayerRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.id, messages.length]);

  const messageMap = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    for (const m of messages) map.set(m.id, m);
    return map;
  }, [messages]);

  const pinnedMessage = chat?.pinnedMessageId
    ? messageMap.get(chat.pinnedMessageId) || null
    : null;

  const wallpaperClass = `sarigram-wallpaper-${settings.wallpaper}`;
  const fontSizeClass =
    settings.fontSize === 'sm'
      ? 'text-[13.5px]'
      : settings.fontSize === 'lg'
        ? 'text-[16px]'
        : 'text-[14.5px]';

  if (!chat) {
    return (
      <main
        className={`flex-1 hidden md:flex flex-col items-center justify-center p-8 ${wallpaperClass}`}
      >
        <div className="px-6 py-5 rounded-2xl bg-white/90 dark:bg-[#17212B]/90 backdrop-blur-sm shadow-sm border border-black/5 dark:border-white/5 text-center max-w-sm">
          <img
            src="/pwa-512x512.png"
            alt="Sarigram"
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-2xl mx-auto mb-3 object-cover shadow-md"
          />
          <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
            {appConfig.welcomeTitle || 'Welcome to Sarigram'}
          </h2>
          <p className="text-[11px] font-semibold tracking-wide text-[#022A8E] dark:text-[#60A5FA] mt-0.5">
            Connect • Share • Belong
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5">
            {appConfig.welcomeBody ||
              'Select a chat, group, or channel from the left sidebar to start messaging.'}
          </p>
        </div>
      </main>
    );
  }

  const display = getChatDisplay(chat, currentUser.id);
  const peerOnline = display.peerId ? onlineUserIds.includes(display.peerId) : false;

  const subtitleText = (() => {
    if (typingUsers.length > 0) {
      return `${typingUsers.map((u) => u.userName.split(' ')[0]).join(', ')} ${t.typing}`;
    }
    if (chat.type === 'saved') return t.personalCloudStorage;
    if (chat.type === 'bot') return t.bot;
    if (chat.type === 'channel') {
      return `${(chat.subscriberCount || 1).toLocaleString()} ${t.subscribers}`;
    }
    if (chat.type === 'group') {
      const onlineCount = Math.max(
        1,
        chat.memberIds.filter((id) => onlineUserIds.includes(id) || id === currentUser.id).length
      );
      return `${(chat.memberCount || chat.memberIds.length).toLocaleString()} ${t.members}, ${onlineCount} ${t.online}`;
    }
    if (peerOnline) return t.online;
    return formatLastSeen(display.peerId ? lastSeenByUser[display.peerId] : undefined);
  })();

  const scrollToMessage = (id: string) => {
    const el = document.getElementById(`sarigram-msg-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(id);
      setTimeout(() => setHighlightedMsgId(null), 1600);
    }
  };

  const handleDraftChange = (val: string) => {
    setDraft(val);
    onTyping(val.trim().length > 0);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 1800);
  };

  const handleSubmit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;

    if (editingMsg) {
      onEditMessage(editingMsg.id, trimmed);
      setEditingMsg(null);
      setDraft('');
      onTyping(false);
      return;
    }

    onSendMessage({
      id: `msg-${crypto.randomUUID()}`,
      chatId: chat.id,
      senderId: currentUser.id,
      senderName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
      senderAvatarColor: currentUser.avatarColor,
      senderAvatarUrl: currentUser.avatarUrl,
      type: 'text',
      text: trimmed,
      replyToId: replyTo?.id,
      timestamp: new Date().toISOString(),
      reactions: [],
      readBy: [currentUser.id],
    });

    setDraft('');
    setReplyTo(null);
    setEmojiMenuOpen(false);
    onTyping(false);
  };

  const handleImagePick = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      onSendMessage({
        id: `msg-${crypto.randomUUID()}`,
        chatId: chat.id,
        senderId: currentUser.id,
        senderName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
        senderAvatarColor: currentUser.avatarColor,
        senderAvatarUrl: currentUser.avatarUrl,
        type: 'image',
        text: draft.trim(),
        mediaUrl: reader.result,
        replyToId: replyTo?.id,
        timestamp: new Date().toISOString(),
        reactions: [],
        readBy: [currentUser.id],
      });
      setDraft('');
      setReplyTo(null);
      setAttachMenuOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoPick = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      onSendMessage({
        id: `msg-${crypto.randomUUID()}`,
        chatId: chat.id,
        senderId: currentUser.id,
        senderName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
        senderAvatarColor: currentUser.avatarColor,
        senderAvatarUrl: currentUser.avatarUrl,
        type: 'video',
        text: draft.trim(),
        fileName: file.name,
        mediaUrl: reader.result,
        replyToId: replyTo?.id,
        timestamp: new Date().toISOString(),
        reactions: [],
        readBy: [currentUser.id],
      });
      setDraft('');
      setReplyTo(null);
      setAttachMenuOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFilePick = (file: File | undefined) => {
    if (!file) return;
    const sizeLabel =
      file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;
    const reader = new FileReader();
    reader.onload = () => {
      onSendMessage({
        id: `msg-${crypto.randomUUID()}`,
        chatId: chat.id,
        senderId: currentUser.id,
        senderName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
        senderAvatarColor: currentUser.avatarColor,
        senderAvatarUrl: currentUser.avatarUrl,
        type: 'file',
        text: draft.trim() || `Shared ${file.name}`,
        fileName: file.name,
        fileSize: sizeLabel,
        mediaUrl: typeof reader.result === 'string' ? reader.result : undefined,
        timestamp: new Date().toISOString(),
        reactions: [],
        readBy: [currentUser.id],
      });
      setDraft('');
      setAttachMenuOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const startVoiceRecording = async () => {
    stopPlaybackResources();
    setRecordSeconds(0);
    setRecordingVoice(true);
    setRecordingWaveform(Array.from({ length: WAVEFORM_BAR_COUNT }, () => 18));
    recordedLevelsRef.current = [];
    audioChunksRef.current = [];
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    if (meterIntervalRef.current) clearInterval(meterIntervalRef.current);

    recordIntervalRef.current = setInterval(() => {
      setRecordSeconds((s) => s + 1);
    }, 1000);

    const pushLevel = (level: number) => {
      const clamped = Math.max(15, Math.min(100, Math.round(level)));
      recordedLevelsRef.current.push(clamped);
      setRecordingWaveform((prev) => [...prev.slice(1), clamped]);
    };

    if (localStorage.getItem('sarigram_mic_denied') === 'true') {
      mediaRecorderRef.current = null;
      meterIntervalRef.current = setInterval(() => {
        const tTick = Date.now() / 160;
        const level = 24 + Math.abs(Math.sin(tTick) * 32 + Math.cos(tTick * 1.7) * 18);
        pushLevel(level);
      }, 75);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStorage.removeItem('sarigram_mic_denied');
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.start();

      // Real-time Web Audio API intensity metering
      const AudioCtx =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        recordAudioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.65;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        meterIntervalRef.current = setInterval(() => {
          analyser.getByteTimeDomainData(data);
          let sumSq = 0;
          for (let i = 0; i < data.length; i++) {
            const norm = (data[i] - 128) / 128;
            sumSq += norm * norm;
          }
          const rms = Math.sqrt(sumSq / data.length);
          // Map quiet speech and peaks cleanly into 15..100
          const intensity = 16 + Math.min(84, rms * 320);
          pushLevel(intensity);
        }, 70);
      }
    } catch {
      localStorage.setItem('sarigram_mic_denied', 'true');
      mediaRecorderRef.current = null;
      meterIntervalRef.current = setInterval(() => {
        const tTick = Date.now() / 160;
        const level = 24 + Math.abs(Math.sin(tTick) * 32 + Math.cos(tTick * 1.7) * 18);
        pushLevel(level);
      }, 75);
    }
  };

  const stopVoiceRecording = (sendNote: boolean) => {
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
    if (meterIntervalRef.current) {
      clearInterval(meterIntervalRef.current);
      meterIntervalRef.current = null;
    }
    if (recordAudioCtxRef.current) {
      recordAudioCtxRef.current.close().catch(() => {});
      recordAudioCtxRef.current = null;
    }

    const duration = Math.max(1, recordSeconds);
    const capturedWaveform = resampleWaveform(recordedLevelsRef.current, WAVEFORM_BAR_COUNT);
    setRecordingVoice(false);
    setRecordSeconds(0);

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((tr) => tr.stop());
        if (!sendNote) return;
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          onSendMessage({
            id: `msg-${crypto.randomUUID()}`,
            chatId: chat.id,
            senderId: currentUser.id,
            senderName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
            senderAvatarColor: currentUser.avatarColor,
            senderAvatarUrl: currentUser.avatarUrl,
            type: 'voice',
            text: 'Voice message',
            mediaUrl: typeof reader.result === 'string' ? reader.result : undefined,
            voiceDuration: duration,
            voiceWaveform: capturedWaveform,
            timestamp: new Date().toISOString(),
            reactions: [],
            readBy: [currentUser.id],
          });
        };
        reader.readAsDataURL(blob);
      };
      recorder.stop();
      return;
    }

    if (sendNote) {
      onSendMessage({
        id: `msg-${crypto.randomUUID()}`,
        chatId: chat.id,
        senderId: currentUser.id,
        senderName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
        senderAvatarColor: currentUser.avatarColor,
        senderAvatarUrl: currentUser.avatarUrl,
        type: 'voice',
        text: 'Voice message',
        voiceDuration: duration,
        voiceWaveform: capturedWaveform,
        timestamp: new Date().toISOString(),
        reactions: [],
        readBy: [currentUser.id],
      });
    }
  };

  const startVoicePlayback = (msg: ChatMessage, startRatio = 0) => {
    stopPlaybackResources();
    const totalDur = Math.max(1, msg.voiceDuration || 12);
    const waveform = msg.voiceWaveform || getSeededWaveform(msg.id);
    const clampedRatio = Math.max(0, Math.min(0.98, startRatio));

    setPlayingVoiceId(msg.id);
    setVoiceProgress(clampedRatio);
    setVoiceElapsed(Math.round(clampedRatio * totalDur));

    if (msg.mediaUrl && msg.mediaUrl.startsWith('data:audio')) {
      const audio = new Audio(msg.mediaUrl);
      audioPlayerRef.current = audio;
      let analyser: AnalyserNode | null = null;
      let freqData: Uint8Array<ArrayBuffer> | null = null;

      try {
        const AudioCtx =
          window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          playbackAudioCtxRef.current = ctx;
          const src = ctx.createMediaElementSource(audio);
          analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          src.connect(analyser);
          analyser.connect(ctx.destination);
          freqData = new Uint8Array(analyser.frequencyBinCount);
        }
      } catch {
        analyser = null;
      }

      audio.onloadedmetadata = () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          audio.currentTime = clampedRatio * audio.duration;
        }
      };
      audio.onended = () => {
        stopPlaybackResources();
      };
      audio.play().catch(() => {});

      playbackTimerRef.current = setInterval(() => {
        const activeDur =
          Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : totalDur;
        const ratio = Math.min(1, audio.currentTime / activeDur);
        setVoiceProgress(ratio);
        setVoiceElapsed(Math.round(audio.currentTime));

        if (analyser && freqData) {
          analyser.getByteFrequencyData(freqData);
          let sum = 0;
          for (let i = 0; i < freqData.length; i++) sum += freqData[i];
          setPlaybackIntensity(Math.round((sum / freqData.length / 255) * 100));
        } else {
          const barIdx = Math.min(waveform.length - 1, Math.floor(ratio * waveform.length));
          setPlaybackIntensity(waveform[barIdx] || 50);
        }
      }, 60);
      return;
    }

    // Smooth playback envelope for voice notes without raw audio blob
    const startedAt = Date.now() - clampedRatio * totalDur * 1000;
    playbackTimerRef.current = setInterval(() => {
      const elapsedSec = (Date.now() - startedAt) / 1000;
      if (elapsedSec >= totalDur) {
        stopPlaybackResources();
        return;
      }
      const ratio = elapsedSec / totalDur;
      const barIdx = Math.min(waveform.length - 1, Math.floor(ratio * waveform.length));
      setVoiceProgress(ratio);
      setVoiceElapsed(Math.floor(elapsedSec));
      setPlaybackIntensity(waveform[barIdx] || 50);
    }, 60);
  };

  const toggleVoicePlayback = (msg: ChatMessage) => {
    if (playingVoiceId === msg.id) {
      stopPlaybackResources();
      return;
    }
    startVoicePlayback(msg, 0);
  };

  const copyMessageText = (msg: ChatMessage) => {
    navigator.clipboard?.writeText(msg.text || msg.fileName || '').catch(() => {});
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <main className="flex-1 flex flex-col h-full min-w-0 relative bg-white dark:bg-[#0E1621]">
      {/* Chat Top Header */}
      <header className="h-[60px] px-3 sm:px-4 bg-white dark:bg-[#17212B] border-b border-slate-200 dark:border-[#101921] flex items-center justify-between gap-3 shrink-0 z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBackMobile}
            aria-label="Back to chats"
            className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#232E3C]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => onToggleRightPanel(rightPanelMode === 'info' ? 'closed' : 'info')}
            className="flex items-center gap-3 min-w-0 text-left group"
          >
            <Avatar
              name={display.title}
              color={display.avatarColor}
              imageUrl={display.avatarUrl}
              type={chat.type}
              size="sm"
              isOnline={peerOnline}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1 min-w-0">
                <h1 className="font-display font-semibold text-[15.5px] text-slate-900 dark:text-slate-100 truncate group-hover:text-[#5B5CE6] dark:group-hover:text-[#A78BFA] transition-colors">
                  {display.title}
                </h1>
                {chat.verified && (
                  <BadgeCheck className="w-4 h-4 text-[#5B5CE6] dark:text-[#A78BFA] shrink-0" />
                )}
              </div>
              <p
                className={`text-xs tabular-nums truncate ${
                  typingUsers.length > 0 || peerOnline
                    ? 'text-[#5B5CE6] dark:text-[#A78BFA] font-medium'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {subtitleText}
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0 relative">
          <button
            type="button"
            onClick={() => onToggleRightPanel(rightPanelMode === 'search' ? 'closed' : 'search')}
            aria-label="Search in chat"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              rightPanelMode === 'search'
                ? 'bg-[#5B5CE6]/12 text-[#5B5CE6] dark:text-[#A78BFA]'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#232E3C]'
            }`}
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          {(chat.type === 'private' || chat.type === 'group') && (
            <>
              <button
                type="button"
                onClick={() => onOpenCall('voice')}
                aria-label="Voice call"
                title="Voice call"
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#232E3C] transition-colors"
              >
                <Phone className="w-4.5 h-4.5" />
              </button>
              <button
                type="button"
                onClick={() => onOpenCall('video')}
                aria-label="Video call"
                title="Video call"
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#232E3C] transition-colors"
              >
                <Video className="w-4.5 h-4.5" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => onToggleRightPanel(rightPanelMode === 'info' ? 'closed' : 'info')}
            aria-label="Toggle info panel"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              rightPanelMode === 'info'
                ? 'bg-[#5B5CE6]/12 text-[#5B5CE6] dark:text-[#A78BFA]'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#232E3C]'
            }`}
          >
            <PanelRight className="w-4.5 h-4.5" />
          </button>

          <button
            type="button"
            onClick={() => setMoreMenuOpen((p) => !p)}
            aria-label="Chat options"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#232E3C] transition-colors"
          >
            <MoreVertical className="w-4.5 h-4.5" />
          </button>

          {moreMenuOpen && (
            <div className="absolute right-0 top-11 w-52 rounded-xl bg-white dark:bg-[#1E2B38] shadow-xl border border-slate-200 dark:border-[#2C3B4B] py-1.5 z-30 text-sm">
              <button
                type="button"
                onClick={() => {
                  onUpdateChat(chat.id, { isPinned: !chat.isPinned });
                  setMoreMenuOpen(false);
                }}
                className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-[#283848] text-slate-800 dark:text-slate-100 text-left"
              >
                <Pin className="w-4 h-4 text-slate-500" />
                <span>{chat.isPinned ? 'Unpin Chat' : 'Pin Chat'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateChat(chat.id, { isMuted: !chat.isMuted });
                  setMoreMenuOpen(false);
                }}
                className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-[#283848] text-slate-800 dark:text-slate-100 text-left"
              >
                {chat.isMuted ? (
                  <Bell className="w-4 h-4 text-slate-500" />
                ) : (
                  <BellOff className="w-4 h-4 text-slate-500" />
                )}
                <span>{chat.isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
              </button>
              <div className="my-1 border-t border-slate-100 dark:border-[#2C3B4B]" />
              <button
                type="button"
                onClick={() => {
                  onClearChat(chat.id);
                  setMoreMenuOpen(false);
                }}
                className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 text-left"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear History</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Pinned Message Bar */}
      {pinnedMessage && (
        <div className="px-4 py-2 bg-white/95 dark:bg-[#17212B]/95 border-b border-slate-200 dark:border-[#101921] flex items-center justify-between gap-3 z-10">
          <button
            type="button"
            onClick={() => scrollToMessage(pinnedMessage.id)}
            className="flex items-center gap-3 min-w-0 text-left flex-1"
          >
            <Pin className="w-4 h-4 text-[#5B5CE6] dark:text-[#A78BFA] shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#5B5CE6] dark:text-[#A78BFA]">
                {t.pinnedMessage}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
                {pinnedMessage.poll?.question || pinnedMessage.text || 'Attachment'}
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onPinMessage(chat.id, pinnedMessage.id)}
            aria-label="Unpin message"
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-[#232E3C]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Message Stream Canvas */}
      <div className={`flex-1 overflow-y-auto px-3 sm:px-6 py-4 ${wallpaperClass}`}>
        <div className="max-w-3xl mx-auto space-y-2.5">
          {messages.length === 0 ? (
            <div className="py-16 flex justify-center">
              <div className="px-5 py-3.5 rounded-2xl bg-white/85 dark:bg-[#17212B]/90 text-center shadow-sm max-w-xs">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {t.noMessagesHere}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t.startConversationHint}
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const prev = idx > 0 ? messages[idx - 1] : null;
              const prevDate = prev ? formatDateDivider(prev.timestamp) : null;
              const currDate = formatDateDivider(msg.timestamp);
              const showDateDivider = currDate !== prevDate;

              const isChannelPost = chat.type === 'channel';
              const isOutgoing = !isChannelPost && msg.senderId === currentUser.id;
              const repliedMsg = msg.replyToId ? messageMap.get(msg.replyToId) : null;
              const isHighlighted = highlightedMsgId === msg.id;
              const isReadByOthers =
                chat.type === 'saved' || msg.readBy.some((id) => id !== msg.senderId);
              const totalPollVotes = msg.poll
                ? msg.poll.options.reduce((sum, o) => sum + o.voterIds.length, 0)
                : 0;

              return (
                <div key={msg.id} id={`sarigram-msg-${msg.id}`}>
                  {showDateDivider && (
                    <div className="my-3 flex justify-center">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-black/25 dark:bg-[#1E2C3A]/85 text-white backdrop-blur-[2px]">
                        {currDate}
                      </span>
                    </div>
                  )}

                  <div
                    className={`group flex items-end gap-2 ${
                      isOutgoing ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!isOutgoing && (chat.type === 'group' || chat.type === 'channel') && (
                      <Avatar
                        name={msg.senderName}
                        color={msg.senderAvatarColor}
                        imageUrl={msg.senderAvatarUrl}
                        size="xs"
                      />
                    )}

                    <div
                      className={`relative max-w-[85%] sm:max-w-[74%] rounded-2xl px-3.5 py-2 shadow-sm transition-all ${
                        isHighlighted ? 'ring-2 ring-[#5B5CE6]' : ''
                      } ${
                        isOutgoing
                          ? 'bg-[#EEF2FF] dark:bg-[#312E81] text-slate-900 dark:text-white rounded-br-sm border border-[#C7D2FE]/60 dark:border-[#4338CA]/50'
                          : 'bg-white dark:bg-[#182533] text-slate-900 dark:text-slate-100 rounded-bl-sm'
                      }`}
                    >
                      {/* Hover Quick Actions */}
                      <div
                        className={`opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity absolute -top-8 ${
                          isOutgoing ? 'right-0' : 'left-0'
                        } flex items-center gap-0.5 px-1.5 py-1 rounded-xl bg-white dark:bg-[#1E2B38] shadow-lg border border-slate-200 dark:border-[#2C3B4B] z-20`}
                      >
                        <button
                          type="button"
                          onClick={() => setReplyTo(msg)}
                          title="Reply"
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2A3948] text-slate-600 dark:text-slate-300"
                        >
                          <Reply className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveReactionPickerId((prevId) =>
                              prevId === msg.id ? null : msg.id
                            )
                          }
                          title="React"
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2A3948] text-slate-600 dark:text-slate-300"
                        >
                          <Smile className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onPinMessage(chat.id, msg.id)}
                          title="Pin"
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2A3948] text-slate-600 dark:text-slate-300"
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenForward(msg)}
                          title="Forward"
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2A3948] text-slate-600 dark:text-slate-300"
                        >
                          <Forward className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => copyMessageText(msg)}
                          title="Copy"
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2A3948] text-slate-600 dark:text-slate-300"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-[#4FAE4E]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {msg.senderId === currentUser.id && msg.type === 'text' && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMsg(msg);
                              setDraft(msg.text);
                            }}
                            title="Edit"
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2A3948] text-slate-600 dark:text-slate-300"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteMessage(msg.id)}
                          title="Delete"
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Quick Emoji Reaction Bar */}
                      {activeReactionPickerId === msg.id && (
                        <div
                          className={`absolute -top-11 ${
                            isOutgoing ? 'right-0' : 'left-0'
                          } flex items-center gap-1 px-2 py-1 rounded-full bg-white dark:bg-[#1E2B38] shadow-xl border border-slate-200 dark:border-[#2C3B4B] z-30`}
                        >
                          {QUICK_REACTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                onReactToMessage(msg.id, emoji);
                                setActiveReactionPickerId(null);
                              }}
                              className="w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-[#2C3B4B] flex items-center justify-center text-base transition-transform hover:scale-115"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Sender Header for Group / Channel */}
                      {!isOutgoing && (chat.type === 'group' || chat.type === 'channel') && (
                        <div className="text-[13px] font-display font-semibold mb-0.5 text-[#5B5CE6] dark:text-[#A78BFA]">
                          {msg.senderName}
                        </div>
                      )}

                      {/* Forwarded Attribution */}
                      {msg.forwardedFrom && (
                        <div className="text-xs italic text-[#5B5CE6] dark:text-[#C4B5FD] mb-1">
                          Forwarded from {msg.forwardedFrom}
                        </div>
                      )}

                      {/* Reply Quote Block */}
                      {repliedMsg && (
                        <button
                          type="button"
                          onClick={() => scrollToMessage(repliedMsg.id)}
                          className="w-full mb-1.5 px-2.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 text-left hover:bg-black/10 dark:hover:bg-white/15 transition-colors"
                        >
                          <div className="text-xs font-semibold text-[#5B5CE6] dark:text-[#C4B5FD] truncate">
                            {repliedMsg.senderName}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
                            {repliedMsg.poll?.question || repliedMsg.text || 'Attachment'}
                          </div>
                        </button>
                      )}

                      {/* Image Attachment */}
                      {msg.type === 'image' && msg.mediaUrl && (
                        <button
                          type="button"
                          onClick={() => onOpenLightbox(msg.mediaUrl!, msg.text)}
                          className="block w-full overflow-hidden rounded-xl mb-1.5 focus:outline-none"
                        >
                          <img
                            src={msg.mediaUrl}
                            alt={msg.text || 'Shared photo'}
                            referrerPolicy="no-referrer"
                            className="max-h-72 w-full object-cover rounded-xl hover:opacity-95 transition-opacity"
                          />
                        </button>
                      )}

                      {/* Video Attachment */}
                      {msg.type === 'video' && msg.mediaUrl && (
                        <div className="overflow-hidden rounded-xl mb-1.5 bg-black">
                          <video
                            src={msg.mediaUrl}
                            controls
                            playsInline
                            className="max-h-72 w-full rounded-xl"
                          />
                        </div>
                      )}

                      {/* File Attachment */}
                      {msg.type === 'file' && (
                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/5 dark:bg-white/10 mb-1.5">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">
                              {msg.fileName || 'Document'}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-300 tabular-nums">
                              {msg.fileSize || 'Document'}
                            </div>
                          </div>
                          {msg.mediaUrl && (
                            <a
                              href={msg.mediaUrl}
                              download={msg.fileName || 'sarigram-file'}
                              aria-label="Download file"
                              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Voice Message */}
                      {msg.type === 'voice' && (() => {
                        const bars = msg.voiceWaveform || getSeededWaveform(msg.id);
                        const isPlaying = playingVoiceId === msg.id;
                        const activeBarFloat = isPlaying ? voiceProgress * bars.length : 0;
                        const activeBarIdx = Math.floor(activeBarFloat);
                        const totalDur = msg.voiceDuration || 12;

                        return (
                          <div className="flex items-center gap-3 py-1 pr-2 min-w-[230px] sm:min-w-[260px]">
                            <button
                              type="button"
                              onClick={() => toggleVoicePlayback(msg)}
                              aria-label={isPlaying ? 'Pause voice' : 'Play voice'}
                              className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white flex items-center justify-center shrink-0 hover:opacity-95 shadow-sm"
                            >
                              {isPlaying ? (
                                <Pause className="w-4.5 h-4.5" />
                              ) : (
                                <Play className="w-4.5 h-4.5 ml-0.5" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div
                                role="slider"
                                aria-label="Voice message waveform"
                                aria-valuemin={0}
                                aria-valuemax={totalDur}
                                aria-valuenow={isPlaying ? voiceElapsed : 0}
                                tabIndex={0}
                                onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const ratio = Math.max(
                                    0,
                                    Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width))
                                  );
                                  startVoicePlayback(msg, ratio);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    toggleVoicePlayback(msg);
                                  }
                                }}
                                className="flex items-center gap-[2.5px] h-7 cursor-pointer select-none"
                              >
                                {bars.map((h, i) => {
                                  const isPlayed = isPlaying && i < activeBarIdx;
                                  const isHead = isPlaying && i === activeBarIdx;
                                  const reactiveBoost = isHead
                                    ? Math.max(h, Math.round(h * 0.55 + playbackIntensity * 0.6))
                                    : h;
                                  const barPx = Math.max(4, Math.round((Math.min(100, reactiveBoost) / 100) * 24));
                                  return (
                                    <span
                                      key={i}
                                      className={`flex-1 min-w-[2.5px] max-w-[4px] rounded-full transition-all duration-75 ${
                                        isHead
                                          ? 'bg-[#7C3AED] dark:bg-[#C4B5FD] scale-y-110'
                                          : isPlayed
                                            ? 'bg-gradient-to-t from-[#2563EB] to-[#5B5CE6] dark:from-[#60A5FA] dark:to-[#A78BFA]'
                                            : 'bg-slate-400/55 dark:bg-slate-300/35 hover:bg-[#5B5CE6]/60'
                                      }`}
                                      style={{ height: `${barPx}px` }}
                                    />
                                  );
                                })}
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-300 tabular-nums mt-0.5">
                                <span>
                                  {isPlaying
                                    ? `${formatDuration(voiceElapsed)} / ${formatDuration(totalDur)}`
                                    : formatDuration(totalDur)}
                                </span>
                                {isPlaying && (
                                  <span className="text-[10px] font-mono text-[#5B5CE6] dark:text-[#A78BFA]">
                                    {playbackIntensity}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Poll Message */}
                      {msg.type === 'poll' && msg.poll && (
                        <div className="min-w-[240px] sm:min-w-[290px] py-1">
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-300 mb-1">
                            {msg.poll.isAnonymous ? 'Anonymous Poll' : 'Poll'} ·{' '}
                            <span className="tabular-nums">{totalPollVotes} votes</span>
                          </div>
                          <div className="font-display font-semibold text-[15px] mb-2.5">
                            {msg.poll.question}
                          </div>
                          <div className="space-y-1.5">
                            {msg.poll.options.map((opt) => {
                              const pct =
                                totalPollVotes > 0
                                  ? Math.round((opt.voterIds.length / totalPollVotes) * 100)
                                  : 0;
                              const voted = opt.voterIds.includes(currentUser.id);
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => onVotePoll(msg.id, opt.id)}
                                  className={`relative w-full text-left px-3 py-2 rounded-xl overflow-hidden border transition-colors ${
                                    voted
                                      ? 'border-[#5B5CE6] bg-[#5B5CE6]/10 dark:bg-[#5B5CE6]/25'
                                      : 'border-slate-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                                  }`}
                                >
                                  <div
                                    className="absolute inset-y-0 left-0 bg-[#5B5CE6]/15 dark:bg-[#7C3AED]/30 transition-all duration-300"
                                    style={{ width: `${pct}%` }}
                                  />
                                  <div className="relative flex items-center justify-between gap-2 text-sm">
                                    <span className="font-medium">{opt.text}</span>
                                    <span className="text-xs font-semibold tabular-nums text-[#5B5CE6] dark:text-[#C4B5FD]">
                                      {pct}%
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Text Body */}
                      {msg.text && msg.type !== 'poll' && msg.type !== 'voice' && (
                        <p className={`${fontSizeClass} leading-relaxed whitespace-pre-wrap break-words`}>
                          {msg.text}
                        </p>
                      )}

                      {/* Reactions */}
                      {msg.reactions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {msg.reactions.map((r) => {
                            const mine = r.userIds.includes(currentUser.id);
                            return (
                              <button
                                key={r.emoji}
                                type="button"
                                onClick={() => onReactToMessage(msg.id, r.emoji)}
                                className={`px-2 py-0.5 rounded-full text-xs font-medium tabular-nums flex items-center gap-1 transition-colors ${
                                  mine
                                    ? 'bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white'
                                    : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15'
                                }`}
                              >
                                <span>{r.emoji}</span>
                                <span>{r.userIds.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Bottom Metadata Line */}
                      <div
                        className={`mt-1 flex items-center justify-end gap-1.5 text-[11px] tabular-nums ${
                          isOutgoing
                            ? 'text-[#4F46E5] dark:text-[#C4B5FD]'
                            : 'text-slate-400 dark:text-slate-400'
                        }`}
                      >
                        {isChannelPost && typeof msg.views === 'number' && (
                          <span className="flex items-center gap-1 mr-1">
                            <Eye className="w-3 h-3" />
                            <span>{formatCompactCount(msg.views)}</span>
                          </span>
                        )}
                        {msg.editedAt && <span>edited</span>}
                        <span>{formatMessageTime(msg.timestamp)}</span>
                        {isOutgoing &&
                          (isReadByOthers ? (
                            <span
                              title="Read"
                              aria-label="Read"
                              className="inline-flex items-center text-[#2563EB] dark:text-[#60A5FA]"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span
                              title="Sent"
                              aria-label="Sent"
                              className="inline-flex items-center opacity-70"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ))}
                      </div>

                      {/* Channel Discussion Comments Bar */}
                      {isChannelPost && (
                        <button
                          type="button"
                          onClick={() => onOpenComments(msg.id)}
                          className="mt-2 pt-2 border-t border-slate-100 dark:border-white/10 w-full flex items-center justify-between text-xs font-medium text-[#5B5CE6] dark:text-[#A78BFA] hover:underline"
                        >
                          <span className="flex items-center gap-1.5">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>
                              {msg.commentsCount && msg.commentsCount > 0
                                ? `${msg.commentsCount} ${
                                    msg.commentsCount === 1 ? t.comment : t.comments
                                  }`
                                : t.leaveComment}
                            </span>
                          </span>
                          <span aria-hidden="true">›</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer Footer */}
      <footer className="bg-white dark:bg-[#17212B] border-t border-slate-200 dark:border-[#101921] px-3 sm:px-4 py-2.5 shrink-0 relative">
        {(replyTo || editingMsg) && (
          <div className="max-w-3xl mx-auto mb-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#202B36] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {editingMsg ? (
                <Edit3 className="w-4 h-4 text-[#5B5CE6] shrink-0" />
              ) : (
                <Reply className="w-4 h-4 text-[#5B5CE6] shrink-0" />
              )}
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#5B5CE6] dark:text-[#A78BFA]">
                  {editingMsg ? 'Edit Message' : `Reply to ${replyTo?.senderName}`}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {editingMsg?.text || replyTo?.poll?.question || replyTo?.text || 'Attachment'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setReplyTo(null);
                setEditingMsg(null);
                if (editingMsg) setDraft('');
              }}
              aria-label="Cancel"
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-[#2B3948]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {emojiMenuOpen && (
          <div className="max-w-3xl mx-auto relative">
            <div className="absolute bottom-3 right-0 w-72 p-3 rounded-2xl bg-white dark:bg-[#1E2B38] shadow-xl border border-slate-200 dark:border-[#2C3B4B] z-30">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Emoji
              </div>
              <div className="grid grid-cols-8 gap-1">
                {EMOJI_PALETTE.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setDraft((d) => `${d}${em}`)}
                    className="h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2B3948] text-lg flex items-center justify-center"
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {attachMenuOpen && (
          <div className="max-w-3xl mx-auto relative">
            <div className="absolute bottom-3 left-0 w-56 py-1.5 rounded-2xl bg-white dark:bg-[#1E2B38] shadow-xl border border-slate-200 dark:border-[#2C3B4B] z-30 text-sm">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-[#283848] text-slate-800 dark:text-slate-100 text-left"
              >
                <ImageIcon className="w-4 h-4 text-[#5B5CE6]" />
                <span>{t.photoOrImage}</span>
              </button>
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-[#283848] text-slate-800 dark:text-slate-100 text-left"
              >
                <Film className="w-4 h-4 text-[#5B5CE6]" />
                <span>{t.videoClip}</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-[#283848] text-slate-800 dark:text-slate-100 text-left"
              >
                <FileText className="w-4 h-4 text-[#7C3AED]" />
                <span>{t.fileDocument}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAttachMenuOpen(false);
                  onOpenCreatePoll();
                }}
                className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-[#283848] text-slate-800 dark:text-slate-100 text-left"
              >
                <BarChart2 className="w-4 h-4 text-[#7C3AED]" />
                <span>{t.createPoll}</span>
              </button>
            </div>
          </div>
        )}

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleImagePick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            handleVideoPick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            handleFilePick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />

        {recordingVoice ? (
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 h-12 px-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40">
            <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="hidden sm:inline">{t.recordingVoiceNote}</span>
              <span className="font-mono tabular-nums font-semibold">
                {formatDuration(recordSeconds)}
              </span>
            </div>

            {/* Live Audio Intensity Recording Waveform */}
            <div
              aria-label="Live recording audio intensity"
              className="flex-1 min-w-0 flex items-center justify-center gap-[2.5px] h-7 overflow-hidden px-1"
            >
              {recordingWaveform.map((level, idx) => (
                <span
                  key={idx}
                  className="flex-1 min-w-[2px] max-w-[4px] rounded-full bg-red-500/85 dark:bg-red-400/90 transition-all duration-75"
                  style={{ height: `${Math.max(4, Math.round((level / 100) * 24))}px` }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => stopVoiceRecording(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => stopVoiceRecording(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white flex items-center gap-1.5"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>{t.send}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto flex items-end gap-2">
            <button
              type="button"
              onClick={() => {
                setAttachMenuOpen((p) => !p);
                setEmojiMenuOpen(false);
              }}
              aria-label="Attach photo, video, file, or poll"
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#232E3C] shrink-0"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <div className="flex-1 flex items-end bg-[#F4F4F5] dark:bg-[#242F3D] rounded-2xl px-3.5 py-2">
              <textarea
                rows={1}
                value={draft}
                onChange={(e) => handleDraftChange(e.target.value)}
                onKeyDown={(e) => {
                  if (settings.enterToSend && e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={
                  chat.type === 'channel'
                    ? t.broadcastPost
                    : t.writeMessage
                }
                className="flex-1 bg-transparent resize-none max-h-32 text-[14.5px] text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none leading-6"
              />
              <button
                type="button"
                onClick={() => {
                  setEmojiMenuOpen((p) => !p);
                  setAttachMenuOpen(false);
                }}
                aria-label="Insert emoji"
                className="ml-2 text-slate-500 dark:text-slate-400 hover:text-[#5B5CE6] dark:hover:text-[#A78BFA] self-end pb-0.5"
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>

            {draft.trim().length > 0 ? (
              <button
                type="button"
                onClick={handleSubmit}
                aria-label="Send message"
                className="w-10 h-10 rounded-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:opacity-95 text-white flex items-center justify-center shrink-0 transition-opacity"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startVoiceRecording}
                aria-label="Record voice message"
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#242F3D] hover:bg-slate-200 dark:hover:bg-[#2E3C4E] text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 transition-colors"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </footer>
    </main>
  );
}
