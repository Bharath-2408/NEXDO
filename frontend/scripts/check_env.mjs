// ==============================================================================
// NEXDO SAFE ENVIRONMENT VARIABLE DETECTOR
// frontend/scripts/check_env.mjs
// Verifies presence and formatting of required credentials WITHOUT leaking secrets.
// ==============================================================================

import fs from 'node:fs';
import path from 'node:path';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const result = {};
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      result[key] = val;
    }
  }
  return result;
}

const cwdEnvPath = path.resolve(process.cwd(), '.env');
const parentEnvPath = path.resolve(process.cwd(), '..', '.env');
const subFrontendEnvPath = path.resolve(process.cwd(), 'frontend', '.env');

const envFromCwd = loadEnvFile(cwdEnvPath);
const envFromParent = loadEnvFile(parentEnvPath);
const envFromSub = loadEnvFile(subFrontendEnvPath);
const mergedEnv = { ...envFromParent, ...envFromSub, ...envFromCwd, ...process.env };

console.log('================================================================');
console.log('NEXDO SAFE ENVIRONMENT CONFIGURATION AUDIT');
console.log('================================================================\n');

console.log(`Checking .env files:`);
console.log(`- Local .env (${cwdEnvPath}) : ${fs.existsSync(cwdEnvPath) ? 'FOUND' : 'MISSING'}`);
if (fs.existsSync(parentEnvPath) && parentEnvPath !== cwdEnvPath) {
  console.log(`- Parent .env (${parentEnvPath}) : FOUND`);
}

const checks = [
  {
    name: 'SUPABASE_URL / VITE_SUPABASE_URL',
    val: mergedEnv.SUPABASE_URL || mergedEnv.VITE_SUPABASE_URL || '',
    validator: (v) => v.startsWith('https://') && v.includes('.supabase.co'),
    example: 'https://<project-ref>.supabase.co',
    hint: 'Project Settings -> Data API -> Project URL'
  },
  {
    name: 'SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY',
    val: mergedEnv.SUPABASE_ANON_KEY || mergedEnv.VITE_SUPABASE_ANON_KEY || '',
    validator: (v) => v.length > 30,
    example: 'eyJhbGciOi...',
    hint: 'Project Settings -> Data API -> Project API keys -> anon public'
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    val: mergedEnv.SUPABASE_SERVICE_ROLE_KEY || '',
    validator: (v) => v.length > 30,
    example: 'eyJhbGciOi...',
    hint: 'Project Settings -> Data API -> Project API keys -> service_role'
  },
  {
    name: 'DATABASE_URL (Optional)',
    val: mergedEnv.DATABASE_URL || '',
    validator: (v) => !v || v.startsWith('postgres'),
    optional: true,
    hint: 'Project Settings -> Database -> Connection string'
  }
];

let allConfigured = true;

for (const check of checks) {
  const isPresent = Boolean(check.val && check.val.trim().length > 0);
  const isValid = isPresent ? check.validator(check.val) : false;

  if (!isPresent) {
    if (!check.optional) allConfigured = false;
    console.log(`[MISSING] ${check.name}`);
    console.log(`          Expected source: ${check.hint}`);
  } else if (!isValid) {
    if (!check.optional) allConfigured = false;
    console.log(`[INVALID FORMAT] ${check.name}`);
    console.log(`                 Value format does not match expected pattern`);
  } else {
    // Masked safely: show only first 6 and last 4 chars
    const masked = check.val.length > 12 
      ? `${check.val.slice(0, 6)}...${check.val.slice(-4)}`
      : '******';
    console.log(`[CONFIGURED] ${check.name}: DETECTED (${masked})`);
  }
}

console.log('\n================================================================');
if (allConfigured) {
  console.log('STATUS: READY TO TEST CONNECTION');
  console.log('All required environment variables are populated and formatted.');
} else {
  console.log('STATUS: AWAITING USER CREDENTIALS');
  console.log('Please copy values from your Supabase dashboard into frontend/.env');
}
console.log('================================================================');
