import { getDb } from '../../lib/db';
import { getSession } from '../../lib/auth';

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session || session.role !== 'owner') return res.status(403).json({ error: 'Owner only' });

  const db = await getDb();
  const { entity_type, entity_id, limit = 100 } = req.query;

  let sql = 'SELECT * FROM edit_history WHERE 1=1';
  const args = [];
  if (entity_type) { sql += ' AND entity_type=?'; args.push(entity_type); }
  if (entity_id) { sql += ' AND entity_id=?'; args.push(Number(entity_id)); }
  sql += ' ORDER BY changed_at DESC LIMIT ?';
  args.push(Number(limit));

  const history = await db.query(sql, args);
  res.json(history);
}
