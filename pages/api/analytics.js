import { getDb } from '../../lib/db';
import { getSession } from '../../lib/auth';

function nptMonth(col) { return `strftime('%Y-%m', ${col}, '+5 hours', '+45 minutes')`; }
function nptYear(col) { return `strftime('%Y', ${col}, '+5 hours', '+45 minutes')`; }

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session || session.role !== 'owner') return res.status(403).json({ error: 'Owner only' });

  const db = await getDb();
  const { period = 'month', year, month } = req.query;

  const nowNPT = await db.queryOne(`SELECT strftime('%Y-%m', 'now', '+5 hours', '+45 minutes') as ym, strftime('%Y', 'now', '+5 hours', '+45 minutes') as y`);
  const targetMonth = month || nowNPT.ym;
  const targetYear = year || nowNPT.y;

  if (period === 'month') {
    const [shoes, accessories, expenses, returns, dailyRev] = await Promise.all([
      db.query(`
        SELECT si.item_name as name,
          SUM(si.quantity) as qty,
          SUM(si.quantity*si.unit_price - COALESCE(si.item_discount,0)) as revenue,
          SUM(si.quantity*(si.unit_price-si.cost_price) - COALESCE(si.item_discount,0)) as profit
        FROM sales s JOIN sale_items si ON si.sale_id=s.id
        WHERE si.item_type='shoe' AND ${nptMonth('s.created_at')}=?
        GROUP BY si.item_name ORDER BY revenue DESC
      `, [targetMonth]),
      db.query(`
        SELECT si.item_name as name,
          SUM(si.quantity) as qty,
          SUM(si.quantity*si.unit_price - COALESCE(si.item_discount,0)) as revenue,
          SUM(si.quantity*(si.unit_price-si.cost_price) - COALESCE(si.item_discount,0)) as profit
        FROM sales s JOIN sale_items si ON si.sale_id=s.id
        WHERE si.item_type='accessory' AND ${nptMonth('s.created_at')}=?
        GROUP BY si.item_name ORDER BY revenue DESC
      `, [targetMonth]),
      db.queryOne(`SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE strftime('%Y-%m',expense_date)=?`, [targetMonth]),
      db.queryOne(`SELECT COALESCE(SUM(return_amount),0) as revenue, COALESCE(SUM(return_profit),0) as profit FROM sales_returns WHERE ${nptMonth('created_at')}=?`, [targetMonth]),
      db.query(`
        SELECT date(s.created_at,'+5 hours','+45 minutes') as date,
          COALESCE(SUM(s.total_amount),0) as revenue,
          COALESCE(SUM(si.quantity*(si.unit_price-si.cost_price)-COALESCE(si.item_discount,0)),0) as profit
        FROM sales s JOIN sale_items si ON si.sale_id=s.id
        WHERE ${nptMonth('s.created_at')}=?
        GROUP BY date(s.created_at,'+5 hours','+45 minutes')
        ORDER BY date
      `, [targetMonth]),
    ]);

    return res.json({ period: 'month', month: targetMonth, shoes, accessories, expenses: Number(expenses?.total || 0), returns, dailyRev });
  }

  if (period === 'year') {
    const [monthly, shoes, accessories] = await Promise.all([
      db.query(`
        SELECT ${nptMonth('s.created_at')} as month,
          COALESCE(SUM(s.total_amount),0) as revenue,
          COALESCE(SUM(si.quantity*(si.unit_price-si.cost_price)-COALESCE(si.item_discount,0)),0) as profit,
          COUNT(DISTINCT s.id) as sales
        FROM sales s JOIN sale_items si ON si.sale_id=s.id
        WHERE ${nptYear('s.created_at')}=?
        GROUP BY ${nptMonth('s.created_at')} ORDER BY month
      `, [targetYear]),
      db.query(`
        SELECT si.item_name as name, SUM(si.quantity) as qty,
          SUM(si.quantity*si.unit_price - COALESCE(si.item_discount,0)) as revenue
        FROM sales s JOIN sale_items si ON si.sale_id=s.id
        WHERE si.item_type='shoe' AND ${nptYear('s.created_at')}=?
        GROUP BY si.item_name ORDER BY qty DESC LIMIT 10
      `, [targetYear]),
      db.query(`
        SELECT si.item_name as name, SUM(si.quantity) as qty,
          SUM(si.quantity*si.unit_price - COALESCE(si.item_discount,0)) as revenue
        FROM sales s JOIN sale_items si ON si.sale_id=s.id
        WHERE si.item_type='accessory' AND ${nptYear('s.created_at')}=?
        GROUP BY si.item_name ORDER BY qty DESC LIMIT 10
      `, [targetYear]),
    ]);
    return res.json({ period: 'year', year: targetYear, monthly, shoes, accessories });
  }

  res.status(400).json({ error: 'Invalid period' });
}
