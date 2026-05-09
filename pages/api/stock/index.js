import { getDb } from '../../../lib/db';
import { getSession } from '../../../lib/auth';

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const db = await getDb();

  if (req.method === 'GET') {
    const entries = await db.query(`
      SELECT se.*, u.username as added_by_name
      FROM stock_entries se
      LEFT JOIN users u ON u.id = se.created_by
      ORDER BY se.created_at DESC
      LIMIT 100
    `);
    return res.json(entries);
  }

  if (req.method === 'POST') {
    const { item_type = 'shoe', shoe_id, accessory_id, item_name, size, quantity, unit_cost = 0, direction = 'in', notes = '' } = req.body;
    if (!item_name?.trim()) return res.status(400).json({ error: 'Item name required' });
    if (!quantity || Number(quantity) <= 0) return res.status(400).json({ error: 'Quantity must be positive' });

    await db.tx(async (tx) => {
      await tx.run(
        'INSERT INTO stock_entries (item_type,shoe_id,accessory_id,item_name,size,quantity,unit_cost,direction,notes,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [item_type, shoe_id || null, accessory_id || null, item_name.trim(), size || null, Number(quantity), Number(unit_cost), direction, notes, session.id]
      );

      if (item_type === 'shoe' && shoe_id && size) {
        const delta = direction === 'in' ? Number(quantity) : -Number(quantity);
        await tx.run(
          'INSERT INTO shoe_sizes (shoe_id,size,quantity) VALUES (?,?,?) ON CONFLICT(shoe_id,size) DO UPDATE SET quantity=quantity+?',
          [Number(shoe_id), Number(size), Math.max(0, delta), delta]
        );
      } else if (item_type === 'accessory' && accessory_id) {
        const delta = direction === 'in' ? Number(quantity) : -Number(quantity);
        await tx.run('UPDATE accessories SET stock=MAX(0,stock+?) WHERE id=?', [delta, Number(accessory_id)]);
      }
    });

    return res.json({ ok: true });
  }

  res.status(405).end();
}
