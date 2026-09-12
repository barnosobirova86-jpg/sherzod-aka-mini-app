import { useCallback, useEffect, useState } from 'react';
import { api, formatPrice, formatDate } from '../api.js';

const filters = [
  { id: 'all', label: 'Ҳаммаси' },
  { id: 'pending', label: 'Кутилмоқда' },
  { id: 'delivered', label: 'Етказилди' },
  { id: 'canceled', label: 'Бекор қилинган' },
];

const statusLabels = {
  pending: 'Кутилмоқда',
  delivered: 'Етказилди',
  canceled: 'Бекор қилинган',
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
      if (err.message.includes('Сессия')) onExpire();
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

  function customerName(order) {
    return (
      order.customerName ||
      `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() ||
      '—'
    );
  }

  function StatusBadge({ order }) {
    return (
      <span className={`badge ${order.status}`}>{statusLabels[order.status] || order.status}</span>
    );
  }

  function Actions({ order }) {
    return (
      <div className="row-actions">
        {order.status !== 'delivered' && (
          <button className="btn btn-accent btn-sm" onClick={() => changeStatus(order.id, 'delivered')}>
            ✓ Етказилди
          </button>
        )}
        {order.status === 'pending' && (
          <button className="btn btn-danger btn-sm" onClick={() => changeStatus(order.id, 'canceled')}>
            ✕ Бекор
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Буюртмалар</h1>
          <p>Янги буюртмалар ҳар 15 сонияда автоматик янгиланади</p>
        </div>
        <button className="btn btn-light" onClick={load}>
          🔄 Янгилаш
        </button>
      </div>

      {stats && (
        <div className="stats">
          <div className="stat">
            <span>Жами буюртмалар</span>
            <b>{stats.orders}</b>
          </div>
          <div className="stat">
            <span>Умумий савдо</span>
            <b>{formatPrice(stats.revenue)} сўм</b>
          </div>
          <div className="stat">
            <span>Мижозлар</span>
            <b>{stats.users}</b>
          </div>
          <div className="stat">
            <span>Маҳсулотлар</span>
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

      {loading ? (
        <div className="card">
          <div className="loading">Юкланмоқда...</div>
        </div>
      ) : orders.length === 0 ? (
        <div className="card">
          <div className="empty">Буюртмалар топилмади</div>
        </div>
      ) : (
        <>
          <div className="card table-only">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Мижоз</th>
                    <th>Телефон</th>
                    <th>Маҳсулотлар</th>
                    <th>Жами</th>
                    <th>Манзил</th>
                    <th>Сана</th>
                    <th>Ҳолат</th>
                    <th>Амаллар</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <b>#{order.id}</b>
                      </td>
                      <td>
                        <b>{customerName(order)}</b>
                        {order.user?.username && (
                          <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                            @{order.user.username}
                          </div>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{order.phone || order.user?.phone || '—'}</td>
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
                        <b>{formatPrice(order.totalPrice)}</b> сўм
                      </td>
                      <td>
                        {order.latitude && order.longitude ? (
                          <a
                            className="link"
                            href={`https://maps.google.com/?q=${order.latitude},${order.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            📍 Харитада
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(order.createdAt)}</td>
                      <td>
                        <StatusBadge order={order} />
                      </td>
                      <td>
                        <Actions order={order} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="order-cards cards-only">
            {orders.map((order) => (
              <div className="order-card-admin" key={order.id}>
                <div className="oca-top">
                  <b>#{order.id}</b>
                  <StatusBadge order={order} />
                </div>

                <div className="oca-customer">
                  <b>{customerName(order)}</b>
                  {order.user?.username && <span className="muted"> @{order.user.username}</span>}
                </div>

                {(order.phone || order.user?.phone) && (
                  <div className="oca-row">📞 {order.phone || order.user?.phone}</div>
                )}

                <div className="items-list oca-items">
                  {(order.items || []).map((item, i) => (
                    <div key={i}>
                      • {item.name}
                      {item.size ? ` (${item.size})` : ''} × {item.qty}
                    </div>
                  ))}
                </div>

                {order.note && <div className="oca-row muted">💬 {order.note}</div>}

                {order.latitude && order.longitude && (
                  <a
                    className="link oca-row"
                    href={`https://maps.google.com/?q=${order.latitude},${order.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    📍 Харитада
                  </a>
                )}

                <div className="oca-footer">
                  <b>{formatPrice(order.totalPrice)} сўм</b>
                  <span className="muted">{formatDate(order.createdAt)}</span>
                </div>

                <Actions order={order} />
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
