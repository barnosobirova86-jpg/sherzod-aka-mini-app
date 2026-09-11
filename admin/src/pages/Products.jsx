import { useEffect, useRef, useState } from 'react';
import { api, formatPrice } from '../api.js';

const emptyForm = {
  name: '',
  description: '',
  imageUrl: '',
  category: "Makka po'shti",
  price: '',
  oldPrice: '',
  sizes: 'S, M, L, XL',
  features: '',
  isRecommended: false,
  isActive: true,
};

export default function Products({ onExpire }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [gallery, setGallery] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  async function load() {
    try {
      setProducts(await api.products());
      setError('');
    } catch (err) {
      setError(err.message);
      if (err.message.includes('Sessiya')) onExpire();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Modal ochilganda papkadagi rasmlar ro'yxatini olish
  useEffect(() => {
    if (editing) api.uploads().then(setGallery).catch(() => setGallery([]));
  }, [editing]);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await api.uploadImage(file);
      setForm((prev) => ({ ...prev, imageUrl: result.url }));
      setGallery(await api.uploads().catch(() => gallery));
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function openNew() {
    setForm(emptyForm);
    setEditing('new');
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

      if (editing === 'new') await api.createProduct(payload);
      else await api.updateProduct(editing.id, payload);

      setEditing(null);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(product) {
    if (!confirm(`"${product.name}" o'chirilsinmi?`)) return;
    try {
      await api.deleteProduct(product.id);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  const check = (key) => ({
    checked: form[key],
    onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.checked })),
  });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Mahsulotlar</h1>
          <p>Yangi mahsulot qo‘shing, narx va rasmlarni tahrirlang</p>
        </div>
        <button className="btn btn-accent" onClick={openNew}>
          + Yangi mahsulot
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading">Yuklanmoqda...</div>
        ) : products.length === 0 ? (
          <div className="empty">Mahsulotlar yo‘q</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Rasm</th>
                  <th>Nomi</th>
                  <th>Kategoriya</th>
                  <th>O‘lchamlar</th>
                  <th>Eski narx</th>
                  <th>Narx</th>
                  <th>Holat</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <img className="thumb" src={product.imageUrl} alt={product.name} />
                    </td>
                    <td style={{ maxWidth: 260 }}>
                      <b>{product.name}</b>
                      <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>
                        {product.description?.slice(0, 70)}
                        {product.description?.length > 70 ? '...' : ''}
                      </div>
                    </td>
                    <td>{product.category}</td>
                    <td>{(product.sizes || []).join(', ') || '—'}</td>
                    <td style={{ color: 'var(--muted)', textDecoration: 'line-through' }}>
                      {product.oldPrice ? formatPrice(product.oldPrice) : '—'}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <b>{formatPrice(product.price)}</b> so‘m
                    </td>
                    <td>
                      {product.isActive ? (
                        <span className="badge delivered">Faol</span>
                      ) : (
                        <span className="badge muted">Yashirilgan</span>
                      )}
                      {product.isRecommended && (
                        <div style={{ marginTop: 4 }}>
                          <span className="badge pending">Tavsiya</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-light btn-sm" onClick={() => openEdit(product)}>
                          ✎ Tahrirlash
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(product)}>
                          🗑 O‘chirish
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <h2>{editing === 'new' ? 'Yangi mahsulot' : 'Mahsulotni tahrirlash'}</h2>

            <div className="form-grid">
              <div className="field full">
                <label>Nomi *</label>
                <input {...field('name')} required placeholder="Makka po‘shti — Oq" />
              </div>

              <div className="field full">
                <label>Ta’rifi</label>
                <textarea {...field('description')} rows={3} placeholder="Qisqacha ta’rif" />
              </div>

              <div className="field full">
                <label>Mahsulot rasmi</label>

                <div className="image-picker">
                  <div className="image-preview">
                    {form.imageUrl ? (
                      <img src={form.imageUrl} alt="" />
                    ) : (
                      <span>Rasm yo'q</span>
                    )}
                  </div>

                  <div className="image-actions">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      className="btn btn-accent btn-sm"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? 'Yuklanmoqda...' : '📁 Kompyuterdan rasm tanlash'}
                    </button>
                    {form.imageUrl && (
                      <button
                        type="button"
                        className="btn btn-light btn-sm"
                        onClick={() => setForm((prev) => ({ ...prev, imageUrl: '' }))}
                      >
                        Rasmni olib tashlash
                      </button>
                    )}
                    <input
                      {...field('imageUrl')}
                      placeholder="yoki rasm havolasini shu yerga qo'ying"
                      style={{ marginTop: 4 }}
                    />
                  </div>
                </div>

                {gallery.length > 0 && (
                  <>
                    <div className="gallery-title">
                      Yuklangan rasmlar ({gallery.length}) — tanlash uchun bosing
                    </div>
                    <div className="gallery">
                      {gallery.map((item) => (
                        <button
                          type="button"
                          key={item.name}
                          className={`gallery-item ${form.imageUrl === item.url ? 'active' : ''}`}
                          title={item.name}
                          onClick={() => setForm((prev) => ({ ...prev, imageUrl: item.url }))}
                        >
                          <img src={item.url} alt={item.name} />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="field">
                <label>Kategoriya *</label>
                <input {...field('category')} required placeholder="Makka po‘shti" />
              </div>

              <div className="field">
                <label>O‘lchamlar (vergul bilan)</label>
                <input {...field('sizes')} placeholder="S, M, L, XL" />
              </div>

              <div className="field">
                <label>Eski narx (so‘m)</label>
                <input {...field('oldPrice')} type="number" placeholder="450000" />
              </div>

              <div className="field">
                <label>Yangi narx (so‘m) *</label>
                <input {...field('price')} type="number" required placeholder="390000" />
              </div>

              <div className="field full">
                <label>Tarkibi / xususiyatlari (har biri yangi qatordan)</label>
                <textarea
                  {...field('features')}
                  rows={4}
                  placeholder={'100% paxta mato\nMakkadan original\nSovg‘a qutisi bilan'}
                />
              </div>

              <label className="checkbox">
                <input type="checkbox" {...check('isActive')} />
                Do‘konda ko‘rinsin
              </label>

              <label className="checkbox">
                <input type="checkbox" {...check('isRecommended')} />
                Savatchada tavsiya qilinsin
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-light" onClick={() => setEditing(null)}>
                Bekor qilish
              </button>
              <button className="btn btn-accent" disabled={saving}>
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
