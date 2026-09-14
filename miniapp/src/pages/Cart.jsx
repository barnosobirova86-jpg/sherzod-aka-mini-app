import { useState } from 'react';
import { api, formatMoney, resolveImage } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { haptic, showAlert, requestLocation } from '../telegram.js';
import ContactGate from '../components/ContactGate.jsx';

function formatTotals(totalsByCurrency) {
  return totalsByCurrency.map((t) => formatMoney(t.amount, t.currency)).join(' + ');
}

export default function Cart({ user, onNavigate, onUserUpdate }) {
  const { items, totalsByCurrency, changeQty, removeItem, clearCart } = useCart();

  const [note, setNote] = useState('');
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showGate, setShowGate] = useState(false);

  async function getLocation() {
    setLocating(true);
    try {
      const coords = await requestLocation();
      setLocation(coords);
      haptic('medium');
    } catch (error) {
      showAlert(error.message || 'Локация олинмади');
    } finally {
      setLocating(false);
    }
  }

  async function placeOrder({ name, phone }) {
    setSending(true);
    try {
      await api.createOrder({
        items: items.map((i) => ({ productId: i.productId, size: i.size, qty: i.qty })),
        name,
        phone,
        latitude: location?.latitude,
        longitude: location?.longitude,
        note: note.trim() || null,
      });

      clearCart();
      haptic('heavy');
      setSubmitted(true);
    } catch (error) {
      showAlert(error.message || 'Буюртма юборилмади');
    } finally {
      setSending(false);
    }
  }

  function submitOrder() {
    if (!user?.contactName || !user?.phone) {
      setShowGate(true);
      return;
    }
    placeOrder({ name: user.contactName, phone: user.phone });
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
          <button className="thankyou-exit" onClick={closeThankYou} aria-label="Ёпиш">
            ➜
          </button>
          <div className="thankyou-icon">🎉</div>
          <h2>Харид учун раҳмат!</h2>
          <p>Админ сиз билан боғланади.</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="page">
        <h1 className="title">Саватча</h1>
        <div className="empty">
          <div className="empty-emoji">🛒</div>
          Саватчангиз бўш
          <div style={{ marginTop: 18 }}>
            <button className="btn btn-soft" onClick={() => onNavigate('catalog')}>
              Каталогга ўтиш
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalLabel = formatTotals(totalsByCurrency);

  return (
    <div className="page" style={{ paddingBottom: 210 }}>
      <h1 className="title">Саватча</h1>
      <p className="subtitle">{items.length} та маҳсулот</p>

      <div style={{ marginTop: 12 }}>
        {items.map((item) => (
          <div className="cart-item" key={item.key}>
            <img className="cart-img" src={resolveImage(item.imageUrl)} alt={item.name} />
            <div className="cart-info">
              <div className="cart-name">{item.name}</div>
              {item.size && <div className="muted" style={{ fontSize: 12 }}>Ўлчам: {item.size}</div>}
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
                  Ўчириш
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title">Етказиб бериш</div>

      <div className="field">
        <label>Манзил (локация) — ихтиёрий</label>
        <button className="btn btn-outline" onClick={getLocation} disabled={locating}>
          {locating
            ? 'Аниқланмоқда...'
            : location
              ? `📍 Локация олинди (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`
              : '📍 Локацияни юбориш'}
        </button>
      </div>

      <div className="field">
        <label>Изоҳ (ихтиёрий)</label>
        <textarea
          rows={3}
          placeholder="Мўлжал, уй рақами ёки қўшимча изоҳ"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="summary">
        <div className="summary-row">
          <span className="muted">Маҳсулотлар</span>
          <span>{totalLabel}</span>
        </div>
        <div className="summary-row">
          <span className="muted">Етказиб бериш</span>
          <span>Бепул</span>
        </div>
        <div className="summary-row summary-total">
          <span>Жами</span>
          <span>{totalLabel}</span>
        </div>
      </div>

      <div className="sticky-bar">
        <button className="btn btn-accent" onClick={submitOrder} disabled={sending}>
          {sending ? 'Юборилмоқда...' : `Буюртмани тасдиқлаш — ${totalLabel}`}
        </button>
      </div>
    </div>
  );
}
