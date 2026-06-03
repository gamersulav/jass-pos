import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

const C = {
  bg: '#0a0a1a', card: '#111827', border: '#1f2937',
  amber: '#f59e0b', cyan: '#00d4ff', text: '#e2e8f0',
  muted: '#6b7280', green: '#10b981', red: '#ef4444', purple: '#8b5cf6',
};
const Rs = n => `Rs ${Number(n || 0).toLocaleString()}`;
const SIZES = [35,36,37,38,39,40,41,42,43,44,45];
const CATEGORIES = ['Sports','Classic','Casual','Formal','Running','Kids','General'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PAYMENT = ['Cash','Bank','eSewa Pranis','eSewa Saharsh','eSewa Sulav'];

function Btn({ onClick, children, color = C.amber, style = {}, disabled = false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding:'8px 16px', background: disabled ? '#374151' : color, color: color === C.amber ? '#000' : '#fff', border:'none', borderRadius:8, cursor: disabled ? 'not-allowed' : 'pointer', fontWeight:600, fontSize:13, ...style }}>
      {children}
    </button>
  );
}

function Card({ children, style = {} }) {
  return <div style={{ background: C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, ...style }}>{children}</div>;
}

function Input({ label, value, onChange, type='text', style={}, ...rest }) {
  return (
    <div style={{ marginBottom:12 }}>
      {label && <label style={{ display:'block', fontSize:11, color:C.muted, marginBottom:4, textTransform:'uppercase', letterSpacing:1 }}>{label}</label>}
      <input type={type} value={value} onChange={onChange} {...rest}
        style={{ width:'100%', padding:'9px 12px', background:'#1f2937', border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:14, outline:'none', ...style }} />
    </div>
  );
}

function Sel({ label, value, onChange, children, style={} }) {
  return (
    <div style={{ marginBottom:12 }}>
      {label && <label style={{ display:'block', fontSize:11, color:C.muted, marginBottom:4, textTransform:'uppercase', letterSpacing:1 }}>{label}</label>}
      <select value={value} onChange={onChange} style={{ width:'100%', padding:'9px 12px', background:'#1f2937', border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:14, outline:'none', ...style }}>
        {children}
      </select>
    </div>
  );
}

function Stat({ label, value, sub, color = C.amber }) {
  return (
    <Card>
      <div style={{ fontSize:12, color:C.muted, marginBottom:4, textTransform:'uppercase', letterSpacing:1 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:800, color }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>{sub}</div>}
    </Card>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function pctChange(curr, prev) {
  if (!prev) return null;
  const diff = ((curr - prev) / prev) * 100;
  return { diff, up: diff >= 0 };
}

function DashboardTab() {
  const [data, setData] = useState(null);

  useEffect(() => { fetch('/api/dashboard').then(r=>r.json()).then(setData); }, []);
  if (!data) return <p style={{ color:C.muted }}>Loading…</p>;

  const { today, monthly, lastMonth, payments, topShoes, topAccessories, stockLow, pendingCredits } = data;

  return (
    <div>
      <h2 style={{ color:C.amber, marginBottom:20, fontSize:22 }}>Dashboard</h2>

      <h3 style={{ color:C.muted, fontSize:13, textTransform:'uppercase', letterSpacing:2, marginBottom:12 }}>Today</h3>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12, marginBottom:24 }}>
        <Stat label="Revenue" value={Rs(today.revenue)} />
        <Stat label="Gross Profit" value={Rs(today.grossProfit)} color={C.green} />
        <Stat label="Expenses" value={Rs(today.expenses)} color={C.red} />
        <Stat label="Net Profit" value={Rs(today.profit)} color={today.profit >= 0 ? C.green : C.red} />
        <Stat label="Sales" value={today.sales} color={C.cyan} />
      </div>

      <h3 style={{ color:C.muted, fontSize:13, textTransform:'uppercase', letterSpacing:2, marginBottom:12 }}>This Month</h3>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12, marginBottom:24 }}>
        <Stat label="Revenue" value={Rs(monthly.revenue)} />
        <Stat label="Gross Profit" value={Rs(monthly.grossProfit)} color={C.green} />
        <Stat label="Expenses" value={Rs(monthly.expenses)} color={C.red} />
        <Stat label="Net Profit" value={Rs(monthly.profit)} color={monthly.profit >= 0 ? C.green : C.red} />
        <Stat label="Margin" value={`${monthly.margin.toFixed(1)}%`} color={C.purple} />
        <Stat label="Sales" value={monthly.sales} color={C.cyan} />
      </div>

      {lastMonth && (() => {
        const items = [
          { label:'Revenue', curr: monthly.revenue, prev: lastMonth.revenue },
          { label:'Net Profit', curr: monthly.profit, prev: lastMonth.profit },
          { label:'Sales', curr: monthly.sales, prev: lastMonth.sales, isCount: true },
        ];
        return (
          <div style={{ marginBottom:24 }}>
            <h3 style={{ color:C.muted, fontSize:13, textTransform:'uppercase', letterSpacing:2, marginBottom:12 }}>vs Last Month</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {items.map(({ label, curr, prev, isCount }) => {
                const pc = pctChange(curr, prev);
                return (
                  <Card key={label}>
                    <div style={{ fontSize:11, color:C.muted, textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>{label}</div>
                    <div style={{ fontSize:18, fontWeight:800 }}>{isCount ? curr : Rs(curr)}</div>
                    {pc !== null && (
                      <div style={{ fontSize:12, marginTop:4, color: pc.up ? C.green : C.red }}>
                        {pc.up ? '▲' : '▼'} {Math.abs(pc.diff).toFixed(1)}% vs {isCount ? prev : Rs(prev)}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20 }}>
        <Card>
          <h4 style={{ color:C.amber, marginBottom:12 }}>Payment Methods Today</h4>
          {payments.map(p => (
            <div key={p.method} style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:14 }}>
              <span style={{ color:C.muted }}>{p.method}</span>
              <span style={{ fontWeight:700 }}>{Rs(p.total)}</span>
            </div>
          ))}
          {!payments.length && <p style={{ color:C.muted, fontSize:13 }}>No sales today</p>}
        </Card>

        <Card>
          <h4 style={{ color:C.amber, marginBottom:12 }}>Top Shoes This Month</h4>
          {topShoes.map((s,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13 }}>
              <span style={{ color:C.muted, flex:1 }}>{s.name}</span>
              <span style={{ color:C.cyan, marginRight:8 }}>×{s.qty}</span>
              <span style={{ fontWeight:700 }}>{Rs(s.revenue)}</span>
            </div>
          ))}
          {!topShoes.length && <p style={{ color:C.muted, fontSize:13 }}>No shoe sales</p>}
        </Card>

        <Card>
          <h4 style={{ color:C.amber, marginBottom:12 }}>Alerts</h4>
          {pendingCredits.count > 0 && (
            <div style={{ background:'#ef444422', border:'1px solid #ef444444', borderRadius:8, padding:10, marginBottom:10 }}>
              <div style={{ color:C.red, fontWeight:700 }}>{pendingCredits.count} Credit(s) Pending</div>
              <div style={{ color:C.muted, fontSize:12 }}>{Rs(pendingCredits.total)}</div>
            </div>
          )}
          {stockLow.length > 0 && (
            <div style={{ background:'#f59e0b11', border:'1px solid #f59e0b33', borderRadius:8, padding:10 }}>
              <div style={{ color:C.amber, fontWeight:700, marginBottom:6 }}>Low Stock</div>
              {stockLow.map((s,i) => (
                <div key={i} style={{ fontSize:12, color:C.muted, marginBottom:2 }}>{s.name} sz{s.size}: {s.quantity}</div>
              ))}
            </div>
          )}
          {pendingCredits.count === 0 && !stockLow.length && <p style={{ color:C.green, fontSize:13 }}>All clear!</p>}
        </Card>
      </div>
    </div>
  );
}

// ── Analytics Tab ─────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const curYear = new Date(Date.now() + 5*3600000 + 45*60000).getFullYear().toString();
  const [data, setData] = useState(null);
  const [year, setYear] = useState(curYear);
  const [view, setView] = useState('monthly');
  const [cat, setCat] = useState('all');

  useEffect(() => {
    setData(null);
    fetch(`/api/analytics?year=${year}`).then(r=>r.json()).then(setData);
  }, [year]);

  if (!data) return <p style={{ color:C.muted }}>Loading…</p>;

  function buildMonthly() {
    return data.shoes.map((row, i) => {
      const ac = data.accessories[i];
      if (cat === 'all') {
        const grossProfit = row.profit + ac.profit;
        const expenses = Number(data.expensesByMonth?.[i + 1] || 0);
        return { label: MONTH_NAMES[i], revenue: row.revenue + ac.revenue, grossProfit, expenses, profit: grossProfit - expenses, count: row.count + ac.count };
      }
      if (cat === 'shoes') return { label: MONTH_NAMES[i], ...row };
      return { label: MONTH_NAMES[i], ...ac };
    });
  }

  function buildYearly() {
    const allYears = [...new Set([
      ...data.yearly.shoes.map(r => r.year),
      ...data.yearly.accessories.map(r => r.year),
    ])].sort((a, b) => b.localeCompare(a));
    return allYears.map(yr => {
      const s = data.yearly.shoes.find(r => r.year === yr) || { revenue: 0, profit: 0, count: 0 };
      const a = data.yearly.accessories.find(r => r.year === yr) || { revenue: 0, profit: 0, count: 0 };
      if (cat === 'all') {
        const grossProfit = s.profit + a.profit;
        const expenses = Number(data.yearly.expenses?.[yr] || 0);
        return { label: yr, revenue: s.revenue + a.revenue, grossProfit, expenses, profit: grossProfit - expenses, count: s.count + a.count };
      }
      if (cat === 'shoes') return { label: yr, ...s };
      return { label: yr, ...a };
    });
  }

  const rows = view === 'monthly' ? buildMonthly() : buildYearly();
  const total = rows.reduce((acc, r) => ({
    revenue: acc.revenue + r.revenue,
    grossProfit: acc.grossProfit + (r.grossProfit || 0),
    expenses: acc.expenses + (r.expenses || 0),
    profit: acc.profit + r.profit,
    count: acc.count + r.count,
  }), { revenue: 0, grossProfit: 0, expenses: 0, profit: 0, count: 0 });

  const btnBase = { border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:13 };

  return (
    <div>
      <h2 style={{ color:C.amber, fontSize:22, marginBottom:16 }}>Analytics</h2>

      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        {[['monthly','Monthly'],['yearly','All Years']].map(([v,lbl]) => (
          <button key={v} onClick={() => setView(v)} style={{ ...btnBase, flex:1, padding:'8px 16px', background: view===v ? C.cyan : C.card, color: view===v ? '#000' : C.muted, border:`1px solid ${view===v ? C.cyan : C.border}` }}>{lbl}</button>
        ))}
      </div>

      {view === 'monthly' && (
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
          {data.years.map(y => (
            <button key={y} onClick={() => setYear(y)} style={{ ...btnBase, padding:'6px 16px', background: year===y ? C.purple : C.card, color: year===y ? '#fff' : C.muted, border:`1px solid ${year===y ? C.purple : C.border}` }}>{y}</button>
          ))}
        </div>
      )}

      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {[['all','All'],['shoes','Shoes'],['accessories','Accessories']].map(([c,lbl]) => (
          <button key={c} onClick={() => setCat(c)} style={{ ...btnBase, flex:1, padding:'8px', background: cat===c ? C.amber : C.card, color: cat===c ? '#000' : C.muted, border:`1px solid ${cat===c ? C.amber : C.border}` }}>{lbl}</button>
        ))}
      </div>

      {cat === 'all' ? (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
          <Stat label="Revenue" value={Rs(total.revenue)} color={C.cyan} />
          <Stat label="Gross Profit" value={Rs(total.grossProfit)} color={C.green} />
          <Stat label="Expenses" value={Rs(total.expenses)} color={C.red} />
          <Stat label="Net Profit" value={Rs(total.profit)} color={total.profit >= 0 ? C.green : C.red} />
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
          <Stat label="Revenue" value={Rs(total.revenue)} color={C.cyan} />
          <Stat label="Profit" value={Rs(total.profit)} color={C.green} />
          <Stat label="Sales" value={total.count} color={C.amber} />
        </div>
      )}

      <Card style={{ padding:0, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}`, background:'rgba(255,255,255,0.03)' }}>
              <th style={{ padding:'10px 12px', textAlign:'left', color:C.muted, fontWeight:700, fontSize:11 }}>{view === 'monthly' ? 'MONTH' : 'YEAR'}</th>
              <th style={{ padding:'10px 8px', textAlign:'right', color:C.muted, fontWeight:700, fontSize:11 }}>REVENUE</th>
              <th style={{ padding:'10px 8px', textAlign:'right', color:C.muted, fontWeight:700, fontSize:11 }}>{cat === 'all' ? 'NET' : 'PROFIT'}</th>
              <th style={{ padding:'10px 10px', textAlign:'right', color:C.muted, fontWeight:700, fontSize:11 }}>{cat === 'all' ? 'EXP' : 'SALES'}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const isEmpty = row.revenue === 0 && (cat === 'all' ? row.grossProfit === 0 : row.count === 0);
              return (
                <tr key={row.label} style={{ borderBottom:`1px solid ${C.border}`, opacity: isEmpty ? 0.35 : 1 }}>
                  <td style={{ padding:'9px 12px', fontWeight:600 }}>{row.label}</td>
                  <td style={{ padding:'9px 8px', textAlign:'right', color:C.cyan, fontWeight:600 }}>{row.revenue > 0 ? Rs(row.revenue) : '—'}</td>
                  <td style={{ padding:'9px 8px', textAlign:'right', fontWeight:600, color: row.profit > 0 ? C.green : row.profit < 0 ? C.red : C.muted }}>
                    {row.profit !== 0 ? Rs(row.profit) : '—'}
                    {cat === 'all' && row.grossProfit > 0 && <div style={{ fontSize:10, color:C.muted, fontWeight:400 }}>g: {Number(row.grossProfit).toLocaleString()}</div>}
                  </td>
                  <td style={{ padding:'9px 10px', textAlign:'right', fontSize:12 }}>
                    {cat === 'all' ? (row.expenses > 0 ? <span style={{ color:C.red }}>{Number(row.expenses).toLocaleString()}</span> : '—') : (row.count > 0 ? row.count : '—')}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background:'rgba(0,212,255,0.08)', borderTop:`2px solid ${C.border}` }}>
              <td style={{ padding:'11px 12px', fontWeight:800, fontSize:13 }}>TOTAL</td>
              <td style={{ padding:'11px 8px', textAlign:'right', color:C.cyan, fontWeight:800 }}>{Rs(total.revenue)}</td>
              <td style={{ padding:'11px 8px', textAlign:'right', color:C.green, fontWeight:800 }}>
                {Rs(total.profit)}
                {cat === 'all' && total.grossProfit > 0 && <div style={{ fontSize:10, color:C.muted, fontWeight:400 }}>g: {Number(total.grossProfit).toLocaleString()}</div>}
              </td>
              <td style={{ padding:'11px 10px', textAlign:'right', fontWeight:800 }}>
                {cat === 'all' ? <span style={{ color:C.red }}>{Number(total.expenses).toLocaleString()}</span> : <span style={{ color:C.amber }}>{total.count}</span>}
              </td>
            </tr>
          </tfoot>
        </table>
      </Card>
      {cat === 'all' && <p style={{ fontSize:11, color:C.muted, marginTop:8 }}>NET = Gross Profit minus Expenses. EXP = total expenses. "g:" = gross before deduction.</p>}

      <div style={{ display:'flex', gap:8, marginTop:16, flexWrap:'wrap' }}>
        {[['sales','Sales'],['expenses','Expenses'],['stock','Stock']].map(([type,lbl]) => (
          <a key={type} href={`/api/export?type=${type}`} download style={{ padding:'7px 16px', background:C.card, border:`1px solid ${C.amber}`, borderRadius:20, color:C.amber, textDecoration:'none', fontSize:13, fontWeight:600 }}>
            ⬇ {lbl}
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Shoes Tab ─────────────────────────────────────────────────────────────────
function ShoesTab() {
  const [shoes, setShoes] = useState([]);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name:'', brand:'', category:'General', cost_price:'', selling_price:'', notes:'' });
  const [variants, setVariants] = useState([{ color:'', size:'', qty:'' }]);
  const [msg, setMsg] = useState('');

  const load = () => fetch('/api/shoes').then(r=>r.json()).then(setShoes);
  useEffect(() => { load(); }, []);

  function updateVariant(i, field, val) { setVariants(v => v.map((r,j) => j===i ? {...r,[field]:val} : r)); }
  function addVariantRow() { setVariants(v => [...v, { color:'', size:'', qty:'' }]); }
  function removeVariantRow(i) { setVariants(v => v.filter((_,j) => j!==i)); }

  function startEdit(shoe) {
    setEditing(shoe.id); setAdding(false);
    setForm({ name: shoe.name, brand: shoe.brand||'', category: shoe.category||'General', cost_price: shoe.cost_price, selling_price: shoe.selling_price, notes: shoe.notes||'' });
    // Expand existing color/size/qty into rows
    const rows = [];
    Object.entries(shoe.colors || {}).forEach(([color, sizes]) => {
      Object.entries(sizes).forEach(([size, qty]) => { if (Number(qty) > 0) rows.push({ color, size, qty: String(qty) }); });
    });
    setVariants(rows.length ? rows : [{ color:'', size:'', qty:'' }]);
  }

  function startAdd() {
    setAdding(true); setEditing(null);
    setForm({ name:'', brand:'', category:'General', cost_price:'', selling_price:'', notes:'' });
    setVariants([{ color:'', size:'', qty:'' }]);
  }

  async function save() {
    if (!form.name.trim()) return setMsg('Name required');
    if (!form.brand.trim()) return setMsg('Brand required');
    const validVariants = variants.filter(v => v.size && Number(v.qty) >= 0).map(v => ({ color: v.color||'', size: Number(v.size), qty: Number(v.qty) }));
    const url = adding ? '/api/shoes' : `/api/shoes/${editing}`;
    const method = adding ? 'POST' : 'PUT';
    const body = { ...form, cost_price: Number(form.cost_price)||0, selling_price: Number(form.selling_price)||0, variants: validVariants };
    const r = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await r.json();
    if (!r.ok) return setMsg(data.error || 'Error');
    setMsg(adding ? 'Added!' : 'Updated!'); setEditing(null); setAdding(false); load();
  }

  async function del(id) {
    if (!confirm('Deactivate this shoe?')) return;
    await fetch(`/api/shoes/${id}`, { method:'DELETE' });
    load();
  }

  const isEditing = editing !== null || adding;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ color:C.amber, fontSize:22 }}>Shoes</h2>
        <Btn onClick={startAdd}>+ Add Shoe</Btn>
      </div>

      {isEditing && (
        <Card style={{ marginBottom:20, border:`1px solid ${C.amber}55` }}>
          <h3 style={{ color:C.amber, marginBottom:16 }}>{adding ? 'New Shoe' : 'Edit Shoe'}</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Input label="Name *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
            <Input label="Brand *" value={form.brand} onChange={e=>setForm(f=>({...f,brand:e.target.value}))} />
            <Sel label="Category" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
              {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </Sel>
            <div />
            <Input label="Cost Price" type="number" value={form.cost_price} onChange={e=>setForm(f=>({...f,cost_price:e.target.value}))} />
            <Input label="Selling Price" type="number" value={form.selling_price} onChange={e=>setForm(f=>({...f,selling_price:e.target.value}))} />
          </div>
          <div style={{ marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <label style={{ fontSize:11, color:C.muted, textTransform:'uppercase', letterSpacing:1 }}>Color / Size / Qty</label>
              <Btn onClick={addVariantRow} color="#374151" style={{ color:C.text, padding:'4px 10px', fontSize:12 }}>+ Row</Btn>
            </div>
            {variants.map((v, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 90px 80px 32px', gap:6, marginBottom:6 }}>
                <input placeholder="Color (e.g. Red)" value={v.color} onChange={e=>updateVariant(i,'color',e.target.value)}
                  style={{ padding:'7px 10px', background:'#1f2937', border:`1px solid ${C.border}`, borderRadius:6, color:C.text, fontSize:13, outline:'none' }} />
                <select value={v.size} onChange={e=>updateVariant(i,'size',e.target.value)}
                  style={{ padding:'7px 6px', background:'#1f2937', border:`1px solid ${C.border}`, borderRadius:6, color:C.text, fontSize:13, outline:'none' }}>
                  <option value="">Sz</option>
                  {SIZES.map(sz=><option key={sz} value={sz}>{sz}</option>)}
                </select>
                <input type="number" min="0" placeholder="Qty" value={v.qty} onChange={e=>updateVariant(i,'qty',e.target.value)}
                  style={{ padding:'7px 8px', background:'#1f2937', border:`1px solid ${C.border}`, borderRadius:6, color:C.text, fontSize:13, outline:'none' }} />
                <button onClick={() => removeVariantRow(i)} style={{ background:'none', border:'none', color:C.red, cursor:'pointer', fontSize:18 }}>×</button>
              </div>
            ))}
          </div>
          <Input label="Notes" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
          {msg && <p style={{ color: msg.includes('!') ? C.green : C.red, fontSize:13, marginBottom:8 }}>{msg}</p>}
          <div style={{ display:'flex', gap:8 }}>
            <Btn onClick={save}>Save</Btn>
            <Btn onClick={() => { setEditing(null); setAdding(false); setMsg(''); }} color="#374151" style={{ color:C.text }}>Cancel</Btn>
          </div>
        </Card>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
        {shoes.map(shoe => {
          const colorKeys = Object.keys(shoe.colors || {});
          return (
            <Card key={shoe.id}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div>
                  <div style={{ fontWeight:700, color:C.amber, fontSize:16 }}>{shoe.name}</div>
                  {shoe.brand && <div style={{ fontSize:12, color:C.muted }}>{shoe.brand}</div>}
                  <div style={{ fontSize:12, color:C.cyan, marginTop:2 }}>{shoe.category}</div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <Btn onClick={() => startEdit(shoe)} color="#374151" style={{ color:C.text, padding:'6px 10px' }}>Edit</Btn>
                  <Btn onClick={() => del(shoe.id)} color={C.red} style={{ padding:'6px 10px' }}>Del</Btn>
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:12, color:C.muted }}>Cost: {Rs(shoe.cost_price)}</span>
                <span style={{ fontSize:14, fontWeight:700 }}>{Rs(shoe.selling_price)}</span>
              </div>
              <div style={{ fontSize:11, color:C.muted, marginBottom:8 }}>Stock: {shoe.total_stock} pairs</div>
              {colorKeys.map(color => (
                <div key={color} style={{ marginBottom:8 }}>
                  {color && <div style={{ fontSize:12, color:C.cyan, fontWeight:600, marginBottom:4 }}>{color}</div>}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                    {SIZES.filter(sz => Number(shoe.colors[color]?.[sz]) > 0).map(sz => (
                      <span key={sz} style={{ padding:'2px 8px', background: Number(shoe.colors[color][sz]) <= 2 ? '#ef444422' : '#f59e0b22', color: Number(shoe.colors[color][sz]) <= 2 ? C.red : C.amber, borderRadius:4, fontSize:12, border:`1px solid ${Number(shoe.colors[color][sz]) <= 2 ? '#ef444444' : '#f59e0b44'}` }}>
                        {sz}: {shoe.colors[color][sz]}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {!colorKeys.length && <span style={{ fontSize:12, color:C.red }}>No stock</span>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Accessories Tab ───────────────────────────────────────────────────────────
function AccessoriesTab() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name:'', category:'General', cost_price:'', selling_price:'', stock:'', notes:'' });
  const [msg, setMsg] = useState('');

  const load = () => fetch('/api/accessories').then(r=>r.json()).then(setItems);
  useEffect(() => { load(); }, []);

  function startEdit(a) {
    setEditing(a.id); setAdding(false);
    setForm({ name:a.name, category:a.category||'General', cost_price:a.cost_price, selling_price:a.selling_price, stock:a.stock, notes:a.notes||'' });
  }

  async function save() {
    if (!form.name.trim()) return setMsg('Name required');
    const url = adding ? '/api/accessories' : `/api/accessories/${editing}`;
    const method = adding ? 'POST' : 'PUT';
    const r = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...form, cost_price: Number(form.cost_price)||0, selling_price: Number(form.selling_price)||0, stock: Number(form.stock)||0 }) });
    const data = await r.json();
    if (!r.ok) return setMsg(data.error || 'Error');
    setMsg(adding ? 'Added!' : 'Updated!'); setEditing(null); setAdding(false); load();
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ color:C.amber, fontSize:22 }}>Accessories</h2>
        <Btn onClick={() => { setAdding(true); setEditing(null); setForm({ name:'', category:'General', cost_price:'', selling_price:'', stock:'', notes:'' }); }}>+ Add</Btn>
      </div>

      {(adding || editing !== null) && (
        <Card style={{ marginBottom:20, border:`1px solid ${C.cyan}55` }}>
          <h3 style={{ color:C.cyan, marginBottom:16 }}>{adding ? 'New Accessory' : 'Edit Accessory'}</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Input label="Name *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
            <Sel label="Category" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
              {['Socks','Insoles','Cleaners','Laces','Bags','General'].map(c=><option key={c}>{c}</option>)}
            </Sel>
            <Input label="Cost Price" type="number" value={form.cost_price} onChange={e=>setForm(f=>({...f,cost_price:e.target.value}))} />
            <Input label="Selling Price" type="number" value={form.selling_price} onChange={e=>setForm(f=>({...f,selling_price:e.target.value}))} />
            <Input label="Stock" type="number" value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))} />
          </div>
          <Input label="Notes" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
          {msg && <p style={{ color: msg.includes('!') ? C.green : C.red, fontSize:13, marginBottom:8 }}>{msg}</p>}
          <div style={{ display:'flex', gap:8 }}>
            <Btn onClick={save} color={C.cyan}>Save</Btn>
            <Btn onClick={() => { setEditing(null); setAdding(false); }} color="#374151" style={{ color:C.text }}>Cancel</Btn>
          </div>
        </Card>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
        {items.map(a => (
          <Card key={a.id}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div>
                <div style={{ fontWeight:700, color:C.cyan }}>{a.name}</div>
                <div style={{ fontSize:12, color:C.muted }}>{a.category}</div>
              </div>
              <Btn onClick={() => startEdit(a)} color="#374151" style={{ color:C.text, padding:'4px 10px' }}>Edit</Btn>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:12, color:C.muted }}>Cost: {Rs(a.cost_price)}</span>
              <span style={{ fontWeight:700 }}>{Rs(a.selling_price)}</span>
            </div>
            <div style={{ fontSize:12, color: a.stock > 10 ? C.green : a.stock > 3 ? C.amber : C.red }}>Stock: {a.stock}</div>
            {a.notes && <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>{a.notes}</div>}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Credits Tab ───────────────────────────────────────────────────────────────
function CreditsTab() {
  const [credits, setCredits] = useState([]);
  const load = () => fetch('/api/credits').then(r=>r.json()).then(setCredits);
  useEffect(() => { load(); }, []);

  async function settle(id) {
    await fetch('/api/credits', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, status:'settled' }) });
    load();
  }

  const pending = credits.filter(c => c.status === 'pending');
  const settled = credits.filter(c => c.status === 'settled');
  const pendingTotal = pending.reduce((s,c) => s+Number(c.amount), 0);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ color:C.amber, fontSize:22 }}>Credits</h2>
        {pending.length > 0 && <span style={{ color:C.red, fontWeight:700 }}>{pending.length} pending · {Rs(pendingTotal)}</span>}
      </div>
      <h3 style={{ color:C.red, marginBottom:12 }}>Pending</h3>
      {!pending.length && <p style={{ color:C.muted, fontSize:13, marginBottom:20 }}>No pending credits</p>}
      {pending.map(c => (
        <Card key={c.id} style={{ marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontWeight:700 }}>{c.customer_name}</div>
            {c.description && <div style={{ fontSize:12, color:C.muted }}>{c.description}</div>}
            <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>{new Date(c.created_at).toLocaleString()}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ color:C.red, fontWeight:800, fontSize:18 }}>{Rs(c.amount)}</span>
            <Btn onClick={() => settle(c.id)} color={C.green}>Settle</Btn>
          </div>
        </Card>
      ))}
      {settled.length > 0 && (
        <>
          <h3 style={{ color:C.green, marginTop:20, marginBottom:12 }}>Settled</h3>
          {settled.slice(0,20).map(c => (
            <Card key={c.id} style={{ marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center', opacity:0.7 }}>
              <div>
                <div style={{ fontWeight:600 }}>{c.customer_name}</div>
                <div style={{ fontSize:11, color:C.muted }}>{new Date(c.settled_at).toLocaleString()}</div>
              </div>
              <span style={{ color:C.green, fontWeight:700 }}>{Rs(c.amount)}</span>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

// ── Expenses Tab ──────────────────────────────────────────────────────────────
function ExpensesTab() {
  const [expenses, setExpenses] = useState([]);
  const [date, setDate] = useState(new Date(Date.now() + 5*3600000 + 45*60000).toISOString().slice(0,10));
  const [form, setForm] = useState({ description:'', amount:'', payment_method:'Cash' });
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    fetch(`/api/expenses?date=${date}`).then(r=>r.json()).then(setExpenses);
  }, [date]);
  useEffect(() => { load(); }, [load]);

  async function add() {
    if (!form.description || !form.amount) return setMsg('Fill required fields');
    const r = await fetch('/api/expenses', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...form, amount: Number(form.amount), expense_date: date }) });
    if (!r.ok) return setMsg('Error');
    setMsg('Added!'); setForm({ description:'', amount:'', payment_method:'Cash' }); load();
  }

  async function del(id) {
    await fetch('/api/expenses', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
    load();
  }

  const total = expenses.reduce((s,e) => s+Number(e.amount), 0);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ color:C.amber, fontSize:22 }}>Expenses</h2>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ padding:'8px 12px', background:'#1f2937', border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:14 }} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:20 }}>
        <Card>
          <h3 style={{ color:C.amber, marginBottom:16 }}>Add Expense</h3>
          <Input label="Description *" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
          <Input label="Amount *" type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} />
          <Sel label="Payment Method" value={form.payment_method} onChange={e=>setForm(f=>({...f,payment_method:e.target.value}))}>
            {PAYMENT.map(p=><option key={p}>{p}</option>)}
          </Sel>
          {msg && <p style={{ color: msg.includes('!') ? C.green : C.red, fontSize:13, marginBottom:8 }}>{msg}</p>}
          <Btn onClick={add} style={{ width:'100%' }}>Add</Btn>
        </Card>
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <h3 style={{ color:C.amber }}>Expenses for {date}</h3>
            <span style={{ color:C.red, fontWeight:700 }}>Total: {Rs(total)}</span>
          </div>
          {expenses.map(e => (
            <Card key={e.id} style={{ marginBottom:8, padding:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:600 }}>{e.description}</div>
                <div style={{ fontSize:12, color:C.muted }}>{e.payment_method} · {e.added_by}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ color:C.red, fontWeight:700 }}>{Rs(e.amount)}</span>
                <button onClick={() => del(e.id)} style={{ background:'none', border:'none', color:C.red, cursor:'pointer', fontSize:18 }}>×</button>
              </div>
            </Card>
          ))}
          {!expenses.length && <p style={{ color:C.muted, fontSize:13 }}>No expenses for this date</p>}
        </div>
      </div>
    </div>
  );
}

// ── Cash Balance Tab ──────────────────────────────────────────────────────────
function CashBalanceTab() {
  const [data, setData] = useState(null);
  const [date, setDate] = useState(new Date(Date.now() + 5*3600000 + 45*60000).toISOString().slice(0,10));
  const [openingEdit, setOpeningEdit] = useState({});
  const [adjEdit, setAdjEdit] = useState({});
  const [msg, setMsg] = useState('');

  const METHODS = ['Cash','Bank','eSewa Pranis','eSewa Saharsh','eSewa Sulav'];

  useEffect(() => {
    fetch(`/api/cash-balance?date=${date}`).then(r=>r.json()).then(setData);
  }, [date]);

  async function saveOpening(m) {
    const r = await fetch('/api/cash-balance', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ date, payment_method:m, amount: openingEdit[m]||0 }) });
    if (r.ok) { setMsg('Saved!'); fetch(`/api/cash-balance?date=${date}`).then(r=>r.json()).then(setData); }
  }

  async function saveAdj(m) {
    const r = await fetch('/api/cash-balance', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ date, payment_method:m, adjustment: adjEdit[m]||0 }) });
    if (r.ok) { setMsg('Saved!'); fetch(`/api/cash-balance?date=${date}`).then(r=>r.json()).then(setData); }
  }

  if (!data) return <p style={{ color:C.muted }}>Loading…</p>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ color:C.amber, fontSize:22 }}>Cash Balance</h2>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ padding:'8px 12px', background:'#1f2937', border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:14 }} />
      </div>
      {msg && <p style={{ color:C.green, marginBottom:12 }}>{msg}</p>}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:20, marginBottom:24 }}>
        {METHODS.map(m => {
          const md = data.methods[m];
          return (
            <Card key={m}>
              <h4 style={{ color:C.cyan, marginBottom:12 }}>{m}</h4>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:11, color:C.muted }}>Opening</div>
                  <div style={{ fontWeight:700 }}>{Rs(md.opening)}</div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:C.muted }}>Inflows</div>
                  <div style={{ fontWeight:700, color:C.green }}>+{Rs(md.inflows)}</div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:C.muted }}>Outflows</div>
                  <div style={{ fontWeight:700, color:C.red }}>-{Rs(md.outflows)}</div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:C.muted }}>Adjustment</div>
                  <div style={{ fontWeight:700, color:C.purple }}>{md.adjustment >= 0 ? '+' : ''}{Rs(md.adjustment)}</div>
                </div>
              </div>
              <div style={{ background:'#1f2937', borderRadius:8, padding:'10px 14px', marginBottom:12 }}>
                <div style={{ fontSize:12, color:C.muted }}>Closing Balance</div>
                <div style={{ fontSize:22, fontWeight:800, color:C.amber }}>{Rs(md.balance)}</div>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
                <input type="number" placeholder="Set opening" value={openingEdit[m]??''} onChange={e=>setOpeningEdit(o=>({...o,[m]:e.target.value}))}
                  style={{ flex:1, padding:'7px 10px', background:'#1f2937', border:`1px solid ${C.border}`, borderRadius:6, color:C.text, fontSize:13, outline:'none' }} />
                <Btn onClick={() => saveOpening(m)} style={{ padding:'7px 12px', fontSize:12 }}>Set</Btn>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input type="number" placeholder="Adjustment" value={adjEdit[m]??''} onChange={e=>setAdjEdit(a=>({...a,[m]:e.target.value}))}
                  style={{ flex:1, padding:'7px 10px', background:'#1f2937', border:`1px solid ${C.border}`, borderRadius:6, color:C.text, fontSize:13, outline:'none' }} />
                <Btn onClick={() => saveAdj(m)} color={C.purple} style={{ padding:'7px 12px', fontSize:12 }}>Adj</Btn>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <h4 style={{ color:C.amber, marginBottom:12 }}>Last 30 Days</h4>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ color:C.muted }}>
                {['Date','Sales','Expenses','Supplier Payments'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'8px', borderBottom:`1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.history.map(h => (
                <tr key={h.date} style={{ borderBottom:`1px solid ${C.border}` }}>
                  <td style={{ padding:'8px', color:C.muted }}>{h.date}</td>
                  <td style={{ padding:'8px', color:C.green }}>{Rs(h.sales)}</td>
                  <td style={{ padding:'8px', color:C.red }}>{Rs(h.expenses)}</td>
                  <td style={{ padding:'8px', color:C.amber }}>{Rs(h.supplier_payments)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── Stock Costs Tab ───────────────────────────────────────────────────────────
function StockCostsTab() {
  const [tabs, setTabs] = useState([]);
  const [form, setForm] = useState({ shop_name:'', direction:'in', quantity:'', unit_cost:'', notes:'' });
  const [msg, setMsg] = useState('');

  const load = () => fetch('/api/shop-tabs').then(r=>r.json()).then(setTabs);
  useEffect(() => { load(); }, []);

  async function add() {
    if (!form.shop_name || !form.quantity) return setMsg('Fill required fields');
    const r = await fetch('/api/shop-tabs', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...form, quantity: Number(form.quantity), unit_cost: Number(form.unit_cost)||0 }) });
    if (!r.ok) return setMsg('Error');
    setMsg('Added!'); setForm({ shop_name:'', direction:'in', quantity:'', unit_cost:'', notes:'' }); load();
  }

  async function settle(id, settled) {
    await fetch('/api/shop-tabs', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, settled: !settled }) });
    load();
  }

  const pending = tabs.filter(t => !t.settled);
  const pendingTotal = pending.reduce((s,t) => s + Number(t.quantity)*Number(t.unit_cost), 0);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ color:C.amber, fontSize:22 }}>Stock Costs (Shop Tabs)</h2>
        {pending.length > 0 && <span style={{ color:C.red, fontWeight:700 }}>Pending: {Rs(pendingTotal)}</span>}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:20 }}>
        <Card>
          <h3 style={{ color:C.amber, marginBottom:16 }}>Add Tab</h3>
          <Input label="Shop Name *" value={form.shop_name} onChange={e=>setForm(f=>({...f,shop_name:e.target.value}))} />
          <Sel label="Direction" value={form.direction} onChange={e=>setForm(f=>({...f,direction:e.target.value}))}>
            <option value="in">Stock In (We owe)</option>
            <option value="out">Stock Out (They owe)</option>
          </Sel>
          <Input label="Quantity *" type="number" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:e.target.value}))} />
          <Input label="Unit Cost" type="number" value={form.unit_cost} onChange={e=>setForm(f=>({...f,unit_cost:e.target.value}))} />
          <Input label="Notes" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
          {msg && <p style={{ color: msg.includes('!') ? C.green : C.red, fontSize:13, marginBottom:8 }}>{msg}</p>}
          <Btn onClick={add} style={{ width:'100%' }}>Add Tab</Btn>
        </Card>
        <div>
          {tabs.map(t => (
            <Card key={t.id} style={{ marginBottom:8, padding:12, borderColor: t.settled ? '#10b98133' : '#ef444433' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <span style={{ fontWeight:700 }}>{t.shop_name}</span>
                  <span style={{ color:C.muted, fontSize:12, marginLeft:8 }}>{t.direction === 'in' ? 'Stock In' : 'Stock Out'}</span>
                  <span style={{ color:C.muted, fontSize:12, marginLeft:8 }}>×{t.quantity} @ {Rs(t.unit_cost)}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontWeight:700 }}>{Rs(Number(t.quantity)*Number(t.unit_cost))}</span>
                  <Btn onClick={() => settle(t.id, t.settled)} color={t.settled ? '#374151' : C.green} style={{ color: t.settled ? C.muted : '#fff', padding:'6px 12px' }}>
                    {t.settled ? 'Unsettle' : 'Settle'}
                  </Btn>
                </div>
              </div>
              {t.notes && <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>{t.notes}</div>}
              {t.settled && <div style={{ fontSize:11, color:C.green, marginTop:4 }}>Settled: {new Date(t.settled_at).toLocaleString()}</div>}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Edit History Tab ──────────────────────────────────────────────────────────
function EditHistoryTab() {
  const [history, setHistory] = useState([]);
  const [entityType, setEntityType] = useState('');

  useEffect(() => {
    const url = `/api/edit-history?limit=200${entityType ? `&entity_type=${entityType}` : ''}`;
    fetch(url).then(r=>r.json()).then(setHistory);
  }, [entityType]);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ color:C.amber, fontSize:22 }}>Edit History</h2>
        <Sel label="" value={entityType} onChange={e=>setEntityType(e.target.value)} style={{ marginBottom:0, width:'auto' }}>
          <option value="">All types</option>
          <option value="shoe">Shoes</option>
          <option value="accessory">Accessories</option>
          <option value="sale">Sales</option>
        </Sel>
      </div>
      {!history.length && <p style={{ color:C.muted }}>No edit history found</p>}
      {history.map(h => (
        <Card key={h.id} style={{ marginBottom:8, padding:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <span style={{ color:C.amber, fontWeight:700 }}>{h.entity_name}</span>
              <span style={{ color:C.muted, fontSize:12, marginLeft:8 }}>[{h.entity_type}]</span>
              <span style={{ color:C.cyan, fontSize:12, marginLeft:8 }}>{h.field_name}</span>
            </div>
            <div style={{ fontSize:11, color:C.muted }}>{new Date(h.changed_at).toLocaleString()}</div>
          </div>
          <div style={{ display:'flex', gap:12, marginTop:6, fontSize:13 }}>
            <span style={{ color:C.red }}>Before: {h.old_value}</span>
            <span style={{ color:C.muted }}>→</span>
            <span style={{ color:C.green }}>After: {h.new_value}</span>
          </div>
          <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>by {h.changed_by_name}</div>
        </Card>
      ))}
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username:'', password:'', role:'staff' });
  const [msg, setMsg] = useState('');

  const load = () => fetch('/api/auth/users').then(r=>r.json()).then(setUsers);
  useEffect(() => { load(); }, []);

  async function add() {
    if (!form.username || !form.password) return setMsg('Username and password required');
    const r = await fetch('/api/auth/users', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
    const data = await r.json();
    if (!r.ok) return setMsg(data.error || 'Error');
    setMsg('User created!'); setForm({ username:'', password:'', role:'staff' }); load();
  }

  async function del(id) {
    if (!confirm('Delete this user?')) return;
    await fetch('/api/auth/users', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
    load();
  }

  return (
    <div>
      <h2 style={{ color:C.amber, fontSize:22, marginBottom:20 }}>Staff Users</h2>
      <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:20 }}>
        <Card>
          <h3 style={{ color:C.amber, marginBottom:16 }}>Add User</h3>
          <Input label="Username *" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} />
          <Input label="Password *" type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} />
          <Sel label="Role" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
            <option value="staff">Staff</option>
            <option value="owner">Owner</option>
          </Sel>
          {msg && <p style={{ color: msg.includes('!') ? C.green : C.red, fontSize:13, marginBottom:8 }}>{msg}</p>}
          <Btn onClick={add} style={{ width:'100%' }}>Add User</Btn>
        </Card>
        <div>
          {users.map(u => (
            <Card key={u.id} style={{ marginBottom:8, padding:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <span style={{ fontWeight:700 }}>{u.username}</span>
                <span style={{ color: u.role === 'owner' ? C.amber : C.cyan, marginLeft:10, fontSize:12, padding:'2px 8px', background: u.role === 'owner' ? '#f59e0b22' : '#00d4ff22', borderRadius:4 }}>{u.role}</span>
              </div>
              {u.id !== currentUser.id && (
                <Btn onClick={() => del(u.id)} color={C.red} style={{ padding:'6px 12px' }}>Remove</Btn>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Supplier Pricing Tab ──────────────────────────────────────────────────────
function SupplierPricingTab({ onUnpricedCountChange }) {
  const [data, setData] = useState({ prices: [], unpriced: [], suppliers: [] });
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    fetch('/api/supplier-prices').then(r=>r.json()).then(d => {
      setData(d);
      if (onUnpricedCountChange) onUnpricedCountChange(d.unpriced.length);
    });
  }, [onUnpricedCountChange]);

  useEffect(() => { load(); }, [load]);

  const setField = (key, field, val) => setForm(f => ({...f, [key]: {...(f[key]||{}), [field]: val}}));

  async function saveNew(supplier_name, shoe_id) {
    const key = `${supplier_name}~${shoe_id}`;
    const { cost_price = 0, selling_price = 0 } = form[key] || {};
    const r = await fetch('/api/supplier-prices', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ supplier_name, shoe_id, cost_price: Number(cost_price), selling_price: Number(selling_price) }) });
    if (!r.ok) { const d = await r.json(); return setMsg(d.error || 'Error saving'); }
    setMsg('Saved!'); setTimeout(() => setMsg(''), 2000);
    setForm(f => { const c = {...f}; delete c[key]; return c; });
    load();
  }

  async function saveEdit() {
    const r = await fetch('/api/supplier-prices', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ supplier_name: editForm.supplier_name, shoe_id: editForm.shoe_id, cost_price: Number(editForm.cost_price)||0, selling_price: Number(editForm.selling_price)||0 }) });
    if (!r.ok) return setMsg('Error saving');
    setMsg('Updated!'); setTimeout(() => setMsg(''), 2000);
    setEditId(null); load();
  }

  async function del(id) {
    if (!confirm('Remove this supplier price?')) return;
    await fetch('/api/supplier-prices', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
    load();
  }

  const suppliers = Array.from(new Set(data.prices.map(p => p.supplier_name)));

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ color:C.amber, fontSize:22 }}>Supplier Pricing</h2>
        {msg && <span style={{ color: msg.includes('!') ? C.green : C.red, fontSize:13, fontWeight:600 }}>{msg}</span>}
      </div>

      {data.unpriced.length > 0 && (
        <Card style={{ marginBottom:24, borderColor:'#f59e0b55' }}>
          <h3 style={{ color:C.amber, marginBottom:4, fontSize:16 }}>Needs Pricing — {data.unpriced.length} combo{data.unpriced.length !== 1 ? 's' : ''}</h3>
          <p style={{ color:C.muted, fontSize:12, marginBottom:16 }}>Set cost & selling price once per shoe model per supplier. Applies to all sizes automatically.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {data.unpriced.map(u => {
              const key = `${u.supplier_name}~${u.shoe_id}`;
              const vals = form[key] || {};
              return (
                <div key={key} style={{ display:'grid', gridTemplateColumns:'1fr 150px 140px 140px auto', gap:10, alignItems:'center', padding:'10px 14px', background:'#1a2030', borderRadius:8, border:`1px solid #f59e0b33` }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14 }}>{u.shoe_name}</div>
                    <div style={{ fontSize:12, color:C.cyan }}>{u.supplier_name}</div>
                    {u.brand && <div style={{ fontSize:11, color:C.muted }}>{u.brand}</div>}
                  </div>
                  <div style={{ fontSize:12, color:C.muted }}>Cost &amp; Selling Price</div>
                  <input type="number" placeholder="Cost" value={vals.cost_price||''} onChange={e=>setField(key,'cost_price',e.target.value)}
                    style={{ padding:'8px 10px', background:'#111827', border:`1px solid ${C.border}`, borderRadius:6, color:C.text, fontSize:13, outline:'none', width:'100%' }} />
                  <input type="number" placeholder="Selling" value={vals.selling_price||''} onChange={e=>setField(key,'selling_price',e.target.value)}
                    style={{ padding:'8px 10px', background:'#111827', border:`1px solid ${C.border}`, borderRadius:6, color:C.text, fontSize:13, outline:'none', width:'100%' }} />
                  <Btn onClick={() => saveNew(u.supplier_name, u.shoe_id)} style={{ padding:'8px 16px', whiteSpace:'nowrap' }}>Set Price</Btn>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {data.unpriced.length === 0 && (
        <div style={{ color:C.green, marginBottom:20, fontSize:14 }}>All shoe-supplier combinations are priced.</div>
      )}

      <Card>
        <h3 style={{ color:C.amber, marginBottom:16, fontSize:16 }}>All Supplier Prices</h3>
        {!data.prices.length && <p style={{ color:C.muted, fontSize:13 }}>No prices set yet.</p>}
        {suppliers.map(supplier => (
          <div key={supplier} style={{ marginBottom:20 }}>
            <div style={{ color:C.cyan, fontWeight:700, fontSize:14, marginBottom:8, paddingBottom:6, borderBottom:`1px solid ${C.border}` }}>{supplier}</div>
            {data.prices.filter(p => p.supplier_name === supplier).map(p => (
              <div key={p.id} style={{ display:'grid', gridTemplateColumns:'1fr 180px 180px auto', gap:10, alignItems:'center', padding:'8px 12px', marginBottom:4, background:'#1f2937', borderRadius:6 }}>
                <div>
                  <span style={{ fontWeight:600 }}>{p.shoe_name}</span>
                  {p.brand && <span style={{ color:C.muted, fontSize:12, marginLeft:8 }}>{p.brand}</span>}
                </div>
                {editId === p.id ? (
                  <>
                    <input type="number" value={editForm.cost_price} onChange={e=>setEditForm(f=>({...f,cost_price:e.target.value}))}
                      placeholder="Cost" style={{ padding:'6px 8px', background:'#111827', border:`1px solid ${C.border}`, borderRadius:6, color:C.text, fontSize:13, outline:'none' }} />
                    <input type="number" value={editForm.selling_price} onChange={e=>setEditForm(f=>({...f,selling_price:e.target.value}))}
                      placeholder="Selling" style={{ padding:'6px 8px', background:'#111827', border:`1px solid ${C.border}`, borderRadius:6, color:C.text, fontSize:13, outline:'none' }} />
                    <div style={{ display:'flex', gap:6 }}>
                      <Btn onClick={saveEdit} color={C.green} style={{ padding:'6px 12px', color:'#fff' }}>Save</Btn>
                      <Btn onClick={() => setEditId(null)} color="#374151" style={{ padding:'6px 10px', color:C.text }}>✕</Btn>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize:13 }}>Cost: <span style={{ color:C.text, fontWeight:600 }}>{Rs(p.cost_price)}</span></div>
                    <div style={{ fontSize:13 }}>Sell: <span style={{ color:C.green, fontWeight:600 }}>{Rs(p.selling_price)}</span></div>
                    <div style={{ display:'flex', gap:6 }}>
                      <Btn onClick={() => { setEditId(p.id); setEditForm({ cost_price: p.cost_price, selling_price: p.selling_price, supplier_name: p.supplier_name, shoe_id: p.shoe_id }); }} color={C.cyan} style={{ padding:'6px 10px', color:'#000' }}>Edit</Btn>
                      <Btn onClick={() => del(p.id)} color={C.red} style={{ padding:'6px 10px' }}>Del</Btn>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Main Owner Page ───────────────────────────────────────────────────────────
export default function Owner() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [unpricedCount, setUnpricedCount] = useState(0);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(u => {
      if (!u) return router.replace('/');
      if (u.role !== 'owner') return router.replace('/staff');
      setUser(u);
    });
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method:'POST' });
    router.replace('/');
  }

  if (!user) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:C.muted }}>Loading…</div>;

  const tabs = [
    { id:'dashboard', label:'Dashboard' },
    { id:'analytics', label:'Analytics' },
    { id:'shoes', label:'Shoes' },
    { id:'accessories', label:'Accessories' },
    { id:'stock-costs', label:'Stock Costs' },
    { id:'supplier-pricing', label:'Supplier Pricing', badge: unpricedCount || null },
    { id:'credits', label:'Credits' },
    { id:'expenses', label:'Expenses' },
    { id:'cash-balance', label:'Cash Balance' },
    { id:'edit-history', label:'Edit History' },
    { id:'users', label:'Users' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:'0 24px', display:'flex', alignItems:'center', overflowX:'auto' }}>
        <div style={{ fontWeight:800, color:C.amber, fontSize:20, marginRight:20, padding:'16px 0', whiteSpace:'nowrap' }}>👟 JASS</div>
        <div style={{ display:'flex', gap:0, flex:1 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'16px 14px', background:'none', border:'none', color: tab===t.id ? C.amber : C.muted, borderBottom: tab===t.id ? `2px solid ${C.amber}` : '2px solid transparent', cursor:'pointer', fontWeight:600, fontSize:13, whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:4 }}>
              {t.label}
              {t.badge ? <span style={{ background:C.red, color:'#fff', borderRadius:10, fontSize:10, padding:'1px 6px', fontWeight:700 }}>{t.badge}</span> : null}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginLeft:12 }}>
          <span style={{ color:C.amber, fontSize:13 }}>Owner: {user.username}</span>
          <Btn onClick={logout} color="#374151" style={{ color:C.text }}>Logout</Btn>
        </div>
      </div>

      <div style={{ padding:24 }}>
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'analytics' && <AnalyticsTab />}
        {tab === 'shoes' && <ShoesTab />}
        {tab === 'accessories' && <AccessoriesTab />}
        {tab === 'stock-costs' && <StockCostsTab />}
        {tab === 'supplier-pricing' && <SupplierPricingTab onUnpricedCountChange={setUnpricedCount} />}
        {tab === 'credits' && <CreditsTab />}
        {tab === 'expenses' && <ExpensesTab />}
        {tab === 'cash-balance' && <CashBalanceTab />}
        {tab === 'edit-history' && <EditHistoryTab />}
        {tab === 'users' && <UsersTab currentUser={user} />}
      </div>
    </div>
  );
}
