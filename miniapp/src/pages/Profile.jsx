import { useEffect, useState } from 'react';
import { api, formatMoney } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { haptic, showAlert } from '../telegram.js';

const statusLabels = {
  pending: 'Kutilmoqda',
  delivered: 'Yetkazildi',
  canceled: 'Bekor qilindi',
};

function orderTotalLabel(order) {
  const map = new Map();
  for (const item of order.items || []) {
    const currency = item.currency || 'UZS';
    map.set(currency, (map.get(currency) || 0) + item.price * item.qty);
  }
  if (map.size === 0) return formatMoney(order.totalPrice);
  return [...map.entries()].map(([currency, amount]) => formatMoney(amount, currency)).join(' + ');
}

export default function Profile({ user, onNavigate }) {
  const { addItem } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOrders, setShowOrders] = useState(false);

  useEffect(() => {
    api
      .myOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const name = user?.firstName || 'Mijoz';
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Mijoz';

  function reorder(order) {
    haptic('medium');
    (order.items || []).forEach((item) => {
      addItem(
        {
          id: item.productId,
          name: item.name,
          price: item.price,
          currency: item.currency || 'UZS',
          oldPrice: null,
          imageUrl: item.imageUrl || 'https://picsum.photos/seed/kisva/300/300',
          sizes: [],
        },
        item.size,
        item.qty
      );
    });
    showAlert('Mahsulotlar savatchaga qo‘shildi');
    onNavigate('cart');
  }

  return (
    <div className="page">
      <div className="profile-head">
        <div className="profile-avatar">{name.charAt(0).toUpperCase()}</div>
        <div style={{ textAlign: 'center' }}>
          <h1 className="title">{fullName}</h1>
          {user?.username && (
            <p className="subtitle" style={{ marginBottom: 2 }}>
              @{user.username}
            </p>
          )}
          <p className="subtitle">{user?.phone || 'Telefon raqam kiritilmagan'}</p>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <button className="list-item" onClick={() => setShowOrders((v) => !v)}>
          <span style={{ fontSize: 18 }}>📜</span>
          <span style={{ flex: 1 }}>Mening buyurtmalarim</span>
          <span className="muted">{orders.length}</span>
        </button>

        <div className="list-item">
          <span style={{ fontSize: 18 }}>📞</span>
          <span style={{ flex: 1 }}>Aloqa</span>
          <span className="muted">+998 90 000 00 00</span>
        </div>
      </div>

      {showOrders && (
        <>
          <div className="section-title">Buyurtmalar tarixi</div>

          {loading ? (
            <div className="loader">
              <div className="spinner" />
            </div>
          ) : orders.length === 0 ? (
            <div className="empty">
              <div className="empty-emoji">📭</div>
              Hali buyurtma qilmagansiz
            </div>
          ) : (
            orders.map((order) => (
              <div className="order-card" key={order.id}>
                <div className="order-head">
                  <b>Buyurtma #{order.id}</b>
                  <span className={`status ${order.status}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>

                <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                  {new Date(order.createdAt).toLocaleString('uz-UZ')}
                </div>

                {(order.items || []).map((item, i) => (
                  <div key={i} style={{ fontSize: 13.5, padding: '2px 0' }}>
                    • {item.name}
                    {item.size ? ` (${item.size})` : ''} × {item.qty}
                  </div>
                ))}

                <div className="price-row">
                  <span className="price-new">{orderTotalLabel(order)}</span>
                </div>

                <button
                  className="btn btn-soft"
                  style={{ marginTop: 10, padding: '11px' }}
                  onClick={() => reorder(order)}
                >
                  🔁 Yana shundan buyurtma qilish
                </button>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
