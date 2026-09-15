import { useMemo, useState } from 'react';
import { formatMoney, resolveImage } from '../api.js';
import { haptic } from '../telegram.js';
import { useCart } from '../context/CartContext.jsx';

export default function ProductSheet({ product, onClose }) {
  const { addItem } = useCart();
  const [size, setSize] = useState(product.sizes?.[0] || null);
  const [qty, setQty] = useState(1);
  const stock = product.stock ?? 0;
  const outOfStock = stock <= 0;

  const media = useMemo(() => {
    const items = [];
    if (product.videoUrl) items.push({ type: 'video', url: product.videoUrl });
    for (const url of product.videos || []) items.push({ type: 'video', url });
    if (product.imageUrl) items.push({ type: 'image', url: product.imageUrl });
    for (const url of product.images || []) items.push({ type: 'image', url });
    return items;
  }, [product]);

  function submit() {
    if (outOfStock) return;
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
          {media.length > 1 ? (
            <div className="sheet-gallery">
              {media.map((item, i) =>
                item.type === 'video' ? (
                  <video
                    key={item.url + i}
                    className="sheet-img sheet-gallery-item"
                    src={resolveImage(item.url)}
                    controls
                    playsInline
                    style={{ background: '#000' }}
                  />
                ) : (
                  <img
                    key={item.url + i}
                    className="sheet-img sheet-gallery-item"
                    src={resolveImage(item.url)}
                    alt={product.name}
                  />
                )
              )}
            </div>
          ) : media[0]?.type === 'video' ? (
            <video
              className="sheet-img"
              src={resolveImage(media[0].url)}
              controls
              playsInline
              style={{ background: '#000' }}
            />
          ) : (
            <img className="sheet-img" src={resolveImage(product.imageUrl)} alt={product.name} />
          )}

          <h2>{product.name}</h2>
          <div className="price-row">
            <span className="price-new" style={{ fontSize: 18 }}>
              {formatMoney(product.price, product.currency)}
            </span>
            {product.oldPrice > 0 && (
              <span className="price-old" style={{ fontSize: 14 }}>
                {formatMoney(product.oldPrice, product.currency)}
              </span>
            )}
          </div>

          <p className="subtitle" style={{ marginTop: 10 }}>
            {product.description}
          </p>

          {product.features?.length > 0 && (
            <>
              <div className="section-title" style={{ marginBottom: 0 }}>
                Tarkibi
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
                O‘lchamni tanlang
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
            Soni
          </div>
          <div className="qty" style={{ marginTop: 10 }}>
            <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span>{qty}</span>
            <button onClick={() => setQty((q) => Math.min(stock, q + 1))} disabled={outOfStock}>
              +
            </button>
          </div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
            {outOfStock ? 'Tugagan' : `Omborda: ${stock} dona`}
          </div>

          {product.reviews?.length > 0 && (
            <>
              <div className="section-title">Mijozlar sharhlari</div>
              <div className="reviews">
                {product.reviews.map((review, i) => (
                  <div className="review" key={i}>
                    <div className="review-head">
                      <b>{review.name}</b>
                      <span className="review-stars">{'★'.repeat(review.rating || 5)}</span>
                    </div>
                    <p>{review.text}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="sheet-footer">
          <button className="btn btn-accent" onClick={submit} disabled={outOfStock}>
            {outOfStock
              ? 'Tugagan'
              : `Savatchaga qo‘shish — ${formatMoney(product.price * qty, product.currency)}`}
          </button>
        </div>
      </div>
    </>
  );
}
