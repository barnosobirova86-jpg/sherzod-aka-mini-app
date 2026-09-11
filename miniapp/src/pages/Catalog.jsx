import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import { api } from '../api.js';
import { haptic } from '../telegram.js';

export default function Catalog({ onOpenProduct }) {
  const [categories, setCategories] = useState([]);
  const [active, setActive] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .products(active)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [active]);

  return (
    <div className="page">
      <h1 className="title">Katalog</h1>
      <p className="subtitle">Barcha mahsulotlarimiz</p>

      <div className="chips" style={{ marginTop: 16 }}>
        <button
          className={`chip ${active === 'all' ? 'active' : ''}`}
          onClick={() => {
            haptic('light');
            setActive('all');
          }}
        >
          Hammasi
        </button>
        {categories.map((category) => (
          <button
            key={category}
            className={`chip ${active === category ? 'active' : ''}`}
            onClick={() => {
              haptic('light');
              setActive(category);
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loader">
          <div className="spinner" />
        </div>
      ) : products.length === 0 ? (
        <div className="empty">
          <div className="empty-emoji">📦</div>
          Bu kategoriyada mahsulot yo‘q
        </div>
      ) : (
        <div className="grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onOpen={onOpenProduct} />
          ))}
        </div>
      )}
    </div>
  );
}
