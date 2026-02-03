#!/usr/bin/env node
/**
 * Set user role to admin
 * Usage: node scripts/set-admin-role.mjs <email>
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const email = process.argv[2] || 'ningainshop@gmail.com';

async function setAdminRole() {
  const sql = neon(process.env.DATABASE_URL);

  // Check if user exists
  const users = await sql`SELECT id, email, role FROM "user" WHERE email = ${email}`;

  if (users.length === 0) {
    console.error(`User with email ${email} not found`);
    process.exit(1);
  }

  const user = users[0];
  console.log(`Found user: ${user.email}, current role: ${user.role || 'none'}`);

  // Update role to admin
  await sql`UPDATE "user" SET role = 'admin', updated_at = NOW() WHERE email = ${email}`;

  console.log(`Successfully set ${email} as admin`);
}

setAdminRole().catch(console.error);
