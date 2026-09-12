import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import { CATEGORIES } from '../categories.js';
import { api } from '../api.js';
import { haptic } from '../telegram.js';

export default function Catalog({ initialCategory, onOpenProduct }) {
  const [active, setActive] = useState(initialCategory || 'all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <h1 className="title">Каталог</h1>
      <p className="subtitle">Барча маҳсулотларимиз</p>

      <div className="chips" style={{ marginTop: 16 }}>
        <button
          className={`chip ${active === 'all' ? 'active' : ''}`}
          onClick={() => {
            haptic('light');
            setActive('all');
          }}
        >
          Ҳаммаси
        </button>
        {CATEGORIES.map((category) => (
          <button
            key={category.name}
            className={`chip ${active === category.name ? 'active' : ''}`}
            onClick={() => {
              haptic('light');
              setActive(category.name);
            }}
          >
            {category.icon} {category.name}
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
          Бу категорияда маҳсулот йўқ
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
