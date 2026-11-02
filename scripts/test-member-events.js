const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://zlgbdvanylvooadkfipx.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ2JkdmFueWx2b29hZGtmaXB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5Mjc1MDY4OSwiZXhwIjoyMTA4MzI2Njg5fQ.AWS1wWwpfeU72l0hzrsPAROx78tqlKiIk5aLqq6ZlG4";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function getTimingSlot(timing) {
  if (!timing) return 'unknown';
  const t = timing.trim().toLowerCase();
  if (t.includes('day & night') || t.includes('full day') || (t.includes('day') && t.includes('night'))) return 'full_day';
  if (t.includes('night') || t.includes('evening') || t.includes('shaam') || t.includes('raat')) return 'night';
  if (t.includes('day') || t.includes('morning') || t.includes('subah') || t.includes('afternoon') || t.includes('dopahar')) return 'day';
  return 'unknown';
}

async function testMemberEvents() {
  const { data } = await supabase.from('quotations').select('*');
  const activeQuotes = data.filter(r => r.status !== 'trash');

  const memberMap = {};

  activeQuotes.forEach(q => {
    const events = q.events || q.full_data?.events || [];
    const clientName = q.client?.name || q.full_data?.client?.name || 'Client';
    const quoteNum = q.quotation_number || q.full_data?.quotationNumber;

    events.forEach(evt => {
      (evt.services || []).forEach(srv => {
        (srv.crewBreakdown || []).forEach(c => {
          const name = c.name?.trim();
          if (!name || name.toLowerCase().startsWith('photographer #') || name.toLowerCase().startsWith('videographer #')) return;

          const key = name.toLowerCase();
          if (!memberMap[key]) memberMap[key] = { canonicalName: name, assignments: [] };

          memberMap[key].assignments.push({
            quotationNumber: quoteNum,
            clientName,
            eventName: evt.name,
            eventDate: evt.eventDate,
            timing: evt.timing,
            timingSlot: getTimingSlot(evt.timing),
            role: c.role || srv.serviceName
          });
        });
      });
    });
  });

  console.log('--- Assignments per member ---');
  for (const [key, data] of Object.entries(memberMap)) {
    console.log(`\nMember: ${data.canonicalName} (Total: ${data.assignments.length})`);
    data.assignments.slice(0, 4).forEach(a => {
      console.log(`  - Date: ${a.eventDate || 'No Date'} | Timing: "${a.timing || 'None'}" (${a.timingSlot}) | Event: ${a.eventName} (${a.clientName} #${a.quotationNumber})`);
    });
  }
}

testMemberEvents();
