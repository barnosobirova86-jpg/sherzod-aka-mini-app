import { useCallback, useEffect, useState } from 'react';
import { api, formatPrice, formatDate } from '../api.js';

const filters = [
  { id: 'all', label: 'Hammasi' },
  { id: 'pending', label: 'Kutilmoqda' },
  { id: 'delivered', label: 'Yetkazildi' },
  { id: 'canceled', label: 'Bekor qilingan' },
];

const statusLabels = {
  pending: 'Kutilmoqda',
  delivered: 'Yetkazildi',
  canceled: 'Bekor qilingan',
};

export default function Orders({ onExpire }) {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [ordersData, statsData] = await Promise.all([api.orders(filter), api.stats()]);
      setOrders(ordersData);
      setStats(statsData);
      setError('');
    } catch (err) {
      setError(err.message);
      if (err.message.includes('Sessiya')) onExpire();
    } finally {
      setLoading(false);
    }
  }, [filter, onExpire]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Har 15 soniyada yangi buyurtmalarni avtomatik tekshirish
  useEffect(() => {
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  async function changeStatus(id, status) {
    try {
      await api.updateOrderStatus(id, status);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Buyurtmalar</h1>
          <p>Yangi buyurtmalar har 15 soniyada avtomatik yangilanadi</p>
        </div>
        <button className="btn btn-light" onClick={load}>
          🔄 Yangilash
        </button>
      </div>

      {stats && (
        <div className="stats">
          <div className="stat">
            <span>Jami buyurtmalar</span>
            <b>{stats.orders}</b>
          </div>
          <div className="stat">
            <span>Umumiy savdo</span>
            <b>{formatPrice(stats.revenue)} so‘m</b>
          </div>
          <div className="stat">
            <span>Mijozlar</span>
            <b>{stats.users}</b>
          </div>
          <div className="stat">
            <span>Mahsulotlar</span>
            <b>{stats.products}</b>
          </div>
        </div>
      )}

      <div className="filters">
        {filters.map((item) => (
          <button
            key={item.id}
            className={`filter ${filter === item.id ? 'active' : ''}`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading">Yuklanmoqda...</div>
        ) : orders.length === 0 ? (
          <div className="empty">Buyurtmalar topilmadi</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mijoz</th>
                  <th>Telefon</th>
                  <th>Mahsulotlar</th>
                  <th>Jami</th>
                  <th>Manzil</th>
                  <th>Sana</th>
                  <th>Holat</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <b>#{order.id}</b>
                    </td>
                    <td>
                      {order.user?.firstName} {order.user?.lastName || ''}
                      {order.user?.username && (
                        <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                          @{order.user.username}
                        </div>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {order.phone || order.user?.phone || '—'}
                    </td>
                    <td>
                      <div className="items-list">
                        {(order.items || []).map((item, i) => (
                          <div key={i}>
                            • {item.name}
                            {item.size ? ` (${item.size})` : ''} × {item.qty}
                          </div>
                        ))}
                      </div>
                      {order.note && (
                        <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
                          💬 {order.note}
                        </div>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <b>{formatPrice(order.totalPrice)}</b> so‘m
                    </td>
                    <td>
                      {order.latitude && order.longitude ? (
                        <a
                          className="link"
                          href={`https://maps.google.com/?q=${order.latitude},${order.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          📍 Xaritada
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(order.createdAt)}</td>
                    <td>
                      <span className={`badge ${order.status}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        {order.status !== 'delivered' && (
                          <button
                            className="btn btn-accent btn-sm"
                            onClick={() => changeStatus(order.id, 'delivered')}
                          >
                            ✓ Yetkazildi
                          </button>
                        )}
                        {order.status === 'pending' && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => changeStatus(order.id, 'canceled')}
                          >
                            ✕ Bekor
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
