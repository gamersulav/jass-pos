import { getDb } from '../../../lib/db';
import { getSession } from '../../../lib/auth';

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const db = await getDb();

  if (req.method === 'GET') {
    const shoes = await db.query(`
      SELECT s.*,
        GROUP_CONCAT(ss.size || ':' || ss.quantity ORDER BY ss.size) as sizes_raw,
        COALESCE(SUM(ss.quantity), 0) as total_stock
      FROM shoes s
      LEFT JOIN shoe_sizes ss ON ss.shoe_id = s.id
      WHERE s.active = 1
      GROUP BY s.id
      ORDER BY s.name
    `);
    return res.json(shoes.map(s => ({
      ...s,
      sizes: s.sizes_raw
        ? Object.fromEntries(s.sizes_raw.split(',').map(p => { const [k,v] = p.split(':'); return [k, Number(v)]; }))
        : {},
      cost_price: session.role === 'owner' ? s.cost_price : undefined,
    })));
  }

  if (req.method === 'POST') {
    if (session.role !== 'owner') return res.status(403).json({ error: 'Owner only' });
    const { name, brand = '', category = 'General', cost_price = 0, selling_price = 0, notes = '', sizes = {} } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' });

    const { lastId } = await db.run(
      'INSERT INTO shoes (name,brand,category,cost_price,selling_price,notes,created_by) VALUES (?,?,?,?,?,?,?)',
      [name.trim(), brand, category, Number(cost_price), Number(selling_price), notes, session.id]
    );

    for (const [size, qty] of Object.entries(sizes)) {
      if (Number(qty) > 0) {
        await db.run(
          'INSERT INTO shoe_sizes (shoe_id,size,quantity) VALUES (?,?,?) ON CONFLICT(shoe_id,size) DO UPDATE SET quantity=quantity+excluded.quantity',
          [lastId, Number(size), Number(qty)]
        );
      }
    }

    return res.json({ ok: true, id: lastId });
  }

  res.status(405).end();
}
