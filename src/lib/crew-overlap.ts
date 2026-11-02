import { Quotation, EventItem, CrewMemberCost } from './types';
import { isQuotationExpired, formatDate, formatEventTiming } from './utils';

export type TimingSlot = 'day' | 'night' | 'full_day' | 'unknown';

/**
 * Determine whether an event timing string falls under Day, Night, Full Day, or Unknown
 */
export function getTimingSlot(timing?: string): TimingSlot {
  if (!timing) return 'unknown';
  const t = timing.trim().toLowerCase();
  if (!t || t === 'undefined' || t === 'null') return 'unknown';

  if (
    t.includes('day & night') ||
    t.includes('full day') ||
    t.includes('fullday') ||
    t.includes('full-day') ||
    (t.includes('day') && t.includes('night'))
  ) {
    return 'full_day';
  }

  if (
    t.includes('night') ||
    t.includes('evening') ||
    t.includes('shaam') ||
    t.includes('raat') ||
    t.includes('dinner')
  ) {
    return 'night';
  }

  if (
    t.includes('day') ||
    t.includes('morning') ||
    t.includes('subah') ||
    t.includes('afternoon') ||
    t.includes('dopahar') ||
    t.includes('lunch')
  ) {
    return 'day';
  }

  // Parse time range if present like "2:00 PM - 8:00 PM" or "7:00 PM - 12:00 AM"
  const match = t.match(/(\d{1,2})(?::\d{2})?\s*(am|pm)/i);
  if (match) {
    let hour = parseInt(match[1], 10);
    const meridiem = match[2].toLowerCase();
    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;

    // 5:00 PM (17:00) onwards is Night shift
    if (hour >= 17) return 'night';
    // 6:00 AM to 4:59 PM is Day shift
    if (hour >= 6 && hour < 17) return 'day';
  }

  return 'unknown';
}

/**
 * Check if two timing slots overlap.
 * Day and Night DO NOT overlap.
 * Full day overlaps with everything.
 * Unknown timing is flagged as potential overlap for safety.
 */
export function doTimingSlotsOverlap(slot1: TimingSlot, slot2: TimingSlot): boolean {
  if (slot1 === 'full_day' || slot2 === 'full_day') return true;
  if (slot1 === 'unknown' || slot2 === 'unknown') return true;
  return slot1 === slot2;
}

/**
 * Filter out generic placeholder names (e.g., "Photographer #1", "Drone Pilot", "")
 */
export function isPlaceholderCrewName(name?: string): boolean {
  if (!name) return true;
  const lower = name.trim().toLowerCase();
  if (!lower) return true;

  if (
    lower.startsWith('photographer #') ||
    lower.startsWith('videographer #') ||
    lower.startsWith('drone #') ||
    lower.startsWith('drone pilot #') ||
    lower.startsWith('cinematographer #') ||
    lower.startsWith('candid #') ||
    lower.startsWith('shoot #') ||
    lower.startsWith('outdoor couple shoot #') ||
    lower === 'photographer' ||
    lower === 'videographer' ||
    lower === 'drone operator' ||
    lower === 'drone pilot' ||
    lower === 'cinematographer' ||
    lower === 'unassigned'
  ) {
    return true;
  }

  return false;
}

export interface CrewConflictItem {
  quotationId: string;
  quotationNumber: string;
  clientName: string;
  clientPhone?: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  timing?: string;
  timingSlot: TimingSlot;
  role?: string;
  reason: string;
}

export interface CrewConflictResult {
  hasConflict: boolean;
  conflicts: CrewConflictItem[];
}

/**
 * Check whether a crew member is already assigned on the same date and overlapping timing.
 */
export function checkCrewMemberOverlap(
  memberName: string,
  targetDate: string,
  targetTiming: string | undefined,
  allQuotations: Quotation[],
  context?: {
    currentQuotationId?: string;
    currentEventId?: string;
    currentServiceId?: string;
    currentCrewIndex?: number;
  }
): CrewConflictResult {
  const cleanTargetName = memberName.trim().toLowerCase();
  if (!cleanTargetName || isPlaceholderCrewName(memberName)) {
    return { hasConflict: false, conflicts: [] };
  }

  if (!targetDate || !targetDate.trim()) {
    return { hasConflict: false, conflicts: [] };
  }

  const cleanTargetDate = targetDate.trim();
  const targetSlot = getTimingSlot(targetTiming);
  const conflicts: CrewConflictItem[] = [];

  // Strictly active quotations
  const activeQuotations = allQuotations.filter(
    (q) => q && q.status !== 'trash' && !q.isDeleted && !isQuotationExpired(q)
  );

  activeQuotations.forEach((q) => {
    (q.events || []).forEach((evt) => {
      const evtDate = evt.eventDate?.trim();
      if (!evtDate || evtDate !== cleanTargetDate) return;

      const evtSlot = getTimingSlot(evt.timing);

      // Check Day vs Night overlap
      if (!doTimingSlotsOverlap(targetSlot, evtSlot)) {
        // Different shifts on the same day (e.g. Day vs Night) -> Permitted, NO clash!
        return;
      }

      (evt.services || []).forEach((srv) => {
        (srv.crewBreakdown || []).slice(0, srv.quantity || 1).forEach((c, cIdx) => {
          const cName = c.name?.trim().toLowerCase();
          if (!cName || isPlaceholderCrewName(c.name)) return;

          if (cName === cleanTargetName) {
            // Check if this is the exact same slot being edited
            if (
              context?.currentQuotationId &&
              q.id === context.currentQuotationId &&
              context.currentEventId &&
              evt.id === context.currentEventId &&
              context.currentServiceId &&
              (srv.id === context.currentServiceId || srv.serviceId === context.currentServiceId) &&
              context.currentCrewIndex !== undefined &&
              cIdx === context.currentCrewIndex
            ) {
              return;
            }

            let reason = '';
            if (targetSlot === 'day' && evtSlot === 'day') {
              reason = 'Both events are scheduled for Day shift';
            } else if (targetSlot === 'night' && evtSlot === 'night') {
              reason = 'Both events are scheduled for Night shift';
            } else if (targetSlot === 'full_day' || evtSlot === 'full_day') {
              reason = 'Scheduled for Full Day booking';
            } else {
              reason = 'Event timing unspecified or overlapping';
            }

            conflicts.push({
              quotationId: q.id,
              quotationNumber: q.quotationNumber,
              clientName: q.client?.name || 'Unnamed Client',
              clientPhone: q.client?.phone,
              eventId: evt.id,
              eventName: evt.name || 'Wedding Event',
              eventDate: evtDate,
              timing: evt.timing,
              timingSlot: evtSlot,
              role: c.role || srv.serviceName,
              reason,
            });
          }
        });
      });
    });
  });

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

export interface GlobalCrewConflict {
  crewName: string;
  eventDate: string;
  timingDescription: string;
  events: {
    quotationId: string;
    quotationNumber: string;
    clientName: string;
    clientPhone?: string;
    eventName: string;
    eventDate: string;
    timing?: string;
    timingSlot: TimingSlot;
    role?: string;
  }[];
}

/**
 * Scan all active quotations and return any existing crew schedule conflicts.
 */
export function findAllCrewConflicts(allQuotations: Quotation[]): GlobalCrewConflict[] {
  const activeQuotations = allQuotations.filter(
    (q) => q && q.status !== 'trash' && !q.isDeleted && !isQuotationExpired(q)
  );

  interface FlatAssignment {
    crewName: string;
    quotationId: string;
    quotationNumber: string;
    clientName: string;
    clientPhone?: string;
    eventId: string;
    eventName: string;
    eventDate: string;
    timing?: string;
    timingSlot: TimingSlot;
    role?: string;
  }

  const assignments: FlatAssignment[] = [];

  activeQuotations.forEach((q) => {
    (q.events || []).forEach((evt) => {
      const evtDate = evt.eventDate?.trim();
      if (!evtDate) return;

      const evtSlot = getTimingSlot(evt.timing);

      (evt.services || []).forEach((srv) => {
        (srv.crewBreakdown || []).slice(0, srv.quantity || 1).forEach((c) => {
          const rawName = c.name?.trim();
          if (!rawName || isPlaceholderCrewName(rawName)) return;

          assignments.push({
            crewName: rawName,
            quotationId: q.id,
            quotationNumber: q.quotationNumber,
            clientName: q.client?.name || 'Unnamed Client',
            clientPhone: q.client?.phone,
            eventId: evt.id,
            eventName: evt.name || 'Wedding Event',
            eventDate: evtDate,
            timing: evt.timing,
            timingSlot: evtSlot,
            role: c.role || srv.serviceName,
          });
        });
      });
    });
  });

  // Group by (crewName.toLowerCase(), eventDate)
  const grouped: Record<string, FlatAssignment[]> = {};
  assignments.forEach((a) => {
    const key = `${a.crewName.toLowerCase()}___${a.eventDate}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(a);
  });

  const results: GlobalCrewConflict[] = [];

  for (const [, list] of Object.entries(grouped)) {
    if (list.length > 1) {
      // Check pairwise if timing slots overlap
      const conflictingSublist: FlatAssignment[] = [];
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          if (doTimingSlotsOverlap(list[i].timingSlot, list[j].timingSlot)) {
            if (!conflictingSublist.includes(list[i])) conflictingSublist.push(list[i]);
            if (!conflictingSublist.includes(list[j])) conflictingSublist.push(list[j]);
          }
        }
      }

      if (conflictingSublist.length > 1) {
        const canonicalName = conflictingSublist[0].crewName;
        const eventDate = conflictingSublist[0].eventDate;
        const timingSlots = [...new Set(conflictingSublist.map((c) => c.timingSlot))];
        const timingDesc = timingSlots.map((s) => (s === 'day' ? 'Day' : s === 'night' ? 'Night' : s === 'full_day' ? 'Full Day' : 'Any/TBD')).join(' & ');

        results.push({
          crewName: canonicalName,
          eventDate,
          timingDescription: timingDesc,
          events: conflictingSublist,
        });
      }
    }
  }

  return results;
}
