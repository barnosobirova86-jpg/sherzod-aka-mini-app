import { useState } from 'react';
import { api, setToken } from '../api.js';

export default function Login({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.login(password);
      setToken(password);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">🕋</div>
        <h1>Kisva Shop — Admin</h1>
        <p style={{ color: 'var(--muted)', marginTop: 0 }}>Panelga kirish uchun parolni kiriting</p>

        {error && <div className="error">{error}</div>}

        <div className="field" style={{ marginTop: 16 }}>
          <input
            type="password"
            placeholder="Parol"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>

        <button className="btn btn-accent" style={{ width: '100%', marginTop: 14 }} disabled={loading}>
          {loading ? 'Tekshirilmoqda...' : 'Kirish'}
        </button>
      </form>
    </div>
  );
}
