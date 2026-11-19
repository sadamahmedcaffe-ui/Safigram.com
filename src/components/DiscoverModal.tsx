import { useEffect, useMemo, useState } from 'react';
import { AtSign, Compass, Megaphone, MessageSquare, Search, UserCheck, X } from 'lucide-react';
import { Avatar } from './Avatar';
import { formatLastSeen } from '../utils/formatters';
import type { SearchUserResult } from '../types/sarigram';

interface DiscoverModalProps {
  currentUserId: string;
  onClose: () => void;
  onSelectResult: (result: SearchUserResult) => void;
}

export function DiscoverModal({
  currentUserId,
  onClose,
  onSelectResult,
}: DiscoverModalProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'users' | 'channels'>('all');
  const [results, setResults] = useState<SearchUserResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      fetch(
        `/api/users/search?q=${encodeURIComponent(query.trim())}&excludeUserId=${encodeURIComponent(
          currentUserId
        )}`
      )
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled && Array.isArray(data.results)) {
            setResults(data.results);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, currentUserId]);

  const filtered = useMemo(() => {
    if (filter === 'users') return results.filter((r) => r.kind !== 'channel');
    if (filter === 'channels') return results.filter((r) => r.kind === 'channel');
    return results;
  }, [results, filter]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/55 backdrop-blur-[1px]" />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] rounded-2xl bg-white dark:bg-[#17212B] text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-200 dark:border-[#242F3D] flex flex-col overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-[#2563EB] via-[#5B5CE6] to-[#7C3AED] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5" />
            <div>
              <h2 className="font-display font-bold text-base">Discover on Sarigram</h2>
              <p className="text-xs text-white/80">Find people and public channels by @username</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close discover"
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-[#242F3D] space-y-3 shrink-0">
          <div className="relative">
            <AtSign className="w-4 h-4 text-[#5B5CE6] dark:text-[#A78BFA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search @username, name, or channel handle..."
              autoFocus
              className="w-full h-11 pl-10 pr-9 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]/50"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear username query"
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'all', label: 'All Results' },
                { id: 'users', label: 'People (@username)' },
                { id: 'channels', label: 'Public Channels' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filter === t.id
                    ? 'bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white'
                    : 'bg-slate-100 dark:bg-[#202B36] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#283644]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
              <Search className="w-4 h-4 animate-pulse" />
              <span>Searching directory...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center px-6">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                No accounts or channels match "{query}"
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Try another @username like @elena_rostova, @mvance, or @sarigram_news.
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={`${item.kind}-${item.id}`}
                className="p-2.5 rounded-xl border border-slate-200/80 dark:border-[#242F3D] hover:border-[#5B5CE6]/45 bg-white dark:bg-[#192430] flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    name={`${item.firstName} ${item.lastName}`}
                    color={item.avatarColor}
                    imageUrl={item.avatarUrl}
                    type={item.kind === 'channel' ? 'channel' : 'private'}
                    size="md"
                    isOnline={item.isOnline}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-semibold text-sm truncate">
                        {item.firstName} {item.lastName}
                      </span>
                      {item.kind === 'channel' ? (
                        <Megaphone className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
                      ) : item.kind === 'user' ? (
                        <UserCheck className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                      ) : null}
                    </div>
                    <div className="text-xs font-mono text-[#5B5CE6] dark:text-[#A78BFA] truncate">
                      @{item.username}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {item.isOnline ? 'online' : formatLastSeen(item.lastSeen)} · {item.bio}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectResult(item);
                    onClose();
                  }}
                  className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:opacity-95 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{item.kind === 'channel' ? 'Open' : 'Message'}</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
