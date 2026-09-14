import { formatMoney, resolveImage } from '../api.js';
import { haptic } from '../telegram.js';
import { useCart } from '../context/CartContext.jsx';

export default function ProductCard({ product, onOpen }) {
  const { items, addItem, changeQty } = useCart();

  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : 0;

  const size = product.sizes?.[0] || null;
  const key = `${product.id}__${size || ''}`;
  const cartItem = items.find((i) => i.key === key);
  const qty = cartItem?.qty || 0;
  const stock = product.stock ?? 0;
  const outOfStock = stock <= 0;

  function quickAdd(event) {
    event.stopPropagation();
    if (outOfStock) return;
    haptic('medium');
    addItem(product, size, 1);
  }

  function increase(event) {
    event.stopPropagation();
    if (qty >= stock) return;
    haptic('light');
    changeQty(key, 1);
  }

  function decrease(event) {
    event.stopPropagation();
    haptic('light');
    changeQty(key, -1);
  }

  return (
    <div className="card" onClick={() => onOpen(product)}>
      <div className="card-img">
        <img src={resolveImage(product.imageUrl)} alt={product.name} loading="lazy" />
        {discount > 0 && <span className="card-badge">-{discount}%</span>}
        {outOfStock ? (
          <span className="card-out">Тугаган</span>
        ) : qty > 0 ? (
          <div className="card-qty-stepper" onClick={(e) => e.stopPropagation()}>
            <button className="card-qty-btn" onClick={decrease} aria-label="Kamaytirish">
              −
            </button>
            <span className="card-qty-value">{qty}</span>
            <button className="card-qty-btn" onClick={increase} aria-label="Ko‘paytirish">
              +
            </button>
          </div>
        ) : (
          <button className="card-add" onClick={quickAdd} aria-label="Savatchaga qo‘shish">
            +
          </button>
        )}
      </div>

      <div className="card-body">
        <div className="card-name">{product.name}</div>
        <div className="price-row">
          <span className="price-new">{formatMoney(product.price, product.currency)}</span>
          {product.oldPrice > 0 && (
            <span className="price-old">{formatMoney(product.oldPrice, product.currency)}</span>
          )}
        </div>
        {!outOfStock && <div className="card-stock">Омборда: {stock} дона</div>}
      </div>
    </div>
  );
}
