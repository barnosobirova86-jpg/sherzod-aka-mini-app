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
        <div className="brand">🕋 Kisva Admin</div>

        <button
          className={`side-link ${page === 'orders' ? 'active' : ''}`}
          onClick={() => setPage('orders')}
        >
          📦 Buyurtmalar
        </button>

        <button
          className={`side-link ${page === 'products' ? 'active' : ''}`}
          onClick={() => setPage('products')}
        >
          🛍 Mahsulotlar
        </button>

        <button className="side-link side-logout" onClick={logout}>
          ⏻ Chiqish
        </button>
      </aside>

      <main className="main">
        {page === 'orders' ? <Orders onExpire={logout} /> : <Products onExpire={logout} />}
      </main>
    </div>
  );
}
