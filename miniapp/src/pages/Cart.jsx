import { useEffect, useState } from 'react';
import { api, formatPrice } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { haptic, showAlert, closeApp, requestLocation } from '../telegram.js';

export default function Cart({ user, onNavigate }) {
  const { items, total, changeQty, removeItem, addItem, clearCart } = useCart();

  const [recommended, setRecommended] = useState([]);
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.recommended().then(setRecommended).catch(() => setRecommended([]));
  }, []);

  useEffect(() => {
    if (user?.phone) setPhone(user.phone);
  }, [user]);

  // Admin panelda "Tavsiya etilgan" deb belgilangan birinchi mahsulot
  const candidate = recommended[0] || null;
  const onlyUpsellInCart =
    candidate && items.length === 1 && items[0].productId === candidate.id;
  const upsell = onlyUpsellInCart ? null : candidate;
  const upsellOn = upsell ? items.some((i) => i.productId === upsell.id) : false;

  function toggleUpsell(product) {
    haptic('medium');
    const inCart = items.find((i) => i.productId === product.id);
    if (inCart) removeItem(inCart.key);
    else addItem(product, product.sizes?.[0] || null, 1);
  }

  async function getLocation() {
    setLocating(true);
    try {
      const coords = await requestLocation();
      setLocation(coords);
      haptic('medium');
    } catch (error) {
      showAlert(error.message || 'Lokatsiya olinmadi');
    } finally {
      setLocating(false);
    }
  }

  async function submitOrder() {
    if (!phone.trim()) return showAlert('Telefon raqamingizni kiriting');
    if (!location) return showAlert('Yetkazib berish lokatsiyasini yuboring');

    setSending(true);
    try {
      await api.createOrder({
        items: items.map((i) => ({ productId: i.productId, size: i.size, qty: i.qty })),
        phone: phone.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        note: note.trim() || null,
      });

      clearCart();
      haptic('heavy');
      showAlert('Buyurtmangiz qabul qilindi! Kuryerimiz tez orada bog‘lanadi 🕋');
      setTimeout(closeApp, 700);
    } catch (error) {
      showAlert(error.message || 'Buyurtma yuborilmadi');
    } finally {
      setSending(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="page">
        <h1 className="title">Savatcha</h1>
        <div className="empty">
          <div className="empty-emoji">🛒</div>
          Savatchangiz bo‘sh
          <div style={{ marginTop: 18 }}>
            <button className="btn btn-soft" onClick={() => onNavigate('catalog')}>
              Katalogga o‘tish
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: 210 }}>
      <h1 className="title">Savatcha</h1>
      <p className="subtitle">{items.length} ta mahsulot</p>

      <div style={{ marginTop: 12 }}>
        {items.map((item) => (
          <div className="cart-item" key={item.key}>
            <img className="cart-img" src={item.imageUrl} alt={item.name} />
            <div className="cart-info">
              <div className="cart-name">{item.name}</div>
              {item.size && <div className="muted" style={{ fontSize: 12 }}>O‘lcham: {item.size}</div>}
              <div className="price-row" style={{ paddingTop: 2 }}>
                <span className="price-new">{formatPrice(item.price * item.qty)} so‘m</span>
              </div>
              <div className="qty">
                <button onClick={() => changeQty(item.key, -1)}>−</button>
                <span>{item.qty}</span>
                <button onClick={() => changeQty(item.key, 1)}>+</button>
                <button
                  style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--muted)', width: 'auto' }}
                  onClick={() => removeItem(item.key)}
                >
                  O‘chirish
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {upsell && (
        <div className="upsell">
          <img src={upsell.imageUrl} alt={upsell.name} />
          <div className="upsell-text">
            Bunga qo‘shimcha ravishda <b>{upsell.name}</b> ni atigi{' '}
            <b>{formatPrice(upsell.price)} so‘m</b> ga qo‘shasizmi?
          </div>
          <button
            className={`switch ${upsellOn ? 'on' : ''}`}
            onClick={() => toggleUpsell(upsell)}
            aria-label="Qo‘shimcha mahsulot"
          />
        </div>
      )}

      <div className="section-title">Yetkazib berish</div>

      <div className="field">
        <label>Telefon raqamingiz</label>
        <input
          type="tel"
          inputMode="tel"
          placeholder="+998 90 123 45 67"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Manzil (lokatsiya)</label>
        <button className="btn btn-outline" onClick={getLocation} disabled={locating}>
          {locating
            ? 'Aniqlanmoqda...'
            : location
              ? `📍 Lokatsiya olindi (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`
              : '📍 Lokatsiyani yuborish'}
        </button>
      </div>

      <div className="field">
        <label>Izoh (ixtiyoriy)</label>
        <textarea
          rows={3}
          placeholder="Mo‘ljal, uy raqami yoki qo‘shimcha izoh"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="summary">
        <div className="summary-row">
          <span className="muted">Mahsulotlar</span>
          <span>{formatPrice(total)} so‘m</span>
        </div>
        <div className="summary-row">
          <span className="muted">Yetkazib berish</span>
          <span>Bepul</span>
        </div>
        <div className="summary-row summary-total">
          <span>Jami</span>
          <span>{formatPrice(total)} so‘m</span>
        </div>
      </div>

      <div className="sticky-bar">
        <button className="btn btn-accent" onClick={submitOrder} disabled={sending}>
          {sending ? 'Yuborilmoqda...' : `Buyurtmani tasdiqlash — ${formatPrice(total)} so‘m`}
        </button>
      </div>
    </div>
  );
}
