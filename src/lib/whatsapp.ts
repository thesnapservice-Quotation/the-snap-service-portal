import { Quotation, AppSettings, WhatsAppCategory, EventItem, CustomWhatsAppCategory } from './types';
import { formatCurrency, formatDate, generatePortalUrl, sortEventsInSequence } from './utils';
import { DEFAULT_WHATSAPP_TEMPLATES } from './defaults';

export { type WhatsAppCategory, type CustomWhatsAppCategory } from './types';

export interface WhatsAppCategoryMeta {
  id: WhatsAppCategory;
  label: string;
  badgeLabel: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  isCustom?: boolean;
}

export const WHATSAPP_CATEGORIES: WhatsAppCategoryMeta[] = [
  {
    id: 'new_client',
    label: 'New Client',
    badgeLabel: 'New Quotation',
    description: 'Initial quotation welcome and package overview message',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    isCustom: false,
  },
  {
    id: 'second_reminder',
    label: '2nd Reminder',
    badgeLabel: 'Follow-up',
    description: 'Friendly follow-up to check if client reviewed the quotation',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    isCustom: false,
  },
  {
    id: 'final_reminder',
    label: 'Final Reminder',
    badgeLabel: 'Date Release Notice',
    description: 'Urgent notice regarding release of dates to competing inquiries',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    isCustom: false,
  },
  {
    id: 'offer_reminder',
    label: 'Offer Reminder',
    badgeLabel: 'Special Deal',
    description: 'Promotional offer or limited-time seasonal perk update',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    isCustom: false,
  },
  {
    id: 'event_confirmation',
    label: 'Event Confirmation',
    badgeLabel: 'Booking Locked',
    description: 'Official confirmation and congratulations on locking the booking',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    isCustom: false,
  },
];

const CUSTOM_COLOR_PALETTES = [
  { color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  { color: 'text-pink-700', bg: 'bg-pink-50', border: 'border-pink-200' },
  { color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200' },
  { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  { color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  { color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
];

/**
 * Returns all default plus custom-created WhatsApp categories seamlessly merged
 */
export function getAllWhatsAppCategories(settings?: AppSettings): WhatsAppCategoryMeta[] {
  const customList = settings?.customWhatsAppCategories || [];
  if (customList.length === 0) {
    return WHATSAPP_CATEGORIES;
  }

  const mappedCustom: WhatsAppCategoryMeta[] = customList.map((c, index) => {
    const palette = CUSTOM_COLOR_PALETTES[index % CUSTOM_COLOR_PALETTES.length];
    return {
      id: c.id,
      label: c.label,
      badgeLabel: c.badgeLabel || 'CUSTOM',
      description: c.description || 'Custom template message',
      color: palette.color,
      bg: palette.bg,
      border: palette.border,
      isCustom: true,
    };
  });

  return [...WHATSAPP_CATEGORIES, ...mappedCustom];
}

export const DYNAMIC_VARIABLES_REFERENCE = [
  { tag: '{client_name}', description: "Client's full name (e.g. Hamza Javed)" },
  { tag: '{quotation_number}', description: 'Quotation number (e.g. #SS-2026-001)' },
  { tag: '{quotation_date}', description: 'Date quotation was created' },
  { tag: '{event_dates}', description: 'Formatted event dates list' },
  { tag: '{event_names}', description: 'Event names (e.g. Mehndi, Barat, Walima)' },
  { tag: '{quotation_details}', description: 'Standardized full quotation details block' },
  { tag: '{total_amount}', description: 'Grand total amount (e.g. Rs. 110,000)' },
  { tag: '{advance_amount}', description: 'Advance received amount' },
  { tag: '{balance_amount}', description: 'Remaining balance payable' },
  { tag: '{business_name}', description: 'Your studio brand name' },
  { tag: '{phone}', description: 'Studio official contact number' },
  { tag: '{portal_url}', description: 'Interactive online quotation link' },
];

/**
 * Normalizes any Pakistani or International phone number into digits only for WhatsApp (e.g. 923001234567)
 * Never alters the stored database phone number.
 */
export function normalizeWhatsAppPhone(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');

  if (cleaned.startsWith('0092')) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.slice(1);
  } else if (cleaned.startsWith('92')) {
    // Already in correct 92 format
  } else if (cleaned.length === 10 && (cleaned.startsWith('30') || cleaned.startsWith('31') || cleaned.startsWith('32') || cleaned.startsWith('33') || cleaned.startsWith('34') || cleaned.startsWith('35') || cleaned.startsWith('36') || cleaned.startsWith('37'))) {
    cleaned = '92' + cleaned;
  }

  return cleaned;
}

/**
 * Formats a clean, readable list of event dates without showing invalid or placeholder dates.
 */
export function formatEventsDateList(events: EventItem[] = [], fallbackString?: string): string {
  const sorted = sortEventsInSequence(events);
  const datedEvents = sorted.filter((e) => e.eventDate && e.eventDate.trim() !== '');

  if (datedEvents.length > 0) {
    return datedEvents
      .map((e) => {
        const dateStr = formatDate(e.eventDate!);
        return `• ${e.name} — ${dateStr}`;
      })
      .join('\n');
  }

  if (fallbackString && fallbackString.trim() !== '') {
    return `• ${fallbackString.trim()}`;
  }

  if (sorted.length > 0) {
    return sorted.map((e) => `• ${e.name} (Date as discussed)`).join('\n');
  }

  return '• As Discussed';
}

/**
 * Standardized, fixed format for core quotation details.
 * Ensures consistent presentation across all WhatsApp categories.
 */
export function generateStandardQuotationDetails(quotation: Quotation, originUrl?: string): string {
  const qNum = quotation.quotationNumber ? `#${quotation.quotationNumber.replace(/^#/, '')}` : '#SS-2026';
  const qDate = quotation.client?.quotationDate ? formatDate(quotation.client.quotationDate) : '';
  const datesList = formatEventsDateList(quotation.events, quotation.client?.eventDates);
  const portalUrl = generatePortalUrl(quotation, originUrl);

  const sortedEvents = sortEventsInSequence(quotation.events || []);
  const eventNames = sortedEvents.length > 0 ? sortedEvents.map((e) => e.name).join(', ') : 'Wedding Photography & Videography';

  const total = formatCurrency(quotation.payment?.grandTotal || 0);
  const advance = Number(quotation.payment?.advanceReceived) || 0;
  const balance = Number(quotation.payment?.balancePayable) || (Number(quotation.payment?.grandTotal) || 0) - advance;

  let pricingBlock = `*Total Package:* ${total}`;
  if (advance > 0) {
    pricingBlock += `\n*Advance Paid:* ${formatCurrency(advance)}\n*Balance Payable:* ${formatCurrency(balance)}`;
  } else if (balance > 0 && balance !== (Number(quotation.payment?.grandTotal) || 0)) {
    pricingBlock += `\n*Balance Payable:* ${formatCurrency(balance)}`;
  }

  const lines = [
    `━━━━━━━━━━━━━━━━━━━━`,
    `📋 *Quotation Details (${qNum})*`,
    qDate ? `*Date:* ${qDate}` : '',
    ``,
    `*Event Schedule:*`,
    datesList,
    ``,
    `*Coverage:* ${eventNames}`,
    pricingBlock,
    ``,
    `🔗 *View Interactive Quotation Online:*`,
    portalUrl,
    `━━━━━━━━━━━━━━━━━━━━`,
  ].filter((l) => l !== undefined);

  return lines.join('\n');
}

/**
 * Compiles a category message template by dynamically replacing all placeholders with live quotation data.
 */
export function compileWhatsAppMessage(
  templateString: string,
  quotation: Quotation,
  settings?: AppSettings,
  originUrl?: string
): string {
  const clientName = quotation.client?.name?.trim() || 'Valued Client';
  const qNum = quotation.quotationNumber ? `#${quotation.quotationNumber.replace(/^#/, '')}` : '#SS-2026';
  const qDate = quotation.client?.quotationDate ? formatDate(quotation.client.quotationDate) : '';
  const datesList = formatEventsDateList(quotation.events, quotation.client?.eventDates);
  const sortedEvents = sortEventsInSequence(quotation.events || []);
  const eventNames = sortedEvents.length > 0 ? sortedEvents.map((e) => e.name).join(', ') : 'Wedding Package';

  const total = formatCurrency(quotation.payment?.grandTotal || 0);
  const advance = formatCurrency(quotation.payment?.advanceReceived || 0);
  const balance = formatCurrency(quotation.payment?.balancePayable || 0);

  const businessName = settings?.business?.name?.trim() || 'The Snap Service';
  const businessPhone = settings?.business?.phone?.trim() || '';
  const portalUrl = generatePortalUrl(quotation, originUrl);
  const stdDetails = generateStandardQuotationDetails(quotation, originUrl);

  let compiled = templateString || DEFAULT_WHATSAPP_TEMPLATES.new_client;

  // Replace placeholders
  compiled = compiled.replace(/\{client_name\}/gi, clientName);
  compiled = compiled.replace(/\{quotation_number\}/gi, qNum);
  compiled = compiled.replace(/\{quotation_date\}/gi, qDate);
  compiled = compiled.replace(/\{event_dates\}/gi, datesList);
  compiled = compiled.replace(/\{event_names\}/gi, eventNames);
  compiled = compiled.replace(/\{total_amount\}/gi, total);
  compiled = compiled.replace(/\{advance_amount\}/gi, advance);
  compiled = compiled.replace(/\{balance_amount\}/gi, balance);
  compiled = compiled.replace(/\{business_name\}/gi, businessName);
  compiled = compiled.replace(/\{phone\}/gi, businessPhone);
  compiled = compiled.replace(/\{portal_url\}/gi, portalUrl);

  // Replace {quotation_details} or auto-append if omitted
  if (compiled.includes('{quotation_details}')) {
    compiled = compiled.replace(/\{quotation_details\}/gi, stdDetails);
  } else {
    compiled = `${compiled.trim()}\n\n${stdDetails}`;
  }

  return compiled.trim();
}

/**
 * Generates the direct WhatsApp Web / App intent URL
 */
export function generateWhatsAppIntentUrl(phone: string, message: string): string {
  const normalized = normalizeWhatsAppPhone(phone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${encoded}`;
}

export interface LatestWhatsAppStatusMeta {
  category: WhatsAppCategory | 'none';
  label: string;
  shortLabel: string;
  buttonLabel: string;
  badgeLabel: string;
  sentAt?: string;
  sentByUserName?: string;
  buttonClass: string;
  badgeClass: string;
  iconColor: string;
  isSent: boolean;
}

export function getLatestWhatsAppStatus(q: Quotation): LatestWhatsAppStatusMeta {
  const history = q.whatsappHistory;
  const latest = history && history.length > 0 ? history[0] : null;

  if (!latest) {
    return {
      category: 'none',
      label: 'Not Sent',
      shortLabel: 'Not Sent',
      buttonLabel: 'WhatsApp',
      badgeLabel: 'Not Sent',
      buttonClass: 'text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-300',
      badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
      iconColor: 'text-slate-400',
      isSent: false,
    };
  }

  switch (latest.category) {
    case 'new_client':
      return {
        category: 'new_client',
        label: '1st Message',
        shortLabel: '1st Msg',
        buttonLabel: '1st Msg Sent',
        badgeLabel: '1st Msg Sent',
        sentAt: latest.sentAt,
        sentByUserName: latest.sentByUserName,
        buttonClass: 'text-emerald-900 bg-emerald-100/90 hover:bg-emerald-200 border-emerald-300',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        iconColor: 'text-emerald-700',
        isSent: true,
      };
    case 'second_reminder':
      return {
        category: 'second_reminder',
        label: '2nd Reminder',
        shortLabel: '2nd Rem',
        buttonLabel: '2nd Reminder',
        badgeLabel: '2nd Reminder',
        sentAt: latest.sentAt,
        sentByUserName: latest.sentByUserName,
        buttonClass: 'text-blue-900 bg-blue-100/90 hover:bg-blue-200 border-blue-300',
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
        iconColor: 'text-blue-700',
        isSent: true,
      };
    case 'final_reminder':
      return {
        category: 'final_reminder',
        label: 'Final Reminder',
        shortLabel: 'Final Rem',
        buttonLabel: 'Final Reminder',
        badgeLabel: 'Final Reminder',
        sentAt: latest.sentAt,
        sentByUserName: latest.sentByUserName,
        buttonClass: 'text-rose-900 bg-rose-100/90 hover:bg-rose-200 border-rose-300',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
        iconColor: 'text-rose-700',
        isSent: true,
      };
    case 'offer_reminder':
      return {
        category: 'offer_reminder',
        label: 'Offer Reminder',
        shortLabel: 'Offer',
        buttonLabel: 'Offer Sent',
        badgeLabel: 'Offer Sent',
        sentAt: latest.sentAt,
        sentByUserName: latest.sentByUserName,
        buttonClass: 'text-amber-900 bg-amber-100/90 hover:bg-amber-200 border-amber-300',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        iconColor: 'text-amber-700',
        isSent: true,
      };
    case 'event_confirmation':
      return {
        category: 'event_confirmation',
        label: 'Booking Locked',
        shortLabel: 'Confirmed',
        buttonLabel: 'Confirmed',
        badgeLabel: 'Confirmed',
        sentAt: latest.sentAt,
        sentByUserName: latest.sentByUserName,
        buttonClass: 'text-purple-900 bg-purple-100/90 hover:bg-purple-200 border-purple-300',
        badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
        iconColor: 'text-purple-700',
        isSent: true,
      };
    default:
      return {
        category: latest.category,
        label: latest.categoryLabel || 'WA Sent',
        shortLabel: (latest.categoryLabel || 'WA Sent').slice(0, 10),
        buttonLabel: latest.categoryLabel || 'WA Sent',
        badgeLabel: latest.categoryLabel || 'WA Sent',
        sentAt: latest.sentAt,
        sentByUserName: latest.sentByUserName,
        buttonClass: 'text-teal-900 bg-teal-100/90 hover:bg-teal-200 border-teal-300',
        badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
        iconColor: 'text-teal-700',
        isSent: true,
      };
  }
}

