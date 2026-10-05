export type QuotationStatus = 'draft' | 'sent' | 'not_confirmed' | 'confirmed' | 'completed' | 'cancelled' | 'trash';
export type UserRole = 'super_admin' | 'user' | 'task_manager';

export interface Workspace {
  id: string; // e.g. "ws_user-super-admin" or "ws_user-123"
  name: string;
  ownerUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserAccount {
  id: string;
  workspaceId?: string; // Authoritative workspace boundary (e.g. "ws_user-super-admin")
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: UserRole;
  approved: boolean;
  active: boolean;
  createdAt: string;
  originalAdminId?: string; // Set when Super Admin switches to another user's account
}

export interface Service {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon identifier
  active: boolean;
  category: 'photography' | 'videography' | 'editing' | 'album' | 'other';
  defaultPrice?: number; // Optional default selling price
  defaultInternalCost?: number; // Default cost per unit (internal only)
}

export interface CrewMemberCost {
  id: string;
  name: string;
  phone?: string;
  role?: string;
  cost: number;
}

export interface PermanentTeamMember {
  id: string;
  name: string;
  phone?: string;
  role?: string; // e.g. "Lead Photographer", "Cinematographer", "Drone Pilot"
  defaultCost?: number;
}

export interface SelectedService {
  id: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  internalCostPerUnit?: number; // Cost per unit for this specific quotation
  crewBreakdown?: CrewMemberCost[]; // Individual crew names and individual costs
}

export interface EventItem {
  id: string;
  name: string; // e.g. "Nikkah", "Mehndi", "Barat", "Walima", "Couple Shoot"
  dayNumber?: number;
  eventDate?: string; // YYYY-MM-DD date string (e.g. "2026-10-15")
  services: SelectedService[];
  guestCount?: number;
  price: number; // Manually entered client selling price (e.g. 40000)
  venue?: string; // e.g. "Royal Palm Golf Club, Lahore"
  timing?: string; // e.g. "07:00 PM (Night)"
  mapLink?: string; // e.g. "https://maps.google.com/?q=..."
  notes?: string;
}

export interface PackageInclusion {
  id: string;
  name: string;
  included: boolean;
  quantity?: number; // e.g. 1, 2, 3 albums
  price?: number; // Optional price for extra deliverables/add-ons (e.g. Hard Drive: 4000, USB: 1700)
}

export interface ClientDetails {
  name: string;
  phone: string;
  quotationDate: string;
  eventDates: string; // e.g. "12th Oct - 15th Oct 2026"
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'online' | 'cheque' | 'other';

export interface PaymentTransaction {
  id: string;
  date: string; // YYYY-MM-DD format (e.g. "2026-08-23")
  amount: number;
  method: PaymentMethod;
  notes?: string;
  recordedBy?: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface PaymentDetails {
  grandTotal: number; // Sum of all event prices
  advanceReceived: number;
  advanceType: 'fixed' | 'percentage';
  advancePercentage?: number;
  balancePayable: number;
  transactions?: PaymentTransaction[]; // Live ledger payment history
  clientProposedAdvance?: number; // Custom advance entered by client on portal link
  paymentStatus?: 'unpaid' | 'partially_paid' | 'paid_in_full';
}

export interface AdditionalExpense {
  id: string;
  description: string;
  amount: number;
}

export interface EventProfitAnalysis {
  eventId: string;
  eventName: string;
  sellingPrice: number;
  internalCost: number;
  profit: number;
  marginPercentage: number;
}

export interface VideoEditingEventCost {
  eventId: string;
  eventName: string;
  dayNumber?: number;
  cameraCount: number;
  droneCount: number;
  tierDescription: string;
  cost: number;
}

export interface AlbumItemCost {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface InternalAnalysis {
  totalInternalCost: number;
  netProfit: number;
  profitMargin: number;
  additionalExpenses: AdditionalExpense[];
  eventBreakdown: EventProfitAnalysis[];
  videoEditingBreakdown?: VideoEditingEventCost[];
  totalVideoEditingCost?: number;
  albumBreakdown?: AlbumItemCost[];
  totalAlbumCost?: number;
}

export type AlbumDeliverableStatus = 
  | 'raw_delivery_pending'
  | 'raw_delivered'
  | 'photo_selection'
  | 'album_designing'
  | 'client_review'
  | 'revisions'
  | 'final_approval'
  | 'printing_completed'
  | 'delivered'
  | 'design'
  | 'printing';

export type VideoDeliverableStatus =
  | 'editing_in_progress'
  | 'video_edited'
  | 'music_selection'
  | 'music_changes'
  | 'client_review'
  | 'revisions'
  | 'final_changes'
  | 'final_export'
  | 'delivered'
  | 'not_started'
  | 'in_progress';

export interface DeliverableStatus {
  albumStatus: AlbumDeliverableStatus;
  videoStatus: VideoDeliverableStatus;
}

export interface Quotation {
  id: string;
  quotationNumber: string; // e.g., "SS-2026-001"
  securityPin?: string; // 4-digit to 8-digit secure random access PIN to prevent client ID enumeration
  publicLinkDate?: string; // Permanent immutable URL date (YYYY-MM-DD) set at creation time
  workspaceId?: string; // Authoritative Workspace Boundary (e.g. "ws_user-super-admin" or "ws_user-xxx")
  userId?: string; // ID of the user who created this quotation (legacy/creator reference)
  createdByUserId?: string; // User ID who authored the quotation
  updatedByUserId?: string; // User ID who last modified the quotation
  status: QuotationStatus;
  createdAt: string;
  updatedAt: string;
  client: ClientDetails;
  packageType: 'single_day' | 'multi_event';
  events: EventItem[];
  inclusions: PackageInclusion[];
  payment: PaymentDetails;
  termsAndConditions: string[];
  notes?: string;
  additionalExpenses?: AdditionalExpense[]; // Internal non-service costs (Transport, Food, etc.)
  internalAnalysis?: InternalAnalysis;
  deliverableStatus?: DeliverableStatus;
  whatsappHistory?: WhatsAppHistoryEntry[];
  previousStatus?: QuotationStatus;
  isDeleted?: boolean;
  deletedAt?: string;
  autoExpired?: boolean;
  autoExpiredReason?: string;
  restoredAt?: string;
}

export type WhatsAppCategory = 
  | 'new_client'
  | 'second_reminder'
  | 'final_reminder'
  | 'offer_reminder'
  | 'event_confirmation'
  | string;

export interface WhatsAppTemplatesConfig {
  new_client: string;
  second_reminder: string;
  final_reminder: string;
  offer_reminder: string;
  event_confirmation: string;
  [key: string]: string;
}

export interface WhatsAppHistoryEntry {
  id: string;
  sentAt: string; // ISO timestamp
  category: WhatsAppCategory;
  categoryLabel: string;
  sentTo: string; // Client name
  phone: string;
  messageSnippet?: string;
  sentByUserId?: string;
  sentByUserName?: string;
  status: 'sent';
}

export interface BusinessSettings {
  name: string;
  logoUrl?: string;
  phone: string;
  address: string;
  instagram: string;
  website: string;
}

export interface BankDetails {
  accountTitle: string;
  bank: string;
  branch: string;
  accountNumber: string;
  iban?: string;
}

export interface QuotationSettings {
  startingNumber: number;
  prefix: string;
  defaultTerms: string[];
  defaultInclusions: string[];
  defaultFooter: string;
}

export interface IntegrationsSettings {
  googleDriveWebhookUrl?: string;
  autoSyncGoogleDrive?: boolean;
  googleDriveFolderName?: string;
}

export interface CustomWhatsAppCategory {
  id: string;
  label: string;
  badgeLabel?: string;
  description?: string;
  isCustom?: boolean;
}

export interface AppSettings {
  workspaceId?: string;
  business: BusinessSettings;
  bank: BankDetails;
  quotation: QuotationSettings;
  integrations?: IntegrationsSettings;
  whatsappTemplates?: WhatsAppTemplatesConfig;
  customWhatsAppCategories?: CustomWhatsAppCategory[];
  permanentTeamMembers?: PermanentTeamMember[];
}

// ----------------------------------------------------
// Snap Service — Daily Task Manager Types
// ----------------------------------------------------

export type TaskCategory = 
  | 'events' 
  | 'albums' 
  | 'editing' 
  | 'clients' 
  | 'team' 
  | 'social_media';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 
  | 'upcoming'      // Before Start Time
  | 'due_now'       // At / past Start Time, before Deadline
  | 'overdue'       // Past Deadline & not completed
  | 'waiting'       // Waiting / Follow-up pending
  | 'completed';    // Manually marked completed

export interface TaskHistoryEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details?: string;
}

export interface TaskAttachment {
  name: string;
  url: string;
  size?: number;
}

export type TaskReminderTiming = 
  | 'none'
  | 'at_start'
  | '15_min_before_start'
  | '30_min_before_start'
  | '1_hour_before_start'
  | 'halfway'
  | '2_hours_before_deadline'
  | '1_hour_before_deadline'
  | '30_min_before_deadline'
  | 'at_deadline'
  | 'custom'
  // Legacy aliases
  | '15_min_before'
  | '30_min_before'
  | '1_hour_before';

export interface TaskReminderItem {
  id: string;
  timing: TaskReminderTiming;
  reminderDateTime: string; // ISO string YYYY-MM-DDTHH:mm
  sentAt?: string; // ISO timestamp
  customLabel?: string;
}

export interface TaskItem {
  id: string;
  workspaceId?: string; // Authoritative Workspace Boundary (e.g. "ws_user-super-admin")
  createdByUserId?: string;
  updatedByUserId?: string;
  title: string;
  category: TaskCategory;
  subCategory?: string; // Predefined quick action template
  quotationId?: string; // Optional linked Event / Client booking
  quotationNumber?: string;
  clientName?: string;
  eventTitle?: string;
  assignedToUserId?: string;
  assignedToName?: string;
  startDateTime: string; // ISO string YYYY-MM-DDTHH:mm
  deadlineDateTime: string; // ISO string YYYY-MM-DDTHH:mm
  priority: TaskPriority;
  manualStatus?: 'waiting' | 'completed' | 'in_progress';
  followUpDateTime?: string; // ISO string YYYY-MM-DDTHH:mm
  reminders?: TaskReminderItem[]; // Multi-reminder checkpoints
  reminderTiming?: TaskReminderTiming; // Legacy single reminder timing
  reminderDateTime?: string; // Legacy single ISO string YYYY-MM-DDTHH:mm
  reminderSentAt?: string; // Legacy ISO timestamp
  overdueAlertSentAt?: string; // ISO timestamp
  followUpAlertSentAt?: string; // ISO timestamp
  notes?: string;
  attachments?: TaskAttachment[];
  history: TaskHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------
// Web Push & Device Subscription Types
// ----------------------------------------------------

export type DeviceType = 'ios_pwa' | 'android' | 'mac' | 'windows' | 'browser';

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface WebPushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: PushSubscriptionKeys;
}

export interface DeviceSubscription {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  deviceType: DeviceType;
  deviceName: string;
  userAgent: string;
  subscription: WebPushSubscription;
  fcmToken?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  taskReminders: boolean;
  defaultReminderTiming: TaskReminderTiming;
  overdueAlerts: boolean;
  followUpAlerts: boolean;
}

// ----------------------------------------------------
// Studio Expenses & Team Advances Ledger Types
// ----------------------------------------------------

export type ExpenseCategory =
  | 'event_profit'       // Auto-synced profit from confirmed/completed quotation
  | 'office_rent'        // Studio / Office Rent
  | 'electricity'        // Electricity & Power bills
  | 'internet'           // Internet, Wi-Fi & Subscriptions
  | 'salary'             // Monthly staff / editor / photographer salaries
  | 'marketing_ads'      // Meta/Instagram advertising, social campaigns
  | 'travel_fuel'        // Fuel, taxi, flight, travel & transport expenses
  | 'gear_equipment'     // Cameras, lenses, lighting, memory cards, batteries, repairs
  | 'team_advance'       // Advance payment disbursed to team member / freelancer
  | 'printing_albums'    // Photobook lab printing, album binding & packaging
  | 'studio_utilities'   // General studio utilities & office supplies
  | 'vendor_payout'      // External vendors, third-party sub-contractors
  | 'other';             // Miscellaneous studio operational expense

export interface StudioExpense {
  id: string;
  workspaceId: string;
  amount: number;
  category: ExpenseCategory;
  type?: 'expense' | 'income';   // 'income' for auto-synced event profits, 'expense' for studio costs
  quotationId?: string;          // If auto-synced from a quotation
  quotationNumber?: string;      // e.g. "SS-2026-104"
  clientName?: string;           // e.g. "Mr Waleed"
  date: string;                  // YYYY-MM-DD
  personName?: string;          // e.g. "Jawad Murtaza", "Ali Photographer", "Farhan Editor"
  userId?: string;              // Optional link to UserAccount if matching team user exists
  paymentMethod: 'cash' | 'bank_transfer' | 'online' | 'cheque' | 'other';
  description: string;          // Purpose / description in English
  reference?: string;           // Optional bank transaction ID, receipt reference
  receiptUrl?: string;          // Optional receipt image / file attachment URL
  createdAt: string;
  updatedAt: string;
}
