import { useState } from 'react';
import Orders from './pages/Orders.jsx';
import Products from './pages/Products.jsx';

export default function App() {
  const [page, setPage] = useState('orders');

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
      </aside>

      <main className="main">{page === 'orders' ? <Orders /> : <Products />}</main>
    </div>
  );
}
