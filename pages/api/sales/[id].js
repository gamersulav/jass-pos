import { getDb } from '../../../lib/db';
import { getSession } from '../../../lib/auth';

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const db = await getDb();
  const id = Number(req.query.id);

  if (req.method === 'GET') {
    const sale = await db.queryOne('SELECT s.*, u.username as staff_name FROM sales s LEFT JOIN users u ON u.id=s.user_id WHERE s.id=?', [id]);
    if (!sale) return res.status(404).json({ error: 'Not found' });
    const items = await db.query('SELECT * FROM sale_items WHERE sale_id=?', [id]);
    return res.json({ ...sale, items });
  }

  if (req.method === 'PUT') {
    if (session.role !== 'owner') return res.status(403).json({ error: 'Owner only' });
    const { total_amount, discount_amount, payment_method } = req.body;
    const sale = await db.queryOne('SELECT * FROM sales WHERE id=?', [id]);
    if (!sale) return res.status(404).json({ error: 'Not found' });

    const fields = [], vals = [];
    if (total_amount !== undefined) { fields.push('total_amount=?'); vals.push(Number(total_amount)); }
    if (discount_amount !== undefined) { fields.push('discount_amount=?'); vals.push(Number(discount_amount)); }
    if (payment_method !== undefined) { fields.push('payment_method=?'); vals.push(payment_method); }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });

    vals.push(id);
    await db.run(`UPDATE sales SET ${fields.join(',')} WHERE id=?`, vals);

    const label = `Sale #${id}`;
    if (total_amount !== undefined) await db.run(
      'INSERT INTO edit_history (entity_type,entity_id,entity_name,field_name,old_value,new_value,changed_by,changed_by_name) VALUES (?,?,?,?,?,?,?,?)',
      ['sale', id, label, 'total_amount', sale.total_amount, total_amount, session.id, session.username]
    );

    return res.json({ ok: true });
  }

  res.status(405).end();
}
