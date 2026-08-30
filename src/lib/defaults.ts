import { Service, AppSettings, PackageInclusion } from './types';

// Coverage services allowed inside Event Days
export const COVERAGE_SERVICES: Service[] = [
  {
    id: 'srv-1',
    name: 'Photographer',
    description: 'Professional candid & portrait photography coverage',
    icon: 'Camera',
    active: true,
    category: 'photography',
    defaultInternalCost: 8000,
  },
  {
    id: 'srv-2',
    name: 'Videographer',
    description: 'High-definition video coverage with cinema camera',
    icon: 'Video',
    active: true,
    category: 'videography',
    defaultInternalCost: 10000,
  },
  {
    id: 'srv-3',
    name: 'Drone',
    description: '4K Aerial drone shot coverage for cinematic venue & entry shots',
    icon: 'Plane',
    active: true,
    category: 'videography',
    defaultInternalCost: 5000,
  },
  {
    id: 'srv-4',
    name: 'Outdoor Couple Shoot',
    description: 'Dedicated outdoor/indoor cinematic & portrait session for couple',
    icon: 'Heart',
    active: true,
    category: 'photography',
    defaultInternalCost: 6000,
  },
];

// Deliverable services moved to INCLUDED IN PACKAGE
export const DELIVERABLE_SERVICES: Service[] = [
  {
    id: 'srv-5',
    name: 'Complete Video Editing',
    description: 'Full documentary style full event film + cinematic highlight reel',
    icon: 'Film',
    active: true,
    category: 'editing',
    defaultInternalCost: 7000,
  },
  {
    id: 'srv-6',
    name: 'Raw Footage',
    description: 'All raw video files provided uncompressed',
    icon: 'HardDriveDownload',
    active: true,
    category: 'editing',
    defaultInternalCost: 1000,
  },
  {
    id: 'srv-7',
    name: 'Hard Drive',
    description: '1TB/2TB External Storage Drive loaded with high-res data',
    icon: 'HardDrive',
    active: true,
    category: 'other',
    defaultInternalCost: 3500,
  },
  {
    id: 'srv-8',
    name: 'Krizma Album',
    description: 'Premium luxury synthetic leather lay-flat photo album',
    icon: 'BookOpen',
    active: true,
    category: 'album',
    defaultInternalCost: 8000,
  },
  {
    id: 'srv-9',
    name: 'Couple Shoot Album',
    description: 'Dedicated luxury album for couple portrait session',
    icon: 'BookMarked',
    active: true,
    category: 'album',
    defaultInternalCost: 6000,
  },
  {
    id: 'srv-10',
    name: 'Family Album',
    description: 'Compact family portrait album',
    icon: 'Book',
    active: true,
    category: 'album',
    defaultInternalCost: 5000,
  },
  {
    id: 'srv-11',
    name: 'Extra Album',
    description: 'Additional custom size printed photo album',
    icon: 'PlusSquare',
    active: true,
    category: 'album',
    defaultInternalCost: 4000,
  },
  {
    id: 'srv-12',
    name: 'Full Event Coverage',
    description: 'Complete start-to-finish event time coverage',
    icon: 'CheckCircle2',
    active: true,
    category: 'other',
    defaultInternalCost: 0,
  },
];

export const DEFAULT_SERVICES: Service[] = [...COVERAGE_SERVICES, ...DELIVERABLE_SERVICES];

export const DEFAULT_INCLUSIONS: PackageInclusion[] = [
  { id: 'inc-1', name: 'Complete Video Editing', included: true, quantity: 1 },
  { id: 'inc-2', name: 'Events Highlights for each day', included: true, quantity: 1 },
  { id: 'inc-3', name: 'Couple Shoot Songs', included: true, quantity: 1 },
  { id: 'inc-4', name: 'Couple Shoot Album', included: true, quantity: 1 },
  { id: 'inc-5', name: 'Family Albums', included: true, quantity: 3 },
  { id: 'inc-6', name: 'Full Event Coverage', included: true, quantity: 1 },
];

export const DEFAULT_TERMS: string[] = [
  '50% advance to confirm booking.',
  '25% after event completion.',
  '25% before final delivery.',
  'Only selected images will be delivered in high resolution.',
  'All other images will be provided in soft form for selection.',
  'Couple shoot duration approximately one hour.',
];

export const DEFAULT_WHATSAPP_TEMPLATES = {
  new_client: `Salam {client_name},

Thank you for contacting {business_name}.

Please find your official photography & videography quotation details below:

{quotation_details}

We would be delighted to capture and preserve your special moments with timeless elegance.

Please let us know if you have any questions or would like to customize your coverage.

Regards,
{business_name}`,

  second_reminder: `Salam {client_name},

Hope you are having a wonderful day!

Following up on your wedding photography quotation ({quotation_number}). We wanted to check if you had a chance to review the package details:

{quotation_details}

Our dates fill up fast on a first-come, first-served basis. Please let us know if you would like to secure your event dates.

Regards,
{business_name}`,

  final_reminder: `Salam {client_name},

This is a gentle final reminder regarding your event quotation ({quotation_number}).

{quotation_details}

We are currently receiving multiple inquiries for these dates ({event_dates}). To avoid disappointment, please confirm your booking so we can keep our team reserved for you.

Regards,
{business_name}`,

  offer_reminder: `Salam {client_name},

Special update regarding your wedding photography quotation ({quotation_number}):

{quotation_details}

We have a limited-time complimentary upgrade available for your wedding dates. Let us know if you would like to lock your booking and avail this special package offer!

Regards,
{business_name}`,

  event_confirmation: `Salam {client_name},

Congratulations! Your booking with {business_name} is officially confirmed and locked! 🎉

Here is your confirmed booking summary:

{quotation_details}

Our senior cinematography & photography crew is officially reserved for your wedding celebrations. We look forward to creating unforgettable memories with you!

Regards,
{business_name}`,
};

export const DEFAULT_PERMANENT_TEAM = [
  { id: 'team-1', name: 'Ali Raza', role: 'Lead Photographer', phone: '03001234567', defaultCost: 8000 },
  { id: 'team-2', name: 'Usman Malik', role: 'Cinematographer', phone: '03219876543', defaultCost: 10000 },
  { id: 'team-3', name: 'Hamza Drone', role: 'Drone Pilot', phone: '03335554433', defaultCost: 5000 },
];

export const SUPER_ADMIN_DEFAULT_SETTINGS: AppSettings = {
  business: {
    name: 'The Snap Service',
    logoUrl: '/snap-service-logo.png',
    phone: '+92 300 1234567',
    address: 'Studio Suite #4, Luxury Wedding Arcade, Gulberg III, Lahore',
    instagram: '@thesnapservice',
    website: 'thesnapservice.com',
  },
  bank: {
    accountTitle: 'THE SNAP SERVICE STUDIOS',
    bank: 'Meezan Bank Limited',
    branch: 'Gulberg Branch, Lahore',
    accountNumber: '02010108928374',
    iban: 'PK45MEZN0002010108928374',
  },
  quotation: {
    startingNumber: 101,
    prefix: 'SS-2026',
    defaultTerms: DEFAULT_TERMS,
    defaultInclusions: DEFAULT_INCLUSIONS.map((i) => i.name),
    defaultFooter: 'The Snap Service — Preserving Royal Wedding Memories Since 2018.',
  },
  integrations: {
    googleDriveWebhookUrl: '',
    autoSyncGoogleDrive: false,
    googleDriveFolderName: 'Snap Service Quotations Archive',
  },
  whatsappTemplates: DEFAULT_WHATSAPP_TEMPLATES,
  permanentTeamMembers: DEFAULT_PERMANENT_TEAM,
};

export const STANDARD_USER_DEFAULT_SETTINGS: AppSettings = {
  business: {
    name: 'Studio',
    logoUrl: '/snap-service-logo.png',
    phone: '',
    address: '',
    instagram: '',
    website: '',
  },
  bank: {
    accountTitle: '',
    bank: '',
    branch: '',
    accountNumber: '',
    iban: '',
  },
  quotation: {
    startingNumber: 101,
    prefix: 'SS-2026',
    defaultTerms: DEFAULT_TERMS,
    defaultInclusions: DEFAULT_INCLUSIONS.map((i) => i.name),
    defaultFooter: 'Thank you for choosing our photography services!',
  },
  integrations: {
    googleDriveWebhookUrl: '',
    autoSyncGoogleDrive: false,
    googleDriveFolderName: '',
  },
  whatsappTemplates: DEFAULT_WHATSAPP_TEMPLATES,
  permanentTeamMembers: DEFAULT_PERMANENT_TEAM,
};

export const DEFAULT_SETTINGS: AppSettings = SUPER_ADMIN_DEFAULT_SETTINGS;

export function getDefaultSettingsForWorkspace(workspaceId?: string): AppSettings {
  const isSuperAdmin =
    !workspaceId ||
    workspaceId === 'ws_user-super-admin' ||
    workspaceId === 'user-super-admin' ||
    workspaceId === 'global' ||
    workspaceId === 'ws_global';

  if (isSuperAdmin) {
    return { ...SUPER_ADMIN_DEFAULT_SETTINGS, workspaceId: 'ws_user-super-admin' };
  }
  const cleanWs = workspaceId.startsWith('ws_') ? workspaceId : `ws_${workspaceId}`;
  return { ...STANDARD_USER_DEFAULT_SETTINGS, workspaceId: cleanWs };
}
