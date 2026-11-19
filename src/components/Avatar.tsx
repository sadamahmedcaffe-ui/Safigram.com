import { useState } from 'react';
import { Bookmark, Bot } from 'lucide-react';
import { getInitials } from '../utils/formatters';
import type { ChatType } from '../types/sarigram';

interface AvatarProps {
  name: string;
  color: string;
  imageUrl?: string;
  type?: ChatType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'w-7 h-7 text-[11px]',
  sm: 'w-9 h-9 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

export function Avatar({ name, color, imageUrl, type, size = 'md', isOnline }: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div className={`relative shrink-0 rounded-full select-none ${sizeClass}`}>
      {type === 'saved' ? (
        <div
          className="w-full h-full rounded-full flex items-center justify-center text-white shadow-inner"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' }}
        >
          <Bookmark className={size === 'xl' ? 'w-8 h-8' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
        </div>
      ) : imageUrl && !imgFailed ? (
        <img
          src={imageUrl}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full rounded-full object-cover bg-slate-200 dark:bg-slate-700"
        />
      ) : (
        <div
          className="w-full h-full rounded-full flex items-center justify-center font-display font-semibold text-white tracking-tight"
          style={{
            background: `linear-gradient(145deg, ${color}, ${color}dd)`,
          }}
        >
          {type === 'bot' ? (
            <Bot className={size === 'xl' ? 'w-8 h-8' : 'w-5 h-5'} />
          ) : (
            getInitials(name)
          )}
        </div>
      )}

      {isOnline && (
        <span
          aria-label="Online"
          className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#4FAE4E] ring-2 ring-white dark:ring-[#17212B]"
        />
      )}
    </div>
  );
}
