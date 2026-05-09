import { getDb } from '../../../lib/db';
import { getSession } from '../../../lib/auth';

async function logEdit(db, session, entityId, entityName, field, oldVal, newVal) {
  await db.run(
    'INSERT INTO edit_history (entity_type,entity_id,entity_name,field_name,old_value,new_value,changed_by,changed_by_name) VALUES (?,?,?,?,?,?,?,?)',
    ['shoe', entityId, entityName, field, String(oldVal ?? ''), String(newVal ?? ''), session.id, session.username]
  );
}

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session || session.role !== 'owner') return res.status(403).json({ error: 'Owner only' });

  const db = await getDb();
  const id = Number(req.query.id);

  if (req.method === 'PUT') {
    const { name, brand, category, cost_price, selling_price, notes, sizes } = req.body;
    const shoe = await db.queryOne('SELECT * FROM shoes WHERE id=?', [id]);
    if (!shoe) return res.status(404).json({ error: 'Not found' });

    const fields = [], vals = [];
    if (name !== undefined && name !== shoe.name) { await logEdit(db, session, id, shoe.name, 'name', shoe.name, name); fields.push('name=?'); vals.push(name); }
    if (brand !== undefined && brand !== shoe.brand) { await logEdit(db, session, id, shoe.name, 'brand', shoe.brand, brand); fields.push('brand=?'); vals.push(brand); }
    if (category !== undefined && category !== shoe.category) { await logEdit(db, session, id, shoe.name, 'category', shoe.category, category); fields.push('category=?'); vals.push(category); }
    if (cost_price !== undefined && Number(cost_price) !== Number(shoe.cost_price)) { await logEdit(db, session, id, shoe.name, 'cost_price', shoe.cost_price, cost_price); fields.push('cost_price=?'); vals.push(Number(cost_price)); }
    if (selling_price !== undefined && Number(selling_price) !== Number(shoe.selling_price)) { await logEdit(db, session, id, shoe.name, 'selling_price', shoe.selling_price, selling_price); fields.push('selling_price=?'); vals.push(Number(selling_price)); }
    if (notes !== undefined && notes !== shoe.notes) { await logEdit(db, session, id, shoe.name, 'notes', shoe.notes, notes); fields.push('notes=?'); vals.push(notes); }

    if (fields.length) { vals.push(id); await db.run(`UPDATE shoes SET ${fields.join(',')} WHERE id=?`, vals); }

    if (sizes && typeof sizes === 'object') {
      for (const [size, qty] of Object.entries(sizes)) {
        const cur = await db.queryOne('SELECT quantity FROM shoe_sizes WHERE shoe_id=? AND size=?', [id, Number(size)]);
        const newQty = Number(qty);
        if (cur) {
          if (cur.quantity !== newQty) {
            await logEdit(db, session, id, shoe.name, `size_${size}`, cur.quantity, newQty);
            await db.run('UPDATE shoe_sizes SET quantity=? WHERE shoe_id=? AND size=?', [newQty, id, Number(size)]);
          }
        } else {
          await db.run('INSERT INTO shoe_sizes (shoe_id,size,quantity) VALUES (?,?,?)', [id, Number(size), newQty]);
        }
      }
    }

    return res.json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const shoe = await db.queryOne('SELECT name FROM shoes WHERE id=?', [id]);
    await db.run('UPDATE shoes SET active=0 WHERE id=?', [id]);
    if (shoe) await logEdit(db, session, id, shoe.name, 'active', 1, 0);
    return res.json({ ok: true });
  }

  res.status(405).end();
}
