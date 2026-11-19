import type { AppConfig, AppLanguage } from '../types/sarigram';

export function normalizeLanguage(lang?: string): AppLanguage {
  if (!lang) return 'en';
  const low = lang.toLowerCase();
  if (low === 'ao' || low.includes('orom')) return 'ao';
  return 'en';
}

export function getBrandGradient(preset?: AppConfig['brandPreset']): string {
  switch (preset) {
    case 'indigo-violet':
      return 'from-[#4338CA] via-[#6D28D9] to-[#9333EA]';
    case 'cobalt-cyan':
      return 'from-[#1D4ED8] via-[#3B82F6] to-[#6366F1]';
    case 'blue-purple':
    default:
      return 'from-[#2563EB] via-[#5B5CE6] to-[#7C3AED]';
  }
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  appName: 'Sarigram',
  appSubtitle: 'Cloud Sync',
  welcomeTitle: 'Welcome to Sarigram',
  welcomeBody: 'Select a chat, group, or channel from the left sidebar to start messaging.',
  announcementText: '',
  showAnnouncement: false,
  brandPreset: 'blue-purple',
  compactMode: false,
  showStories: true,
};

export interface Translations {
  chats: string;
  discover: string;
  admin: string;
  settings: string;
  searchPlaceholder: string;
  myStory: string;
  noChatsMatch: string;
  tryAnotherSearch: string;
  newGroup: string;
  newChannel: string;
  newMessage: string;
  postStory: string;
  discoverMenu: string;
  adminDashboard: string;
  contacts: string;
  calls: string;
  savedMessages: string;
  signInRegister: string;
  signOut: string;
  nightMode: string;
  registerOrSignIn: string;
  active: string;
  folders: {
    all: string;
    unread: string;
    personal: string;
    groups: string;
    channels: string;
    bots: string;
  };
  writeMessage: string;
  broadcastPost: string;
  noMessagesHere: string;
  startConversationHint: string;
  pinnedMessage: string;
  online: string;
  typing: string;
  bot: string;
  personalCloudStorage: string;
  subscribers: string;
  members: string;
  leaveComment: string;
  comments: string;
  comment: string;
  recordingVoiceNote: string;
  cancel: string;
  send: string;
  photoOrImage: string;
  videoClip: string;
  fileDocument: string;
  createPoll: string;
  connecting: string;
  languageLabel: string;
  recentCalls: string;
  inviteFriends: string;
  privacyAndSecurity: string;
  faqAndPolicy: string;
  dataAndStorage: string;
  devices: string;
  powerSaving: string;
  sarigramPremium: string;
  sarigramBusiness: string;
  starsAndGifts: string;
  addAccount: string;
  chatAutomation: string;
  developedBy: string;
  manageFolders: string;
  newFolder: string;
  editFolder: string;
  folderName: string;
  includedChats: string;
  includedTypes: string;
  saveFolder: string;
  deleteFolder: string;
  addChatsToFolder: string;
  profile: string;
}

const EN: Translations = {
  chats: 'Chats',
  discover: 'Discover',
  admin: 'Admin',
  settings: 'Settings',
  searchPlaceholder: 'Search chats or @username',
  myStory: 'My Story',
  noChatsMatch: 'No chats or users match',
  tryAnotherSearch: 'Try searching another @username, name, or phone number.',
  newGroup: 'New Group',
  newChannel: 'New Channel',
  newMessage: 'New Message',
  postStory: 'Post Story',
  discoverMenu: 'Discover (@username)',
  adminDashboard: 'Admin Dashboard',
  contacts: 'Contacts',
  calls: 'Calls',
  savedMessages: 'Saved Messages',
  signInRegister: 'Sign In / Register',
  signOut: 'Sign Out',
  nightMode: 'Night Mode',
  registerOrSignIn: 'Register or Sign In',
  active: 'Active',
  folders: {
    all: 'All',
    unread: 'Unread',
    personal: 'Personal',
    groups: 'Groups',
    channels: 'Channels',
    bots: 'Bots',
  },
  writeMessage: 'Write a message...',
  broadcastPost: 'Broadcast a post to channel...',
  noMessagesHere: 'No messages here yet',
  startConversationHint: 'Send a message, photo, video, document, or poll to start.',
  pinnedMessage: 'Pinned Message',
  online: 'online',
  typing: 'typing...',
  bot: 'bot',
  personalCloudStorage: 'Personal Cloud Storage',
  subscribers: 'subscribers',
  members: 'members',
  leaveComment: 'Leave a comment',
  comments: 'Comments',
  comment: 'Comment',
  recordingVoiceNote: 'Recording voice note',
  cancel: 'Cancel',
  send: 'Send',
  photoOrImage: 'Photo or Image',
  videoClip: 'Video Clip',
  fileDocument: 'File / Document',
  createPoll: 'Create Poll',
  connecting: 'Connecting to cloud workspace...',
  languageLabel: 'Language (En/Ao)',
  recentCalls: 'Recent Calls',
  inviteFriends: 'Invite Friends',
  privacyAndSecurity: 'Privacy & Security',
  faqAndPolicy: 'Sarigram FAQ & Policy',
  dataAndStorage: 'Data & Storage',
  devices: 'Devices',
  powerSaving: 'Power Saving',
  sarigramPremium: 'Sarigram Premium',
  sarigramBusiness: 'Sarigram Business',
  starsAndGifts: 'Stars & Send Gift',
  addAccount: 'Add Account',
  chatAutomation: 'Chat Automation',
  developedBy: 'Developed by Sadam A Qaallicha',
  manageFolders: 'Chat Folders',
  newFolder: 'Create New Folder',
  editFolder: 'Edit Folder',
  folderName: 'Folder Name',
  includedChats: 'Included Chats',
  includedTypes: 'Chat Types',
  saveFolder: 'Save Folder',
  deleteFolder: 'Delete Folder',
  addChatsToFolder: 'Add Chats to Folder',
  profile: 'Profile',
};

const AO: Translations = {
  chats: 'Haasaawwan',
  discover: 'Barbaadi',
  admin: 'Bulchiinsa',
  settings: "Qindaa'ina",
  searchPlaceholder: 'Haasaa ykn @maqaa barbaadi',
  myStory: 'Seenaa Koo',
  noChatsMatch: 'Haasaan ykn fayyadamaan hin argamne',
  tryAnotherSearch: '@maqaa, maqaa, ykn lakkoofsa bilbilaa biraa yaali.',
  newGroup: 'Garee Haaraa',
  newChannel: 'Chaanaalii Haaraa',
  newMessage: 'Ergaa Haaraa',
  postStory: 'Seenaa Maxxansi',
  discoverMenu: 'Barbaadi (@maqaa)',
  adminDashboard: 'Gabatee Bulchiinsaa',
  contacts: 'Quunnamtiiwwan',
  calls: 'Bilbiloota',
  savedMessages: 'Ergaawwan Kuufaman',
  signInRegister: "Seeni / Galmaa'i",
  signOut: "Ba'i",
  nightMode: 'Haala Halkanii',
  registerOrSignIn: "Galmaa'i ykn Seeni",
  active: 'Hojii irra',
  folders: {
    all: 'Hunda',
    unread: 'Hin dubbifamne',
    personal: 'Dhuunfaa',
    groups: 'Gareewwan',
    channels: 'Chaanaalota',
    bots: 'Bootota',
  },
  writeMessage: 'Ergaa barreessi...',
  broadcastPost: 'Chaanaalii irratti ergaa tamsaasi...',
  noMessagesHere: 'Ergaan asitti hin jiru',
  startConversationHint: 'Jalqabuuf ergaa, suuraa, viidiyoo, sanada, ykn filannoo ergi.',
  pinnedMessage: 'Ergaa Hidhamte',
  online: 'toora irra jira',
  typing: 'barreessaa jira...',
  bot: 'bootii',
  personalCloudStorage: 'Kuusaa Duumessaa Dhuunfaa',
  subscribers: 'hordoftoota',
  members: 'miseensota',
  leaveComment: 'Yaada barreessi',
  comments: 'Yaadota',
  comment: 'Yaada',
  recordingVoiceNote: 'Sagalee waraabaa jira',
  cancel: 'Haqi',
  send: 'Ergi',
  photoOrImage: 'Suuraa ykn Fakkii',
  videoClip: 'Viidiyoo',
  fileDocument: 'Faayilii / Sanada',
  createPoll: 'Filannoo Uumi',
  connecting: 'Walquunnamtii duumessaa eegalaa jira...',
  languageLabel: 'Afaan (En/Ao)',
  recentCalls: 'Bilbiloota Dhiyoo',
  inviteFriends: 'Hiriyoota Afeeri',
  privacyAndSecurity: 'Nageenya & Dhuunfaa',
  faqAndPolicy: 'Gaaffilee, Amala & Imaammata',
  dataAndStorage: 'Daataa & Kuusaa',
  devices: 'Meeshaalee Walqabatan',
  powerSaving: 'Qusannaa Humnaa',
  sarigramPremium: 'Sarigram Premium',
  sarigramBusiness: 'Sarigram Daldalaa',
  starsAndGifts: 'Urjii & Kennaa Ergi',
  addAccount: 'Herrega Haaraa Dabali',
  chatAutomation: 'Ofumaa Deebii Haasaa',
  developedBy: 'Sadam A Qaallichaan kan Qophaa’e',
  manageFolders: 'Kuusaa Haasaawwanii',
  newFolder: 'Kuusaa Haaraa Uumi',
  editFolder: 'Kuusaa Gulaali',
  folderName: 'Maqaa Kuusaa',
  includedChats: 'Haasaawwan Dabalaman',
  includedTypes: 'Gosa Haasaawwanii',
  saveFolder: 'Kuusaa Olkaa’i',
  deleteFolder: 'Kuusaa Haqi',
  addChatsToFolder: 'Haasaa Kuusaatti Dabali',
  profile: 'Eenyummaa',
};

export function getTranslations(language?: string): Translations {
  return normalizeLanguage(language) === 'ao' ? AO : EN;
}
