import { getDb } from '../../../lib/db';
import { verifyPassword, createToken, setCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

  const db = await getDb();
  const user = await db.queryOne('SELECT * FROM users WHERE username=?', [username]);

  if (!user) {
    // Auto-create owner if no users exist
    const count = await db.queryOne('SELECT COUNT(*) as c FROM users');
    if (Number(count?.c) === 0 && username === 'owner') {
      const { hashPassword } = await import('../../../lib/auth');
      const hash = await hashPassword(password);
      const { lastId } = await db.run(
        "INSERT INTO users (username,password_hash,role) VALUES (?,?,'owner')",
        [username, hash]
      );
      const token = await createToken({ id: lastId, username, role: 'owner' });
      setCookie(res, token);
      return res.json({ ok: true, role: 'owner' });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = await createToken({ id: user.id, username: user.username, role: user.role });
  setCookie(res, token);
  res.json({ ok: true, role: user.role });
}
