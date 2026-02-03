import { config } from 'dotenv';
import postgres from 'postgres';

// 加载 .env.local
config({ path: '.env.local' });

console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

const sql = postgres(process.env.DATABASE_URL);

async function createTables() {
  try {
    console.log('Connecting to database...');

    // 先添加 tune_order 表的 promo_code_id 列（如果不存在）
    await sql`
      ALTER TABLE tune_order
      ADD COLUMN IF NOT EXISTS promo_code_id text
    `;
    console.log('Added promo_code_id column to tune_order');

    // 创建 promo_code 表
    await sql`
      CREATE TABLE IF NOT EXISTS promo_code (
        id text PRIMARY KEY NOT NULL,
        code text NOT NULL UNIQUE,
        type text NOT NULL DEFAULT 'single',
        max_uses integer DEFAULT 1,
        used_count integer DEFAULT 0 NOT NULL,
        valid_from timestamp DEFAULT now(),
        valid_until timestamp,
        created_by text,
        note text,
        is_active boolean DEFAULT true NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      )
    `;
    console.log('Created promo_code table');

    // 创建 promo_code_usage 表
    await sql`
      CREATE TABLE IF NOT EXISTS promo_code_usage (
        id text PRIMARY KEY NOT NULL,
        promo_code_id text NOT NULL REFERENCES promo_code(id) ON DELETE CASCADE,
        order_id text REFERENCES tune_order(id) ON DELETE SET NULL,
        customer_email text NOT NULL,
        used_at timestamp DEFAULT now() NOT NULL
      )
    `;
    console.log('Created promo_code_usage table');

    // 创建索引
    await sql`CREATE INDEX IF NOT EXISTS promo_code_code_idx ON promo_code (code)`;
    await sql`CREATE INDEX IF NOT EXISTS promo_code_usage_code_idx ON promo_code_usage (promo_code_id)`;
    await sql`CREATE INDEX IF NOT EXISTS promo_code_usage_email_idx ON promo_code_usage (customer_email)`;
    console.log('Created indexes');

    console.log('\nAll tables created successfully!');
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sql.end();
  }
}

createTables();
