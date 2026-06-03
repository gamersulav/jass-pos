import { getDb } from '../../../lib/db';
import { getSession } from '../../../lib/auth';

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const db = await getDb();

  if (req.method === 'GET') {
    const shoes = await db.query(`
      SELECT s.*, COALESCE(SUM(ss.quantity), 0) as total_stock
      FROM shoes s
      LEFT JOIN shoe_sizes ss ON ss.shoe_id = s.id
      WHERE s.active = 1
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);

    const allSizes = shoes.length > 0
      ? await db.query(
          `SELECT shoe_id, color, size, quantity FROM shoe_sizes WHERE shoe_id IN (${shoes.map(() => '?').join(',')}) AND quantity > 0`,
          shoes.map(s => Number(s.id))
        )
      : [];

    const sizesMap = {};
    allSizes.forEach(ss => {
      if (!sizesMap[ss.shoe_id]) sizesMap[ss.shoe_id] = {};
      if (!sizesMap[ss.shoe_id][ss.color]) sizesMap[ss.shoe_id][ss.color] = {};
      sizesMap[ss.shoe_id][ss.color][ss.size] = ss.quantity;
    });

    return res.json(shoes.map(s => ({
      ...s,
      colors: sizesMap[s.id] || {},
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
