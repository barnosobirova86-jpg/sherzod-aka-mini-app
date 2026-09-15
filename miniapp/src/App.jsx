import { useEffect, useState } from 'react';
import Intro from './components/Intro.jsx';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import Cart from './pages/Cart.jsx';
import Profile from './pages/Profile.jsx';
import BottomNav from './components/BottomNav.jsx';
import ProductSheet from './components/ProductSheet.jsx';
import { initTelegram, requestTelegramPhone, getTelegramUser } from './telegram.js';
import { api } from './api.js';

/**
 * Mijoz birinchi kirganda Telegram raqamini avtomatik oladi.
 * Telegram bir marta "raqamni ulashasizmi?" deb so‘raydi, mijoz tasdiqlasa —
 * raqam o‘zi saqlanadi va qo‘lda yozish kerak bo‘lmaydi.
 */
async function collectTelegramPhone(me) {
  const phone = await requestTelegramPhone();
  if (!phone) return null;

  const tgUser = getTelegramUser();
  const name =
    me?.contactName ||
    [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(' ') ||
    me?.firstName ||
    'Mijoz';

  // Raqam Telegram javobida kelmasa — u botga yuborilgan bo‘ladi,
  // shuning uchun serverdan qayta so‘raymiz
  if (phone === 'shared') {
    for (let i = 0; i < 5; i += 1) {
      await new Promise((r) => setTimeout(r, 1200));
      const fresh = await api.me().catch(() => null);
      if (fresh?.phone) return fresh;
    }
    return null;
  }

  return api.updateProfile({ contactName: name, phone }).catch(() => null);
}

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [tab, setTab] = useState('home');
  const [user, setUser] = useState(null);
  const [sheetProduct, setSheetProduct] = useState(null);

  useEffect(() => {
    initTelegram();
    api
      .me()
      .then((me) => {
        setUser(me);
        if (!me?.phone) collectTelegramPhone(me).then((updated) => updated && setUser(updated));
      })
      .catch(() => setUser(null));
  }, []);

  if (showIntro) {
    return <Intro onFinish={() => setShowIntro(false)} />;
  }

  return (
    <div className="app">
      {tab === 'home' && <Home user={user} onOpenProduct={setSheetProduct} />}
      {tab === 'catalog' && <Catalog onOpenProduct={setSheetProduct} />}
      {tab === 'cart' && <Cart user={user} onNavigate={setTab} onUserUpdate={setUser} />}
      {tab === 'profile' && (
        <Profile user={user} onNavigate={setTab} onUserUpdate={setUser} />
      )}

      <BottomNav active={tab} onChange={setTab} />

      {sheetProduct && (
        <ProductSheet product={sheetProduct} onClose={() => setSheetProduct(null)} />
      )}
    </div>
  );
}
