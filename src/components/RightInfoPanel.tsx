import { useMemo, useState } from 'react';
import {
  AtSign,
  BadgeCheck,
  Bell,
  Check,
  Copy,
  FileText,
  Info,
  Link2,
  Search,
  Send,
  X,
} from 'lucide-react';
import { Avatar } from './Avatar';
import { formatMessageTime, getChatDisplay } from '../utils/formatters';
import type {
  ChatMessage,
  ChatThread,
  CommentItem,
  ContactItem,
  UserProfile,
} from '../types/sarigram';

interface RightInfoPanelProps {
  mode: 'closed' | 'info' | 'search' | 'comments';
  chat: ChatThread | null;
  messages: ChatMessage[];
  contacts: ContactItem[];
  comments: CommentItem[];
  activeCommentMessageId: string | null;
  currentUser: UserProfile;
  onlineUserIds: string[];
  onClose: () => void;
  onUpdateChat: (chatId: string, patch: Partial<ChatThread>) => void;
  onAddComment: (comment: CommentItem) => void;
  onOpenLightbox: (url: string, caption?: string) => void;
  onJumpToMessage: (messageId: string) => void;
}

export function RightInfoPanel({
  mode,
  chat,
  messages,
  contacts,
  comments,
  activeCommentMessageId,
  currentUser,
  onlineUserIds,
  onClose,
  onUpdateChat,
  onAddComment,
  onOpenLightbox,
  onJumpToMessage,
}: RightInfoPanelProps) {
  const [infoTab, setInfoTab] = useState<'media' | 'files' | 'members'>('media');
  const [searchQuery, setSearchQuery] = useState('');
  const [commentText, setCommentText] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const mediaMessages = useMemo(
    () => messages.filter((m) => (m.type === 'image' || m.type === 'video') && m.mediaUrl),
    [messages]
  );

  const fileMessages = useMemo(
    () => messages.filter((m) => m.type === 'file'),
    [messages]
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return messages.filter(
      (m) =>
        m.text.toLowerCase().includes(q) ||
        m.fileName?.toLowerCase().includes(q) ||
        m.poll?.question.toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  const activePost = useMemo(
    () => messages.find((m) => m.id === activeCommentMessageId) || null,
    [messages, activeCommentMessageId]
  );

  const postComments = useMemo(
    () => comments.filter((c) => c.messageId === activeCommentMessageId),
    [comments, activeCommentMessageId]
  );

  if (mode === 'closed' || !chat) return null;

  const display = getChatDisplay(chat, currentUser.id);

  const groupMembers = chat.memberIds
    .map((id) => {
      if (id === currentUser.id) {
        return {
          id: currentUser.id,
          name: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
          username: currentUser.username,
          color: currentUser.avatarColor,
          avatarUrl: currentUser.avatarUrl,
          isOnline: true,
          role: chat.adminIds.includes(id) ? 'admin' : undefined,
        };
      }
      const contact = contacts.find((c) => c.id === id);
      if (!contact) return null;
      return {
        id: contact.id,
        name: `${contact.firstName} ${contact.lastName}`.trim(),
        username: contact.username,
        color: contact.avatarColor,
        avatarUrl: contact.avatarUrl,
        isOnline: onlineUserIds.includes(contact.id),
        role: chat.adminIds.includes(contact.id) ? 'admin' : undefined,
      };
    })
    .filter(Boolean) as {
    id: string;
    name: string;
    username: string;
    color: string;
    avatarUrl?: string;
    isOnline: boolean;
    role?: string;
  }[];

  const handleCopyShareLink = () => {
    const link = `https://sari.me/${chat.username || chat.id}`;
    navigator.clipboard?.writeText(link).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1600);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !activeCommentMessageId) return;
    onAddComment({
      id: `cmt-${crypto.randomUUID()}`,
      messageId: activeCommentMessageId,
      chatId: chat.id,
      authorId: currentUser.id,
      authorName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
      authorAvatarColor: currentUser.avatarColor,
      text: commentText.trim(),
      timestamp: new Date().toISOString(),
    });
    setCommentText('');
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-30 w-full sm:w-[340px] lg:static lg:w-[340px] shrink-0 bg-white dark:bg-[#17212B] border-l border-slate-200 dark:border-[#101921] flex flex-col h-full">
      {/* Header */}
      <div className="h-[60px] px-4 border-b border-slate-200 dark:border-[#101921] flex items-center justify-between shrink-0">
        <h2 className="font-display font-semibold text-[15px] text-slate-900 dark:text-slate-100">
          {mode === 'search'
            ? 'Search Messages'
            : mode === 'comments'
              ? 'Post Discussion'
              : chat.type === 'channel'
                ? 'Channel Info'
                : chat.type === 'group'
                  ? 'Group Info'
                  : 'Profile Info'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#232E3C]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mode 1: In-Chat Search */}
      {mode === 'search' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 dark:border-[#1F2C38]">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in this conversation..."
                autoFocus
                className="w-full h-10 pl-10 pr-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]/45"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {searchQuery.trim() === '' ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-8 px-4">
                Enter a keyword to search across messages, polls, and shared files in {display.title}.
              </p>
            ) : searchResults.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-8">
                No matching messages found.
              </p>
            ) : (
              searchResults.map((msg) => (
                <button
                  key={msg.id}
                  type="button"
                  onClick={() => onJumpToMessage(msg.id)}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#202B36] text-left transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="font-semibold text-[#5B5CE6] dark:text-[#5EB5F7]">
                      {msg.senderName}
                    </span>
                    <span className="text-slate-400 tabular-nums">
                      {formatMessageTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2">
                    {msg.poll?.question || msg.fileName || msg.text}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Channel Post Comments */}
      {mode === 'comments' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {activePost && (
            <div className="p-4 bg-slate-50 dark:bg-[#131C26] border-b border-slate-200 dark:border-[#101921]">
              <div className="text-xs font-semibold text-[#5B5CE6] dark:text-[#5EB5F7] mb-1">
                {activePost.senderName}
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-100 line-clamp-3">
                {activePost.poll?.question || activePost.text}
              </p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {postComments.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500 dark:text-slate-400">
                No comments yet. Start the discussion below.
              </div>
            ) : (
              postComments.map((cmt) => (
                <div key={cmt.id} className="flex items-start gap-2.5">
                  <Avatar name={cmt.authorName} color={cmt.authorAvatarColor} size="xs" />
                  <div className="flex-1 min-w-0 bg-slate-50 dark:bg-[#1E2B38] rounded-xl px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#5B5CE6] dark:text-[#5EB5F7] truncate">
                        {cmt.authorName}
                      </span>
                      <span className="text-[11px] text-slate-400 tabular-nums">
                        {formatMessageTime(cmt.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-100 mt-0.5 break-words">
                      {cmt.text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={handleCommentSubmit}
            className="p-3 border-t border-slate-200 dark:border-[#101921] flex items-center gap-2"
          >
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 h-10 px-3.5 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]/45"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              aria-label="Post comment"
              className="w-10 h-10 rounded-full bg-[#5B5CE6] disabled:opacity-45 text-white flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Mode 3: Info Panel */}
      {mode === 'info' && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 flex flex-col items-center text-center border-b border-slate-200 dark:border-[#101921]">
            <Avatar
              name={display.title}
              color={display.avatarColor}
              imageUrl={display.avatarUrl}
              type={chat.type}
              size="xl"
            />
            <div className="flex items-center gap-1.5 mt-3">
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100">
                {display.title}
              </h3>
              {chat.verified && (
                <BadgeCheck className="w-4.5 h-4.5 text-[#5B5CE6] dark:text-[#5EB5F7]" />
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              {chat.type === 'channel'
                ? `${(chat.subscriberCount || 1).toLocaleString()} subscribers`
                : chat.type === 'group'
                  ? `${(chat.memberCount || chat.memberIds.length).toLocaleString()} members`
                  : chat.type === 'saved'
                    ? 'Cloud Notes & Bookmarks'
                    : `@${chat.username || 'sarigram'}`}
            </p>
          </div>

          <div className="px-4 py-3 space-y-3 border-b border-slate-200 dark:border-[#101921] text-sm">
            {chat.description && (
              <div className="flex items-start gap-3">
                <Info className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                    {chat.description}
                  </p>
                  <span className="text-xs text-slate-400">Bio</span>
                </div>
              </div>
            )}

            {chat.username && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <AtSign className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      @{chat.username}
                    </div>
                    <div className="text-xs text-slate-400">Username</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#232E3C] text-xs font-medium text-[#5B5CE6] dark:text-[#5EB5F7] flex items-center gap-1 shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy link'}</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => onUpdateChat(chat.id, { isMuted: !chat.isMuted })}
              className="w-full py-1.5 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4.5 h-4.5 text-slate-400" />
                <span className="text-slate-800 dark:text-slate-200 font-medium">Notifications</span>
              </div>
              <div
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${
                  !chat.isMuted ? 'bg-[#5B5CE6]' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${
                    !chat.isMuted ? 'translate-x-4.5' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          </div>

          <div className="flex border-b border-slate-200 dark:border-[#101921] px-2">
            {(
              [
                { id: 'media', label: `Media (${mediaMessages.length})` },
                { id: 'files', label: `Files (${fileMessages.length})` },
                ...(chat.type === 'group'
                  ? [{ id: 'members', label: `Members (${groupMembers.length})` }]
                  : []),
              ] as { id: 'media' | 'files' | 'members'; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setInfoTab(tab.id)}
                className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  infoTab === tab.id
                    ? 'border-[#5B5CE6] text-[#5B5CE6] dark:text-[#5EB5F7]'
                    : 'border-transparent text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-3">
            {infoTab === 'media' && (
              mediaMessages.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-8">
                  No shared photos or videos yet.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {mediaMessages.map((m) =>
                    m.type === 'video' ? (
                      <div
                        key={m.id}
                        className="aspect-square rounded-lg overflow-hidden bg-black"
                      >
                        <video src={m.mediaUrl} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => onOpenLightbox(m.mediaUrl!, m.text)}
                        className="aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-[#242F3D]"
                      >
                        <img
                          src={m.mediaUrl}
                          alt={m.text || 'Media'}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </button>
                    )
                  )}
                </div>
              )
            )}

            {infoTab === 'files' && (
              fileMessages.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-8">
                  No shared files yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {fileMessages.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-[#1E2B38]"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#5B5CE6]/15 text-[#5B5CE6] flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate">{m.fileName}</div>
                        <div className="text-[11px] text-slate-400 tabular-nums">
                          {m.fileSize} · {formatMessageTime(m.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {infoTab === 'members' && (
              <div className="space-y-1">
                {groupMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#1E2B38]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        name={member.name}
                        color={member.color}
                        imageUrl={member.avatarUrl}
                        size="sm"
                        isOnline={member.isOnline}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{member.name}</div>
                        <div className="text-xs text-slate-400 truncate">
                          {member.isOnline ? 'online' : `@${member.username}`}
                        </div>
                      </div>
                    </div>
                    {member.role && (
                      <span className="text-[11px] font-medium text-[#5B5CE6] dark:text-[#5EB5F7] shrink-0">
                        {member.role}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1F2C38] flex items-center gap-2 text-xs text-slate-400">
              <Link2 className="w-3.5 h-3.5" />
              <span className="truncate">sari.me/{chat.username || chat.id}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
