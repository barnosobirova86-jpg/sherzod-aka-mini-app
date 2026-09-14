import { useEffect, useState } from 'react';
import Banner from '../components/Banner.jsx';
import ContactButton from '../components/ContactButton.jsx';
import CategoryRibbon from '../components/CategoryRibbon.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { CATEGORIES } from '../categories.js';
import { api } from '../api.js';

export default function Home({ user, onOpenProduct }) {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].name);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .products(activeCategory)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  const name = user?.firstName || 'Меҳмон';
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Меҳмон';

  return (
    <div className="page">
      <div className="header">
        <div>
          <h1 className="title">{name} ака, хуш келибсиз!</h1>
          <p className="subtitle">Ассалому алайкум 🕋</p>
        </div>
        <div className="avatar" title={fullName}>
          {name.charAt(0).toUpperCase()}
        </div>
      </div>

      <Banner />

      <ContactButton />

      <CategoryRibbon active={activeCategory} onSelect={setActiveCategory} />

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
