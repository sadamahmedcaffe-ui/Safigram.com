import { useState } from 'react';
import {
  Check,
  Download,
  ExternalLink,
  Globe,
  Share2,
  Smartphone,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface BrandKitModalProps {
  currentAvatarUrl?: string;
  onClose: () => void;
  onPreviewSplash: () => void;
  onApplyProfilePicture: (avatarUrl: string) => void;
}

export function BrandKitModal({
  currentAvatarUrl,
  onClose,
  onPreviewSplash,
  onApplyProfilePicture,
}: BrandKitModalProps) {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [appliedAvatar, setAppliedAvatar] = useState(
    currentAvatarUrl === '/brand/sarigram-profile-512.png'
  );
  const [installNotice, setInstallNotice] = useState<string>('');

  const handleInstallClick = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      setInstallNotice('Sarigram app installed on your device.');
    } else if (outcome === 'dismissed') {
      setInstallNotice('Install dismissed — you can install anytime from your browser menu.');
    }
  };

  const handleApplyAvatar = () => {
    onApplyProfilePicture('/brand/sarigram-profile-512.png');
    setAppliedAvatar(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/55 backdrop-blur-[2px]" />

      <div className="relative z-10 w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-[#17212B] text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-200 dark:border-[#242F3D] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#022688] via-[#1D4ED8] to-[#5B5CE6] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/pwa-512x512.png"
              alt="Sarigram Icon"
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-xl shadow ring-1 ring-white/30 object-cover shrink-0"
            />
            <div className="min-w-0">
              <h2 className="font-display font-bold text-base truncate">
                Sarigram Brand Kit &amp; App Install
              </h2>
              <p className="text-xs text-sky-100/90 truncate">
                Android Icon · Website Favicon · Splash Branding · Social Profile Picture
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close brand kit"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/90 hover:bg-white/15 shrink-0"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Install Banner */}
          <div className="rounded-2xl p-4 bg-gradient-to-r from-[#011B69] via-[#022A8E] to-[#1D4ED8] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5 min-w-0">
              <img
                src="/pwa-512x512.png"
                alt="Sarigram Android Icon"
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-2xl shadow-md ring-1 ring-white/25 shrink-0"
              />
              <div className="min-w-0">
                <div className="font-display font-bold text-sm sm:text-base">
                  Install Sarigram on Android &amp; Desktop
                </div>
                <p className="text-xs text-sky-100/90 mt-0.5">
                  {isInstalled
                    ? 'Sarigram is running in standalone app mode with offline brand caching.'
                    : isIOS
                      ? 'On iOS Safari, tap the Share button and choose "Add to Home Screen".'
                      : 'Add the Sarigram app icon to your home screen with adaptive Android maskable support.'}
                </p>
                {installNotice && (
                  <p className="text-xs text-[#FACC15] font-medium mt-1">{installNotice}</p>
                )}
              </div>
            </div>

            {isInstallable && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-4 py-2.5 rounded-xl bg-[#FACC15] hover:bg-[#FDE047] text-[#011657] font-display font-bold text-xs flex items-center gap-2 whitespace-nowrap shrink-0 shadow transition-colors"
              >
                <Smartphone className="w-4 h-4" />
                <span>Install App</span>
              </button>
            )}
            {isInstalled && (
              <span className="px-3.5 py-2 rounded-xl bg-white/15 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0">
                <Check className="w-4 h-4 text-[#FACC15]" />
                <span>Installed</span>
              </span>
            )}
          </div>

          {/* 4 Deliverables Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Android App Icon */}
            <section className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] p-4 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
                    <h3 className="font-display font-semibold text-sm">1. Android App Icon</h3>
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    192px · 512px
                  </span>
                </div>

                <div className="flex items-center justify-around gap-3 py-3 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200/80 dark:border-[#2C3B4B]">
                  <div className="flex flex-col items-center gap-1.5">
                    <img
                      src="/pwa-512x512.png"
                      alt="Sarigram Standard Squircle App Icon"
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-2xl shadow-md object-cover"
                    />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Squircle (any)
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <img
                      src="/pwa-maskable-512x512.png"
                      alt="Sarigram Android Adaptive Maskable Icon"
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-full shadow-md object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                    />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Adaptive (maskable)
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <img
                      src="/apple-touch-icon.png"
                      alt="Sarigram iOS Apple Touch Icon"
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-[14px] shadow-md object-cover"
                    />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      180px Touch
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href="/pwa-512x512.png"
                  download="sarigram-android-icon-512.png"
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] hover:border-[#2563EB] text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                  <span>512px Icon</span>
                </a>
                <a
                  href="/pwa-maskable-512x512.png"
                  download="sarigram-android-maskable-512.png"
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] hover:border-[#2563EB] text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                  <span>Maskable</span>
                </a>
              </div>
            </section>

            {/* 2. Website Favicon */}
            <section className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] p-4 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
                    <h3 className="font-display font-semibold text-sm">2. Website Favicon</h3>
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    ICO · 16–64px
                  </span>
                </div>

                {/* Browser Tab Mock Preview */}
                <div className="rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200/80 dark:border-[#2C3B4B] p-3 space-y-3">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#141D26] border border-slate-200 dark:border-[#242F3D]">
                    <img
                      src="/favicon-32x32.png"
                      alt="Sarigram Browser Tab Favicon"
                      referrerPolicy="no-referrer"
                      className="w-4 h-4 rounded-sm shrink-0"
                    />
                    <span className="text-xs font-medium truncate">
                      Sarigram — Connect · Share · Belong
                    </span>
                  </div>
                  <div className="flex items-center justify-around pt-1">
                    <div className="flex flex-col items-center gap-1">
                      <img src="/favicon-16x16.png" alt="16px favicon" className="w-4 h-4" />
                      <span className="text-[10px] font-mono text-slate-400">16px</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <img src="/favicon-32x32.png" alt="32px favicon" className="w-8 h-8 rounded" />
                      <span className="text-[10px] font-mono text-slate-400">32px</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <img
                        src="/favicon-64x64.png"
                        alt="64px favicon"
                        className="w-11 h-11 rounded-lg"
                      />
                      <span className="text-[10px] font-mono text-slate-400">64px</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href="/favicon.ico"
                  download="sarigram-favicon.ico"
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] hover:border-[#2563EB] text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                  <span>favicon.ico</span>
                </a>
                <a
                  href="/favicon-64x64.png"
                  download="sarigram-favicon-64x64.png"
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] hover:border-[#2563EB] text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                  <span>64px PNG</span>
                </a>
              </div>
            </section>

            {/* 3. Splash Screen Branding */}
            <section className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] p-4 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
                    <h3 className="font-display font-semibold text-sm">
                      3. Splash Screen Branding
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Active on Launch
                  </span>
                </div>

                <div className="rounded-xl overflow-hidden bg-[#011657] border border-slate-200/80 dark:border-[#2C3B4B] flex items-center gap-3 p-3 text-white">
                  <img
                    src="/brand/sarigram-splash-mobile.png"
                    alt="Sarigram Mobile Splash Screen Preview"
                    referrerPolicy="no-referrer"
                    className="w-16 h-28 rounded-lg object-cover shadow-md ring-1 ring-white/20 shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="font-display font-bold text-base leading-tight">
                      <span className="text-white">Sari</span>
                      <span className="text-[#FACC15]">gram</span>
                    </div>
                    <div className="text-[11px] text-sky-100">Connect · Share · Belong</div>
                    <p className="text-[11px] text-sky-200/85 leading-snug">
                      Royal cobalt radial backdrop, glowing globe &amp; paper-plane icon, gold arc,
                      and connected-world network footer.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onPreviewSplash();
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#022A8E] hover:bg-[#0B46C8] text-white text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview Live Splash</span>
                </button>
                <a
                  href="/brand/sarigram-splash-mobile.png"
                  download="sarigram-splash-screen.png"
                  className="px-3 py-2 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] hover:border-[#2563EB] text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                  <span>PNG</span>
                </a>
              </div>
            </section>

            {/* 4. Social Media Profile Picture */}
            <section className="rounded-2xl border border-slate-200 dark:border-[#242F3D] bg-slate-50/70 dark:bg-[#141D26] p-4 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
                    <h3 className="font-display font-semibold text-sm">
                      4. Social Media Profile Picture
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    512×512
                  </span>
                </div>

                <div className="flex items-center justify-around gap-4 py-3 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200/80 dark:border-[#2C3B4B]">
                  <div className="flex flex-col items-center gap-1.5">
                    <img
                      src="/brand/sarigram-profile-512.png"
                      alt="Circular Social Profile Picture"
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-full shadow-md ring-2 ring-[#2563EB]/30 object-cover"
                    />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Circular Crop
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <img
                      src="/brand/sarigram-profile-512.png"
                      alt="Square Social Profile Picture"
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl shadow-md object-cover"
                    />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Square / OG
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleApplyAvatar}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors ${
                    appliedAvatar
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#5B5CE6] hover:bg-[#4F46E5] text-white'
                  }`}
                >
                  {appliedAvatar ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Applied to Profile</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Use as My Avatar</span>
                    </>
                  )}
                </button>
                <a
                  href="/brand/sarigram-profile-512.png"
                  download="sarigram-social-profile-512.png"
                  className="px-3 py-2 rounded-xl bg-white dark:bg-[#1E2B38] border border-slate-200 dark:border-[#2C3B4B] hover:border-[#2563EB] text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                  <span>PNG</span>
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
