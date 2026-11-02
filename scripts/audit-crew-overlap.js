const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://zlgbdvanylvooadkfipx.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ2JkdmFueWx2b29hZGtmaXB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5Mjc1MDY4OSwiZXhwIjoyMTA4MzI2Njg5fQ.AWS1wWwpfeU72l0hzrsPAROx78tqlKiIk5aLqq6ZlG4";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function getTimingSlot(timing) {
  if (!timing) return 'unknown';
  const t = timing.trim().toLowerCase();
  
  if (t.includes('day & night') || t.includes('full day') || (t.includes('day') && t.includes('night'))) {
    return 'full_day';
  }
  if (t.includes('night') || t.includes('evening') || t.includes('shaam') || t.includes('raat')) {
    return 'night';
  }
  if (t.includes('day') || t.includes('morning') || t.includes('subah') || t.includes('afternoon') || t.includes('dopahar')) {
    return 'day';
  }

  // Parse time range if present like "2:00 PM - 8:00 PM" or "7:00 PM - 12:00 AM"
  const match = t.match(/(\d{1,2})(?::\d{2})?\s*(am|pm)/i);
  if (match) {
    let hour = parseInt(match[1], 10);
    const meridiem = match[2].toLowerCase();
    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;

    // If starts at or after 17:00 (5 PM), classify as night
    if (hour >= 17) return 'night';
    // If between 7 AM and 5 PM, classify as day
    if (hour >= 7 && hour < 17) return 'day';
  }

  return 'unknown';
}

function slotsOverlap(slot1, slot2) {
  if (slot1 === 'full_day' || slot2 === 'full_day') return true;
  if (slot1 === 'unknown' || slot2 === 'unknown') return true; // Be safe
  return slot1 === slot2;
}

async function audit() {
  console.log('Fetching all quotations from Supabase...');
  const { data, error } = await supabase.from('quotations').select('*');
  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Retrieved ${data.length} quotation rows.`);

  const quotations = data.map(r => {
    const base = r.full_data || {};
    return {
      id: r.id || base.id,
      quotationNumber: r.quotation_number || base.quotationNumber,
      status: r.status || base.status,
      isDeleted: (r.status === 'trash' || base.status === 'trash') ? true : (base.isDeleted === true),
      client: r.client || base.client || { name: 'Unknown' },
      events: r.events || base.events || [],
      rawRow: r
    };
  });

  const active = quotations.filter(q => q.status !== 'trash' && !q.isDeleted);
  console.log(`Active quotations: ${active.length}`);

  const assignments = [];

  active.forEach(q => {
    (q.events || []).forEach(evt => {
      const date = evt.eventDate;
      const timing = evt.timing || '';
      const slot = getTimingSlot(timing);

      (evt.services || []).forEach(srv => {
        (srv.crewBreakdown || []).forEach((c, idx) => {
          const rawName = c.name?.trim();
          if (!rawName) return;
          const lower = rawName.toLowerCase();
          if (
            lower.startsWith('photographer #') ||
            lower.startsWith('videographer #') ||
            lower.startsWith('drone #') ||
            lower === 'photographer' ||
            lower === 'videographer' ||
            lower === 'drone operator'
          ) {
            return;
          }

          assignments.push({
            crewName: rawName,
            crewPhone: c.phone || '',
            crewRole: c.role || srv.serviceName,
            crewCost: c.cost,
            quotationId: q.id,
            quotationNumber: q.quotationNumber,
            clientName: q.client?.name || 'Unknown',
            eventId: evt.id,
            eventName: evt.name,
            eventDate: date || 'NO_DATE',
            timing: timing,
            timingSlot: slot,
            serviceId: srv.id || srv.serviceId,
            crewIndex: idx
          });
        });
      });
    });
  });

  console.log(`Total specific crew assignments across all quotations: ${assignments.length}`);

  // Group by (crewName, eventDate)
  const grouped = {};
  assignments.forEach(a => {
    if (!a.eventDate || a.eventDate === 'NO_DATE') return;
    const cleanCrew = a.crewName.trim().toLowerCase();
    const key = `${cleanCrew}___${a.eventDate}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(a);
  });

  const conflicts = [];
  for (const [key, list] of Object.entries(grouped)) {
    if (list.length > 1) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a1 = list[i];
          const a2 = list[j];
          if (slotsOverlap(a1.timingSlot, a2.timingSlot)) {
            conflicts.push({ a1, a2, key });
          }
        }
      }
    }
  }

  console.log(`\n=== CONFLICTS FOUND: ${conflicts.length} ===`);
  conflicts.forEach((c, idx) => {
    console.log(`\n[Conflict #${idx + 1}] Crew Member: "${c.a1.crewName}" on Date: ${c.a1.eventDate}`);
    console.log(`  Event 1: Quote #${c.a1.quotationNumber} (${c.a1.clientName}) - Event: "${c.a1.eventName}" | Timing: "${c.a1.timing}" (Slot: ${c.a1.timingSlot})`);
    console.log(`  Event 2: Quote #${c.a2.quotationNumber} (${c.a2.clientName}) - Event: "${c.a2.eventName}" | Timing: "${c.a2.timing}" (Slot: ${c.a2.timingSlot})`);
  });

  console.log('\n=== All assigned crew members summary: ===');
  const crewStats = {};
  assignments.forEach(a => {
    crewStats[a.crewName] = (crewStats[a.crewName] || 0) + 1;
  });
  console.log(crewStats);
}

audit();
