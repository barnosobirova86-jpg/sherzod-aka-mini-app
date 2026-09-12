import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import Banner from '../components/Banner.jsx';
import ContactButton from '../components/ContactButton.jsx';
import { api } from '../api.js';

export default function Home({ user, onOpenProduct }) {
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

      <Banner />

      <ContactButton />

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
