import { useState } from 'react';
import Orders from './pages/Orders.jsx';
import Products from './pages/Products.jsx';

export default function App() {
  const [page, setPage] = useState('orders');

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
      </aside>

      <main className="main">{page === 'orders' ? <Orders /> : <Products />}</main>
    </div>
  );
}
