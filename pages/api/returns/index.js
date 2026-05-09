import { getDb } from '../../../lib/db';
import { getSession } from '../../../lib/auth';

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const db = await getDb();

  if (req.method === 'GET') {
    const returns = await db.query(`
      SELECT sr.*, u.username as returned_by_name
      FROM sales_returns sr
      LEFT JOIN users u ON u.id = sr.created_by
      ORDER BY sr.created_at DESC
      LIMIT 100
    `);
    return res.json(returns);
  }

  if (req.method === 'POST') {
    const { sale_id, item_name, quantity = 1, return_amount, return_profit = 0, reason = '' } = req.body;
    if (!item_name?.trim()) return res.status(400).json({ error: 'Item name required' });
    if (!return_amount && return_amount !== 0) return res.status(400).json({ error: 'Return amount required' });

    await db.run(
      'INSERT INTO sales_returns (sale_id,item_name,quantity,return_amount,return_profit,reason,created_by) VALUES (?,?,?,?,?,?,?)',
      [sale_id || null, item_name.trim(), Number(quantity), Number(return_amount), Number(return_profit), reason, session.id]
    );

    return res.json({ ok: true });
  }

  res.status(405).end();
}
