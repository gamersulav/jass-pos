import { getDb } from '../../../lib/db';
import { getSession } from '../../../lib/auth';

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const db = await getDb();

  if (req.method === 'GET') {
    // All set prices
    const prices = await db.query(`
      SELECT sp.*, s.name as shoe_name, s.brand
      FROM supplier_prices sp
      JOIN shoes s ON s.id = sp.shoe_id
      ORDER BY sp.supplier_name, s.name
    `);

    // Unpriced: (supplier, shoe) combos that have stock but no price set
    const unpriced = await db.query(`
      SELECT DISTINCT se.supplier_name, se.shoe_id, s.name as shoe_name, s.brand
      FROM stock_entries se
      JOIN shoes s ON s.id = se.shoe_id
      WHERE se.supplier_name IS NOT NULL AND se.supplier_name != ''
        AND NOT EXISTS (
          SELECT 1 FROM supplier_prices sp
          WHERE sp.supplier_name = se.supplier_name AND sp.shoe_id = se.shoe_id
        )
      ORDER BY se.supplier_name, s.name
    `);

    // All unique supplier names ever used
    const suppliers = await db.query(`
      SELECT DISTINCT supplier_name FROM stock_entries
      WHERE supplier_name IS NOT NULL AND supplier_name != ''
      ORDER BY supplier_name
    `);

    return res.json({ prices, unpriced, suppliers: suppliers.map(r => r.supplier_name) });
  }

  if (req.method === 'POST') {
    if (session.role !== 'owner') return res.status(403).json({ error: 'Owner only' });
    const { supplier_name, shoe_id, cost_price, selling_price } = req.body;
    if (!supplier_name?.trim() || !shoe_id) return res.status(400).json({ error: 'supplier_name and shoe_id required' });

    await db.run(
      `INSERT INTO supplier_prices (supplier_name, shoe_id, cost_price, selling_price, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(supplier_name, shoe_id)
       DO UPDATE SET cost_price=excluded.cost_price, selling_price=excluded.selling_price, updated_at=excluded.updated_at`,
      [supplier_name.trim(), Number(shoe_id), Number(cost_price) || 0, Number(selling_price) || 0]
    );

    // Auto-apply to the shoe so cost/selling prices are current
    await db.run(
      'UPDATE shoes SET cost_price=?, selling_price=? WHERE id=?',
      [Number(cost_price) || 0, Number(selling_price) || 0, Number(shoe_id)]
    );

    // Log edit
    await db.run(
      'INSERT INTO edit_history (entity_type,entity_id,entity_name,field_name,old_value,new_value,changed_by,changed_by_name) VALUES (?,?,?,?,?,?,?,?)',
      ['supplier_price', Number(shoe_id), supplier_name.trim(), 'price', '', `cost:${cost_price} sell:${selling_price}`, session.id, session.username]
    );

    return res.json({ ok: true });
  }

  if (req.method === 'DELETE') {
    if (session.role !== 'owner') return res.status(403).json({ error: 'Owner only' });
    const { id } = req.body;
    await db.run('DELETE FROM supplier_prices WHERE id=?', [id]);
    return res.json({ ok: true });
  }

  res.status(405).end();
}
