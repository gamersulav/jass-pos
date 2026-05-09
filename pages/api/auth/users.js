import { getDb } from '../../../lib/db';
import { getSession, hashPassword } from '../../../lib/auth';

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session || session.role !== 'owner') return res.status(403).json({ error: 'Owner only' });

  const db = await getDb();

  if (req.method === 'GET') {
    const users = await db.query('SELECT id, username, role, created_at FROM users ORDER BY id');
    return res.json(users);
  }

  if (req.method === 'POST') {
    const { username, password, role = 'staff' } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const hash = await hashPassword(password);
    try {
      const { lastId } = await db.run(
        'INSERT INTO users (username,password_hash,role) VALUES (?,?,?)',
        [username, hash, role]
      );
      return res.json({ ok: true, id: lastId });
    } catch {
      return res.status(409).json({ error: 'Username already exists' });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (Number(id) === Number(session.id)) return res.status(400).json({ error: 'Cannot delete yourself' });
    await db.run('DELETE FROM users WHERE id=?', [id]);
    return res.json({ ok: true });
  }

  res.status(405).end();
}
