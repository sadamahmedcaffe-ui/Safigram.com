import { useRef, useState } from 'react';
import {
  Camera,
  Check,
  Forward,
  KeyRound,
  Lock,
  MailCheck,
  Megaphone,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { Avatar } from './Avatar';
import { CountryCodeSelect } from './CountryCodeSelect';
import {
  COUNTRY_CODES,
  formatPhoneWithCode,
  isValidEmail,
  isValidInternationalPhone,
  type CountryCode,
} from '../utils/countryCodes';
import {
  FirebaseEmailNotVerifiedError,
  firebaseRegisterWithEmail,
  firebaseResendVerificationEmail,
  firebaseSendPasswordReset,
  firebaseSignInWithEmail,
  formatFirebaseAuthError,
} from '../firebase';
import type {
  ChatMessage,
  ChatThread,
  ContactItem,
  PollData,
  UserProfile,
} from '../types/sarigram';

const AVATAR_COLORS = ['#5B5CE6', '#7C3AED', '#2563EB', '#E17076', '#7BC862', '#EE7AAE', '#FAA774'];

function ModalShell({
  title,
  onClose,
  children,
  maxWidth = 'max-w-md',
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-[1px]" />
      <div
        className={`relative z-10 w-full ${maxWidth} max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#17212B] text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-200 dark:border-[#242F3D] overflow-hidden`}
      >
        <div className="px-5 py-4 bg-gradient-to-r from-[#2563EB] via-[#5B5CE6] to-[#7C3AED] text-white flex items-center justify-between shrink-0">
          <h2 className="font-display font-semibold text-base">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/90 hover:bg-white/15"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

export function AuthAccountModal({
  onClose,
  onAuthenticated,
}: {
  onClose: () => void;
  onAuthenticated: (profile: UserProfile, token?: string) => void;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [identifier, setIdentifier] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [localPhone, setLocalPhone] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [bio, setBio] = useState('');
  const [password, setPassword] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSentEmail, setResetSentEmail] = useState<string | null>(null);
  const [resetSending, setResetSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setAvatarUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSendPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSentEmail(null);
    const clean = resetEmail.trim().toLowerCase();
    if (!clean || !isValidEmail(clean)) {
      setError('Please enter a valid email address.');
      return;
    }
    setResetSending(true);
    try {
      await firebaseSendPasswordReset(clean);
      setResetSentEmail(clean);
    } catch (err) {
      setError(formatFirebaseAuthError(err));
    } finally {
      setResetSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      const cleanEmail = email.trim();
      const formattedPhone = localPhone.trim()
        ? formatPhoneWithCode(country.dialCode, localPhone)
        : '';

      if (!firstName.trim()) {
        setError('First name is required.');
        return;
      }
      if (!cleanEmail && !formattedPhone) {
        setError('Enter an email address or phone number to create an account.');
        return;
      }
      if (cleanEmail && !isValidEmail(cleanEmail)) {
        setError('Please enter a valid email address.');
        return;
      }
      if (formattedPhone && !isValidInternationalPhone(formattedPhone)) {
        setError(`Enter a valid phone number for ${country.name} (${country.dialCode}).`);
        return;
      }
      if (!password || password.length < (cleanEmail ? 6 : 4)) {
        setError(
          cleanEmail
            ? 'Password must be at least 6 characters.'
            : 'Password must be at least 4 characters.'
        );
        return;
      }

      setSubmitting(true);
      try {
        if (cleanEmail) {
          const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
          await firebaseRegisterWithEmail(cleanEmail, password, displayName);
          setVerificationEmail(cleanEmail);
          setResendMessage('');
          setError('');
          return;
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            username: username.trim().replace(/^@/, ''),
            email: cleanEmail,
            phone: formattedPhone,
            birthdate: birthdate || undefined,
            bio: bio.trim(),
            password,
            avatarColor,
            avatarUrl,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Registration failed.');
          setSubmitting(false);
          return;
        }
        onAuthenticated(data.user, data.token);
        onClose();
      } catch (err) {
        setError(
          cleanEmail
            ? formatFirebaseAuthError(err)
            : 'Network error connecting to Sarigram server.'
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);
    try {
      const trimmedId = identifier.trim();
      const loginWithEmail = !trimmedId.startsWith('@') && isValidEmail(trimmedId);

      if (loginWithEmail) {
        const cleanEmail = trimmedId.toLowerCase();
        try {
          const credential = await firebaseSignInWithEmail(cleanEmail, password);
          const idToken = await credential.user.getIdToken();
          const res = await fetch('/api/auth/firebase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken, email: cleanEmail, password }),
          });
          const data = await res.json();
          if (!res.ok) {
            if (res.status === 403 && String(data.error || '').toLowerCase().includes('verify')) {
              setVerificationEmail(cleanEmail);
              setResendMessage('');
              setError('');
              setSubmitting(false);
              return;
            }
            setError(data.error || 'Login failed.');
            setSubmitting(false);
            return;
          }
          onAuthenticated(data.user, data.token);
          onClose();
          return;
        } catch (fbErr) {
          if (fbErr instanceof FirebaseEmailNotVerifiedError) {
            setVerificationEmail(fbErr.email || cleanEmail);
            setResendMessage('');
            setError('');
            setSubmitting(false);
            return;
          }
          const fbCode =
            typeof fbErr === 'object' && fbErr !== null && 'code' in fbErr
              ? String((fbErr as { code?: unknown }).code || '')
              : '';
          if (
            fbCode === 'auth/invalid-credential' ||
            fbCode === 'auth/user-not-found' ||
            fbCode === 'auth/wrong-password'
          ) {
            const legacyRes = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ identifier: cleanEmail, password }),
            });
            if (legacyRes.ok) {
              const legacyData = await legacyRes.json();
              onAuthenticated(legacyData.user, legacyData.token);
              onClose();
              return;
            }
          }
          setError(formatFirebaseAuthError(fbErr));
          setSubmitting(false);
          return;
        }
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed.');
        setSubmitting(false);
        return;
      }
      onAuthenticated(data.user, data.token);
      onClose();
    } catch {
      setError('Network error connecting to Sarigram server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="Sarigram Account" onClose={onClose}>
      <div className="px-5 pt-4 pb-3 bg-gradient-to-b from-[#EFF6FF] to-white dark:from-[#0E1E3A]/60 dark:to-[#17212B] flex flex-col items-center text-center border-b border-slate-100 dark:border-[#242F3D]">
        <img
          src="/pwa-512x512.png"
          alt="Sarigram App Icon"
          referrerPolicy="no-referrer"
          className="w-14 h-14 rounded-2xl shadow-md object-cover mb-2"
        />
        <div className="font-display font-bold text-xl leading-none">
          <span className="text-[#022A8E] dark:text-white">Sari</span>
          <span className="text-[#EAB308]">gram</span>
        </div>
        <p className="text-[11px] font-semibold tracking-wide text-[#022A8E]/80 dark:text-sky-300 mt-1">
          Connect • Share • Belong
        </p>
      </div>

      {forgotPasswordOpen ? (
        <form onSubmit={handleSendPasswordReset} className="p-6 space-y-4">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#5B5CE6]/12 text-[#5B5CE6] dark:text-[#A78BFA] flex items-center justify-center">
              <KeyRound className="w-7 h-7" />
            </div>
            <h3 className="font-display font-semibold text-base text-slate-900 dark:text-white">
              Forgot Password
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Enter your account email address and we&apos;ll send you a Firebase password reset
              link.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="name@email.com"
              required
              autoFocus
              className="w-full h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
            />
          </div>

          {resetSentEmail && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
              Password reset email sent to{' '}
              <span className="font-mono font-semibold">{resetSentEmail}</span>. Check your inbox
              and follow the link to set a new password.
            </div>
          )}

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <div className="space-y-2 pt-1">
            <button
              type="submit"
              disabled={resetSending}
              className="w-full h-10 rounded-xl text-sm font-semibold bg-[#5B5CE6] hover:bg-[#7C3AED] disabled:opacity-50 text-white transition-colors"
            >
              {resetSending ? 'Sending...' : 'Send Reset Email'}
            </button>

            <button
              type="button"
              onClick={() => {
                if (resetSentEmail || resetEmail.trim()) {
                  setIdentifier(resetSentEmail || resetEmail.trim());
                }
                setMode('login');
                setForgotPasswordOpen(false);
                setResetSentEmail(null);
                setError('');
              }}
              className="w-full h-9 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#242F3D] transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        </form>
      ) : verificationEmail ? (
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#5B5CE6]/12 text-[#5B5CE6] dark:text-[#A78BFA] flex items-center justify-center">
            <MailCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display font-semibold text-base text-slate-900 dark:text-white">
              Check your email &amp; verify, then log in
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              We sent a verification link to{' '}
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                {verificationEmail}
              </span>
              . Verify your email address before signing in.
            </p>
          </div>

          {resendMessage && (
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {resendMessage}
            </p>
          )}
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIdentifier(verificationEmail);
                setMode('login');
                setVerificationEmail(null);
                setError('');
                setResendMessage('');
              }}
              className="w-full h-10 rounded-xl text-sm font-semibold bg-[#5B5CE6] hover:bg-[#7C3AED] text-white transition-colors"
            >
              Login
            </button>

            {password && (
              <button
                type="button"
                disabled={resending}
                onClick={async () => {
                  setResending(true);
                  setError('');
                  setResendMessage('');
                  try {
                    await firebaseResendVerificationEmail(verificationEmail, password);
                    setResendMessage('Verification email sent again. Check your inbox.');
                  } catch (err) {
                    setError(formatFirebaseAuthError(err));
                  } finally {
                    setResending(false);
                  }
                }}
                className="w-full h-9 rounded-xl text-xs font-semibold text-[#5B5CE6] dark:text-[#A78BFA] hover:bg-slate-100 dark:hover:bg-[#242F3D] disabled:opacity-50 transition-colors"
              >
                {resending ? 'Sending...' : 'Resend verification email'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex border-b border-slate-200 dark:border-[#242F3D] px-5">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors ${
                mode === 'register'
                  ? 'border-[#5B5CE6] text-[#5B5CE6] dark:text-[#5EB5F7]'
                  : 'border-transparent text-slate-500 dark:text-slate-400'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors ${
                mode === 'login'
                  ? 'border-[#5B5CE6] text-[#5B5CE6] dark:text-[#5EB5F7]'
                  : 'border-transparent text-slate-500 dark:text-slate-400'
              }`}
            >
              Sign In
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
        {mode === 'login' ? (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Username, Email, or Phone Number
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="@sari_explorer, name@email.com, or +251 911 223344"
                required
                className="w-full h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
              />
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = identifier.trim();
                    setResetEmail(isValidEmail(trimmed) ? trimmed : '');
                    setResetSentEmail(null);
                    setError('');
                    setForgotPasswordOpen(true);
                  }}
                  className="text-xs font-semibold text-[#5B5CE6] dark:text-[#A78BFA] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sign in with your <span className="font-mono">@username</span>, email address, or
              registered phone number.
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar
                  name={`${firstName || 'S'} ${lastName}`}
                  color={avatarColor}
                  imageUrl={avatarUrl}
                  size="lg"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Upload profile picture"
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#5B5CE6] text-white flex items-center justify-center shadow ring-2 ring-white dark:ring-[#17212B]"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
                />
              </div>

              <div className="flex-1">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  Profile Photo or Badge Color
                </div>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setAvatarUrl(undefined);
                        setAvatarColor(c);
                      }}
                      aria-label={`Select color ${c}`}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        !avatarUrl && avatarColor === c
                          ? 'ring-2 ring-offset-2 ring-[#5B5CE6] scale-110'
                          : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Alex"
                  required
                  className="w-full h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Mercer"
                  className="w-full h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Phone Number (All Countries)
              </label>
              <div className="flex items-center gap-2">
                <CountryCodeSelect value={country} onChange={setCountry} />
                <input
                  type="tel"
                  value={localPhone}
                  onChange={(e) => setLocalPhone(e.target.value.replace(/[^\d\s-]/g, ''))}
                  placeholder="911 223 344"
                  className="flex-1 min-w-0 h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Register with email, international phone number, or both.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  @username (optional)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="auto or custom"
                  className="w-full h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 4 chars"
                  required
                  className="w-full h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Birthdate (optional)
                </label>
                <input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Bio
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Product builder"
                  className="w-full h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
                />
              </div>
            </div>
          </>
        )}

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#242F3D]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#5B5CE6] hover:bg-[#7C3AED] disabled:opacity-50 text-white whitespace-nowrap"
          >
            {submitting
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign In'
                : 'Register & Continue'}
          </button>
        </div>
      </form>
        </>
      )}
    </ModalShell>
  );
}

export function NewGroupModal({
  currentUser,
  contacts,
  onClose,
  onCreateGroup,
}: {
  currentUser: UserProfile;
  contacts: ContactItem[];
  onClose: () => void;
  onCreateGroup: (chat: ChatThread) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  const toggleMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Group name is required.');
      return;
    }
    const members = [currentUser.id, ...selectedIds];
    onCreateGroup({
      id: `chat-grp-${crypto.randomUUID().slice(0, 8)}`,
      type: 'group',
      title: title.trim(),
      username: title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      description: description.trim() || 'Sarigram community group',
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      memberCount: members.length,
      memberIds: members,
      adminIds: [currentUser.id],
      unreadBy: {},
    });
    onClose();
  };

  return (
    <ModalShell title="New Group" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#5B5CE6]/15 text-[#5B5CE6] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError('');
              }}
              placeholder="Group name"
              autoFocus
              className="w-full h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
            />
          </div>
        </div>

        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Group description (optional)"
          className="w-full h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
        />

        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            Add Members ({selectedIds.length} selected)
          </div>
          <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
            {contacts.map((c) => {
              const checked = selectedIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleMember(c.id)}
                  className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-left transition-colors ${
                    checked
                      ? 'bg-[#5B5CE6]/12 dark:bg-[#5B5CE6]/20'
                      : 'hover:bg-slate-100 dark:hover:bg-[#202B36]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      name={`${c.firstName} ${c.lastName}`}
                      color={c.avatarColor}
                      imageUrl={c.avatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {c.firstName} {c.lastName}
                      </div>
                      <div className="text-xs text-slate-400 truncate">@{c.username}</div>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      checked
                        ? 'bg-[#5B5CE6] border-[#5B5CE6] text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {checked && <Check className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#242F3D]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#5B5CE6] hover:bg-[#7C3AED] text-white"
          >
            Create Group
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function NewChannelModal({
  currentUser,
  onClose,
  onCreateChannel,
}: {
  currentUser: UserProfile;
  onClose: () => void;
  onCreateChannel: (chat: ChatThread) => void;
}) {
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Channel name is required.');
      return;
    }
    const cleanHandle = (username || title)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_');

    onCreateChannel({
      id: `chat-chn-${crypto.randomUUID().slice(0, 8)}`,
      type: 'channel',
      title: title.trim(),
      username: visibility === 'public' ? cleanHandle : undefined,
      description:
        description.trim() || 'Broadcast channel for updates and community discussions.',
      avatarColor: '#1E5B88',
      subscriberCount: 1,
      memberIds: [currentUser.id],
      adminIds: [currentUser.id],
      unreadBy: {},
    });
    onClose();
  };

  return (
    <ModalShell title="New Channel" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#5B5CE6]/15 text-[#5B5CE6] flex items-center justify-center shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError('');
            }}
            placeholder="Channel name"
            autoFocus
            className="flex-1 h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will you broadcast on this channel?"
            className="w-full p-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6] resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setVisibility('public')}
            className={`p-3 rounded-xl border text-left transition-colors ${
              visibility === 'public'
                ? 'border-[#5B5CE6] bg-[#5B5CE6]/10'
                : 'border-slate-200 dark:border-[#2C3B4B]'
            }`}
          >
            <div className="text-sm font-semibold flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5 text-[#5B5CE6]" />
              <span>Public Channel</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Discoverable via @handle
            </p>
          </button>
          <button
            type="button"
            onClick={() => setVisibility('private')}
            className={`p-3 rounded-xl border text-left transition-colors ${
              visibility === 'private'
                ? 'border-[#5B5CE6] bg-[#5B5CE6]/10'
                : 'border-slate-200 dark:border-[#2C3B4B]'
            }`}
          >
            <div className="text-sm font-semibold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#5B5CE6]" />
              <span>Private Channel</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Invite link access only
            </p>
          </button>
        </div>

        {visibility === 'public' && (
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Public Link (sari.me/...)
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="my_sarigram_channel"
              className="w-full h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
            />
          </div>
        )}

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#242F3D]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#5B5CE6] hover:bg-[#7C3AED] text-white"
          >
            Create Channel
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function CreatePollModal({
  onClose,
  onCreatePoll,
}: {
  onClose: () => void;
  onCreatePoll: (poll: PollData) => void;
}) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [error, setError] = useState('');

  const updateOption = (idx: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === idx ? value : o)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim()) {
      setError('Enter a poll question.');
      return;
    }
    if (validOptions.length < 2) {
      setError('Add at least 2 poll options.');
      return;
    }
    onCreatePoll({
      question: question.trim(),
      isAnonymous,
      multipleChoice,
      options: validOptions.map((text, idx) => ({
        id: `opt-${idx}-${crypto.randomUUID().slice(0, 4)}`,
        text,
        voterIds: [],
      })),
    });
    onClose();
  };

  return (
    <ModalShell title="New Poll" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Question
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              setError('');
            }}
            placeholder="Ask a question..."
            autoFocus
            className="w-full h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Answer Options
            </span>
            {options.length < 6 && (
              <button
                type="button"
                onClick={() => setOptions((p) => [...p, ''])}
                className="text-xs font-semibold text-[#5B5CE6] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Option</span>
              </button>
            )}
          </div>
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={opt}
                onChange={(e) => updateOption(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                className="flex-1 h-10 px-3 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => setOptions((p) => p.filter((_, i) => i !== idx))}
                  aria-label="Remove option"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-1">
          <label className="flex items-center justify-between text-sm cursor-pointer">
            <span>Anonymous Voting</span>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 accent-[#5B5CE6]"
            />
          </label>
          <label className="flex items-center justify-between text-sm cursor-pointer">
            <span>Multiple Answers</span>
            <input
              type="checkbox"
              checked={multipleChoice}
              onChange={(e) => setMultipleChoice(e.target.checked)}
              className="w-4 h-4 accent-[#5B5CE6]"
            />
          </label>
        </div>

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#242F3D]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#5B5CE6] hover:bg-[#7C3AED] text-white"
          >
            Create Poll
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function ForwardModal({
  message,
  chats,
  onClose,
  onForwardToChat,
}: {
  message: ChatMessage;
  chats: ChatThread[];
  onClose: () => void;
  onForwardToChat: (targetChatId: string) => void;
}) {
  return (
    <ModalShell title="Forward Message to..." onClose={onClose}>
      <div className="p-3 max-h-96 overflow-y-auto space-y-1">
        {chats.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              onForwardToChat(c.id);
              onClose();
            }}
            className="w-full px-3 py-2.5 rounded-xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-[#202B36] text-left transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                name={c.title}
                color={c.avatarColor}
                imageUrl={c.avatarUrl}
                type={c.type}
                size="sm"
              />
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{c.title}</div>
                <div className="text-xs text-slate-400 truncate capitalize">{c.type}</div>
              </div>
            </div>
            <Forward className="w-4 h-4 text-[#5B5CE6]" />
          </button>
        ))}
      </div>
      <div className="px-4 py-2.5 border-t border-slate-200 dark:border-[#242F3D] text-xs text-slate-500 dark:text-slate-400 truncate">
        Message: {message.poll?.question || message.text || message.fileName || 'Media'}
      </div>
    </ModalShell>
  );
}
