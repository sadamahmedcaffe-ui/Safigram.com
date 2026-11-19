import { useState } from 'react';
import {
  Bookmark,
  Bot,
  Briefcase,
  ChevronDown,
  Compass,
  Crown,
  Globe,
  HardDrive,
  HelpCircle,
  Laptop,
  Lock,
  LogIn,
  LogOut,
  Megaphone,
  Moon,
  Palette,
  Pencil,
  Phone,
  Plus,
  Settings,
  Share2,
  Shield,
  Smartphone,
  Star,
  Sun,
  UserPlus,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Avatar } from './Avatar';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  DEFAULT_APP_CONFIG,
  getBrandGradient,
  getTranslations,
  normalizeLanguage,
} from '../utils/i18n';
import type { AppConfig, UserProfile } from '../types/sarigram';

interface DrawerMenuProps {
  open: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  savedAccounts: UserProfile[];
  theme: 'light' | 'dark';
  language: string;
  appConfig?: AppConfig;
  hasAuthToken: boolean;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  onSwitchAccount: (user: UserProfile) => void;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  onOpenDiscover: () => void;
  onOpenAdmin: () => void;
  onOpenEditApps?: () => void;
  onOpenNewGroup: () => void;
  onOpenNewChannel: () => void;
  onOpenContacts: () => void;
  onOpenCalls: () => void;
  onOpenSavedMessages: () => void;
  onOpenSettings: () => void;
  onOpenPrivacySecurity: () => void;
  onOpenDataStorage: () => void;
  onOpenDevices: () => void;
  onOpenPowerSaving: () => void;
  onOpenAutomation: () => void;
  onOpenPlus: (tab: 'premium' | 'business' | 'stars' | 'gift') => void;
  onOpenInviteFriends: () => void;
  onOpenHelpCenter: () => void;
  onOpenBrandKit: () => void;
}

export function DrawerMenu({
  open,
  onClose,
  currentUser,
  savedAccounts,
  theme,
  language,
  appConfig = DEFAULT_APP_CONFIG,
  hasAuthToken,
  onToggleTheme,
  onToggleLanguage,
  onSwitchAccount,
  onOpenAuthModal,
  onSignOut,
  onOpenDiscover,
  onOpenAdmin,
  onOpenEditApps,
  onOpenNewGroup,
  onOpenNewChannel,
  onOpenContacts,
  onOpenCalls,
  onOpenSavedMessages,
  onOpenSettings,
  onOpenPrivacySecurity,
  onOpenDataStorage,
  onOpenDevices,
  onOpenPowerSaving,
  onOpenAutomation,
  onOpenPlus,
  onOpenInviteFriends,
  onOpenHelpCenter,
  onOpenBrandKit,
}: DrawerMenuProps) {
  const [accountsExpanded, setAccountsExpanded] = useState(false);
  const { isInstallable, promptInstall } = usePWAInstall();
  const t = getTranslations(language);
  const langCode = normalizeLanguage(language);
  const isAdmin = currentUser.role === 'admin';
  const brandGrad = getBrandGradient(appConfig.brandPreset);

  const menuAction = (fn: () => void) => {
    onClose();
    fn();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/45 backdrop-blur-[1px]"
          />

          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-[290px] max-w-[85vw] h-full bg-white dark:bg-[#17212B] text-slate-900 dark:text-slate-100 shadow-2xl flex flex-col border-r border-slate-200 dark:border-[#242F3D]"
          >
            {/* Header Profile Block */}
            <div
              className={`bg-gradient-to-br ${brandGrad} dark:from-[#1E293B] dark:via-[#2D2A5E] dark:to-[#3B2667] text-white px-5 pt-5 pb-4`}
            >
              <div className="flex items-start justify-between mb-3">
                <Avatar
                  name={`${currentUser.firstName} ${currentUser.lastName}`}
                  color={currentUser.avatarColor}
                  imageUrl={currentUser.avatarUrl}
                  size="lg"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={onToggleLanguage}
                    aria-label="Switch language En/Ao"
                    className="h-9 px-2.5 rounded-full bg-white/15 hover:bg-white/25 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{langCode === 'ao' ? 'AO' : 'EN'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onToggleTheme}
                    aria-label="Toggle night mode"
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/15 transition-colors"
                  >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close navigation menu"
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/15 transition-colors md:hidden"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAccountsExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between text-left group"
              >
                <div className="min-w-0">
                  <div className="font-display font-semibold text-base truncate">
                    {currentUser.firstName} {currentUser.lastName}
                  </div>
                  <div className="text-xs text-white/85 font-mono tabular-nums truncate">
                    @{currentUser.username} · {isAdmin ? 'Admin' : 'Member'}
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 shrink-0 transition-transform duration-150 ${
                    accountsExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {/* Expandable Account Switcher */}
            {accountsExpanded && (
              <div className="border-b border-slate-200 dark:border-[#242F3D] bg-slate-50 dark:bg-[#141D26] py-2">
                {savedAccounts.map((acc) => {
                  const isActive = acc.id === currentUser.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        onSwitchAccount(acc);
                        setAccountsExpanded(false);
                      }}
                      className="w-full px-5 py-2 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-[#1E2B38] transition-colors text-left"
                    >
                      <Avatar
                        name={`${acc.firstName} ${acc.lastName}`}
                        color={acc.avatarColor}
                        imageUrl={acc.avatarUrl}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">
                          {acc.firstName} {acc.lastName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          @{acc.username}
                        </div>
                      </div>
                      {isActive && (
                        <span className="text-xs font-medium text-[#5B5CE6] dark:text-[#A78BFA]">
                          {t.active}
                        </span>
                      )}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => menuAction(onOpenAuthModal)}
                  className="w-full px-5 py-2.5 flex items-center gap-3 text-sm font-medium text-[#5B5CE6] dark:text-[#A78BFA] hover:bg-slate-100 dark:hover:bg-[#1E2B38] transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-[#5B5CE6]/12 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span>{t.addAccount}</span>
                </button>
              </div>
            )}

            {/* Main Navigation Links */}
            <nav className="flex-1 overflow-y-auto py-2">
              <DrawerItem
                icon={<Compass className="w-5 h-5 text-[#5B5CE6] dark:text-[#A78BFA]" />}
                label={t.discoverMenu}
                onClick={() => menuAction(onOpenDiscover)}
              />
              {isAdmin && (
                <>
                  <DrawerItem
                    icon={<Shield className="w-5 h-5 text-[#7C3AED] dark:text-[#C4B5FD]" />}
                    label={t.adminDashboard}
                    onClick={() => menuAction(onOpenAdmin)}
                  />
                  {onOpenEditApps && (
                    <DrawerItem
                      icon={<Pencil className="w-5 h-5 text-[#2563EB] dark:text-[#60A5FA]" />}
                      label="Edit Apps"
                      onClick={() => menuAction(onOpenEditApps)}
                    />
                  )}
                </>
              )}

              <div className="my-1.5 border-t border-slate-100 dark:border-[#242F3D]" />

              <DrawerItem
                icon={<Users className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
                label={t.newGroup}
                onClick={() => menuAction(onOpenNewGroup)}
              />
              <DrawerItem
                icon={<Megaphone className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
                label={t.newChannel}
                onClick={() => menuAction(onOpenNewChannel)}
              />
              <DrawerItem
                icon={<UserPlus className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
                label={t.contacts}
                onClick={() => menuAction(onOpenContacts)}
              />
              <DrawerItem
                icon={<Phone className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
                label={t.recentCalls}
                onClick={() => menuAction(onOpenCalls)}
              />
              <DrawerItem
                icon={<Bookmark className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
                label={t.savedMessages}
                onClick={() => menuAction(onOpenSavedMessages)}
              />
              <DrawerItem
                icon={<Settings className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
                label={t.settings}
                onClick={() => menuAction(onOpenSettings)}
              />
              <DrawerItem
                icon={<Lock className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
                label={t.privacyAndSecurity}
                onClick={() => menuAction(onOpenPrivacySecurity)}
              />
              <DrawerItem
                icon={<HardDrive className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
                label={t.dataAndStorage}
                onClick={() => menuAction(onOpenDataStorage)}
              />
              <DrawerItem
                icon={<Laptop className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
                label={t.devices}
                onClick={() => menuAction(onOpenDevices)}
              />
              <DrawerItem
                icon={<Zap className="w-5 h-5 text-amber-500" />}
                label={t.powerSaving}
                onClick={() => menuAction(onOpenPowerSaving)}
              />
              <DrawerItem
                icon={<Bot className="w-5 h-5 text-[#5B5CE6] dark:text-[#60A5FA]" />}
                label={t.chatAutomation}
                onClick={() => menuAction(onOpenAutomation)}
              />

              <div className="my-1.5 border-t border-slate-100 dark:border-[#242F3D]" />

              <DrawerItem
                icon={<Crown className="w-5 h-5 text-[#7C3AED] dark:text-[#C4B5FD]" />}
                label={t.sarigramPremium}
                onClick={() => menuAction(() => onOpenPlus('premium'))}
              />
              <DrawerItem
                icon={<Briefcase className="w-5 h-5 text-[#2563EB] dark:text-[#60A5FA]" />}
                label={t.sarigramBusiness}
                onClick={() => menuAction(() => onOpenPlus('business'))}
              />
              <DrawerItem
                icon={<Star className="w-5 h-5 text-amber-500" />}
                label={t.starsAndGifts}
                onClick={() => menuAction(() => onOpenPlus('stars'))}
              />

              <div className="my-1.5 border-t border-slate-100 dark:border-[#242F3D]" />

              <DrawerItem
                icon={<Share2 className="w-5 h-5 text-[#5B5CE6] dark:text-[#A78BFA]" />}
                label={t.inviteFriends}
                onClick={() => menuAction(onOpenInviteFriends)}
              />
              <DrawerItem
                icon={<HelpCircle className="w-5 h-5 text-[#2563EB] dark:text-[#60A5FA]" />}
                label={t.faqAndPolicy}
                onClick={() => menuAction(onOpenHelpCenter)}
              />
              <DrawerItem
                icon={<Palette className="w-5 h-5 text-[#2563EB] dark:text-[#60A5FA]" />}
                label="Brand Kit & Icons"
                onClick={() => menuAction(onOpenBrandKit)}
              />
              {isInstallable && (
                <DrawerItem
                  icon={<Smartphone className="w-5 h-5 text-[#2563EB] dark:text-[#60A5FA]" />}
                  label="Install Android / App"
                  onClick={() => {
                    onClose();
                    void promptInstall();
                  }}
                />
              )}
              <DrawerItem
                icon={<LogIn className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
                label={t.signInRegister}
                onClick={() => menuAction(onOpenAuthModal)}
              />
              {hasAuthToken && (
                <DrawerItem
                  icon={<LogOut className="w-5 h-5 text-red-500" />}
                  label={t.signOut}
                  onClick={() => menuAction(onSignOut)}
                />
              )}

              <div className="my-2 border-t border-slate-200 dark:border-[#242F3D]" />

              <button
                type="button"
                onClick={onToggleLanguage}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-[#202B36] transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <Globe className="w-5 h-5 text-[#5B5CE6] dark:text-[#A78BFA]" />
                  <span className="text-[15px] font-medium">{t.languageLabel}</span>
                </div>
                <span className="text-xs font-semibold text-[#5B5CE6] dark:text-[#A78BFA]">
                  {langCode === 'ao' ? 'Afaan Oromoo' : 'English'}
                </span>
              </button>

              <button
                type="button"
                onClick={onToggleTheme}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-[#202B36] transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  ) : (
                    <Moon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  )}
                  <span className="text-[15px] font-medium">{t.nightMode}</span>
                </div>
                <div
                  className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${
                    theme === 'dark' ? `bg-gradient-to-r ${brandGrad}` : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${
                      theme === 'dark' ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </button>
            </nav>

            <div className="px-5 py-3 border-t border-slate-200 dark:border-[#242F3D] space-y-1 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2.5">
                <img
                  src="/pwa-512x512.png"
                  alt={appConfig.appName}
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-md object-cover shadow-xs"
                />
                <span
                  className={`font-display font-semibold bg-gradient-to-r ${brandGrad} bg-clip-text text-transparent`}
                >
                  {appConfig.appName}
                </span>
                <span aria-hidden="true">·</span>
                <span className="truncate">{appConfig.appSubtitle}</span>
              </div>
              <div className="text-[11px] font-bold italic text-red-600 dark:text-red-400 truncate">
                {t.developedBy}
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

function DrawerItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full px-5 py-3 flex items-center gap-4 hover:bg-slate-100 dark:hover:bg-[#202B36] transition-colors text-left"
    >
      {icon}
      <span className="text-[15px] font-medium whitespace-nowrap">{label}</span>
    </button>
  );
}
