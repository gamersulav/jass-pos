import { getDb } from '../../../lib/db';
import { getSession } from '../../../lib/auth';

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const db = await getDb();

  if (req.method === 'GET') {
    const { date, limit = 50 } = req.query;
    const dateFilter = date
      ? `AND date(s.created_at, '+5 hours', '+45 minutes') = ?`
      : `AND date(s.created_at, '+5 hours', '+45 minutes') = date('now', '+5 hours', '+45 minutes')`;
    const args = date ? [date] : [];

    const sales = await db.query(`
      SELECT s.*, u.username as staff_name,
        GROUP_CONCAT(si.item_name || ' ×' || si.quantity || (CASE WHEN si.shoe_size IS NOT NULL THEN ' (sz' || si.shoe_size || ')' ELSE '' END)) as items_summary
      FROM sales s
      LEFT JOIN users u ON u.id = s.user_id
      LEFT JOIN sale_items si ON si.sale_id = s.id
      WHERE 1=1 ${dateFilter}
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT ?
    `, [...args, Number(limit)]);

    return res.json(sales);
  }

  if (req.method === 'POST') {
    const { payment, items, discount = 0, creditCustomer = '' } = req.body;
    if (!payment) return res.status(400).json({ error: 'Payment method required' });
    if (!items?.length) return res.status(400).json({ error: 'No items' });

    const discAmt = Math.max(0, Number(discount));
    const subtotal = items.reduce((s, it) => s + Number(it.unit_price) * Number(it.quantity), 0);
    const saleTotal = Math.max(0, subtotal - discAmt);

    // Verify stock
    for (const it of items) {
      if (it.item_type === 'shoe') {
        const sz = await db.queryOne('SELECT quantity FROM shoe_sizes WHERE shoe_id=? AND size=?', [it.shoe_id, it.shoe_size]);
        if (!sz || Number(sz.quantity) < Number(it.quantity)) return res.status(400).json({ error: `Insufficient stock: ${it.item_name} size ${it.shoe_size}` });
      } else {
        const acc = await db.queryOne('SELECT stock FROM accessories WHERE id=?', [it.accessory_id]);
        if (!acc || Number(acc.stock) < Number(it.quantity)) return res.status(400).json({ error: `Insufficient stock: ${it.item_name}` });
      }
    }

    const saleId = await db.tx(async (tx) => {
      const { lastId } = await tx.run(
        'INSERT INTO sales (payment_method,total_amount,discount_amount,credit_customer,user_id) VALUES (?,?,?,?,?)',
        [payment, saleTotal, discAmt, payment === 'Credit' ? creditCustomer : '', session.id]
      );

      // Distribute discount proportionally
      const totalRaw = items.reduce((s, it) => s + Number(it.unit_price) * Number(it.quantity), 0);
      let discLeft = discAmt;

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const itemSubtotal = Number(it.unit_price) * Number(it.quantity);
        const itemDisc = i === items.length - 1 ? discLeft : Math.round((itemSubtotal / totalRaw) * discAmt * 100) / 100;
        discLeft -= itemDisc;

        await tx.run(
          'INSERT INTO sale_items (sale_id,item_type,shoe_id,shoe_size,accessory_id,item_name,quantity,unit_price,cost_price,item_discount) VALUES (?,?,?,?,?,?,?,?,?,?)',
          [lastId, it.item_type, it.shoe_id || null, it.shoe_size || null, it.accessory_id || null, it.item_name, Number(it.quantity), Number(it.unit_price), Number(it.cost_price), itemDisc]
        );

        if (it.item_type === 'shoe') {
          await tx.run('UPDATE shoe_sizes SET quantity=quantity-? WHERE shoe_id=? AND size=?', [Number(it.quantity), it.shoe_id, it.shoe_size]);
        } else {
          await tx.run('UPDATE accessories SET stock=stock-? WHERE id=?', [Number(it.quantity), it.accessory_id]);
        }
      }

      if (payment === 'Credit') {
        await tx.run(
          'INSERT INTO credits (customer_name,amount,description,status,sale_id) VALUES (?,?,?,?,?)',
          [creditCustomer, saleTotal, `Sale #${lastId}`, 'pending', lastId]
        );
      }

      return lastId;
    });

    return res.json({ ok: true, saleId });
  }

  res.status(405).end();
}
