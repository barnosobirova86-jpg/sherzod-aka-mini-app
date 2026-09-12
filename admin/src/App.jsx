import { useState } from 'react';
import Login from './pages/Login.jsx';
import Orders from './pages/Orders.jsx';
import Products from './pages/Products.jsx';
import { getToken, clearToken } from './api.js';

export default function App() {
  const [authed, setAuthed] = useState(() => Boolean(getToken()));
  const [page, setPage] = useState('orders');

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />;
  }

  function logout() {
    clearToken();
    setAuthed(false);
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">🕋 Кисва Админ</div>

        <button
          className={`side-link ${page === 'orders' ? 'active' : ''}`}
          onClick={() => setPage('orders')}
        >
          📦 Буюртмалар
        </button>

        <button
          className={`side-link ${page === 'products' ? 'active' : ''}`}
          onClick={() => setPage('products')}
        >
          🛍 Маҳсулотлар
        </button>

        <button className="side-link side-logout" onClick={logout}>
          ⏻ Чиқиш
        </button>
      </aside>

      <main className="main">
        {page === 'orders' ? <Orders onExpire={logout} /> : <Products onExpire={logout} />}
      </main>
    </div>
  );
}
