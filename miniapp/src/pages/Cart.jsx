import { useCallback, useEffect, useState } from 'react';
import { api, formatMoney, resolveImage } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { haptic, showAlert, requestLocation } from '../telegram.js';
import ContactGate from '../components/ContactGate.jsx';
import MapPicker from '../components/MapPicker.jsx';

function formatTotals(totalsByCurrency) {
  return totalsByCurrency.map((t) => formatMoney(t.amount, t.currency)).join(' + ');
}

export default function Cart({ user, onNavigate, onUserUpdate }) {
  const { items, totalsByCurrency, changeQty, removeItem, clearCart } = useCart();

  const [note, setNote] = useState('');
  const [address, setAddress] = useState('');
  const [point, setPointState] = useState(null);
  const [phone, setPhone] = useState(user?.phone || '');
  const [extraPhone, setExtraPhone] = useState(user?.extraPhone || '');
  const [locating, setLocating] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showGate, setShowGate] = useState(false);

  const setPoint = useCallback((value) => setPointState(value), []);

  // Telegram raqami kechroq kelishi mumkin — kelgach maydonlarga to‘ldiriladi
  useEffect(() => {
    if (user?.phone) setPhone((current) => current || user.phone);
    if (user?.extraPhone) setExtraPhone((current) => current || user.extraPhone);
  }, [user?.phone, user?.extraPhone]);

  function clearPoint() {
    haptic('light');
    setPointState(null);
  }

  async function useMyLocation() {
    setLocating(true);
    try {
      const coords = await requestLocation();
      setPointState({ lat: coords.latitude, lng: coords.longitude });
      haptic('medium');
    } catch (error) {
      showAlert(error.message || 'Lokatsiya olinmadi');
    } finally {
      setLocating(false);
    }
  }

  async function placeOrder({ name, phone: orderPhone }) {
    setSending(true);
    try {
      await api.createOrder({
        items: items.map((i) => ({ productId: i.productId, size: i.size, qty: i.qty })),
        name,
        phone: orderPhone,
        extraPhone: extraPhone.trim() || null,
        address: address.trim() || null,
        latitude: point?.lat,
        longitude: point?.lng,
        note: note.trim() || null,
      });

      clearCart();
      haptic('heavy');
      setSubmitted(true);
    } catch (error) {
      showAlert(error.message || 'Buyurtma yuborilmadi');
    } finally {
      setSending(false);
    }
  }

  function submitOrder() {
    if (!phone.trim()) {
      return showAlert('Aloqa uchun telefon raqamingizni kiriting');
    }
    if (!user?.contactName) {
      setShowGate(true);
      return;
    }
    placeOrder({ name: user.contactName, phone: phone.trim() });
  }

  function gateDone(updatedUser) {
    onUserUpdate(updatedUser);
    setShowGate(false);
    placeOrder({ name: updatedUser.contactName, phone: updatedUser.phone });
  }

  function closeThankYou() {
    haptic('light');
    setSubmitted(false);
    onNavigate('home');
  }

  if (showGate) {
    return <ContactGate user={user} onDone={gateDone} />;
  }

  if (submitted) {
    return (
      <div className="page">
        <div className="thankyou-card">
          <button className="thankyou-exit" onClick={closeThankYou} aria-label="Yopish">
            ➜
          </button>
          <div className="thankyou-icon">🎉</div>
          <h2>Xarid uchun rahmat!</h2>
          <p>Admin siz bilan bog‘lanadi.</p>
        </div>
      </div>
    );
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

  const totalLabel = formatTotals(totalsByCurrency);

  return (
    <div className="page" style={{ paddingBottom: 210 }}>
      <h1 className="title">Savatcha</h1>
      <p className="subtitle">{items.length} ta mahsulot</p>

      <div style={{ marginTop: 12 }}>
        {items.map((item) => (
          <div className="cart-item" key={item.key}>
            <img className="cart-img" src={resolveImage(item.imageUrl)} alt={item.name} />
            <div className="cart-info">
              <div className="cart-name">{item.name}</div>
              {item.size && <div className="muted" style={{ fontSize: 12 }}>O‘lcham: {item.size}</div>}
              <div className="price-row" style={{ paddingTop: 2 }}>
                <span className="price-new">{formatMoney(item.price * item.qty, item.currency)}</span>
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

      <div className="section-title">Yetkazib berish</div>

      <div className="field">
        <label>Manzil (qo‘lda yozing)</label>
        <textarea
          rows={2}
          placeholder="Masalan: Toshkent sh., Chilonzor t., 12-kvartal, 34-uy, 5-xonadon"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Xaritada belgilang</label>
        <MapPicker point={point} onChange={setPoint} />

        <div className="map-actions">
          <button className="btn btn-outline btn-sm" onClick={useMyLocation} disabled={locating}>
            {locating ? 'Aniqlanmoqda...' : '📍 Mening joylashuvim'}
          </button>
          {point && (
            <button className="btn btn-light btn-sm" onClick={clearPoint}>
              Belgini olib tashlash
            </button>
          )}
        </div>
      </div>

      <div className="section-title">Aloqa uchun</div>

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
        <label>Qo‘shimcha telefon raqamingiz (ixtiyoriy)</label>
        <input
          type="tel"
          inputMode="tel"
          placeholder="+998 91 234 56 78"
          value={extraPhone}
          onChange={(e) => setExtraPhone(e.target.value)}
        />
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
          <span>{totalLabel}</span>
        </div>
        <div className="summary-row">
          <span className="muted">Yetkazib berish</span>
          <span>Bepul</span>
        </div>
        <div className="summary-row summary-total">
          <span>Jami</span>
          <span>{totalLabel}</span>
        </div>
      </div>

      <div className="sticky-bar">
        <button className="btn btn-accent" onClick={submitOrder} disabled={sending}>
          {sending ? 'Yuborilmoqda...' : `Buyurtmani tasdiqlash — ${totalLabel}`}
        </button>
      </div>
    </div>
  );
}
