import { getDb } from '../../../lib/db';
import { getSession } from '../../../lib/auth';

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const db = await getDb();

  if (req.method === 'GET') {
    const items = await db.query('SELECT * FROM accessories WHERE active=1 ORDER BY name');
    return res.json(items.map(a => ({
      ...a,
      cost_price: session.role === 'owner' ? a.cost_price : undefined,
    })));
  }

  if (req.method === 'POST') {
    if (session.role !== 'owner') return res.status(403).json({ error: 'Owner only' });
    const { name, category = 'General', cost_price = 0, selling_price = 0, stock = 0, notes = '' } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
    const { lastId } = await db.run(
      'INSERT INTO accessories (name,category,cost_price,selling_price,stock,notes,created_by) VALUES (?,?,?,?,?,?,?)',
      [name.trim(), category, Number(cost_price), Number(selling_price), Number(stock), notes, session.id]
    );
    return res.json({ ok: true, id: lastId });
  }

  res.status(405).end();
}
