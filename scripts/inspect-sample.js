const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://zlgbdvanylvooadkfipx.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ2JkdmFueWx2b29hZGtmaXB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5Mjc1MDY4OSwiZXhwIjoyMTA4MzI2Njg5fQ.AWS1wWwpfeU72l0hzrsPAROx78tqlKiIk5aLqq6ZlG4";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function inspectRow() {
  const { data, error } = await supabase.from('quotations').select('*').limit(3);
  if (error) {
    console.error(error);
    return;
  }
  data.forEach((row, idx) => {
    console.log(`\n--- Row ${idx + 1} ---`);
    console.log('Columns:', Object.keys(row));
    console.log('quotation_number:', row.quotation_number);
    let parsedData = row.data;
    if (typeof parsedData === 'string') {
      try { parsedData = JSON.parse(parsedData); } catch(e) {}
    }
    console.log('events count:', parsedData?.events?.length);
    if (parsedData?.events && parsedData.events.length > 0) {
      console.log('sample event:', JSON.stringify(parsedData.events[0], null, 2));
    }
  });
}

inspectRow();
