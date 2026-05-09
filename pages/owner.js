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
const PAYMENT = ['Cash','eSewa','Bank Transfer','Fonepay'];

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
function DashboardTab() {
  const [data, setData] = useState(null);

  useEffect(() => { fetch('/api/dashboard').then(r=>r.json()).then(setData); }, []);
  if (!data) return <p style={{ color:C.muted }}>Loading…</p>;

  const { today, monthly, payments, topShoes, topAccessories, stockLow, pendingCredits } = data;

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
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState(null);
  const nowYM = new Date().toISOString().slice(0,7);
  const nowY = new Date().getFullYear().toString();
  const [month, setMonth] = useState(nowYM);
  const [year, setYear] = useState(nowY);

  useEffect(() => {
    const url = period === 'month' ? `/api/analytics?period=month&month=${month}` : `/api/analytics?period=year&year=${year}`;
    fetch(url).then(r=>r.json()).then(setData);
  }, [period, month, year]);

  if (!data) return <p style={{ color:C.muted }}>Loading…</p>;

  return (
    <div>
      <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:24 }}>
        <h2 style={{ color:C.amber, fontSize:22 }}>Analytics</h2>
        <div style={{ display:'flex', gap:8 }}>
          {['month','year'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ padding:'6px 16px', background: period===p ? C.amber : C.card, color: period===p ? '#000' : C.muted, border:`1px solid ${period===p ? C.amber : C.border}`, borderRadius:6, cursor:'pointer', fontWeight:600 }}>{p}</button>
          ))}
        </div>
        {period === 'month' && <input type="month" value={month} onChange={e=>setMonth(e.target.value)} style={{ padding:'6px 10px', background:'#1f2937', border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:14 }} />}
        {period === 'year' && <input type="number" value={year} onChange={e=>setYear(e.target.value)} min="2020" max="2035" style={{ padding:'6px 10px', background:'#1f2937', border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:14, width:100 }} />}
      </div>

      {period === 'month' && data.shoes && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
            <Card>
              <h4 style={{ color:C.amber, marginBottom:12 }}>Shoe Sales — {month}</h4>
              {data.shoes.map((s,i) => (
                <div key={i} style={{ borderBottom:`1px solid ${C.border}`, paddingBottom:8, marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontWeight:600 }}>{s.name}</span>
                    <span style={{ color:C.cyan }}>×{s.qty}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:C.muted, marginTop:2 }}>
                    <span>Revenue: {Rs(s.revenue)}</span>
                    <span style={{ color:C.green }}>Profit: {Rs(s.profit)}</span>
                  </div>
                </div>
              ))}
              {!data.shoes.length && <p style={{ color:C.muted, fontSize:13 }}>No shoe sales</p>}
            </Card>
            <Card>
              <h4 style={{ color:C.cyan, marginBottom:12 }}>Accessory Sales — {month}</h4>
              {data.accessories.map((a,i) => (
                <div key={i} style={{ borderBottom:`1px solid ${C.border}`, paddingBottom:8, marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontWeight:600 }}>{a.name}</span>
                    <span style={{ color:C.cyan }}>×{a.qty}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:C.muted, marginTop:2 }}>
                    <span>Revenue: {Rs(a.revenue)}</span>
                    <span style={{ color:C.green }}>Profit: {Rs(a.profit)}</span>
                  </div>
                </div>
              ))}
              {!data.accessories.length && <p style={{ color:C.muted, fontSize:13 }}>No accessory sales</p>}
            </Card>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            <Stat label="Total Expenses" value={Rs(data.expenses)} color={C.red} />
            <Stat label="Returns" value={Rs(data.returns?.revenue || 0)} color={C.red} />
          </div>
        </div>
      )}

      {period === 'year' && data.monthly && (
        <div>
          <Card style={{ marginBottom:20 }}>
            <h4 style={{ color:C.amber, marginBottom:12 }}>Monthly Revenue — {year}</h4>
            {data.monthly.map((m,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', borderBottom:`1px solid ${C.border}`, paddingBottom:8, marginBottom:8 }}>
                <span style={{ color:C.muted }}>{m.month}</span>
                <span>Revenue: {Rs(m.revenue)}</span>
                <span style={{ color:C.green }}>Profit: {Rs(m.profit)}</span>
                <span style={{ color:C.cyan }}>{m.sales} sales</span>
              </div>
            ))}
            {!data.monthly.length && <p style={{ color:C.muted, fontSize:13 }}>No data for {year}</p>}
          </Card>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <Card>
              <h4 style={{ color:C.amber, marginBottom:12 }}>Top Shoes — {year}</h4>
              {data.shoes.map((s,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ color:C.muted, flex:1 }}>{s.name}</span>
                  <span style={{ color:C.cyan, marginRight:8 }}>×{s.qty}</span>
                  <span style={{ fontWeight:700 }}>{Rs(s.revenue)}</span>
                </div>
              ))}
            </Card>
            <Card>
              <h4 style={{ color:C.cyan, marginBottom:12 }}>Top Accessories — {year}</h4>
              {data.accessories.map((a,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ color:C.muted, flex:1 }}>{a.name}</span>
                  <span style={{ color:C.cyan, marginRight:8 }}>×{a.qty}</span>
                  <span style={{ fontWeight:700 }}>{Rs(a.revenue)}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shoes Tab ─────────────────────────────────────────────────────────────────
function ShoesTab() {
  const [shoes, setShoes] = useState([]);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name:'', brand:'', category:'General', cost_price:'', selling_price:'', notes:'', sizes:{} });
  const [msg, setMsg] = useState('');

  const load = () => fetch('/api/shoes').then(r=>r.json()).then(setShoes);
  useEffect(() => { load(); }, []);

  function startEdit(shoe) {
    setEditing(shoe.id);
    setForm({ name: shoe.name, brand: shoe.brand||'', category: shoe.category||'General', cost_price: shoe.cost_price, selling_price: shoe.selling_price, notes: shoe.notes||'', sizes: { ...shoe.sizes } });
    setAdding(false);
  }

  function startAdd() {
    setAdding(true); setEditing(null);
    setForm({ name:'', brand:'', category:'General', cost_price:'', selling_price:'', notes:'', sizes:{} });
  }

  async function save() {
    if (!form.name.trim()) return setMsg('Name required');
    const url = adding ? '/api/shoes' : `/api/shoes/${editing}`;
    const method = adding ? 'POST' : 'PUT';
    const body = { ...form, cost_price: Number(form.cost_price)||0, selling_price: Number(form.selling_price)||0, sizes: Object.fromEntries(Object.entries(form.sizes).map(([k,v]) => [k, Number(v)||0])) };
    const r = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await r.json();
    if (!r.ok) return setMsg(data.error || 'Error');
    setMsg(adding ? 'Added!' : 'Updated!'); setEditing(null); setAdding(false);
    load();
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
            <Input label="Brand" value={form.brand} onChange={e=>setForm(f=>({...f,brand:e.target.value}))} />
            <Sel label="Category" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
              {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </Sel>
            <div />
            <Input label="Cost Price" type="number" value={form.cost_price} onChange={e=>setForm(f=>({...f,cost_price:e.target.value}))} />
            <Input label="Selling Price" type="number" value={form.selling_price} onChange={e=>setForm(f=>({...f,selling_price:e.target.value}))} />
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ display:'block', fontSize:11, color:C.muted, marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Sizes (quantity)</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {SIZES.map(sz => (
                <div key={sz} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:2 }}>{sz}</div>
                  <input type="number" min="0" value={form.sizes[sz]||''} onChange={e=>setForm(f=>({...f,sizes:{...f.sizes,[sz]:e.target.value}}))}
                    style={{ width:52, padding:'6px', background:'#1f2937', border:`1px solid ${C.border}`, borderRadius:6, color:C.text, fontSize:13, textAlign:'center', outline:'none' }} />
                </div>
              ))}
            </div>
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
        {shoes.map(shoe => (
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
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:12, color:C.muted }}>Cost: {Rs(shoe.cost_price)}</span>
              <span style={{ fontSize:14, fontWeight:700 }}>{Rs(shoe.selling_price)}</span>
            </div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:6 }}>Stock: {shoe.total_stock} pairs</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {SIZES.filter(sz => Number(shoe.sizes?.[sz]) > 0).map(sz => (
                <span key={sz} style={{ padding:'2px 8px', background: Number(shoe.sizes[sz]) <= 2 ? '#ef444422' : '#f59e0b22', color: Number(shoe.sizes[sz]) <= 2 ? C.red : C.amber, borderRadius:4, fontSize:12, border:`1px solid ${Number(shoe.sizes[sz]) <= 2 ? '#ef444444' : '#f59e0b44'}` }}>
                  {sz}: {shoe.sizes[sz]}
                </span>
              ))}
            </div>
          </Card>
        ))}
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
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
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
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [openingEdit, setOpeningEdit] = useState({});
  const [adjEdit, setAdjEdit] = useState({});
  const [msg, setMsg] = useState('');

  const METHODS = ['Cash','eSewa','Bank Transfer','Fonepay'];

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

// ── Main Owner Page ───────────────────────────────────────────────────────────
export default function Owner() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('dashboard');

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
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'16px 14px', background:'none', border:'none', color: tab===t.id ? C.amber : C.muted, borderBottom: tab===t.id ? `2px solid ${C.amber}` : '2px solid transparent', cursor:'pointer', fontWeight:600, fontSize:13, whiteSpace:'nowrap' }}>{t.label}</button>
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
        {tab === 'credits' && <CreditsTab />}
        {tab === 'expenses' && <ExpensesTab />}
        {tab === 'cash-balance' && <CashBalanceTab />}
        {tab === 'edit-history' && <EditHistoryTab />}
        {tab === 'users' && <UsersTab currentUser={user} />}
      </div>
    </div>
  );
}
