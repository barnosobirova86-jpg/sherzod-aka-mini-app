import { useState } from 'react';
import { formatPrice, resolveImage } from '../api.js';
import { haptic } from '../telegram.js';
import { useCart } from '../context/CartContext.jsx';

export default function ProductSheet({ product, onClose }) {
  const { addItem } = useCart();
  const [size, setSize] = useState(product.sizes?.[0] || null);
  const [qty, setQty] = useState(1);

  function submit() {
    haptic('medium');
    addItem(product, size, qty);
    onClose();
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />

        <div className="sheet-scroll">
          <img className="sheet-img" src={resolveImage(product.imageUrl)} alt={product.name} />

          <h2>{product.name}</h2>
          <div className="price-row">
            <span className="price-new" style={{ fontSize: 18 }}>
              {formatPrice(product.price)} сўм
            </span>
            {product.oldPrice > 0 && (
              <span className="price-old" style={{ fontSize: 14 }}>
                {formatPrice(product.oldPrice)} сўм
              </span>
            )}
          </div>

          <p className="subtitle" style={{ marginTop: 10 }}>
            {product.description}
          </p>

          {product.features?.length > 0 && (
            <>
              <div className="section-title" style={{ marginBottom: 0 }}>
                Таркиби
              </div>
              <ul className="features">
                {product.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
            </>
          )}

          {product.sizes?.length > 0 && (
            <>
              <div className="section-title" style={{ marginBottom: 0 }}>
                Ўлчамни танланг
              </div>
              <div className="sizes">
                {product.sizes.map((item) => (
                  <button
                    key={item}
                    className={`size ${size === item ? 'active' : ''}`}
                    onClick={() => {
                      haptic('light');
                      setSize(item);
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="section-title" style={{ marginBottom: 0 }}>
            Сони
          </div>
          <div className="qty" style={{ marginTop: 10 }}>
            <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span>{qty}</span>
            <button onClick={() => setQty((q) => q + 1)}>+</button>
          </div>
        </div>

        <div className="sheet-footer">
          <button className="btn btn-accent" onClick={submit}>
            Саватчага қўшиш — {formatPrice(product.price * qty)} сўм
          </button>
        </div>
      </div>
    </>
  );
}
