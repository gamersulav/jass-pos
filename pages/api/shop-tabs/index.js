import { getDb } from '../../../lib/db';
import { getSession } from '../../../lib/auth';

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const db = await getDb();

  if (req.method === 'GET') {
    const tabs = await db.query('SELECT * FROM shop_tabs ORDER BY created_at DESC LIMIT 100');
    return res.json(tabs);
  }

  if (req.method === 'POST') {
    if (session.role !== 'owner') return res.status(403).json({ error: 'Owner only' });
    const { shop_name, direction = 'in', quantity = 1, unit_cost = 0, notes = '' } = req.body;
    if (!shop_name?.trim()) return res.status(400).json({ error: 'Shop name required' });
    await db.run(
      'INSERT INTO shop_tabs (shop_name,direction,quantity,unit_cost,notes) VALUES (?,?,?,?,?)',
      [shop_name.trim(), direction, Number(quantity), Number(unit_cost), notes]
    );
    return res.json({ ok: true });
  }

  if (req.method === 'PUT') {
    if (session.role !== 'owner') return res.status(403).json({ error: 'Owner only' });
    const { id, settled } = req.body;
    await db.run(
      "UPDATE shop_tabs SET settled=?, settled_at=CASE WHEN ? THEN datetime('now') ELSE NULL END WHERE id=?",
      [settled ? 1 : 0, settled ? 1 : 0, id]
    );
    return res.json({ ok: true });
  }

  res.status(405).end();
}
