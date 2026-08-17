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
  { id: 'inc-2', name: 'Raw Footage', included: true, quantity: 1 },
  { id: 'inc-3', name: 'Hard Drive', included: true, quantity: 1 },
  { id: 'inc-4', name: 'Krizma Album', included: true, quantity: 1 },
  { id: 'inc-5', name: 'Couple Shoot Album', included: true, quantity: 1 },
  { id: 'inc-6', name: 'Family Albums', included: true, quantity: 3 },
  { id: 'inc-7', name: 'Extra Album', included: false, quantity: 1 },
  { id: 'inc-8', name: 'Full Event Coverage', included: true, quantity: 1 },
];

export const DEFAULT_TERMS: string[] = [
  '50% advance to confirm booking.',
  '25% after event completion.',
  '25% before final delivery.',
  'Only selected images will be delivered in high resolution.',
  'All other images will be provided in soft form for selection.',
  'Couple shoot duration approximately one hour.',
];

export const DEFAULT_SETTINGS: AppSettings = {
  business: {
    name: 'The Snap Service',
    logoUrl: '/snap-service-logo.png',
    phone: '+92 323 9244924',
    address: 'Office# 42, Dragon Mall, Faisalabad',
    instagram: '@snapservice.pk',
    website: 'www.snapservice.pk',
  },
  bank: {
    accountTitle: 'Zunair Ahmad',
    bank: 'Meezan Bank',
    branch: 'PMC Branch',
    accountNumber: '04240104676435',
    iban: 'PK36MEZN0004240104676435',
  },
  quotation: {
    startingNumber: 101,
    prefix: 'SS-2026',
    defaultTerms: DEFAULT_TERMS,
    defaultInclusions: DEFAULT_INCLUSIONS.map((i) => i.name),
    defaultFooter: 'Thank you for choosing The Snap Service for your special moments!',
  },
  integrations: {
    googleDriveWebhookUrl: '',
    autoSyncGoogleDrive: true,
    googleDriveFolderName: 'Snap Service Quotations Archive',
  },
};
