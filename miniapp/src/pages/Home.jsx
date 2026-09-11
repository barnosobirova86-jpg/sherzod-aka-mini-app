import { useEffect, useState } from 'react';
import Stories from '../components/Stories.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { api } from '../api.js';
import { haptic } from '../telegram.js';

export default function Home({ user, onNavigate, onOpenProduct }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .products()
      .then((data) => setProducts(data.slice(0, 4)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const name = user?.firstName || 'Mehmon';
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Mehmon';

  return (
    <div className="page">
      <div className="header">
        <div>
          <h1 className="title">{name} aka, xush kelibsiz!</h1>
          <p className="subtitle">Assalomu alaykum 🕋</p>
        </div>
        <div className="avatar" title={fullName}>
          {name.charAt(0).toUpperCase()}
        </div>
      </div>

      <Stories />

      <div className="hero">
        <div className="hero-emoji">🛍</div>
        <h2>Yangi buyurtma berish</h2>
        <p>Ka'ba kisvasidan asl bo'laklar — sertifikat bilan</p>
        <button
          className="hero-btn"
          onClick={() => {
            haptic('medium');
            onNavigate('catalog');
          }}
        >
          Katalogni ochish
        </button>
      </div>

      <div className="info-row">
        <div className="info-card">
          <b>🚚 1 kun</b>
          <span>Toshkent bo‘ylab</span>
        </div>
        <div className="info-card">
          <b>✅ Kafolat</b>
          <span>Almashtirish</span>
        </div>
        <div className="info-card">
          <b>🕋 Asl</b>
          <span>Sertifikatli</span>
        </div>
      </div>

      <div className="section-title">Ommabop mahsulotlar</div>

      {loading ? (
        <div className="loader">
          <div className="spinner" />
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
