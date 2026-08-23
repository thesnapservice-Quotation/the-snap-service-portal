const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Read .env.local securely from project directory
const projectDir = '/Users/mac/.gemini/antigravity/scratch/the-snap-service-portal';
const envPath = path.join(projectDir, '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('ERROR: .env.local not found at', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = (match[2] || '').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    envVars[match[1]] = value;
  }
}

const rawUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || envVars.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_URL = (rawUrl.startsWith('http') ? rawUrl : 'https://lwsmgogcxngolukwqnjj.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('ERROR: Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function inspectAndBackup() {
  console.log('--- EXECUTING READ-ONLY SUPABASE INSPECTION ---');
  
  // A. Fetch quotations table rows
  const { data: allQuotationRows, error: qErr } = await supabase
    .from('quotations')
    .select('*')
    .order('updated_at', { ascending: false });

  if (qErr) {
    console.error('Failed to query quotations table:', qErr);
    process.exit(1);
  }

  // B. Fetch app_users table
  const { data: userRows, error: uErr } = await supabase
    .from('app_users')
    .select('*')
    .order('created_at', { ascending: false });

  // C. Fetch app_settings table
  const { data: settingsRows, error: sErr } = await supabase
    .from('app_settings')
    .select('*');

  // D. Fetch app_tasks table
  const { data: taskRows, error: tErr } = await supabase
    .from('app_tasks')
    .select('*');

  // Categorize quotations
  const businessQuotations = (allQuotationRows || []).filter(
    (r) =>
      r.id &&
      !r.id.startsWith('sys_') &&
      !r.full_data?.isSystemTaskRecord &&
      !r.full_data?.isSystemSettingsRecord &&
      !r.full_data?.isSystemServicesRecord
  );

  const systemRecords = (allQuotationRows || []).filter(
    (r) =>
      r.id &&
      (r.id.startsWith('sys_') ||
        r.full_data?.isSystemTaskRecord ||
        r.full_data?.isSystemSettingsRecord ||
        r.full_data?.isSystemServicesRecord)
  );

  // Extract tasks
  const sysGlobalTasks = (allQuotationRows || []).find((r) => r.id === 'sys_global_tasks');
  const finalTasks =
    taskRows && taskRows.length > 0 ? taskRows : sysGlobalTasks?.full_data?.tasks || [];

  // Write verified backup file inside the project backups directory
  const backupDir = path.join(projectDir, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilePath = path.join(backupDir, `verified_pre_migration_backup_${timestamp}.json`);

  const fullBackup = {
    metadata: {
      generatedAt: new Date().toISOString(),
      databaseUrl: SUPABASE_URL,
      totalQuotationsTableRows: (allQuotationRows || []).length,
      businessQuotationsCount: businessQuotations.length,
      systemRecordsCount: systemRecords.length,
      userAccountsCount: (userRows || []).length,
      settingsRowsCount: (settingsRows || []).length,
      tasksCount: finalTasks.length,
    },
    tables: {
      quotations_raw: allQuotationRows || [],
      business_quotations: businessQuotations,
      system_records: systemRecords,
      app_users: userRows || [],
      app_settings: settingsRows || [],
      tasks: finalTasks,
    },
  };

  fs.writeFileSync(backupFilePath, JSON.stringify(fullBackup, null, 2), 'utf8');

  console.log('\n======================================================');
  console.log('          DATABASE INSPECTION & BACKUP REPORT         ');
  console.log('======================================================');
  console.log(`Backup File Path       : ${backupFilePath}`);
  console.log(`Total Quotation Rows   : ${(allQuotationRows || []).length}`);
  console.log(`Business Quotations    : ${businessQuotations.length}`);
  console.log(`System Records Count   : ${systemRecords.length}`);
  console.log(`User Accounts Count    : ${(userRows || []).length}`);
  console.log(`Settings Rows Count    : ${(settingsRows || []).length}`);
  console.log(`Total Tasks Count      : ${finalTasks.length}`);
  console.log('------------------------------------------------------');
  console.log('OWNERSHIP & WORKSPACE DETAILS OF EVERY QUOTATION:');
  console.log('------------------------------------------------------');

  businessQuotations.forEach((q, idx) => {
    const fd = q.full_data || {};
    console.log(`[#${idx + 1}] Quotation Number : ${q.quotation_number || fd.quotationNumber}`);
    console.log(`     Database ID       : ${q.id}`);
    console.log(`     Client Name       : "${q.client?.name || fd.client?.name || ''}"`);
    console.log(`     user_id (column)  : ${q.user_id}`);
    console.log(`     full_data.userId  : ${fd.userId}`);
    console.log(`     workspaceId       : ${q.workspace_id || fd.workspaceId || '(NOT SET / NULL)'}`);
    console.log(`     createdByUserId   : ${q.created_by_user_id || fd.createdByUserId || '(NOT SET / NULL)'}`);
    console.log(`     updatedByUserId   : ${q.updated_by_user_id || fd.updatedByUserId || '(NOT SET / NULL)'}`);
    console.log(`     Grand Total (PKR) : ${q.payment?.grandTotal || fd.payment?.grandTotal}`);
    console.log(`     Events Summary    : ${(q.events || fd.events || []).map((e) => e.name).join(', ')}`);
    console.log(`     Quotation Date    : ${q.client?.quotationDate || fd.client?.quotationDate || q.created_at || fd.createdAt}`);
    console.log('------------------------------------------------------');
  });

  console.log('\nSYSTEM REGISTRY RECORDS:');
  systemRecords.forEach((s) => {
    console.log(` - ID: ${s.id} | QuotationNumber: ${s.quotation_number} | UpdatedAt: ${s.updated_at}`);
  });
}

inspectAndBackup().catch((err) => {
  console.error('Fatal Inspection Error:', err);
  process.exit(1);
});
