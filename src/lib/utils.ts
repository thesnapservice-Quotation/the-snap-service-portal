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
 * Encode quotation object into ultra-compact, short URL payload string
 */
export function encodeQuotationData(quotation: any): string {
  try {
    const compactArr = [
      quotation.id || '',
      quotation.quotationNumber || '',
      quotation.userId || 'user-super-admin',
      quotation.status || 'sent',
      quotation.client?.name || '',
      quotation.client?.phone || '',
      quotation.client?.quotationDate || '',
      quotation.client?.eventDates || '',
      quotation.packageType || 'multi_event',
      (quotation.events || []).map((e: any) => [
        e.id || '',
        e.name || '',
        e.dayNumber || 1,
        e.guestCount || 0,
        e.price || 0,
        (e.services || []).map((s: any) => [s.serviceName || '', s.quantity || 1]),
        e.eventDate || '',
      ]),
      (quotation.inclusions || []).map((inc: any) => [inc.id || '', inc.name || '', inc.included ? 1 : 0]),
      [
        quotation.payment?.grandTotal || 0,
        quotation.payment?.advanceReceived || 0,
        quotation.payment?.advanceType || 'fixed',
        quotation.payment?.advancePercentage || 0,
        quotation.payment?.balancePayable || 0,
      ],
      quotation.termsAndConditions || [],
    ];

    const jsonStr = JSON.stringify(compactArr);
    if (typeof window !== 'undefined' && window.btoa) {
      return encodeURIComponent(window.btoa(encodeURIComponent(jsonStr)));
    }
  } catch (e) {
    console.error('Error encoding quotation data', e);
  }
  return '';
}

/**
 * Decode quotation object from URL-safe string (Supports both compact array & legacy object formats)
 */
export function decodeQuotationData(encodedStr: string): any | null {
  try {
    if (!encodedStr) return null;
    const jsonStr = decodeURIComponent(window.atob(decodeURIComponent(encodedStr)));
    const parsed = JSON.parse(jsonStr);

    if (Array.isArray(parsed)) {
      return {
        id: parsed[0] || `quote-${Date.now()}`,
        quotationNumber: parsed[1] || 'SS-2026',
        userId: parsed[2] || 'user-super-admin',
        status: parsed[3] || 'sent',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        client: {
          name: parsed[4] || '',
          phone: parsed[5] || '',
          quotationDate: parsed[6] || '',
          eventDates: parsed[7] || '',
        },
        packageType: parsed[8] || 'multi_event',
        events: (parsed[9] || []).map((e: any) => ({
          id: e[0] || `evt-${Math.random()}`,
          name: e[1] || '',
          dayNumber: e[2] || 1,
          guestCount: e[3] || 0,
          price: e[4] || 0,
          services: (e[5] || []).map((s: any, idx: number) => ({
            id: `srv-${idx}`,
            serviceName: s[0] || '',
            quantity: s[1] || 1,
          })),
          eventDate: e[6] || '',
        })),
        inclusions: (parsed[10] || []).map((inc: any, idx: number) => ({
          id: inc[0] || `inc-${idx}`,
          name: inc[1] || '',
          included: Boolean(inc[2]),
        })),
        payment: {
          grandTotal: parsed[11]?.[0] || 0,
          advanceReceived: parsed[11]?.[1] || 0,
          advanceType: parsed[11]?.[2] || 'fixed',
          advancePercentage: parsed[11]?.[3] || 0,
          balancePayable: parsed[11]?.[4] || 0,
        },
        termsAndConditions: parsed[12] || [],
      };
    }

    if (parsed && typeof parsed === 'object') {
      return {
        id: parsed.id || `quote-${Date.now()}`,
        quotationNumber: parsed.qN || 'SS-2026',
        userId: parsed.uId || 'user-super-admin',
        status: parsed.st || 'sent',
        createdAt: parsed.cA || new Date().toISOString(),
        updatedAt: parsed.uA || new Date().toISOString(),
        client: parsed.cl || {},
        packageType: parsed.pT || 'multi_event',
        events: parsed.ev || [],
        inclusions: parsed.inc || [],
        payment: parsed.pay || {},
        termsAndConditions: parsed.tC || [],
      };
    }
  } catch (e) {
    console.error('Error decoding quotation data', e);
  }
  return null;
}

/**
 * Generate ultra-clean, short portal URL without any query parameters (e.g. https://portal.thesnapservice.com/p/SS-2026-103)
 */
export function generatePortalUrl(quotation: any, originUrl?: string): string {
  const baseUrl = originUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://portal.thesnapservice.com');
  const shortId = quotation.quotationNumber || quotation.id;
  return `${baseUrl}/p/${shortId}`;
}

/**
 * Generate luxury personalized WhatsApp share URL with portal link
 */
export function generateWhatsAppShareUrl(quotation: any, originUrl?: string): string {
  const phone = formatWhatsAppPhone(quotation.client?.phone || '');
  const portalUrl = generatePortalUrl(quotation, originUrl);

  const eventNames = (quotation.events || []).map((e: any) => e.name).join(', ');

  const message = `THE SNAP SERVICE\n\nAssalam-o-Alaikum ${quotation.client?.name || 'Valued Client'},\nHere is your official wedding quotation (#${quotation.quotationNumber || 'SS-2026'}).\n\nEvents Covered: ${eventNames || 'Wedding Package'}\nEvent Dates: ${quotation.client?.eventDates || 'As Discussed'}\nGrand Total: ${formatCurrency(quotation.payment?.grandTotal)}\nAdvance Paid: ${formatCurrency(quotation.payment?.advanceReceived)}\nBalance Payable: ${formatCurrency(quotation.payment?.balancePayable)}\n\nView Interactive Quotation & Lock Your Dates Online:\n${portalUrl}\n\nThank you for choosing The Snap Service.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
