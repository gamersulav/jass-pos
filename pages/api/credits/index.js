import { getDb } from '../../../lib/db';
import { getSession } from '../../../lib/auth';

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const db = await getDb();

  if (req.method === 'GET') {
    const credits = await db.query(`
      SELECT c.*, s.payment_method, s.created_at as sale_date
      FROM credits c
      LEFT JOIN sales s ON s.id = c.sale_id
      ORDER BY c.created_at DESC
    `);
    return res.json(credits);
  }

  if (req.method === 'PUT') {
    const { id, status, amount } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });
    const fields = [], vals = [];
    if (status) {
      fields.push('status=?'); vals.push(status);
      if (status === 'settled') { fields.push("settled_at=datetime('now')"); }
    }
    if (amount !== undefined) { fields.push('amount=?'); vals.push(Number(amount)); }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    vals.push(id);
    await db.run(`UPDATE credits SET ${fields.join(',')} WHERE id=?`, vals);
    return res.json({ ok: true });
  }

  res.status(405).end();
}
