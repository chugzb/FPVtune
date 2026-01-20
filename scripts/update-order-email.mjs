import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function updateOrderEmail() {
  const orderNumber = 'TEST-20260119-2F89EY';
  const newEmail = 'ningainshop@gmail.com';

  // 更新订单邮箱
  const result = await sql`
    UPDATE tune_order
    SET customer_email = ${newEmail}, status = 'paid', updated_at = NOW()
    WHERE order_number = ${orderNumber}
    RETURNING order_number, customer_email, status
  `;

  console.log('Updated order:', result);
}

updateOrderEmail().catch(console.error);
