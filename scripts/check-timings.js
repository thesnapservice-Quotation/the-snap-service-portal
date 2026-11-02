const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://zlgbdvanylvooadkfipx.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ2JkdmFueWx2b29hZGtmaXB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5Mjc1MDY4OSwiZXhwIjoyMTA4MzI2Njg5fQ.AWS1wWwpfeU72l0hzrsPAROx78tqlKiIk5aLqq6ZlG4";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkTimings() {
  const { data } = await supabase.from('quotations').select('events, full_data');
  const timings = new Set();
  data.forEach(r => {
    const events = r.events || r.full_data?.events || [];
    events.forEach(e => {
      if (e.timing !== undefined) {
        timings.add(String(e.timing));
      }
    });
  });
  console.log('Unique event timings found in Supabase:');
  console.log([...timings]);
}

checkTimings();
