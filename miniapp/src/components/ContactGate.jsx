import { useState } from 'react';
import { api } from '../api.js';
import { haptic, showAlert } from '../telegram.js';

export default function ContactGate({ user, onDone }) {
  const [name, setName] = useState(
    [user?.firstName, user?.lastName].filter(Boolean).join(' ')
  );
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!name.trim() || !phone.trim()) {
      return showAlert('Исмингиз ва телефон рақамингизни киритинг');
    }

    setSaving(true);
    try {
      const updated = await api.updateProfile({
        contactName: name.trim(),
        phone: phone.trim(),
      });
      haptic('medium');
      onDone(updated);
    } catch (error) {
      showAlert(error.message || 'Хатолик юз берди');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="gate-card">
        <div className="gate-icon">🕋</div>
        <h1 className="title" style={{ textAlign: 'center' }}>
          Буюртмани расмийлаштириш
        </h1>
        <p className="subtitle" style={{ textAlign: 'center' }}>
          Буюртма бериш учун исмингиз ва телефон рақамингизни киритинг
        </p>

        <form onSubmit={submit}>
          <div className="field">
            <label>Исмингиз</label>
            <input
              type="text"
              placeholder="Исмингизни киритинг"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="field">
            <label>Телефон рақамингиз</label>
            <input
              type="tel"
              inputMode="tel"
              placeholder="+998 90 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <button className="btn btn-accent" style={{ width: '100%', marginTop: 8 }} disabled={saving}>
            {saving ? 'Сақланмоқда...' : 'Давом этиш'}
          </button>
        </form>
      </div>
    </div>
  );
}
