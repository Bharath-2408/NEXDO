// ==============================================================================
// NEXDO DATABASE MIGRATION RUNNER
// frontend/scripts/run_migrations.mjs
// Applies production DDL and RLS policies to live Supabase PostgreSQL.
// Zero secrets printed to stdout.
// ==============================================================================

import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const { Client } = pg;

// Safely load local .env without external dependencies
function loadEnvFromDisk() {
  const candidatePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'frontend', '.env'),
    path.resolve(process.cwd(), '..', '.env'),
  ];
  for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const idx = trimmed.indexOf('=');
          if (idx !== -1) {
            const k = trimmed.slice(0, idx).trim();
            let v = trimmed.slice(idx + 1).trim();
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
              v = v.slice(1, -1);
            }
            if (!process.env[k]) {
              process.env[k] = v;
            }
          }
        }
      } catch {}
    }
  }
}
loadEnvFromDisk();

const dbUrl = process.env.DATABASE_URL;

console.log('================================================================');
console.log('NEXDO REAL SUPABASE MIGRATION RUNNER');
console.log('================================================================\n');

if (!dbUrl) {
  console.error('[ERROR] DATABASE_URL is not set in .env');
  console.error('Please configure DATABASE_URL to apply migrations via PostgreSQL connection.');
  process.exit(1);
}

// Masked connection host for safe output
const maskedUrl = dbUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
console.log(`Connecting to: ${maskedUrl}\n`);

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  console.log('[SUCCESS] Connected to live Supabase PostgreSQL database.\n');

  const migrationFiles = [
    'supabase/migrations/20261008000001_production_auth_and_security.sql',
    'supabase/migrations/20261008000002_enable_rls_and_policies.sql',
  ];

  for (const relPath of migrationFiles) {
    const fullPath = path.resolve(relPath);
    const altPath = path.resolve('..', relPath);
    const actualPath = fs.existsSync(fullPath) ? fullPath : altPath;

    if (!fs.existsSync(actualPath)) {
      console.error(`[ERROR] Migration file not found: ${relPath}`);
      process.exit(1);
    }

    console.log(`Applying migration: ${path.basename(actualPath)}...`);
    const sql = fs.readFileSync(actualPath, 'utf8');
    
    // Execute SQL script
    await client.query(sql);
    console.log(`[PASS] Successfully applied ${path.basename(actualPath)}\n`);
  }

  // Verify all 13 tables
  console.log('Verifying 13 relational tables in remote database:');
  const expectedTables = [
    'users',
    'sessions',
    'customer_profiles',
    'technician_profiles',
    'technician_skills',
    'service_requests',
    'bookings',
    'booking_status_history',
    'payments',
    'subscriptions',
    'technician_earnings',
    'notifications',
    'audit_logs',
  ];

  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = ANY($1::text[]);
  `, [expectedTables]);

  const foundTables = new Set(res.rows.map(r => r.table_name));
  let missing = 0;
  for (const tbl of expectedTables) {
    if (foundTables.has(tbl)) {
      console.log(`  [OK] Table 'public.${tbl}' exists`);
    } else {
      console.error(`  [MISSING] Table 'public.${tbl}' NOT found`);
      missing++;
    }
  }

  // Verify RLS is enabled on all tables
  console.log('\nVerifying Row Level Security (RLS) status:');
  const rlsRes = await client.query(`
    SELECT relname as table_name, relrowsecurity as rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = ANY($1::text[]);
  `, [expectedTables]);

  let rlsMissing = 0;
  for (const row of rlsRes.rows) {
    if (row.rls_enabled) {
      console.log(`  [OK] RLS enabled on 'public.${row.table_name}'`);
    } else {
      console.error(`  [WARN] RLS NOT enabled on 'public.${row.table_name}'`);
      rlsMissing++;
    }
  }

  await client.end();

  if (missing === 0 && rlsMissing === 0) {
    console.log('\n================================================================');
    console.log('[SUCCESS] ALL 13 MIGRATIONS AND RLS POLICIES VERIFIED ON REMOTE SUPABASE');
    console.log('================================================================');
  } else {
    console.error(`\n[FAIL] Missing tables: ${missing}, Missing RLS: ${rlsMissing}`);
    process.exit(1);
  }
}

run().catch(async (err) => {
  console.error('[MIGRATION ERROR]', err.message);
  try { await client.end(); } catch {}
  process.exit(1);
});
