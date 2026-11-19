import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bot,
  Check,
  Folder,
  FolderPlus,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import { Avatar } from './Avatar';
import { getChatDisplay } from '../utils/formatters';
import { getBrandGradient, getTranslations } from '../utils/i18n';
import type { AppConfig, ChatThread, ChatType, CustomChatFolder } from '../types/sarigram';

interface FolderManagerModalProps {
  open: boolean;
  initialEditFolderId?: string | null;
  chats: ChatThread[];
  currentUserId: string;
  customFolders: CustomChatFolder[];
  language: string;
  brandPreset?: AppConfig['brandPreset'];
  onClose: () => void;
  onSaveFolders: (folders: CustomChatFolder[]) => void;
}

const FOLDER_PRESETS = ['Work', 'Friends', 'Channels', 'Study', 'Family', 'VIP'];

const TYPE_OPTIONS: { type: ChatType; label: string; icon: typeof User }[] = [
  { type: 'private', label: 'Personal', icon: User },
  { type: 'group', label: 'Groups', icon: Users },
  { type: 'channel', label: 'Channels', icon: Megaphone },
  { type: 'bot', label: 'Bots', icon: Bot },
];

export function doesChatMatchCustomFolder(chat: ChatThread, folder: CustomChatFolder): boolean {
  if (folder.excludedChatIds?.includes(chat.id)) return false;
  if (folder.chatIds.includes(chat.id)) return true;
  if (folder.includedTypes && folder.includedTypes.length > 0) {
    if (chat.type === 'saved' && folder.includedTypes.includes('private')) return true;
    return folder.includedTypes.includes(chat.type);
  }
  return false;
}

export function FolderManagerModal({
  open,
  initialEditFolderId,
  chats,
  currentUserId,
  customFolders,
  language,
  brandPreset,
  onClose,
  onSaveFolders,
}: FolderManagerModalProps) {
  const t = getTranslations(language);
  const brandGrad = getBrandGradient(brandPreset);

  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [includedTypes, setIncludedTypes] = useState<ChatType[]>([]);
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [excludedChatIds, setExcludedChatIds] = useState<string[]>([]);
  const [chatSearch, setChatSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setChatSearch('');
    setError('');
    if (initialEditFolderId) {
      const target = customFolders.find((f) => f.id === initialEditFolderId);
      if (target) {
        setEditingId(target.id);
        setNameInput(target.name);
        setIncludedTypes(target.includedTypes || []);
        setSelectedChatIds(target.chatIds || []);
        setExcludedChatIds(target.excludedChatIds || []);
        setMode('edit');
        return;
      }
    }
    setMode('list');
    setEditingId(null);
  }, [open, initialEditFolderId, customFolders]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mode === 'edit' && !initialEditFolderId) {
          setMode('list');
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, mode, initialEditFolderId, onClose]);

  const startCreate = () => {
    setEditingId(null);
    setNameInput('');
    setIncludedTypes([]);
    setSelectedChatIds([]);
    setExcludedChatIds([]);
    setChatSearch('');
    setError('');
    setMode('edit');
  };

  const startEdit = (folder: CustomChatFolder) => {
    setEditingId(folder.id);
    setNameInput(folder.name);
    setIncludedTypes(folder.includedTypes || []);
    setSelectedChatIds(folder.chatIds || []);
    setExcludedChatIds(folder.excludedChatIds || []);
    setChatSearch('');
    setError('');
    setMode('edit');
  };

  const toggleType = (type: ChatType) => {
    setIncludedTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]
    );
  };

  const isChatIncludedInDraft = (chat: ChatThread) => {
    if (excludedChatIds.includes(chat.id)) return false;
    if (selectedChatIds.includes(chat.id)) return true;
    if (chat.type === 'saved' && includedTypes.includes('private')) return true;
    return includedTypes.includes(chat.type);
  };

  const toggleChatInDraft = (chat: ChatThread) => {
    const matchedByType =
      includedTypes.includes(chat.type) ||
      (chat.type === 'saved' && includedTypes.includes('private'));
    const currentlyIncluded = isChatIncludedInDraft(chat);

    if (currentlyIncluded) {
      setSelectedChatIds((prev) => prev.filter((id) => id !== chat.id));
      if (matchedByType) {
        setExcludedChatIds((prev) => (prev.includes(chat.id) ? prev : [...prev, chat.id]));
      }
    } else {
      setExcludedChatIds((prev) => prev.filter((id) => id !== chat.id));
      if (!matchedByType) {
        setSelectedChatIds((prev) => (prev.includes(chat.id) ? prev : [...prev, chat.id]));
      }
    }
  };

  const filteredChats = useMemo(() => {
    const q = chatSearch.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((chat) => {
      const display = getChatDisplay(chat, currentUserId);
      return (
        display.title.toLowerCase().includes(q) ||
        (chat.username && chat.username.toLowerCase().includes(q))
      );
    });
  }, [chats, chatSearch, currentUserId]);

  const draftMatchedCount = useMemo(
    () => chats.filter((c) => isChatIncludedInDraft(c)).length,
    [chats, selectedChatIds, includedTypes, excludedChatIds]
  );

  const handleSaveDraft = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setError('Please enter a folder name.');
      return;
    }
    const nextFolder: CustomChatFolder = {
      id: editingId || `folder-${crypto.randomUUID().slice(0, 8)}`,
      name: trimmed.slice(0, 22),
      includedTypes,
      chatIds: selectedChatIds,
      excludedChatIds,
    };

    const exists = editingId && customFolders.some((f) => f.id === editingId);
    const updated = exists
      ? customFolders.map((f) => (f.id === editingId ? nextFolder : f))
      : [...customFolders, nextFolder];

    onSaveFolders(updated);
    if (initialEditFolderId) {
      onClose();
    } else {
      setMode('list');
      setEditingId(null);
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    onSaveFolders(customFolders.filter((f) => f.id !== folderId));
    if (editingId === folderId) {
      setMode('list');
      setEditingId(null);
    }
  };

  const handleMoveFolder = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= customFolders.length) return;
    const copy = [...customFolders];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    onSaveFolders(copy);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#17212B] border border-slate-200 dark:border-[#243242] shadow-2xl overflow-hidden flex flex-col max-h-[86vh]">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-200 dark:border-[#243242] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {mode === 'edit' && !initialEditFolderId && (
              <button
                type="button"
                onClick={() => setMode('list')}
                aria-label="Back to folders"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#232E3C]"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-8 h-8 rounded-xl bg-gradient-to-br ${brandGrad} text-white flex items-center justify-center shrink-0`}
              >
                {mode === 'edit' ? (
                  <FolderPlus className="w-4 h-4" />
                ) : (
                  <Folder className="w-4 h-4" />
                )}
              </span>
              <div className="min-w-0">
                <h2 className="font-display font-bold text-[15px] text-slate-900 dark:text-slate-100 truncate">
                  {mode === 'edit'
                    ? editingId
                      ? t.editFolder
                      : t.newFolder
                    : t.manageFolders}
                </h2>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 truncate">
                  {mode === 'edit'
                    ? `${draftMatchedCount} chats matched`
                    : 'Organize chats into Telegram-style folder tabs'}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close folder manager"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#232E3C]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {mode === 'list' ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Custom Folders ({customFolders.length})
              </span>
              <button
                type="button"
                onClick={startCreate}
                className={`px-3 py-1.5 rounded-xl bg-gradient-to-r ${brandGrad} text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:opacity-95 whitespace-nowrap shrink-0`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.newFolder}</span>
              </button>
            </div>

            {customFolders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-[#2C3B4B] p-6 text-center">
                <FolderPlus className="w-8 h-8 text-[#5B5CE6] dark:text-[#A78BFA] mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  No custom folders yet
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Create folders like Work, Friends, or Channels to organize your chat list.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {customFolders.map((folder, idx) => {
                  const matchedCount = chats.filter((c) =>
                    doesChatMatchCustomFolder(c, folder)
                  ).length;
                  return (
                    <div
                      key={folder.id}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#273545] bg-slate-50/70 dark:bg-[#1E2A37] flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Folder className="w-4 h-4 text-[#5B5CE6] dark:text-[#A78BFA] shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {folder.name}
                          </div>
                          <div className="text-[11.5px] text-slate-500 dark:text-slate-400 tabular-nums">
                            {matchedCount} {matchedCount === 1 ? 'chat' : 'chats'}
                            {folder.includedTypes && folder.includedTypes.length > 0
                              ? ` · Auto: ${folder.includedTypes.join(', ')}`
                              : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveFolder(idx, -1)}
                          disabled={idx === 0}
                          aria-label={`Move ${folder.name} left`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200/70 dark:hover:bg-[#2A394A] disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveFolder(idx, 1)}
                          disabled={idx === customFolders.length - 1}
                          aria-label={`Move ${folder.name} right`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200/70 dark:hover:bg-[#2A394A] disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(folder)}
                          aria-label={`Edit ${folder.name}`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5B5CE6] dark:text-[#A78BFA] hover:bg-[#5B5CE6]/10"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFolder(folder.id)}
                          aria-label={`Delete ${folder.name}`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-[#243242]">
              <p className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Built-in Tabs
              </p>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {(['all', 'unread', 'personal', 'groups', 'channels', 'bots'] as const).map(
                  (key) => (
                    <div
                      key={key}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1E2A37] text-slate-700 dark:text-slate-300 font-medium text-center truncate"
                    >
                      {t.folders[key]}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Folder Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                {t.folderName}
              </label>
              <input
                type="text"
                value={nameInput}
                maxLength={22}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  setError('');
                }}
                placeholder="e.g. Work, Friends, Study..."
                className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-[#222E3C] border border-slate-200 dark:border-[#2E3E50] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
              />
              {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}

              {!editingId && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {FOLDER_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setNameInput(preset);
                        setError('');
                      }}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#2E3E50] bg-slate-50 dark:bg-[#1E2A37] hover:border-[#5B5CE6] text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auto-include chat types */}
            <div>
              <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                {t.includedTypes} (auto-include)
              </span>
              <div className="grid grid-cols-2 gap-2">
                {TYPE_OPTIONS.map(({ type, label, icon: Icon }) => {
                  const active = includedTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleType(type)}
                      className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 transition-colors ${
                        active
                          ? 'border-[#5B5CE6] bg-[#5B5CE6]/10 text-[#5B5CE6] dark:text-[#A78BFA]'
                          : 'border-slate-200 dark:border-[#2A3848] bg-slate-50/60 dark:bg-[#1E2A37] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#243242]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5" />
                        <span>{label}</span>
                      </span>
                      {active && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Included Chats checklist */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {t.includedChats}
                </span>
                <span className="text-[11.5px] text-slate-500 dark:text-slate-400 tabular-nums">
                  {draftMatchedCount} selected
                </span>
              </div>

              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  placeholder="Filter chats..."
                  className="w-full h-9 pl-8 pr-3 rounded-xl bg-slate-100 dark:bg-[#222E3C] text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]/40"
                />
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
                {filteredChats.map((chat) => {
                  const display = getChatDisplay(chat, currentUserId);
                  const checked = isChatIncludedInDraft(chat);
                  return (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => toggleChatInDraft(chat)}
                      className={`w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-left transition-colors ${
                        checked
                          ? 'bg-[#5B5CE6]/10 dark:bg-[#5B5CE6]/20'
                          : 'hover:bg-slate-100 dark:hover:bg-[#222E3C]'
                      }`}
                    >
                      <Avatar
                        name={display.title}
                        color={display.avatarColor}
                        imageUrl={display.avatarUrl}
                        type={chat.type}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {display.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                          {chat.type}
                        </div>
                      </div>
                      <span
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          checked
                            ? `bg-gradient-to-br ${brandGrad} border-transparent text-white`
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {checked && <Check className="w-3.5 h-3.5" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {mode === 'edit' && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-[#243242] flex items-center justify-between gap-2 bg-slate-50/60 dark:bg-[#131C26]">
            {editingId ? (
              <button
                type="button"
                onClick={() => handleDeleteFolder(editingId)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.deleteFolder}</span>
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => (initialEditFolderId ? onClose() : setMode('list'))}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-[#232E3C]"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                className={`px-4 py-2 rounded-xl bg-gradient-to-r ${brandGrad} text-white text-xs font-semibold shadow-sm hover:opacity-95 whitespace-nowrap shrink-0`}
              >
                {t.saveFolder}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
