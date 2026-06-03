import { getDb } from '../../lib/db';
import { getSession } from '../../lib/auth';

function toCSV(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\r\n');
}

function sendCSV(res, filename, csv) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session || session.role !== 'owner') return res.status(403).json({ error: 'Owner only' });

  const db = await getDb();
  const { type } = req.query;

  if (type === 'sales') {
    const rows = await db.query(`
      SELECT s.id, date(s.created_at,'+5 hours','+45 minutes') as date,
        s.payment_method, s.total_amount, s.discount_amount,
        s.credit_customer, s.credit_customer_phone,
        u.username as staff,
        GROUP_CONCAT(si.item_name || ' x' || si.quantity) as items
      FROM sales s
      LEFT JOIN users u ON u.id=s.user_id
      LEFT JOIN sale_items si ON si.sale_id=s.id
      GROUP BY s.id ORDER BY s.created_at DESC
    `);
    return sendCSV(res, 'sales.csv', toCSV(rows));
  }

  if (type === 'expenses') {
    const rows = await db.query(`
      SELECT e.id, e.expense_date, e.description, e.amount, e.payment_method,
        u.username as added_by
      FROM expenses e LEFT JOIN users u ON u.id=e.created_by
      ORDER BY e.expense_date DESC
    `);
    return sendCSV(res, 'expenses.csv', toCSV(rows));
  }

  if (type === 'stock') {
    const rows = await db.query(`
      SELECT s.name, s.brand, s.category, ss.color, ss.size, ss.quantity,
        s.cost_price, s.selling_price
      FROM shoe_sizes ss JOIN shoes s ON s.id=ss.shoe_id
      WHERE s.active=1 ORDER BY s.name, ss.color, ss.size
    `);
    return sendCSV(res, 'stock.csv', toCSV(rows));
  }

  res.status(400).json({ error: 'Invalid type. Use: sales, expenses, stock' });
}
