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
 * Encode quotation object into lightweight URL-safe string
 */
export function encodeQuotationData(quotation: any): string {
  try {
    const compact = {
      id: quotation.id,
      qN: quotation.quotationNumber,
      uId: quotation.userId,
      st: quotation.status,
      cA: quotation.createdAt,
      uA: quotation.updatedAt,
      cl: quotation.client,
      pT: quotation.packageType,
      ev: quotation.events,
      inc: quotation.inclusions,
      pay: quotation.payment,
      tC: quotation.termsAndConditions,
    };
    const jsonStr = JSON.stringify(compact);
    if (typeof window !== 'undefined' && window.btoa) {
      return encodeURIComponent(window.btoa(encodeURIComponent(jsonStr)));
    }
  } catch (e) {
    console.error('Error encoding quotation data', e);
  }
  return '';
}

/**
 * Decode quotation object from URL-safe string
 */
export function decodeQuotationData(encodedStr: string): any | null {
  try {
    if (!encodedStr) return null;
    const jsonStr = decodeURIComponent(window.atob(decodeURIComponent(encodedStr)));
    const parsed = JSON.parse(jsonStr);
    if (parsed) {
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
 * Ultra-Compact Quotation Serialization for Short Links
 */
export function compactQuotationData(q: any): string {
  try {
    const compactObj = {
      i: q.id,
      n: q.quotationNumber,
      u: q.userId,
      s: q.status,
      c: {
        n: q.client?.name || '',
        p: q.client?.phone || '',
        d: q.client?.quotationDate || '',
        e: q.client?.eventDates || '',
      },
      e: (q.events || []).map((evt: any) => [
        evt.id,
        evt.name,
        evt.eventDate || '',
        evt.guestCount || 0,
        evt.price || 0,
        (evt.services || []).map((srv: any) => [srv.serviceId, srv.serviceName, srv.quantity]),
      ]),
      m: [
        q.payment?.grandTotal || 0,
        q.payment?.advanceReceived || 0,
        q.payment?.balancePayable || 0,
        q.payment?.advanceType || 'fixed',
      ],
      t: q.termsAndConditions || [],
      k: (q.inclusions || []).map((inc: any) => [inc.id, inc.name, inc.included ? 1 : 0]),
    };

    const jsonStr = JSON.stringify(compactObj);
    if (typeof window !== 'undefined' && window.btoa) {
      return encodeURIComponent(window.btoa(encodeURIComponent(jsonStr)));
    }
  } catch (e) {
    console.error('Error compacting quotation data', e);
  }
  return '';
}

/**
 * Decompact quotation object from ultra-compact string
 */
export function decompactQuotationData(str: string): any | null {
  try {
    if (!str) return null;
    const jsonStr = decodeURIComponent(window.atob(decodeURIComponent(str)));
    const o = JSON.parse(jsonStr);
    if (!o) return null;

    return {
      id: o.i || `quote-${Date.now()}`,
      quotationNumber: o.n || 'SS-2026',
      userId: o.u || 'user-super-admin',
      status: o.s || 'sent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      client: {
        name: o.c?.n || '',
        phone: o.c?.p || '',
        quotationDate: o.c?.d || '',
        eventDates: o.c?.e || '',
      },
      packageType: 'multi_event',
      events: (o.e || []).map((eArr: any, idx: number) => ({
        id: eArr[0] || `evt-${idx}`,
        name: eArr[1] || `Event ${idx + 1}`,
        dayNumber: idx + 1,
        eventDate: eArr[2] || '',
        guestCount: eArr[3] || 0,
        price: eArr[4] || 0,
        services: (eArr[5] || []).map((sArr: any, sIdx: number) => ({
          id: `srv-${idx}-${sIdx}`,
          serviceId: sArr[0] || 'srv-1',
          serviceName: sArr[1] || 'Photography',
          quantity: sArr[2] || 1,
        })),
      })),
      payment: {
        grandTotal: o.m?.[0] || 0,
        advanceReceived: o.m?.[1] || 0,
        balancePayable: o.m?.[2] || 0,
        advanceType: o.m?.[3] || 'fixed',
      },
      termsAndConditions: o.t || [],
      inclusions: (o.k || []).map((kArr: any) => ({
        id: kArr[0],
        name: kArr[1],
        included: kArr[2] === 1,
      })),
    };
  } catch (e) {
    console.error('Error decompacting quotation data', e);
  }
  return null;
}

/**
 * Generate luxury short portal URL (e.g. portal.thesnapservice.com/p/SS-2026-102?c=...)
 */
export function generatePortalUrl(quotation: any, originUrl?: string): string {
  const baseUrl = originUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://portal.thesnapservice.com');
  const shortId = quotation.quotationNumber || quotation.id;
  const compactPayload = compactQuotationData(quotation);
  if (compactPayload) {
    return `${baseUrl}/p/${shortId}?c=${compactPayload}`;
  }
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
