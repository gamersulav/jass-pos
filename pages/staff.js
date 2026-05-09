import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

const C = {
  bg: '#0a0a1a', card: '#111827', border: '#1f2937',
  amber: '#f59e0b', cyan: '#00d4ff', text: '#e2e8f0',
  muted: '#6b7280', green: '#10b981', red: '#ef4444',
};
const Rs = n => `Rs ${Number(n || 0).toLocaleString()}`;
const SIZES = [35,36,37,38,39,40,41,42,43,44,45];
const PAYMENT = ['Cash','eSewa','Bank Transfer','Fonepay','Credit'];

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

function Select({ label, value, onChange, children, style={} }) {
  return (
    <div style={{ marginBottom:12 }}>
      {label && <label style={{ display:'block', fontSize:11, color:C.muted, marginBottom:4, textTransform:'uppercase', letterSpacing:1 }}>{label}</label>}
      <select value={value} onChange={onChange} style={{ width:'100%', padding:'9px 12px', background:'#1f2937', border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:14, outline:'none', ...style }}>
        {children}
      </select>
    </div>
  );
}

// ── Sale Tab ─────────────────────────────────────────────────────────────────
function SaleTab({ user }) {
  const [shoes, setShoes] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [cart, setCart] = useState([]);
  const [payment, setPayment] = useState('Cash');
  const [discount, setDiscount] = useState('');
  const [creditCustomer, setCreditCustomer] = useState('');
  const [search, setSearch] = useState('');
  const [accSearch, setAccSearch] = useState('');
  const [selColor, setSelColor] = useState({});
  const [selSize, setSelSize] = useState({});
  const [activeTab, setActiveTab] = useState('shoes');
  const [msg, setMsg] = useState('');

  const reload = () => {
    fetch('/api/shoes').then(r=>r.json()).then(setShoes);
    fetch('/api/accessories').then(r=>r.json()).then(setAccessories);
  };
  useEffect(() => { reload(); }, []);

  function addShoe(shoe, color, size) {
    const qty = Number(shoe.colors?.[color]?.[size] || 0);
    if (!qty) return;
    const existing = cart.findIndex(c => c.shoe_id === shoe.id && c.shoe_color === color && c.shoe_size === size);
    if (existing >= 0) {
      if (cart[existing].quantity >= qty) return setMsg('Not enough stock');
      setCart(c => c.map((it,i) => i===existing ? {...it, quantity: it.quantity+1} : it));
    } else {
      const colorLabel = color ? ` [${color}]` : '';
      setCart(c => [...c, { item_type:'shoe', shoe_id:shoe.id, shoe_color:color, shoe_size:size, accessory_id:null, item_name:`${shoe.name}${shoe.brand?' - '+shoe.brand:''}${colorLabel} (sz ${size})`, quantity:1, unit_price: shoe.selling_price, cost_price: shoe.cost_price||0 }]);
    }
    setMsg('');
  }

  function addAcc(acc) {
    if (!acc.stock) return setMsg('Out of stock');
    const existing = cart.findIndex(c => c.accessory_id === acc.id);
    if (existing >= 0) {
      if (cart[existing].quantity >= acc.stock) return setMsg('Not enough stock');
      setCart(c => c.map((it,i) => i===existing ? {...it, quantity:it.quantity+1} : it));
    } else {
      setCart(c => [...c, { item_type:'accessory', shoe_id:null, shoe_color:'', shoe_size:null, accessory_id:acc.id, item_name:acc.name, quantity:1, unit_price:acc.selling_price, cost_price:acc.cost_price||0 }]);
    }
    setMsg('');
  }

  function removeItem(i) { setCart(c => c.filter((_,idx) => idx!==i)); }

  const subtotal = cart.reduce((s,it) => s + it.unit_price * it.quantity, 0);
  const disc = Math.min(Math.max(0, Number(discount)||0), subtotal);
  const total = subtotal - disc;

  async function checkout() {
    if (!cart.length) return setMsg('Cart is empty');
    if (payment === 'Credit' && !creditCustomer.trim()) return setMsg('Credit customer name required');
    const r = await fetch('/api/sales', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ payment, items: cart, discount: disc, creditCustomer }) });
    const data = await r.json();
    if (!r.ok) return setMsg(data.error || 'Error');
    setCart([]); setDiscount(''); setCreditCustomer(''); setSelColor({}); setSelSize({});
    setMsg(`Sale #${data.saleId} completed!`);
    reload();
  }

  const filteredShoes = shoes.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.brand?.toLowerCase().includes(search.toLowerCase()) || s.category?.toLowerCase().includes(search.toLowerCase()));
  const filteredAcc = accessories.filter(a => a.name.toLowerCase().includes(accSearch.toLowerCase()) || a.category?.toLowerCase().includes(accSearch.toLowerCase()));

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:20 }}>
      <div>
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {['shoes','accessories'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ padding:'8px 20px', background: activeTab===t ? C.amber : C.card, color: activeTab===t ? '#000' : C.muted, border:`1px solid ${activeTab===t ? C.amber : C.border}`, borderRadius:8, cursor:'pointer', fontWeight:600, textTransform:'capitalize' }}>{t}</button>
          ))}
        </div>

        {activeTab === 'shoes' && (
          <>
            <Input label="Search shoes" value={search} onChange={e=>setSearch(e.target.value)} style={{ marginBottom:16 }} />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))', gap:12 }}>
              {filteredShoes.map(shoe => {
                const availColors = Object.keys(shoe.colors || {}).filter(c => Object.values(shoe.colors[c]).some(q => Number(q) > 0));
                const curColor = selColor[shoe.id] || '';
                const sizesForColor = shoe.colors?.[curColor] || {};
                return (
                  <Card key={shoe.id}>
                    <div style={{ fontWeight:700, color:C.amber, marginBottom:2 }}>{shoe.name}</div>
                    {shoe.brand && <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>{shoe.brand} · {shoe.category}</div>}
                    <div style={{ fontWeight:700, marginBottom:8 }}>{Rs(shoe.selling_price)}</div>
                    {availColors.length > 1 && (
                      <Select label="Color" value={curColor} onChange={e => { setSelColor(s=>({...s,[shoe.id]:e.target.value})); setSelSize(s=>({...s,[shoe.id]:''})); }}>
                        <option value="">Pick color</option>
                        {availColors.map(c => <option key={c} value={c}>{c || 'No color'}</option>)}
                      </Select>
                    )}
                    <Select label="Size" value={selSize[shoe.id]||''} onChange={e => setSelSize(s => ({...s,[shoe.id]:e.target.value}))}>
                      <option value="">Pick size</option>
                      {SIZES.filter(sz => Number(sizesForColor[sz]) > 0).map(sz => (
                        <option key={sz} value={sz}>Size {sz} ({sizesForColor[sz]} left)</option>
                      ))}
                    </Select>
                    <Btn onClick={() => addShoe(shoe, curColor, Number(selSize[shoe.id]))} disabled={!selSize[shoe.id] || (availColors.length > 1 && !curColor)} style={{ width:'100%' }}>Add to Cart</Btn>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'accessories' && (
          <>
            <Input label="Search accessories" value={accSearch} onChange={e=>setAccSearch(e.target.value)} style={{ marginBottom:16 }} />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
              {filteredAcc.map(acc => (
                <Card key={acc.id}>
                  <div style={{ fontWeight:700, color:C.cyan, marginBottom:2 }}>{acc.name}</div>
                  <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>{acc.category}</div>
                  <div style={{ fontWeight:700, marginBottom:4 }}>{Rs(acc.selling_price)}</div>
                  <div style={{ fontSize:12, color: acc.stock > 5 ? C.green : acc.stock > 0 ? C.amber : C.red, marginBottom:8 }}>Stock: {acc.stock}</div>
                  <Btn onClick={() => addAcc(acc)} disabled={!acc.stock} style={{ width:'100%' }} color={C.cyan}>Add</Btn>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      <Card>
        <h3 style={{ color:C.amber, marginBottom:16, fontSize:18 }}>Cart</h3>
        {!cart.length && <p style={{ color:C.muted, fontSize:13 }}>No items yet</p>}
        {cart.map((it,i) => (
          <div key={i} style={{ borderBottom:`1px solid ${C.border}`, paddingBottom:10, marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ fontSize:13, flex:1 }}>{it.item_name}</div>
              <button onClick={() => removeItem(i)} style={{ background:'none', border:'none', color:C.red, cursor:'pointer', fontSize:16, padding:'0 4px' }}>×</button>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
              <button onClick={() => setCart(c => c.map((x,j) => j===i ? {...x,quantity:Math.max(1,x.quantity-1)}:x))} style={{ width:24,height:24,background:C.border,border:'none',borderRadius:4,color:C.text,cursor:'pointer' }}>-</button>
              <span style={{ fontSize:13 }}>{it.quantity}</span>
              <button onClick={() => setCart(c => c.map((x,j) => j===i ? {...x,quantity:x.quantity+1}:x))} style={{ width:24,height:24,background:C.border,border:'none',borderRadius:4,color:C.text,cursor:'pointer' }}>+</button>
              <span style={{ marginLeft:'auto', fontWeight:700 }}>{Rs(it.unit_price * it.quantity)}</span>
            </div>
          </div>
        ))}

        <div style={{ marginTop:16 }}>
          <Input label="Discount (Rs)" type="number" value={discount} onChange={e=>setDiscount(e.target.value)} />
          <Select label="Payment" value={payment} onChange={e=>setPayment(e.target.value)}>
            {PAYMENT.map(p => <option key={p}>{p}</option>)}
          </Select>
          {payment === 'Credit' && <Input label="Customer Name" value={creditCustomer} onChange={e=>setCreditCustomer(e.target.value)} />}

          <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:12, marginTop:4 }}>
            {disc > 0 && <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:C.muted, marginBottom:4 }}><span>Discount</span><span style={{ color:C.red }}>- {Rs(disc)}</span></div>}
            <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700, fontSize:20, color:C.amber }}>
              <span>Total</span><span>{Rs(total)}</span>
            </div>
          </div>

          {msg && <p style={{ color: msg.includes('!') ? C.green : C.red, fontSize:13, marginTop:8 }}>{msg}</p>}
          <Btn onClick={checkout} style={{ width:'100%', padding:'12px', fontSize:15, marginTop:12 }}>Complete Sale</Btn>
        </div>
      </Card>
    </div>
  );
}

// ── Stock Tab ─────────────────────────────────────────────────────────────────
function StockTab() {
  const [shoes, setShoes] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ item_type:'shoe', shoe_id:'', accessory_id:'', color:'', size:'', quantity:'', notes:'' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/shoes').then(r=>r.json()).then(setShoes);
    fetch('/api/accessories').then(r=>r.json()).then(setAccessories);
    fetch('/api/stock').then(r=>r.json()).then(setEntries);
  }, []);

  async function addStock() {
    if (!form.quantity || Number(form.quantity) <= 0) return setMsg('Enter valid quantity');
    const shoe = form.item_type === 'shoe' ? shoes.find(s => s.id === Number(form.shoe_id)) : null;
    const acc = form.item_type === 'accessory' ? accessories.find(a => a.id === Number(form.accessory_id)) : null;
    const item_name = shoe ? shoe.name : acc ? acc.name : '';
    if (!item_name) return setMsg('Select an item');
    if (form.item_type === 'shoe' && !form.size) return setMsg('Select a size');

    const r = await fetch('/api/stock', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ...form, shoe_id: form.shoe_id ? Number(form.shoe_id) : null, accessory_id: form.accessory_id ? Number(form.accessory_id) : null, color: form.color || '', size: form.size ? Number(form.size) : null, quantity: Number(form.quantity), item_name, direction:'in' }) });
    const data = await r.json();
    if (!r.ok) return setMsg(data.error || 'Error');
    setMsg('Stock added!');
    setForm(f => ({ ...f, quantity:'', notes:'' }));
    fetch('/api/stock').then(r=>r.json()).then(setEntries);
    fetch('/api/shoes').then(r=>r.json()).then(setShoes);
    fetch('/api/accessories').then(r=>r.json()).then(setAccessories);
  }

  const selShoe = shoes.find(s => s.id === Number(form.shoe_id));
  const curColorStock = selShoe?.colors?.[form.color] || {};

  return (
    <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:20 }}>
      <Card>
        <h3 style={{ color:C.amber, marginBottom:16 }}>Add Stock</h3>
        <Select label="Type" value={form.item_type} onChange={e=>setForm(f=>({...f,item_type:e.target.value,shoe_id:'',accessory_id:'',color:'',size:''}))}>
          <option value="shoe">Shoe</option>
          <option value="accessory">Accessory</option>
        </Select>
        {form.item_type === 'shoe' ? (
          <>
            <Select label="Shoe" value={form.shoe_id} onChange={e=>setForm(f=>({...f,shoe_id:e.target.value,color:'',size:''}))}>
              <option value="">Select shoe</option>
              {shoes.map(s => <option key={s.id} value={s.id}>{s.name}{s.brand ? ` - ${s.brand}` : ''}</option>)}
            </Select>
            <Input label="Color (optional)" value={form.color} onChange={e=>setForm(f=>({...f,color:e.target.value,size:''}))} placeholder="e.g. Red, Black, White" />
            <Select label="Size" value={form.size} onChange={e=>setForm(f=>({...f,size:e.target.value}))}>
              <option value="">Select size</option>
              {SIZES.map(sz => <option key={sz} value={sz}>Size {sz}{curColorStock[sz] ? ` (${curColorStock[sz]} in stock)` : ''}</option>)}
            </Select>
          </>
        ) : (
          <Select label="Accessory" value={form.accessory_id} onChange={e=>setForm(f=>({...f,accessory_id:e.target.value}))}>
            <option value="">Select accessory</option>
            {accessories.map(a => <option key={a.id} value={a.id}>{a.name} (stock: {a.stock})</option>)}
          </Select>
        )}
        <Input label="Quantity" type="number" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:e.target.value}))} />
        <Input label="Notes" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
        {msg && <p style={{ color: msg.includes('!') ? C.green : C.red, fontSize:13, marginBottom:8 }}>{msg}</p>}
        <Btn onClick={addStock} style={{ width:'100%' }}>Add Stock</Btn>
      </Card>

      <div>
        <h3 style={{ color:C.amber, marginBottom:12 }}>Recent Stock Entries</h3>
        {entries.map(e => (
          <Card key={e.id} style={{ marginBottom:8, padding:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <div>
                <span style={{ fontWeight:600 }}>{e.item_name}</span>
                {e.color && <span style={{ color:C.cyan, fontSize:12, marginLeft:8 }}>{e.color}</span>}
                {e.size && <span style={{ color:C.muted, fontSize:12, marginLeft:8 }}>sz {e.size}</span>}
              </div>
              <span style={{ color:C.green, fontWeight:700 }}>+{e.quantity}</span>
            </div>
            {e.notes && <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{e.notes}</div>}
            <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>{e.added_by_name} · {new Date(e.created_at).toLocaleString()}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Returns Tab ──────────────────────────────────────────────────────────────
function ReturnsTab() {
  const [returns, setReturns] = useState([]);
  const [form, setForm] = useState({ sale_id:'', item_name:'', quantity:'1', return_amount:'', return_profit:'', reason:'' });
  const [msg, setMsg] = useState('');

  useEffect(() => { fetch('/api/returns').then(r=>r.json()).then(setReturns); }, []);

  async function submit() {
    if (!form.item_name || !form.return_amount) return setMsg('Fill required fields');
    const r = await fetch('/api/returns', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ...form, quantity: Number(form.quantity), return_amount: Number(form.return_amount), return_profit: Number(form.return_profit)||0, sale_id: form.sale_id ? Number(form.sale_id) : null }) });
    const data = await r.json();
    if (!r.ok) return setMsg(data.error || 'Error');
    setMsg('Return recorded!');
    setForm({ sale_id:'', item_name:'', quantity:'1', return_amount:'', return_profit:'', reason:'' });
    fetch('/api/returns').then(r=>r.json()).then(setReturns);
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:20 }}>
      <Card>
        <h3 style={{ color:C.amber, marginBottom:16 }}>Record Return</h3>
        <Input label="Sale ID (optional)" value={form.sale_id} onChange={e=>setForm(f=>({...f,sale_id:e.target.value}))} />
        <Input label="Item Name *" value={form.item_name} onChange={e=>setForm(f=>({...f,item_name:e.target.value}))} />
        <Input label="Quantity" type="number" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:e.target.value}))} />
        <Input label="Return Amount *" type="number" value={form.return_amount} onChange={e=>setForm(f=>({...f,return_amount:e.target.value}))} />
        <Input label="Return Profit" type="number" value={form.return_profit} onChange={e=>setForm(f=>({...f,return_profit:e.target.value}))} />
        <Input label="Reason" value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} />
        {msg && <p style={{ color: msg.includes('!') ? C.green : C.red, fontSize:13, marginBottom:8 }}>{msg}</p>}
        <Btn onClick={submit} style={{ width:'100%' }}>Record Return</Btn>
      </Card>
      <div>
        <h3 style={{ color:C.amber, marginBottom:12 }}>Recent Returns</h3>
        {returns.map(r => (
          <Card key={r.id} style={{ marginBottom:8, padding:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontWeight:600 }}>{r.item_name} ×{r.quantity}</span>
              <span style={{ color:C.red, fontWeight:700 }}>- {Rs(r.return_amount)}</span>
            </div>
            {r.reason && <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{r.reason}</div>}
            <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>{r.returned_by_name} · {new Date(r.created_at).toLocaleString()}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Expenses Tab ─────────────────────────────────────────────────────────────
function ExpensesTab() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ description:'', amount:'', payment_method:'Cash' });
  const [msg, setMsg] = useState('');

  useEffect(() => { fetch('/api/expenses').then(r=>r.json()).then(setExpenses); }, []);

  async function add() {
    if (!form.description || !form.amount) return setMsg('Fill required fields');
    const r = await fetch('/api/expenses', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...form, amount: Number(form.amount) }) });
    const data = await r.json();
    if (!r.ok) return setMsg(data.error || 'Error');
    setMsg('Added!'); setForm({ description:'', amount:'', payment_method:'Cash' });
    fetch('/api/expenses').then(r=>r.json()).then(setExpenses);
  }

  const total = expenses.reduce((s,e) => s+Number(e.amount),0);
  return (
    <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:20 }}>
      <Card>
        <h3 style={{ color:C.amber, marginBottom:16 }}>Add Expense</h3>
        <Input label="Description *" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
        <Input label="Amount *" type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} />
        <Select label="Payment Method" value={form.payment_method} onChange={e=>setForm(f=>({...f,payment_method:e.target.value}))}>
          {['Cash','eSewa','Bank Transfer','Fonepay'].map(p=><option key={p}>{p}</option>)}
        </Select>
        {msg && <p style={{ color: msg.includes('!') ? C.green : C.red, fontSize:13, marginBottom:8 }}>{msg}</p>}
        <Btn onClick={add} style={{ width:'100%' }}>Add Expense</Btn>
      </Card>
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h3 style={{ color:C.amber }}>Today's Expenses</h3>
          <span style={{ color:C.red, fontWeight:700, fontSize:18 }}>Total: {Rs(total)}</span>
        </div>
        {expenses.map(e => (
          <Card key={e.id} style={{ marginBottom:8, padding:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontWeight:600 }}>{e.description}</span>
              <span style={{ color:C.red, fontWeight:700 }}>- {Rs(e.amount)}</span>
            </div>
            <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{e.payment_method} · {e.added_by}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Credits Tab ──────────────────────────────────────────────────────────────
function CreditsTab() {
  const [credits, setCredits] = useState([]);

  useEffect(() => { fetch('/api/credits').then(r=>r.json()).then(setCredits); }, []);

  const pending = credits.filter(c => c.status === 'pending');
  const settled = credits.filter(c => c.status === 'settled');
  const pendingTotal = pending.reduce((s,c) => s+Number(c.amount), 0);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h3 style={{ color:C.amber }}>Credit Sales</h3>
        {pending.length > 0 && <span style={{ color:C.red, fontWeight:700 }}>{pending.length} pending · {Rs(pendingTotal)}</span>}
      </div>
      <h4 style={{ color:C.red, marginBottom:8 }}>Pending</h4>
      {!pending.length && <p style={{ color:C.muted, fontSize:13, marginBottom:16 }}>No pending credits</p>}
      {pending.map(c => (
        <Card key={c.id} style={{ marginBottom:8, padding:12, borderColor:'#ef444433' }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontWeight:700 }}>{c.customer_name}</span>
            <span style={{ color:C.red, fontWeight:700 }}>{Rs(c.amount)}</span>
          </div>
          {c.description && <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{c.description}</div>}
          <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>{new Date(c.created_at).toLocaleString()}</div>
        </Card>
      ))}
      {settled.length > 0 && (
        <>
          <h4 style={{ color:C.green, marginTop:16, marginBottom:8 }}>Settled</h4>
          {settled.slice(0,10).map(c => (
            <Card key={c.id} style={{ marginBottom:8, padding:12, borderColor:'#10b98133' }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontWeight:600 }}>{c.customer_name}</span>
                <span style={{ color:C.green, fontWeight:700 }}>{Rs(c.amount)}</span>
              </div>
              <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>{new Date(c.settled_at).toLocaleString()}</div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

// ── Shoes Tab (staff) ─────────────────────────────────────────────────────────
const SHOE_CATEGORIES = ['Sports','Classic','Casual','Formal','Running','Kids','General'];

function ShoesTab() {
  const [shoes, setShoes] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name:'', brand:'', category:'General', selling_price:'', notes:'' });
  const [variants, setVariants] = useState([{ color:'', size:'', qty:'' }]);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');

  const load = () => fetch('/api/shoes').then(r=>r.json()).then(setShoes);
  useEffect(() => { load(); }, []);

  function updateVariant(i, field, val) { setVariants(v => v.map((r,j) => j===i ? {...r,[field]:val} : r)); }
  function addVariantRow() { setVariants(v => [...v, { color:'', size:'', qty:'' }]); }
  function removeVariantRow(i) { setVariants(v => v.filter((_,j) => j!==i)); }

  async function save() {
    if (!form.name.trim()) return setMsg('Name required');
    const validVariants = variants.filter(v => v.size && Number(v.qty) > 0).map(v => ({ color: v.color||'', size: Number(v.size), qty: Number(v.qty) }));
    const body = { ...form, selling_price: Number(form.selling_price)||0, variants: validVariants };
    const r = await fetch('/api/shoes', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await r.json();
    if (!r.ok) return setMsg(data.error || 'Error');
    setMsg('Added!'); setAdding(false); setForm({ name:'', brand:'', category:'General', selling_price:'', notes:'' }); setVariants([{ color:'', size:'', qty:'' }]); load();
  }

  const filtered = shoes.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.brand?.toLowerCase().includes(search.toLowerCase()) || s.category?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ color:C.amber, fontSize:22 }}>Shoes</h2>
        <Btn onClick={() => { setAdding(a => !a); setMsg(''); }}>+ Add Shoe</Btn>
      </div>

      {adding && (
        <Card style={{ marginBottom:20, border:`1px solid ${C.amber}55` }}>
          <h3 style={{ color:C.amber, marginBottom:16 }}>New Shoe</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Input label="Name *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
            <Input label="Brand" value={form.brand} onChange={e=>setForm(f=>({...f,brand:e.target.value}))} />
            <Select label="Category" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
              {SHOE_CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </Select>
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
            <Btn onClick={() => { setAdding(false); setMsg(''); }} color="#374151" style={{ color:C.text }}>Cancel</Btn>
          </div>
        </Card>
      )}

      <Input label="Search" value={search} onChange={e=>setSearch(e.target.value)} style={{ maxWidth:320, marginBottom:16 }} />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
        {filtered.map(shoe => {
          const colorKeys = Object.keys(shoe.colors || {});
          return (
            <Card key={shoe.id}>
              <div style={{ fontWeight:700, color:C.amber, fontSize:15, marginBottom:2 }}>{shoe.name}</div>
              {shoe.brand && <div style={{ fontSize:12, color:C.muted, marginBottom:2 }}>{shoe.brand}</div>}
              <div style={{ fontSize:12, color:C.cyan, marginBottom:6 }}>{shoe.category}</div>
              <div style={{ fontWeight:700, fontSize:16, marginBottom:8 }}>{Rs(shoe.selling_price)}</div>
              <div style={{ fontSize:11, color:C.muted, marginBottom:8 }}>Total stock: {shoe.total_stock} pairs</div>
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
              {!colorKeys.length && <span style={{ fontSize:12, color:C.red }}>Out of stock</span>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Staff() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('sale');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(u => {
      if (!u) return router.replace('/');
      if (u.role === 'owner') return router.replace('/owner');
      setUser(u);
    });
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method:'POST' });
    router.replace('/');
  }

  if (!user) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:C.muted }}>Loading…</div>;

  const tabs = [
    { id:'sale', label:'Sale' },
    { id:'shoes', label:'Shoes' },
    { id:'stock', label:'Stock' },
    { id:'returns', label:'Returns' },
    { id:'expenses', label:'Expenses' },
    { id:'credits', label:'Credits' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:'0 24px', display:'flex', alignItems:'center', gap:0 }}>
        <div style={{ fontWeight:800, color:C.amber, fontSize:20, marginRight:24, padding:'16px 0' }}>👟 JASS</div>
        <div style={{ display:'flex', gap:4, flex:1 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'16px 18px', background:'none', border:'none', color: tab===t.id ? C.amber : C.muted, borderBottom: tab===t.id ? `2px solid ${C.amber}` : '2px solid transparent', cursor:'pointer', fontWeight:600, fontSize:14 }}>{t.label}</button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ color:C.muted, fontSize:13 }}>{user.username}</span>
          <Btn onClick={logout} color="#374151" style={{ color:C.text }}>Logout</Btn>
        </div>
      </div>

      <div style={{ padding:24 }}>
        {tab === 'sale' && <SaleTab user={user} />}
        {tab === 'shoes' && <ShoesTab />}
        {tab === 'stock' && <StockTab />}
        {tab === 'returns' && <ReturnsTab />}
        {tab === 'expenses' && <ExpensesTab />}
        {tab === 'credits' && <CreditsTab />}
      </div>
    </div>
  );
}
