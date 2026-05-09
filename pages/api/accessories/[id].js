import { getDb } from '../../../lib/db';
import { getSession } from '../../../lib/auth';

async function logEdit(db, session, entityId, entityName, field, oldVal, newVal) {
  await db.run(
    'INSERT INTO edit_history (entity_type,entity_id,entity_name,field_name,old_value,new_value,changed_by,changed_by_name) VALUES (?,?,?,?,?,?,?,?)',
    ['accessory', entityId, entityName, field, String(oldVal ?? ''), String(newVal ?? ''), session.id, session.username]
  );
}

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session || session.role !== 'owner') return res.status(403).json({ error: 'Owner only' });

  const db = await getDb();
  const id = Number(req.query.id);

  if (req.method === 'PUT') {
    const { name, category, cost_price, selling_price, stock, notes } = req.body;
    const acc = await db.queryOne('SELECT * FROM accessories WHERE id=?', [id]);
    if (!acc) return res.status(404).json({ error: 'Not found' });

    const fields = [], vals = [];
    if (name !== undefined && name !== acc.name) { await logEdit(db, session, id, acc.name, 'name', acc.name, name); fields.push('name=?'); vals.push(name); }
    if (category !== undefined && category !== acc.category) { await logEdit(db, session, id, acc.name, 'category', acc.category, category); fields.push('category=?'); vals.push(category); }
    if (cost_price !== undefined && Number(cost_price) !== Number(acc.cost_price)) { await logEdit(db, session, id, acc.name, 'cost_price', acc.cost_price, cost_price); fields.push('cost_price=?'); vals.push(Number(cost_price)); }
    if (selling_price !== undefined && Number(selling_price) !== Number(acc.selling_price)) { await logEdit(db, session, id, acc.name, 'selling_price', acc.selling_price, selling_price); fields.push('selling_price=?'); vals.push(Number(selling_price)); }
    if (stock !== undefined && Number(stock) !== Number(acc.stock)) { await logEdit(db, session, id, acc.name, 'stock', acc.stock, stock); fields.push('stock=?'); vals.push(Number(stock)); }
    if (notes !== undefined && notes !== acc.notes) { await logEdit(db, session, id, acc.name, 'notes', acc.notes, notes); fields.push('notes=?'); vals.push(notes); }

    if (fields.length) { vals.push(id); await db.run(`UPDATE accessories SET ${fields.join(',')} WHERE id=?`, vals); }
    return res.json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const acc = await db.queryOne('SELECT name FROM accessories WHERE id=?', [id]);
    await db.run('UPDATE accessories SET active=0 WHERE id=?', [id]);
    if (acc) await logEdit(db, session, id, acc.name, 'active', 1, 0);
    return res.json({ ok: true });
  }

  res.status(405).end();
}
