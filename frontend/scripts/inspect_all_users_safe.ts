import { getSupabaseClient } from '../src/backend/database/supabaseClient';

async function listUsers() {
  const client = getSupabaseClient();
  if (!client) process.exit(1);

  const { data: users, error } = await client
    .from('users')
    .select('id, email, phone, role, status, email_verified, phone_verified, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error(error);
    process.exit(1);
  }

  console.log(`Found ${users.length} users in public.users:`);
  users.forEach((u, idx) => {
    console.log(`${idx + 1}. [${u.role}] phone: "${u.phone}" | email: "${u.email || ''}" | id: "${u.id}" | status: ${u.status}`);
  });
}

listUsers();
