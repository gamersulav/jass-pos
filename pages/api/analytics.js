import { getDb } from '../../lib/db';
import { getSession } from '../../lib/auth';

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session || session.role !== 'owner') return res.status(403).json({ error: 'Owner only' });

  const db = await getDb();
  const year = (req.query.year || new Date().getFullYear()).toString();

  const yearRows = await db.query(`
    SELECT DISTINCT strftime('%Y', created_at, '+5 hours', '+45 minutes') as yr FROM sales
    UNION
    SELECT DISTINCT strftime('%Y', expense_date) as yr FROM expenses
    ORDER BY yr DESC
  `);
  const years = [...new Set([...yearRows.map(r => r.yr).filter(Boolean), year])].sort((a, b) => b.localeCompare(a));

  const [shoeMonthly, accessoryMonthly, expenseMonthly, yearlyShoes, yearlyAccessories, expenseYearly] = await Promise.all([
    db.query(`
      SELECT CAST(strftime('%m', s.created_at, '+5 hours', '+45 minutes') AS INTEGER) as month,
             COALESCE(SUM(si.quantity * si.unit_price - COALESCE(si.item_discount,0)), 0) as revenue,
             COALESCE(SUM(si.quantity * (si.unit_price - si.cost_price) - COALESCE(si.item_discount,0)), 0) as profit,
             COUNT(DISTINCT s.id) as sales
      FROM sales s JOIN sale_items si ON si.sale_id = s.id
      WHERE si.item_type='shoe' AND strftime('%Y', s.created_at, '+5 hours', '+45 minutes') = ?
      GROUP BY month
    `, [year]),
    db.query(`
      SELECT CAST(strftime('%m', s.created_at, '+5 hours', '+45 minutes') AS INTEGER) as month,
             COALESCE(SUM(si.quantity * si.unit_price - COALESCE(si.item_discount,0)), 0) as revenue,
             COALESCE(SUM(si.quantity * (si.unit_price - si.cost_price) - COALESCE(si.item_discount,0)), 0) as profit,
             COUNT(DISTINCT s.id) as sales
      FROM sales s JOIN sale_items si ON si.sale_id = s.id
      WHERE si.item_type='accessory' AND strftime('%Y', s.created_at, '+5 hours', '+45 minutes') = ?
      GROUP BY month
    `, [year]),
    db.query(`
      SELECT CAST(strftime('%m', expense_date) AS INTEGER) as month,
             COALESCE(SUM(amount), 0) as total
      FROM expenses WHERE strftime('%Y', expense_date) = ?
      GROUP BY month
    `, [year]),
    db.query(`
      SELECT strftime('%Y', s.created_at, '+5 hours', '+45 minutes') as yr,
             COALESCE(SUM(si.quantity * si.unit_price - COALESCE(si.item_discount,0)), 0) as revenue,
             COALESCE(SUM(si.quantity * (si.unit_price - si.cost_price) - COALESCE(si.item_discount,0)), 0) as profit,
             COUNT(DISTINCT s.id) as sales
      FROM sales s JOIN sale_items si ON si.sale_id = s.id
      WHERE si.item_type='shoe' GROUP BY yr ORDER BY yr DESC
    `),
    db.query(`
      SELECT strftime('%Y', s.created_at, '+5 hours', '+45 minutes') as yr,
             COALESCE(SUM(si.quantity * si.unit_price - COALESCE(si.item_discount,0)), 0) as revenue,
             COALESCE(SUM(si.quantity * (si.unit_price - si.cost_price) - COALESCE(si.item_discount,0)), 0) as profit,
             COUNT(DISTINCT s.id) as sales
      FROM sales s JOIN sale_items si ON si.sale_id = s.id
      WHERE si.item_type='accessory' GROUP BY yr ORDER BY yr DESC
    `),
    db.query(`
      SELECT strftime('%Y', expense_date) as yr, COALESCE(SUM(amount), 0) as total
      FROM expenses GROUP BY yr ORDER BY yr DESC
    `),
  ]);

  function toMonthArray(rows) {
    const map = {};
    for (const r of rows) map[Number(r.month)] = r;
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      return { month: m, revenue: Number(map[m]?.revenue || 0), profit: Number(map[m]?.profit || 0), count: Number(map[m]?.sales || 0) };
    });
  }

  const expMonthMap = {};
  expenseMonthly.forEach(r => { expMonthMap[Number(r.month)] = Number(r.total); });
  const expYearMap = {};
  expenseYearly.forEach(r => { expYearMap[r.yr] = Number(r.total); });

  res.json({
    year,
    years,
    shoes: toMonthArray(shoeMonthly),
    accessories: toMonthArray(accessoryMonthly),
    expensesByMonth: expMonthMap,
    yearly: {
      shoes: yearlyShoes.map(r => ({ year: r.yr, revenue: Number(r.revenue), profit: Number(r.profit), count: Number(r.sales) })),
      accessories: yearlyAccessories.map(r => ({ year: r.yr, revenue: Number(r.revenue), profit: Number(r.profit), count: Number(r.sales) })),
      expenses: expYearMap,
    },
  });
}
