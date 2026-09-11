import { useEffect, useRef, useState } from 'react';
import { adminApi, formatPrice, resolveImage } from '../api.js';
import { haptic, showAlert } from '../telegram.js';

const STORAGE_KEY = 'kisva_admin_pass';

const emptyForm = {
  name: "Kisva — Makkani po'shti",
  description: '',
  imageUrl: '',
  category: "Makkani po'shti",
  price: '',
  oldPrice: '',
  sizes: '',
  features: '',
  isRecommended: false,
  isActive: true,
};

const statusLabels = {
  pending: 'Kutilmoqda',
  delivered: 'Yetkazildi',
  canceled: 'Bekor qilindi',
};

export default function Admin({ onExit }) {
  const [pass, setPass] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState('');
  const [checking, setChecking] = useState(false);

  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [gallery, setGallery] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  // Saqlangan parol bilan avtomatik kirish
  useEffect(() => {
    if (!pass) return;
    adminApi
      .stats(pass)
      .then(() => setAuthed(true))
      .catch(() => {
        setAuthed(false);
        setPass('');
      });
  }, [pass]);

  async function load() {
    setLoading(true);
    try {
      const [ordersData, productsData, statsData] = await Promise.all([
        adminApi.orders(pass),
        adminApi.products(pass),
        adminApi.stats(pass),
      ]);
      setOrders(ordersData);
      setProducts(productsData);
      setStats(statsData);
    } catch (error) {
      showAlert(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authed) load();
  }, [authed]);

  async function login(event) {
    event.preventDefault();
    setChecking(true);
    try {
      await adminApi.login(input);
      try {
        localStorage.setItem(STORAGE_KEY, input);
      } catch {
        /* ignore */
      }
      setPass(input);
      setAuthed(true);
      haptic('medium');
    } catch (error) {
      showAlert(error.message || "Parol noto'g'ri");
    } finally {
      setChecking(false);
    }
  }

  function logout() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setPass('');
    setAuthed(false);
    onExit();
  }

  async function changeStatus(id, status) {
    try {
      await adminApi.updateOrderStatus(pass, id, status);
      haptic('medium');
      load();
    } catch (error) {
      showAlert(error.message);
    }
  }

  function openNew() {
    setForm(emptyForm);
    setEditing('new');
    adminApi.uploads(pass).then(setGallery).catch(() => setGallery([]));
  }

  function openEdit(product) {
    setForm({
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      category: product.category,
      price: String(product.price),
      oldPrice: product.oldPrice ? String(product.oldPrice) : '',
      sizes: (product.sizes || []).join(', '),
      features: (product.features || []).join('\n'),
      isRecommended: product.isRecommended,
      isActive: product.isActive,
    });
    setEditing(product);
    adminApi.uploads(pass).then(setGallery).catch(() => setGallery([]));
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await adminApi.uploadImage(pass, file);
      setForm((prev) => ({ ...prev, imageUrl: result.url }));
      setGallery(await adminApi.uploads(pass).catch(() => gallery));
      haptic('medium');
    } catch (error) {
      showAlert(error.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
      };

      if (editing === 'new') await adminApi.createProduct(pass, payload);
      else await adminApi.updateProduct(pass, editing.id, payload);

      setEditing(null);
      haptic('medium');
      load();
    } catch (error) {
      showAlert(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(product) {
    if (!confirm(`"${product.name}" o'chirilsinmi?`)) return;
    try {
      await adminApi.deleteProduct(pass, product.id);
      load();
    } catch (error) {
      showAlert(error.message);
    }
  }

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  /* ---------- Parol oynasi ---------- */

  if (!authed) {
    return (
      <div className="page">
        <button className="btn btn-soft" style={{ width: 'auto', padding: '9px 14px' }} onClick={onExit}>
          ← Orqaga
        </button>

        <div style={{ textAlign: 'center', padding: '48px 0 24px' }}>
          <div style={{ fontSize: 46 }}>🔐</div>
          <h1 className="title" style={{ marginTop: 12 }}>
            Admin panel
          </h1>
          <p className="subtitle">Kirish uchun parolni kiriting</p>
        </div>

        <form onSubmit={login}>
          <div className="field">
            <input
              type="password"
              placeholder="Parol"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
            />
          </div>
          <button className="btn btn-accent" style={{ marginTop: 14 }} disabled={checking}>
            {checking ? 'Tekshirilmoqda...' : 'Kirish'}
          </button>
        </form>
      </div>
    );
  }

  /* ---------- Mahsulot formasi ---------- */

  if (editing) {
    return (
      <div className="page" style={{ paddingBottom: 40 }}>
        <button
          className="btn btn-soft"
          style={{ width: 'auto', padding: '9px 14px' }}
          onClick={() => setEditing(null)}
        >
          ← Orqaga
        </button>

        <h1 className="title" style={{ marginTop: 16 }}>
          {editing === 'new' ? 'Yangi mahsulot' : 'Tahrirlash'}
        </h1>

        <form onSubmit={save}>
          <div className="field">
            <label>Nomi</label>
            <input {...field('name')} required />
          </div>

          <div className="field">
            <label>Ta'rifi</label>
            <textarea {...field('description')} rows={3} />
          </div>

          <div className="field">
            <label>Rasm</label>
            {form.imageUrl && (
              <img
                src={resolveImage(form.imageUrl)}
                alt=""
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  objectFit: 'cover',
                  borderRadius: 14,
                  marginBottom: 8,
                }}
              />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Yuklanmoqda...' : '📁 Telefondan rasm tanlash'}
            </button>

            {gallery.length > 0 && (
              <>
                <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                  Yuklangan rasmlar — bosib tanlang
                </div>
                <div className="admin-image-row">
                  {gallery.map((item) => (
                    <button
                      type="button"
                      key={item.name}
                      className={form.imageUrl === item.url ? 'active' : ''}
                      onClick={() => setForm((prev) => ({ ...prev, imageUrl: item.url }))}
                    >
                      <img src={resolveImage(item.url)} alt={item.name} />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="field">
            <label>Kategoriya</label>
            <input {...field('category')} required />
          </div>

          <div className="field">
            <label>O'lchamlar (vergul bilan)</label>
            <input {...field('sizes')} placeholder="Katta, O'rta, Kichik" />
          </div>

          <div className="field">
            <label>Eski narx (so'm)</label>
            <input {...field('oldPrice')} type="number" inputMode="numeric" placeholder="15500000" />
          </div>

          <div className="field">
            <label>Yangi narx (so'm)</label>
            <input {...field('price')} type="number" inputMode="numeric" required placeholder="12900000" />
          </div>

          <div className="field">
            <label>Tarkibi (har biri yangi qatordan)</label>
            <textarea {...field('features')} rows={4} />
          </div>

          <label
            className="list-item"
            style={{ justifyContent: 'space-between', borderBottom: 'none' }}
          >
            <span>Do'konda ko'rinsin</span>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              style={{ width: 20, height: 20, accentColor: 'var(--accent)' }}
            />
          </label>

          <label
            className="list-item"
            style={{ justifyContent: 'space-between', borderBottom: 'none' }}
          >
            <span>Savatchada tavsiya qilinsin</span>
            <input
              type="checkbox"
              checked={form.isRecommended}
              onChange={(e) => setForm((p) => ({ ...p, isRecommended: e.target.checked }))}
              style={{ width: 20, height: 20, accentColor: 'var(--accent)' }}
            />
          </label>

          <button className="btn btn-accent" style={{ marginTop: 16 }} disabled={saving}>
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </form>
      </div>
    );
  }

  /* ---------- Asosiy admin ekrani ---------- */

  return (
    <div className="page">
      <div className="header">
        <div>
          <h1 className="title">Admin panel</h1>
          <p className="subtitle">Buyurtmalar va mahsulotlar</p>
        </div>
        <button className="btn btn-soft" style={{ width: 'auto', padding: '9px 14px' }} onClick={onExit}>
          ✕
        </button>
      </div>

      {stats && (
        <div className="admin-stats">
          <div className="admin-stat">
            <span>Buyurtmalar</span>
            <b>{stats.orders}</b>
          </div>
          <div className="admin-stat">
            <span>Umumiy savdo</span>
            <b>{formatPrice(stats.revenue)}</b>
          </div>
          <div className="admin-stat">
            <span>Mijozlar</span>
            <b>{stats.users}</b>
          </div>
          <div className="admin-stat">
            <span>Mahsulotlar</span>
            <b>{stats.products}</b>
          </div>
        </div>
      )}

      <div className="admin-tabs">
        <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>
          📦 Buyurtmalar
        </button>
        <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>
          🛍 Mahsulotlar
        </button>
      </div>

      {loading ? (
        <div className="loader">
          <div className="spinner" />
        </div>
      ) : tab === 'orders' ? (
        <div style={{ marginTop: 14 }}>
          {orders.length === 0 ? (
            <div className="empty">
              <div className="empty-emoji">📭</div>
              Buyurtmalar yo'q
            </div>
          ) : (
            orders.map((order) => (
              <div className="admin-card" key={order.id}>
                <div className="order-head">
                  <b>#{order.id}</b>
                  <span className={`status ${order.status}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>

                <div style={{ fontSize: 13.5 }}>
                  👤 {order.user?.firstName} {order.user?.lastName || ''}
                </div>
                <div style={{ fontSize: 13.5 }}>📞 {order.phone || order.user?.phone || '—'}</div>
                <div className="muted" style={{ fontSize: 12, margin: '6px 0' }}>
                  {new Date(order.createdAt).toLocaleString('uz-UZ')}
                </div>

                {(order.items || []).map((item, i) => (
                  <div key={i} style={{ fontSize: 13 }}>
                    • {item.name}
                    {item.size ? ` (${item.size})` : ''} × {item.qty}
                  </div>
                ))}

                {order.note && (
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                    💬 {order.note}
                  </div>
                )}

                <div className="price-row">
                  <span className="price-new">{formatPrice(order.totalPrice)} so'm</span>
                </div>

                {order.latitude && order.longitude && (
                  <a
                    href={`https://maps.google.com/?q=${order.latitude},${order.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}
                  >
                    📍 Xaritada ochish
                  </a>
                )}

                {order.status === 'pending' && (
                  <div className="admin-actions">
                    <button
                      className="btn btn-accent"
                      onClick={() => changeStatus(order.id, 'delivered')}
                    >
                      ✓ Yetkazildi
                    </button>
                    <button
                      className="btn btn-soft"
                      onClick={() => changeStatus(order.id, 'canceled')}
                    >
                      ✕ Bekor
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ marginTop: 14 }}>
          <button className="btn btn-accent" onClick={openNew} style={{ marginBottom: 14 }}>
            + Yangi mahsulot
          </button>

          {products.map((product) => (
            <div className="admin-card" key={product.id}>
              <div className="admin-row">
                <img className="admin-thumb" src={resolveImage(product.imageUrl)} alt="" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{product.name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {product.category}
                  </div>
                  <div className="price-row" style={{ paddingTop: 2 }}>
                    <span className="price-new">{formatPrice(product.price)} so'm</span>
                    {product.oldPrice > 0 && (
                      <span className="price-old">{formatPrice(product.oldPrice)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="admin-actions">
                <button className="btn btn-soft" onClick={() => openEdit(product)}>
                  ✎ Tahrirlash
                </button>
                <button className="btn btn-soft" onClick={() => remove(product)}>
                  🗑 O'chirish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-soft" style={{ marginTop: 18 }} onClick={logout}>
        Admin paneldan chiqish
      </button>
    </div>
  );
}
