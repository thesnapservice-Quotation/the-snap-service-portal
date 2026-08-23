export type QuotationStatus = 'draft' | 'sent' | 'not_confirmed' | 'confirmed' | 'completed' | 'cancelled';
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
  cost: number;
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
  notes?: string;
}

export interface PackageInclusion {
  id: string;
  name: string;
  included: boolean;
  quantity?: number; // e.g. 1, 2, 3 albums
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

export interface DeliverableStatus {
  albumStatus: 'design' | 'printing' | 'delivered';
  videoStatus: 'not_started' | 'in_progress' | 'delivered';
}

export interface Quotation {
  id: string;
  quotationNumber: string; // e.g., "SS-2026-001"
  securityPin?: string; // 4-digit to 8-digit secure random access PIN to prevent client ID enumeration
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

export interface AppSettings {
  workspaceId?: string;
  business: BusinessSettings;
  bank: BankDetails;
  quotation: QuotationSettings;
  integrations?: IntegrationsSettings;
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
