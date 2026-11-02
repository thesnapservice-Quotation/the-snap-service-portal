const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://zlgbdvanylvooadkfipx.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ2JkdmFueWx2b29hZGtmaXB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5Mjc1MDY4OSwiZXhwIjoyMTA4MzI2Njg5fQ.AWS1wWwpfeU72l0hzrsPAROx78tqlKiIk5aLqq6ZlG4";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function cleanOverlaps() {
  console.log('Fetching quote SS-2026-2051...');
  const { data, error } = await supabase.from('quotations').select('*').eq('quotation_number', 'SS-2026-2051').single();
  if (error || !data) {
    console.error('Error fetching quotation:', error);
    return;
  }

  const events = data.events || data.full_data?.events || [];
  let modified = false;

  const updatedEvents = events.map(evt => {
    // 2026-12-11 (Barat)
    if (evt.eventDate === '2026-12-11') {
      const updatedServices = (evt.services || []).map(srv => {
        const updatedCrew = (srv.crewBreakdown || []).map((c, idx) => {
          const nameLower = (c.name || '').trim().toLowerCase();
          if (nameLower === 'umair' || nameLower === 'mamo arif') {
            console.log(`Removing overlapping member "${c.name}" from event "${evt.name}" on ${evt.eventDate} in service ${srv.serviceName}`);
            modified = true;
            return {
              id: c.id || `crew-${idx + 1}`,
              name: `${srv.serviceName} #${idx + 1}`,
              cost: c.cost || srv.internalCostPerUnit || 5000,
              phone: '',
              role: ''
            };
          }
          return c;
        });
        return { ...srv, crewBreakdown: updatedCrew };
      });
      return { ...evt, services: updatedServices };
    }

    // 2026-12-12 (Walima)
    if (evt.eventDate === '2026-12-12') {
      const updatedServices = (evt.services || []).map(srv => {
        const updatedCrew = (srv.crewBreakdown || []).map((c, idx) => {
          const nameLower = (c.name || '').trim().toLowerCase();
          if (nameLower === 'umair' || nameLower === 'shahbaz' || nameLower === 'mamo arif') {
            console.log(`Removing overlapping member "${c.name}" from event "${evt.name}" on ${evt.eventDate} in service ${srv.serviceName}`);
            modified = true;
            return {
              id: c.id || `crew-${idx + 1}`,
              name: `${srv.serviceName} #${idx + 1}`,
              cost: c.cost || srv.internalCostPerUnit || 5000,
              phone: '',
              role: ''
            };
          }
          return c;
        });
        return { ...srv, crewBreakdown: updatedCrew };
      });
      return { ...evt, services: updatedServices };
    }

    return evt;
  });

  if (!modified) {
    console.log('No overlapping members needed removal.');
    return;
  }

  const updatedFullData = {
    ...(data.full_data || {}),
    events: updatedEvents,
    updatedAt: new Date().toISOString()
  };

  const { error: updateError } = await supabase
    .from('quotations')
    .update({
      events: updatedEvents,
      full_data: updatedFullData,
      updated_at: new Date().toISOString()
    })
    .eq('id', data.id);

  if (updateError) {
    console.error('Update failed:', updateError);
  } else {
    console.log('Successfully cleaned overlapping crew assignments from quotation SS-2026-2051 in Supabase!');
  }
}

cleanOverlaps();
