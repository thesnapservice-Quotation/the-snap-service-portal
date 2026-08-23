import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Quotation, EventItem } from './types';
import { generateSecureId } from './crypto';

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
  return date.toLocaleDateString('en-PK', {
    timeZone: 'Asia/Karachi',
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
export function encodeQuotationData(quotation: Quotation): string {
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
export function decodeQuotationData(encodedStr: string): Quotation | null {
  try {
    if (!encodedStr) return null;
    const jsonStr = decodeURIComponent(window.atob(decodeURIComponent(encodedStr)));
    const parsed = JSON.parse(jsonStr);
    if (parsed) {
      return {
        id: parsed.id || generateSecureId('quote'),
        quotationNumber: parsed.qN || 'SS-2026',
        userId: parsed.uId || 'user-super-admin',
        status: parsed.st || 'sent',
        createdAt: parsed.cA || new Date().toISOString(),
        updatedAt: parsed.uA || new Date().toISOString(),
        client: parsed.cl || { name: '', phone: '', quotationDate: '', eventDates: '' },
        packageType: parsed.pT || 'multi_event',
        events: parsed.ev || [],
        inclusions: parsed.inc || [],
        payment: parsed.pay || { grandTotal: 0, advanceReceived: 0, advanceType: 'fixed', balancePayable: 0 },
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
export function compactQuotationData(q: Quotation): string {
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
      e: (q.events || []).map((evt) => [
        evt.id,
        evt.name,
        evt.eventDate || '',
        evt.guestCount || 0,
        evt.price || 0,
        (evt.services || []).map((srv) => [srv.serviceId, srv.serviceName, srv.quantity]),
      ]),
      m: [
        q.payment?.grandTotal || 0,
        q.payment?.advanceReceived || 0,
        q.payment?.balancePayable || 0,
        q.payment?.advanceType || 'fixed',
      ],
      t: q.termsAndConditions || [],
      k: (q.inclusions || []).map((inc) => [inc.id, inc.name, inc.included ? 1 : 0]),
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
export function decompactQuotationData(str: string): Quotation | null {
  try {
    if (!str) return null;
    const jsonStr = decodeURIComponent(window.atob(decodeURIComponent(str)));
    const o = JSON.parse(jsonStr);
    if (!o) return null;

    type RawEventTuple = [string, string, string, number, number, [string, string, number][]];
    type RawInclusionTuple = [string, string, number];

    return {
      id: o.i || generateSecureId('quote'),
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
      events: ((o.e || []) as RawEventTuple[]).map((eArr, idx) => ({
        id: eArr[0] || `evt-${idx}`,
        name: eArr[1] || `Event ${idx + 1}`,
        dayNumber: idx + 1,
        eventDate: eArr[2] || '',
        guestCount: eArr[3] || 0,
        price: eArr[4] || 0,
        services: (eArr[5] || []).map((sArr, sIdx) => ({
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
      inclusions: ((o.k || []) as RawInclusionTuple[]).map((kArr) => ({
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

import { generateRandomNumericId } from './crypto';

/**
 * Retrieve or generate the security access code for a quotation
 * Preserves existing 4-8 digit numeric codes for backward compatibility.
 */
export function getQuotationSecurityPin(quotation: Quotation): string {
  if (quotation.securityPin && /^\d{4,8}$/.test(quotation.securityPin)) {
    return quotation.securityPin;
  }
  // Deterministic stable 6-digit hash fallback if no pin was persisted
  const key = (quotation.quotationNumber || quotation.id || '').toUpperCase().trim();
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const pinNum = Math.abs(hash % 900000) + 100000; // 100000 to 999999
  return pinNum.toString();
}

/**
 * Generate luxury personalized portal URL with format:
 * Website Link / {Quotation Creation Date} / {Quotation#} / {Random Global Unique 6-digit Code}
 * e.g. https://portal.thesnapservice.com/portal/2026-08-23/SS-2026-103/847291
 */
export function generatePortalUrl(quotation: Quotation, originUrl?: string): string {
  const baseUrl = originUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://portal.thesnapservice.com');
  const cleanNumber = (quotation.quotationNumber || quotation.id || 'SS-2026-001').trim();
  
  // Format permanent immutable publicLinkDate (YYYY-MM-DD)
  const datePart = (
    quotation.publicLinkDate ||
    (quotation.client?.quotationDate ? quotation.client.quotationDate.split('T')[0] : (quotation.createdAt ? quotation.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]))
  ).trim();

  const pin = getQuotationSecurityPin(quotation);

  return `${baseUrl}/portal/${datePart}/${cleanNumber}/${pin}`;
}

/**
 * Chronological Pakistani Wedding Event Sequence Ordering:
 * 1. Engagement / Baat Pakki (1)
 * 2. Nikkah / Mayun (2)
 * 3. Ubtan / Dholki / Haldi (3)
 * 4. Mehndi / Sangeet / Qawwali (4)
 * 5. Barat / Shaadi / Wedding Day / Rukhsati (5)
 * 6. Walima / Reception (6)
 * 7. Couple Shoot / Outdoor (7)
 * 8. Other Events (8)
 */
export function getEventOrderScore(name: string): number {
  const n = (name || '').toLowerCase();
  if (n.includes('engagement') || n.includes('baat pakki') || n.includes('ring')) return 1;
  if (n.includes('nikkah')) return 2;
  if (n.includes('mayun') || n.includes('ubtan') || n.includes('dholki') || n.includes('haldi')) return 3;
  if (n.includes('mehndi') || n.includes('mehendi') || n.includes('sangeet') || n.includes('qawwali') || n.includes('dance')) return 4;
  if (n.includes('barat') || n.includes('baraat') || n.includes('shaadi') || n.includes('shadi') || n.includes('wedding') || n.includes('rukhsati')) return 5;
  if (n.includes('walima') || n.includes('valima') || n.includes('reception') || n.includes('dinner')) return 6;
  if (n.includes('couple') || n.includes('shoot') || n.includes('outdoor') || n.includes('post')) return 7;
  return 8;
}

export function sortEventsInSequence(events: EventItem[]): EventItem[] {
  if (!events || !Array.isArray(events)) return [];
  return [...events]
    .sort((a, b) => {
      const scoreDiff = getEventOrderScore(a.name) - getEventOrderScore(b.name);
      if (scoreDiff !== 0) return scoreDiff;
      return (a.dayNumber || 0) - (b.dayNumber || 0);
    })
    .map((evt, idx) => ({ ...evt, dayNumber: idx + 1 }));
}

/**
 * Generate luxury personalized WhatsApp share URL with secure portal link
 */
export function generateWhatsAppShareUrl(quotation: Quotation, originUrl?: string): string {
  const phone = formatWhatsAppPhone(quotation.client?.phone || '');
  const portalUrl = generatePortalUrl(quotation, originUrl);

  const sortedEvents = sortEventsInSequence(quotation.events || []);
  const eventNames = sortedEvents.map((e) => e.name).join(', ');

  const message = `THE SNAP SERVICE\n\nAssalam-o-Alaikum ${quotation.client?.name || 'Valued Client'},\nHere is your official wedding quotation (#${quotation.quotationNumber || 'SS-2026'}).\n\nEvents Covered: ${eventNames || 'Wedding Package'}\nEvent Dates: ${quotation.client?.eventDates || 'As Discussed'}\nGrand Total: ${formatCurrency(quotation.payment?.grandTotal)}\nAdvance Paid: ${formatCurrency(quotation.payment?.advanceReceived)}\nBalance Payable: ${formatCurrency(quotation.payment?.balancePayable)}\n\nView Interactive Quotation & Lock Your Dates Online:\n${portalUrl}\n\nThank you for choosing The Snap Service.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
