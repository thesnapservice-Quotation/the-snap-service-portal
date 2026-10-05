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
  if (num < 0) {
    return `-Rs. ${Math.abs(num).toLocaleString('en-PK')}`;
  }
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
 * Format date and time (e.g., "5 Oct 2026 • 2:20 AM")
 */
export function formatDateTime(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const d = date.toLocaleDateString('en-PK', {
    timeZone: 'Asia/Karachi',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const t = date.toLocaleTimeString('en-PK', {
    timeZone: 'Asia/Karachi',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${d} • ${t}`;
}

/**
 * Format event timing string for elegant display on quotation cards and calendars.
 * Converts shorthand like "Day", "Night", "Full day" into "Day Event", "Night Event", "Full Day".
 */
export function formatEventTiming(timing?: string): string {
  if (!timing) return '';
  const trimmed = timing.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();

  if (lower === 'day' || lower === 'day event') {
    return 'Day Event';
  }
  if (lower === 'night' || lower === 'night event') {
    return 'Night Event';
  }
  if (lower === 'full day' || lower === 'fullday' || lower === 'full-day' || lower === 'full day event') {
    return 'Full Day';
  }

  return trimmed;
}

/**
 * Extract sequence integer from Quotation Number (e.g. "SS-2026-105" -> 105)
 */
export function extractQuotationSeq(quotationNumber?: string): number {
  if (!quotationNumber) return 0;
  const cleaned = quotationNumber.replace(/^#/, '').trim();
  const match = cleaned.match(/(\d+)$/);
  if (match) {
    return parseInt(match[1], 10);
  }
  const digits = cleaned.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

/**
 * Sort quotations strictly by Quotation Number (descending: newest quotation # at the top).
 * If quotation numbers are equal or non-numeric, fall back to immutable createdAt.
 * Does NOT sort by updatedAt, so editing a quotation will NEVER change its fixed position in the list.
 */
export function sortQuotationsByNumber(quotes: Quotation[]): Quotation[] {
  return [...quotes].sort((a, b) => {
    const seqA = extractQuotationSeq(a.quotationNumber);
    const seqB = extractQuotationSeq(b.quotationNumber);

    if (seqA !== seqB) {
      return seqB - seqA;
    }

    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeA !== timeB) {
      return timeB - timeA;
    }

    return (b.quotationNumber || '').localeCompare(a.quotationNumber || '');
  });
}

/**
 * Sort wedding quotations for the Studio Calendar & Master Schedule:
 * 1. Confirmed Upcoming Weddings (earliest upcoming date first)
 * 2. Unconfirmed / Inquired Upcoming Weddings (earliest upcoming date first)
 * 3. Dates Pending / TBD Weddings (newest quotation sequence first)
 * 4. Past / Covered Weddings (dates have passed -> sent to the very bottom)
 */
export function sortCalendarQuotations(quotes: Quotation[]): Quotation[] {
  const today = getTodayDateString();

  return [...quotes].sort((a, b) => {
    const getDates = (q: Quotation) => {
      const dates = (q.events || [])
        .map((e) => e.eventDate)
        .filter((d): d is string => Boolean(d && d.trim().length > 0))
        .sort();
      return {
        hasDates: dates.length > 0,
        earliest: dates[0] || '',
        latest: dates[dates.length - 1] || '',
      };
    };

    const aInfo = getDates(a);
    const bInfo = getDates(b);

    const aIsConfirmed = a.status === 'confirmed';
    const bIsConfirmed = b.status === 'confirmed';

    const aIsPast = aInfo.hasDates && aInfo.latest < today;
    const bIsPast = bInfo.hasDates && bInfo.latest < today;

    const getRank = (info: { hasDates: boolean; earliest: string; latest: string }, isConfirmed: boolean, isPast: boolean) => {
      if (info.hasDates && isPast) return 4;
      if (!info.hasDates) return 3;
      if (isConfirmed) return 1;
      return 2;
    };

    const aRank = getRank(aInfo, aIsConfirmed, aIsPast);
    const bRank = getRank(bInfo, bIsConfirmed, bIsPast);

    if (aRank !== bRank) {
      return aRank - bRank;
    }

    // Inside Rank 1 (Confirmed Upcoming) & Rank 2 (Unconfirmed Upcoming):
    // Strict chronological date sequence (earliest event date ascending)
    if (aRank === 1 || aRank === 2) {
      const cmp = aInfo.earliest.localeCompare(bInfo.earliest);
      if (cmp !== 0) return cmp;
      return extractQuotationSeq(b.quotationNumber) - extractQuotationSeq(a.quotationNumber);
    }

    // Inside Rank 3 (Dates Pending / TBD):
    // Sequence descending (newest quotation first)
    if (aRank === 3) {
      return extractQuotationSeq(b.quotationNumber) - extractQuotationSeq(a.quotationNumber);
    }

    // Inside Rank 4 (Past / Covered):
    // Most recently covered events first, older ones below
    if (aRank === 4) {
      const cmp = bInfo.latest.localeCompare(aInfo.latest);
      if (cmp !== 0) return cmp;
      return extractQuotationSeq(b.quotationNumber) - extractQuotationSeq(a.quotationNumber);
    }

    return 0;
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
        evt.venue || '',
        evt.timing || '',
      ]),
      m: [
        q.payment?.grandTotal || 0,
        q.payment?.advanceReceived || 0,
        q.payment?.balancePayable || 0,
        q.payment?.advanceType || 'fixed',
      ],
      t: q.termsAndConditions || [],
      k: (q.inclusions || []).map((inc) => [
        inc.id,
        inc.name,
        inc.included ? 1 : 0,
        inc.quantity !== undefined ? inc.quantity : 1,
        inc.price !== undefined ? inc.price : 0,
      ]),
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

    type RawEventTuple = [string, string, string, number, number, [string, string, number][], string?, string?];
    type RawInclusionTuple = [string, string, number, number?, number?];

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
        venue: eArr[6] || undefined,
        timing: eArr[7] || undefined,
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
        quantity: kArr[3] !== undefined ? kArr[3] : 1,
        price: kArr[4] !== undefined && kArr[4] > 0 ? kArr[4] : undefined,
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

export interface PaymentMilestones {
  stage1Amount: number; // 50% Advance to confirm booking
  stage2Amount: number; // 25% After event completion
  stage3Amount: number; // 25% Before final delivery
  grandTotal: number;
  advancePaid: number;
  balancePayable: number;
}

/**
 * Calculates 3-Stage Milestone Payment Schedule with dynamic redistribution:
 * - Baseline: 50% Advance, 25% After Event, 25% Before Final Delivery
 * - If client pays less than planned advance, unpaid advance is moved to Stage 2 (After Event Completion)
 * - Stage 3 (Before Final Delivery) remains exactly 25%
 * - Sum of Stage 1 + Stage 2 + Stage 3 always strictly equals Grand Total
 */
export function calculatePaymentMilestones(
  grandTotal: number,
  advanceReceived: number = 0,
  advancePercentage: number = 50
): PaymentMilestones {
  const total = Math.max(0, Number(grandTotal) || 0);
  const paid = Math.max(0, Number(advanceReceived) || 0);

  const pct = advancePercentage > 0 && advancePercentage < 100 ? advancePercentage : 50;
  const plannedStage1 = Math.round((total * pct) / 100);
  const plannedStage3 = Math.round(total * 0.25);
  const plannedStage2 = Math.max(0, total - plannedStage1 - plannedStage3);

  if (paid === 0) {
    return {
      stage1Amount: plannedStage1,
      stage2Amount: plannedStage2,
      stage3Amount: plannedStage3,
      grandTotal: total,
      advancePaid: 0,
      balancePayable: total,
    };
  }

  if (paid <= plannedStage1) {
    const unpaidAdvance = plannedStage1 - paid;
    const stage1Amount = paid;
    const stage2Amount = plannedStage2 + unpaidAdvance;
    const stage3Amount = plannedStage3;

    return {
      stage1Amount,
      stage2Amount,
      stage3Amount,
      grandTotal: total,
      advancePaid: paid,
      balancePayable: Math.max(0, total - paid),
    };
  }

  // If paid > plannedStage1
  const excess = paid - plannedStage1;
  const stage1Amount = paid;
  const stage2Amount = Math.max(0, plannedStage2 - excess);
  const stage3Amount = Math.max(0, total - stage1Amount - stage2Amount);

  return {
    stage1Amount,
    stage2Amount,
    stage3Amount,
    grandTotal: total,
    advancePaid: paid,
    balancePayable: Math.max(0, total - paid),
  };
}
