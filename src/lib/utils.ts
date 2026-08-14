import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format numbers as PKR currency string (e.g. "Rs. 40,000")
 */
export function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || amount === '') return 'Rs. 0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'Rs. 0';
  return `Rs. ${num.toLocaleString('en-PK')}`;
}

/**
 * Format raw number input or parse string number
 */
export function parseAmount(val: string | number): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = val.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format date string to display format (e.g., "12 Aug 2026")
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format today's date in YYYY-MM-DD for input[type="date"]
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format Pakistani phone numbers for WhatsApp API (e.g. "03211234567" -> "923211234567")
 */
export function formatWhatsAppPhone(phone: string): string {
  let cleaned = (phone || '').replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.slice(1);
  }
  return cleaned;
}

/**
 * Generate luxury personalized WhatsApp share URL with portal link
 */
export function generateWhatsAppShareUrl(quotation: any, originUrl?: string): string {
  const phone = formatWhatsAppPhone(quotation.client?.phone || '');
  const baseUrl = originUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const portalUrl = `${baseUrl}/portal/${quotation.id}`;

  const eventNames = (quotation.events || []).map((e: any) => e.name).join(', ');

  const message = `SNAP SERVICE WEDDING STUDIO\n\nAssalam-o-Alaikum ${quotation.client?.name},\nHere is your official wedding quotation (#${quotation.quotationNumber}).\n\nEvents Covered: ${eventNames || 'Wedding Package'}\nEvent Dates: ${quotation.client?.eventDates || 'As Discussed'}\nGrand Total: ${formatCurrency(quotation.payment?.grandTotal)}\nAdvance Paid: ${formatCurrency(quotation.payment?.advanceReceived)}\nBalance Payable: ${formatCurrency(quotation.payment?.balancePayable)}\n\nView Interactive Quotation & Lock Your Dates Online:\n${portalUrl}\n\nThank you for choosing Snap Service Studio.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
