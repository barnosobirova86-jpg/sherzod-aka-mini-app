import { useEffect, useRef, useState } from 'react';
import { api, formatMoney, resolveImage } from '../api.js';
import { CATEGORIES } from '../categories.js';

const emptyForm = {
  name: '',
  description: '',
  imageUrl: '',
  videoUrl: '',
  images: [],
  videos: [],
  category: CATEGORIES[0],
  price: '',
  oldPrice: '',
  currency: 'UZS',
  stock: '0',
  sizes: 'S, M, L, XL',
  features: '',
  reviews: [],
  isRecommended: false,
  isActive: true,
};

const emptyReview = { name: '', rating: 5, text: '' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [gallery, setGallery] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [videoGallery, setVideoGallery] = useState([]);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingMore, setUploadingMore] = useState(false);
  const [uploadingMoreVideos, setUploadingMoreVideos] = useState(false);
  const fileRef = useRef(null);
  const videoFileRef = useRef(null);
  const moreImagesRef = useRef(null);
  const moreVideosRef = useRef(null);

  async function load() {
    try {
      setProducts(await api.products());
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Modal ochilganda papkadagi rasmlar ro‘yxatini olish
  useEffect(() => {
    if (editing) api.uploads().then(setGallery).catch(() => setGallery([]));
  }, [editing]);

  // Modal ochilganda papkadagi videolar ro‘yxatini olish
  useEffect(() => {
    if (editing) api.videoUploads().then(setVideoGallery).catch(() => setVideoGallery([]));
  }, [editing]);

  // Modal ochiq paytda orqa fon qotib tursin (faqat modal ichi scroll bo‘ladi)
  useEffect(() => {
    if (editing) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
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

  async function handleVideoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    try {
      const result = await api.uploadVideo(file);
      setForm((prev) => ({ ...prev, videoUrl: result.url }));
      setVideoGallery(await api.videoUploads().catch(() => videoGallery));
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingVideo(false);
      if (videoFileRef.current) videoFileRef.current.value = '';
    }
  }

  async function handleMoreImages(event) {
    const files = [...(event.target.files || [])];
    if (!files.length) return;

    setUploadingMore(true);
    try {
      for (const file of files) {
        const result = await api.uploadImage(file);
        setForm((prev) => ({ ...prev, images: [...prev.images, result.url] }));
      }
      setGallery(await api.uploads().catch(() => gallery));
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingMore(false);
      if (moreImagesRef.current) moreImagesRef.current.value = '';
    }
  }

  async function handleMoreVideos(event) {
    const files = [...(event.target.files || [])];
    if (!files.length) return;

    setUploadingMoreVideos(true);
    try {
      for (const file of files) {
        const result = await api.uploadVideo(file);
        setForm((prev) => ({ ...prev, videos: [...prev.videos, result.url] }));
      }
      setVideoGallery(await api.videoUploads().catch(() => videoGallery));
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingMoreVideos(false);
      if (moreVideosRef.current) moreVideosRef.current.value = '';
    }
  }

  function removeImageAt(index) {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  }

  function removeVideoAt(index) {
    setForm((prev) => ({ ...prev, videos: prev.videos.filter((_, i) => i !== index) }));
  }

  function addReview() {
    setForm((prev) => ({ ...prev, reviews: [...prev.reviews, { ...emptyReview }] }));
  }

  function updateReview(index, key, value) {
    setForm((prev) => ({
      ...prev,
      reviews: prev.reviews.map((r, i) => (i === index ? { ...r, [key]: value } : r)),
    }));
  }

  function removeReview(index) {
    setForm((prev) => ({ ...prev, reviews: prev.reviews.filter((_, i) => i !== index) }));
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
      videoUrl: product.videoUrl || '',
      images: product.images || [],
      videos: product.videos || [],
      category: product.category,
      price: String(product.price),
      oldPrice: product.oldPrice ? String(product.oldPrice) : '',
      currency: product.currency || 'UZS',
      stock: String(product.stock ?? 0),
      sizes: (product.sizes || []).join(', '),
      features: (product.features || []).join('\n'),
      reviews: product.reviews || [],
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
        stock: Number(form.stock) || 0,
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
    if (!confirm(`"${product.name}" o‘chirilsinmi?`)) return;
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

      {loading ? (
        <div className="card">
          <div className="loading">Yuklanmoqda...</div>
        </div>
      ) : products.length === 0 ? (
        <div className="card">
          <div className="empty">Mahsulotlar yo‘q</div>
        </div>
      ) : (
        <>
          <div className="card table-only">
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
                    <th>Omborda</th>
                    <th>Holat</th>
                    <th>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <img className="thumb" src={resolveImage(product.imageUrl)} alt={product.name} />
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
                        {product.oldPrice ? formatMoney(product.oldPrice, product.currency) : '—'}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <b>{formatMoney(product.price, product.currency)}</b>
                      </td>
                      <td>
                        {product.stock > 0 ? (
                          <span className="badge delivered">{product.stock} dona</span>
                        ) : (
                          <span className="badge canceled">Tugagan</span>
                        )}
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
          </div>

          <div className="product-cards cards-only">
            {products.map((product) => (
              <div className="product-card-admin" key={product.id}>
                <div className="pca-top">
                  <img className="thumb" src={resolveImage(product.imageUrl)} alt={product.name} />
                  <div className="pca-body">
                    <b>{product.name}</b>
                    <div className="pca-desc">
                      {product.description?.slice(0, 70)}
                      {product.description?.length > 70 ? '...' : ''}
                    </div>
                    <div className="pca-meta">
                      <span className="badge muted">{product.category}</span>
                      {(product.sizes || []).length > 0 && (
                        <span className="badge muted">{product.sizes.join(', ')}</span>
                      )}
                      {product.isActive ? (
                        <span className="badge delivered">Faol</span>
                      ) : (
                        <span className="badge muted">Yashirilgan</span>
                      )}
                      {product.isRecommended && <span className="badge pending">Tavsiya</span>}
                      {product.stock > 0 ? (
                        <span className="badge delivered">{product.stock} dona</span>
                      ) : (
                        <span className="badge canceled">Tugagan</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pca-price">
                  <b>{formatMoney(product.price, product.currency)}</b>
                  {product.oldPrice > 0 && (
                    <span className="pca-old">{formatMoney(product.oldPrice, product.currency)}</span>
                  )}
                </div>

                <div className="row-actions pca-actions">
                  <button className="btn btn-light btn-sm" onClick={() => openEdit(product)}>
                    ✎ Tahrirlash
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(product)}>
                    🗑 O‘chirish
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

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
                <label>Ta‘rifi</label>
                <textarea {...field('description')} rows={3} placeholder="Qisqacha ta‘rif" />
              </div>

              <div className="field full">
                <label>Mahsulot videosi (ixtiyoriy, rasmdan oldin ko‘rinadi)</label>

                <div className="image-picker">
                  <div className="image-preview">
                    {form.videoUrl ? (
                      <video src={resolveImage(form.videoUrl)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span>Video yo‘q</span>
                    )}
                  </div>

                  <div className="image-actions">
                    <input
                      ref={videoFileRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      className="btn btn-accent btn-sm"
                      onClick={() => videoFileRef.current?.click()}
                      disabled={uploadingVideo}
                    >
                      {uploadingVideo ? 'Yuklanmoqda...' : '🎬 Video joylash'}
                    </button>
                    {form.videoUrl && (
                      <button
                        type="button"
                        className="btn btn-light btn-sm"
                        onClick={() => setForm((prev) => ({ ...prev, videoUrl: '' }))}
                      >
                        Videoni olib tashlash
                      </button>
                    )}
                    <input
                      {...field('videoUrl')}
                      placeholder="yoki video havolasini shu yerga qo‘ying"
                      style={{ marginTop: 4 }}
                    />
                  </div>
                </div>

                {videoGallery.length > 0 && (
                  <>
                    <div className="gallery-title">
                      Yuklangan videolar ({videoGallery.length}) — tanlash uchun bosing
                    </div>
                    <div className="gallery">
                      {videoGallery.map((item) => (
                        <button
                          type="button"
                          key={item.name}
                          className={`gallery-item ${form.videoUrl === item.url ? 'active' : ''}`}
                          title={item.name}
                          onClick={() => setForm((prev) => ({ ...prev, videoUrl: item.url }))}
                        >
                          <video src={resolveImage(item.url)} muted />
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <label style={{ marginTop: 14, display: 'block' }}>Qo‘shimcha videolar</label>
                <input
                  ref={moreVideosRef}
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleMoreVideos}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn btn-light btn-sm"
                  onClick={() => moreVideosRef.current?.click()}
                  disabled={uploadingMoreVideos}
                  style={{ marginTop: 6 }}
                >
                  {uploadingMoreVideos ? 'Yuklanmoqda...' : '🎬 Yana video qo‘shish (bir nechta tanlash mumkin)'}
                </button>
                {form.videos.length > 0 && (
                  <div className="gallery" style={{ marginTop: 8 }}>
                    {form.videos.map((url, i) => (
                      <div key={url + i} className="gallery-item active" style={{ position: 'relative' }}>
                        <video src={resolveImage(url)} muted />
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeVideoAt(i)}
                          style={{ position: 'absolute', top: 2, right: 2, padding: '2px 6px' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="field full">
                <label>Mahsulot rasmi</label>

                <div className="image-picker">
                  <div className="image-preview">
                    {form.imageUrl ? (
                      <img src={resolveImage(form.imageUrl)} alt="" />
                    ) : (
                      <span>Rasm yo‘q</span>
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
                      {uploading ? 'Yuklanmoqda...' : '📁 Rasm joylash'}
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
                      placeholder="yoki rasm havolasini shu yerga qo‘ying"
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
                          <img src={resolveImage(item.url)} alt={item.name} />
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <label style={{ marginTop: 14, display: 'block' }}>Qo‘shimcha rasmlar</label>
                <input
                  ref={moreImagesRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMoreImages}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn btn-light btn-sm"
                  onClick={() => moreImagesRef.current?.click()}
                  disabled={uploadingMore}
                  style={{ marginTop: 6 }}
                >
                  {uploadingMore ? 'Yuklanmoqda...' : '📁 Yana rasm qo‘shish (bir nechta tanlash mumkin)'}
                </button>
                {form.images.length > 0 && (
                  <div className="gallery" style={{ marginTop: 8 }}>
                    {form.images.map((url, i) => (
                      <div key={url + i} className="gallery-item active" style={{ position: 'relative' }}>
                        <img src={resolveImage(url)} alt="" />
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeImageAt(i)}
                          style={{ position: 'absolute', top: 2, right: 2, padding: '2px 6px' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="field">
                <label>Kategoriya *</label>
                <select {...field('category')} required>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>O‘lchamlar (vergul bilan)</label>
                <input {...field('sizes')} placeholder="S, M, L, XL" />
              </div>

              <div className="field">
                <label>Valyuta</label>
                <select {...field('currency')}>
                  <option value="UZS">So‘m</option>
                  <option value="USD">Dollar ($)</option>
                </select>
              </div>

              <div className="field">
                <label>Eski narx</label>
                <input {...field('oldPrice')} type="number" placeholder="450000" />
              </div>

              <div className="field">
                <label>Yangi narx *</label>
                <input {...field('price')} type="number" required placeholder="390000" />
              </div>

              <div className="field">
                <label>Omborda qancha bor (dona)</label>
                <input {...field('stock')} type="number" min="0" placeholder="10" />
              </div>

              <div className="field full">
                <label>Tarkibi / xususiyatlari (har biri yangi qatordan)</label>
                <textarea
                  {...field('features')}
                  rows={4}
                  placeholder={'100% paxta mato\nMakkadan original\nSovg‘a qutisi bilan'}
                />
              </div>

              <div className="field full">
                <label>Mijoz sharhlari (siz o‘zingiz qo‘shasiz)</label>
                {form.reviews.map((review, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 8,
                      marginBottom: 8,
                      padding: 10,
                      border: '1px solid var(--line)',
                      borderRadius: 10,
                      flexWrap: 'wrap',
                    }}
                  >
                    <input
                      style={{ flex: '1 1 140px' }}
                      placeholder="Ism"
                      value={review.name}
                      onChange={(e) => updateReview(i, 'name', e.target.value)}
                    />
                    <select
                      style={{ flex: '0 0 90px' }}
                      value={review.rating}
                      onChange={(e) => updateReview(i, 'rating', Number(e.target.value))}
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {'★'.repeat(n)}
                        </option>
                      ))}
                    </select>
                    <input
                      style={{ flex: '1 1 100%' }}
                      placeholder="Sharh matni"
                      value={review.text}
                      onChange={(e) => updateReview(i, 'text', e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => removeReview(i)}
                    >
                      ✕ O‘chirish
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-light btn-sm" onClick={addReview}>
                  + Sharh qo‘shish
                </button>
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
