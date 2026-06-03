import { getDb } from '../../lib/db';
import { getSession } from '../../lib/auth';

const NPT_TODAY = "date('now', '+5 hours', '+45 minutes')";
const NPT_MONTH = "strftime('%Y-%m', 'now', '+5 hours', '+45 minutes')";
function nptDate(col) { return `date(${col}, '+5 hours', '+45 minutes')`; }
function nptMonth(col) { return `strftime('%Y-%m', ${col}, '+5 hours', '+45 minutes')`; }

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session || session.role !== 'owner') return res.status(403).json({ error: 'Owner only' });

  const db = await getDb();

  const NPT_LAST_MONTH = "strftime('%Y-%m', 'now', '+5 hours', '+45 minutes', '-1 month')";

  const [today, monthlyRev, todayProfit, monthlyProfit, todayReturns, monthlyReturns, todayExp, monthlyExp, lmSales, lmProfit, lmExp, payments, topShoes, topAccessories, stockLow, pendingCredits] = await Promise.all([
    db.queryOne(`SELECT COALESCE(SUM(total_amount),0) as revenue, COUNT(*) as sales FROM sales WHERE ${nptDate('created_at')}=${NPT_TODAY}`),
    db.queryOne(`SELECT COALESCE(SUM(total_amount),0) as revenue, COUNT(*) as sales FROM sales WHERE ${nptMonth('created_at')}=${NPT_MONTH}`),
    db.queryOne(`SELECT COALESCE(SUM(si.quantity*(si.unit_price-si.cost_price)-COALESCE(si.item_discount,0)),0) as profit FROM sales s JOIN sale_items si ON si.sale_id=s.id WHERE ${nptDate('s.created_at')}=${NPT_TODAY}`),
    db.queryOne(`SELECT COALESCE(SUM(si.quantity*(si.unit_price-si.cost_price)-COALESCE(si.item_discount,0)),0) as profit FROM sales s JOIN sale_items si ON si.sale_id=s.id WHERE ${nptMonth('s.created_at')}=${NPT_MONTH}`),
    db.queryOne(`SELECT COALESCE(SUM(return_amount),0) as revenue, COALESCE(SUM(return_profit),0) as profit FROM sales_returns WHERE ${nptDate('created_at')}=${NPT_TODAY}`),
    db.queryOne(`SELECT COALESCE(SUM(return_amount),0) as revenue, COALESCE(SUM(return_profit),0) as profit FROM sales_returns WHERE ${nptMonth('created_at')}=${NPT_MONTH}`),
    db.queryOne(`SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE expense_date=${NPT_TODAY}`),
    db.queryOne(`SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE ${nptMonth('expense_date')}=${NPT_MONTH}`),
    db.queryOne(`SELECT COALESCE(SUM(total_amount),0) as revenue, COUNT(*) as sales FROM sales WHERE ${nptMonth('created_at')}=${NPT_LAST_MONTH}`),
    db.queryOne(`SELECT COALESCE(SUM(si.quantity*(si.unit_price-si.cost_price)-COALESCE(si.item_discount,0)),0) as profit FROM sales s JOIN sale_items si ON si.sale_id=s.id WHERE ${nptMonth('s.created_at')}=${NPT_LAST_MONTH}`),
    db.queryOne(`SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE ${nptMonth('expense_date')}=${NPT_LAST_MONTH}`),
    db.query(`SELECT payment_method as method, COUNT(*) as count, SUM(total_amount) as total FROM sales WHERE ${nptDate('created_at')}=${NPT_TODAY} GROUP BY payment_method ORDER BY total DESC`),
    db.query(`
      SELECT si.item_name as name, SUM(si.quantity) as qty,
        SUM(si.quantity*si.unit_price - COALESCE(si.item_discount,0)) as revenue,
        SUM(si.quantity*(si.unit_price-si.cost_price) - COALESCE(si.item_discount,0)) as profit
      FROM sales s JOIN sale_items si ON si.sale_id=s.id
      WHERE si.item_type='shoe' AND ${nptMonth('s.created_at')}=${NPT_MONTH}
      GROUP BY si.item_name ORDER BY qty DESC LIMIT 5
    `),
    db.query(`
      SELECT si.item_name as name, SUM(si.quantity) as qty,
        SUM(si.quantity*si.unit_price - COALESCE(si.item_discount,0)) as revenue
      FROM sales s JOIN sale_items si ON si.sale_id=s.id
      WHERE si.item_type='accessory' AND ${nptMonth('s.created_at')}=${NPT_MONTH}
      GROUP BY si.item_name ORDER BY qty DESC LIMIT 5
    `),
    db.query(`SELECT s.name, s.brand, s.category, ss.size, ss.quantity FROM shoe_sizes ss JOIN shoes s ON s.id=ss.shoe_id WHERE ss.quantity <= 2 AND s.active=1 ORDER BY ss.quantity, s.name LIMIT 20`),
    db.queryOne(`SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as total FROM credits WHERE status='pending'`),
  ]);

  const todayRev = Number(today?.revenue || 0) - Number(todayReturns?.revenue || 0);
  const todayPro = Number(todayProfit?.profit || 0) - Number(todayReturns?.profit || 0);
  const monthRev = Number(monthlyRev?.revenue || 0) - Number(monthlyReturns?.revenue || 0);
  const monthPro = Number(monthlyProfit?.profit || 0) - Number(monthlyReturns?.profit || 0);
  const todayExpTotal = Number(todayExp?.total || 0);
  const monthExpTotal = Number(monthlyExp?.total || 0);
  const lmRev = Number(lmSales?.revenue || 0);
  const lmPro = Number(lmProfit?.profit || 0);
  const lmExpTotal = Number(lmExp?.total || 0);

  res.json({
    today: {
      revenue: todayRev,
      grossProfit: todayPro,
      expenses: todayExpTotal,
      profit: todayPro - todayExpTotal,
      sales: Number(today?.sales || 0),
    },
    monthly: {
      revenue: monthRev,
      grossProfit: monthPro,
      expenses: monthExpTotal,
      profit: monthPro - monthExpTotal,
      sales: Number(monthlyRev?.sales || 0),
      margin: monthRev > 0 ? ((monthPro - monthExpTotal) / monthRev) * 100 : 0,
    },
    lastMonth: {
      revenue: lmRev,
      profit: lmPro - lmExpTotal,
      sales: Number(lmSales?.sales || 0),
    },
    payments,
    topShoes,
    topAccessories,
    stockLow,
    pendingCredits: {
      count: Number(pendingCredits?.count || 0),
      total: Number(pendingCredits?.total || 0),
    },
  });
}
