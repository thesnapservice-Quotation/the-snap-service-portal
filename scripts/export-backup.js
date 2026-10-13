const fs = require('fs');
const path = require('path');

async function backup() {
  const baseUrl = 'https://portal.thesnapservice.com';
  const endpoints = [
    { key: 'quotations', path: '/api/quotations' },
    { key: 'settings', path: '/api/settings' },
    { key: 'tasks', path: '/api/tasks' },
    { key: 'expenses', path: '/api/expenses' },
    { key: 'services', path: '/api/services' },
    { key: 'users', path: '/api/users' },
  ];

  const backupData = {
    timestamp: new Date().toISOString(),
    source: baseUrl,
    data: {}
  };

  for (const ep of endpoints) {
    try {
      console.log(`Fetching ${ep.key} from ${ep.path}...`);
      const res = await fetch(`${baseUrl}${ep.path}`);
      if (res.ok) {
        backupData.data[ep.key] = await res.json();
        console.log(`✓ Fetched ${ep.key}`);
      } else {
        console.warn(`⚠ ${ep.key} returned HTTP ${res.status}`);
        backupData.data[ep.key] = { error: `HTTP ${res.status}` };
      }
    } catch (e) {
      console.error(`✗ Error fetching ${ep.key}:`, e.message);
      backupData.data[ep.key] = { error: e.message };
    }
  }

  const outPath = path.join(__dirname, 'backups', `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(outPath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`\n🎉 Full Backup successfully saved to:\n${outPath}`);
  
  const quotationsCount = Array.isArray(backupData.data.quotations) 
    ? backupData.data.quotations.length 
    : (backupData.data.quotations?.quotations?.length || 0);
  console.log(`Total quotations backed up: ${quotationsCount}`);
}

backup().catch(console.error);
