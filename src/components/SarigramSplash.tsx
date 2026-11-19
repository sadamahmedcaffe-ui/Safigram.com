import { X } from 'lucide-react';

interface SarigramSplashProps {
  appName?: string;
  loadingText?: string;
  isPreview?: boolean;
  onClosePreview?: () => void;
}

export function SarigramSplash({
  appName = 'Sarigram',
  loadingText = 'Loading...',
  isPreview = false,
  onClosePreview,
}: SarigramSplashProps) {
  const trimmedName = (appName || 'Sarigram').trim();
  const isDefaultName = trimmedName.toLowerCase() === 'sarigram';

  return (
    <div
      role={isPreview ? 'dialog' : 'status'}
      aria-label="Sarigram splash screen"
      className={`${
        isPreview ? 'fixed inset-0 z-50' : 'flex-1 min-h-full w-full'
      } relative overflow-hidden flex flex-col items-center justify-between text-white select-none`}
      style={{
        background:
          'radial-gradient(circle at 50% 24%, #0B46C8 0%, #022A8E 45%, #011657 100%)',
      }}
    >
      {/* Subtle atmospheric glow behind emblem */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[12%] left-1/2 -translate-x-1/2 w-[360px] h-[360px] rounded-full opacity-45 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(56,189,248,0.55) 0%, rgba(2,42,142,0) 70%)',
        }}
      />

      {isPreview && onClosePreview && (
        <button
          type="button"
          onClick={onClosePreview}
          className="absolute top-4 right-4 z-30 h-9 px-3.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Close Preview</span>
        </button>
      )}

      {/* Top/Center Brand Emblem + Wordmark + Tagline */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 pt-12 sm:pt-16">
        <div className="relative mb-5">
          <div
            aria-hidden="true"
            className="absolute -inset-3 rounded-[36px] bg-sky-400/25 blur-xl"
          />
          <img
            src="/pwa-512x512.png"
            alt="Sarigram App Icon"
            referrerPolicy="no-referrer"
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[28px] shadow-[0_18px_45px_rgba(0,10,45,0.55)] ring-1 ring-white/25 object-cover"
          />
        </div>

        <div className="flex flex-col items-center">
          <h1 className="font-display font-bold text-4xl sm:text-5xl tracking-tight leading-none drop-shadow-[0_4px_14px_rgba(0,0,0,0.4)]">
            {isDefaultName ? (
              <>
                <span className="text-white">Sari</span>
                <span className="text-[#FACC15]">gram</span>
              </>
            ) : (
              <span className="text-white">{trimmedName}</span>
            )}
          </h1>

          {/* Signature gold-to-white curved swoosh */}
          <svg
            viewBox="0 0 220 18"
            className="w-48 sm:w-56 h-4 mt-1.5"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="sarigram-arc" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FACC15" />
                <stop offset="55%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </linearGradient>
            </defs>
            <path
              d="M8 14 C 68 3, 152 3, 212 14 C 154 7, 72 7, 8 14 Z"
              fill="url(#sarigram-arc)"
            />
          </svg>
        </div>

        <p className="mt-2.5 text-sm sm:text-base font-medium tracking-wide text-white/95 flex items-center justify-center gap-2">
          <span>Connect</span>
          <span className="text-[#FACC15]" aria-hidden="true">•</span>
          <span>Share</span>
          <span className="text-[#FACC15]" aria-hidden="true">•</span>
          <span>Belong</span>
        </p>

        <p className="mt-4 max-w-xs text-sm sm:text-[15px] italic text-sky-100/90 leading-snug">
          A Better Social Media
          <br />
          for a Connected World
        </p>
      </div>

      {/* Bottom Connected-World Artwork + Loading Spinner */}
      <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col items-center mt-auto">
        <div className="relative w-full flex justify-center overflow-hidden">
          <img
            src="/brand/sarigram-splash-network.png"
            alt="Connected global Sarigram community network"
            referrerPolicy="no-referrer"
            className="w-full max-w-[380px] h-auto object-contain object-bottom opacity-95 pointer-events-none"
            style={{
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent 0%, black 22%, black 88%, transparent 100%)',
              maskImage:
                'linear-gradient(to bottom, transparent 0%, black 22%, black 88%, transparent 100%)',
            }}
          />
          <div className="absolute bottom-5 inset-x-0 flex flex-col items-center gap-2">
            <div
              aria-hidden="true"
              className="w-8 h-8 rounded-full border-[3px] border-white/25 border-t-white animate-spin"
            />
            <span className="text-xs font-medium tracking-wide text-white/90 drop-shadow">
              {loadingText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
