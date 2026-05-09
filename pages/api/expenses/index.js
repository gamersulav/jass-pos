import { getDb } from '../../../lib/db';
import { getSession } from '../../../lib/auth';

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const db = await getDb();

  if (req.method === 'GET') {
    const { date } = req.query;
    const today = await db.queryOne(`SELECT date('now','+5 hours','+45 minutes') as d`);
    const d = date || today.d;
    const expenses = await db.query(
      `SELECT e.*, u.username as added_by FROM expenses e LEFT JOIN users u ON u.id=e.created_by WHERE expense_date=? ORDER BY e.created_at DESC`,
      [d]
    );
    return res.json(expenses);
  }

  if (req.method === 'POST') {
    const { description, amount, payment_method = 'Cash', expense_date } = req.body;
    if (!description?.trim()) return res.status(400).json({ error: 'Description required' });
    if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Amount required' });

    const today = await db.queryOne(`SELECT date('now','+5 hours','+45 minutes') as d`);
    const d = expense_date || today.d;

    await db.run(
      'INSERT INTO expenses (description,amount,payment_method,expense_date,created_by) VALUES (?,?,?,?,?)',
      [description.trim(), Number(amount), payment_method, d, session.id]
    );
    return res.json({ ok: true });
  }

  if (req.method === 'DELETE') {
    if (session.role !== 'owner') return res.status(403).json({ error: 'Owner only' });
    const { id } = req.body;
    await db.run('DELETE FROM expenses WHERE id=?', [id]);
    return res.json({ ok: true });
  }

  res.status(405).end();
}
