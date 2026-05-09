import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(u => {
      if (u) router.replace(u.role === 'owner' ? '/owner' : '/staff');
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await r.json();
    setLoading(false);
    if (!r.ok) return setError(data.error || 'Login failed');
    router.replace(data.role === 'owner' ? '/owner' : '/staff');
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a0a1a' }}>
      <div style={{ width:360, background:'#111827', borderRadius:16, padding:40, border:'1px solid #f59e0b33' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>👟</div>
          <h1 style={{ fontSize:28, fontWeight:800, color:'#f59e0b', letterSpacing:2 }}>JASS</h1>
          <p style={{ color:'#6b7280', fontSize:13, marginTop:4 }}>Just Another Shoe Shop</p>
        </div>
        <form onSubmit={handleSubmit}>
          {['username','password'].map(field => (
            <div key={field} style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:6, textTransform:'uppercase', letterSpacing:1 }}>{field}</label>
              <input
                type={field === 'password' ? 'password' : 'text'}
                value={form[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                required
                style={{ width:'100%', padding:'10px 14px', background:'#1f2937', border:'1px solid #374151', borderRadius:8, color:'#e2e8f0', fontSize:15, outline:'none' }}
              />
            </div>
          ))}
          {error && <p style={{ color:'#ef4444', fontSize:13, marginBottom:12 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ width:'100%', padding:'12px', background:'#f59e0b', color:'#000', fontWeight:700, fontSize:16, border:'none', borderRadius:8, cursor:'pointer', marginTop:8 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
