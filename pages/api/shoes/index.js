import { getDb } from '../../../lib/db';
import { getSession } from '../../../lib/auth';

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const db = await getDb();

  if (req.method === 'GET') {
    const shoes = await db.query(`
      SELECT s.*,
        GROUP_CONCAT(ss.color || '~' || ss.size || '~' || ss.quantity ORDER BY ss.color, ss.size) as sizes_raw,
        COALESCE(SUM(ss.quantity), 0) as total_stock
      FROM shoes s
      LEFT JOIN shoe_sizes ss ON ss.shoe_id = s.id
      WHERE s.active = 1
      GROUP BY s.id
      ORDER BY s.name
    `);
    return res.json(shoes.map(s => ({
      ...s,
      colors: parseSizesRaw(s.sizes_raw),
      cost_price: session.role === 'owner' ? s.cost_price : undefined,
    })));
  }

  if (req.method === 'POST') {
    const { name, brand = '', category = 'General', cost_price = 0, selling_price = 0, notes = '', variants = [] } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
    if (!brand?.trim()) return res.status(400).json({ error: 'Brand required' });

    const { lastId } = await db.run(
      'INSERT INTO shoes (name,brand,category,cost_price,selling_price,notes,created_by) VALUES (?,?,?,?,?,?,?)',
      [name.trim(), brand, category, Number(cost_price), Number(selling_price), notes, session.id]
    );

    for (const { color = '', size, qty } of variants) {
      if (Number(qty) > 0 && size) {
        await db.run(
          'INSERT INTO shoe_sizes (shoe_id,color,size,quantity) VALUES (?,?,?,?) ON CONFLICT(shoe_id,color,size) DO UPDATE SET quantity=quantity+excluded.quantity',
          [lastId, color, Number(size), Number(qty)]
        );
      }
    }

    return res.json({ ok: true, id: lastId });
  }

  res.status(405).end();
}

function parseSizesRaw(raw) {
  if (!raw) return {};
  const colors = {};
  raw.split(',').forEach(p => {
    const parts = p.split('~');
    if (parts.length < 3) return;
    const color = parts[0];
    const size = parts[1];
    const qty = Number(parts[2]);
    if (!colors[color]) colors[color] = {};
    colors[color][size] = qty;
  });
  return colors;
}
