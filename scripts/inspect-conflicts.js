const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://zlgbdvanylvooadkfipx.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ2JkdmFueWx2b29hZGtmaXB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5Mjc1MDY4OSwiZXhwIjoyMTA4MzI2Njg5fQ.AWS1wWwpfeU72l0hzrsPAROx78tqlKiIk5aLqq6ZlG4";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function inspectQuotes() {
  const { data } = await supabase.from('quotations').select('*').in('quotation_number', ['SS-2026-2043', 'SS-2026-2051']);
  data.forEach(q => {
    console.log(`\n================== QUOTE ${q.quotation_number} ==================`);
    console.log(`ID: ${q.id}`);
    console.log(`Status: ${q.status}`);
    console.log(`Client:`, q.client);
    console.log(`Created: ${q.created_at}, Updated: ${q.updated_at}`);
    (q.events || []).forEach(evt => {
      console.log(`\n  Event: "${evt.name}", Date: "${evt.eventDate}", Timing: "${evt.timing}"`);
      (evt.services || []).forEach(srv => {
        console.log(`    Service: ${srv.serviceName} (qty: ${srv.quantity})`);
        (srv.crewBreakdown || []).forEach((c, idx) => {
          console.log(`      Crew #${idx + 1}: ${c.name} | cost: ${c.cost} | role: ${c.role}`);
        });
      });
    });
  });
}

inspectQuotes();
