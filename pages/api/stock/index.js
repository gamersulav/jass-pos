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
    const { item_type = 'shoe', shoe_id, accessory_id, item_name, color = '', size, quantity, unit_cost = 0, direction = 'in', notes = '', supplier_name = '' } = req.body;
    if (!item_name?.trim()) return res.status(400).json({ error: 'Item name required' });
    if (!quantity || Number(quantity) <= 0) return res.status(400).json({ error: 'Quantity must be positive' });
    if (item_type === 'shoe' && !color?.trim()) return res.status(400).json({ error: 'Color is required for shoes' });

    // Auto-apply supplier price if known
    let resolvedCost = Number(unit_cost);
    let priceApplied = false;
    if (item_type === 'shoe' && shoe_id && supplier_name.trim()) {
      const sp = await db.queryOne(
        'SELECT cost_price, selling_price FROM supplier_prices WHERE supplier_name=? AND shoe_id=?',
        [supplier_name.trim(), Number(shoe_id)]
      );
      if (sp) {
        resolvedCost = Number(sp.cost_price);
        await db.run('UPDATE shoes SET cost_price=?, selling_price=? WHERE id=?', [sp.cost_price, sp.selling_price, Number(shoe_id)]);
        priceApplied = true;
      }
    }

    await db.tx(async (tx) => {
      await tx.run(
        'INSERT INTO stock_entries (item_type,shoe_id,accessory_id,item_name,color,size,quantity,unit_cost,direction,notes,supplier_name,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        [item_type, shoe_id || null, accessory_id || null, item_name.trim(), color, size || null, Number(quantity), resolvedCost, direction, notes, supplier_name.trim(), session.id]
      );

      if (item_type === 'shoe' && shoe_id && size) {
        const delta = direction === 'in' ? Number(quantity) : -Number(quantity);
        await tx.run(
          'INSERT INTO shoe_sizes (shoe_id,color,size,quantity) VALUES (?,?,?,?) ON CONFLICT(shoe_id,color,size) DO UPDATE SET quantity=quantity+?',
          [Number(shoe_id), color, Number(size), Math.max(0, delta), delta]
        );
      } else if (item_type === 'accessory' && accessory_id) {
        const delta = direction === 'in' ? Number(quantity) : -Number(quantity);
        await tx.run('UPDATE accessories SET stock=MAX(0,stock+?) WHERE id=?', [delta, Number(accessory_id)]);
      }
    });

    return res.json({ ok: true, priceApplied, needsPricing: item_type === 'shoe' && shoe_id && supplier_name.trim() && !priceApplied });
  }

  res.status(405).end();
}
