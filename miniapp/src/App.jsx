import { useEffect, useState } from 'react';
import Intro from './components/Intro.jsx';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import Cart from './pages/Cart.jsx';
import Profile from './pages/Profile.jsx';
import BottomNav from './components/BottomNav.jsx';
import ProductSheet from './components/ProductSheet.jsx';
import { initTelegram } from './telegram.js';
import { api } from './api.js';

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [tab, setTab] = useState('home');
  const [user, setUser] = useState(null);
  const [sheetProduct, setSheetProduct] = useState(null);

  useEffect(() => {
    initTelegram();
    api.me().then(setUser).catch(() => setUser(null));
  }, []);

  if (showIntro) {
    return <Intro onFinish={() => setShowIntro(false)} />;
  }

  return (
    <div className="app">
      {tab === 'home' && <Home user={user} onOpenProduct={setSheetProduct} />}
      {tab === 'catalog' && <Catalog onOpenProduct={setSheetProduct} />}
      {tab === 'cart' && <Cart user={user} onNavigate={setTab} onUserUpdate={setUser} />}
      {tab === 'profile' && <Profile user={user} onNavigate={setTab} />}

      <BottomNav active={tab} onChange={setTab} />

      {sheetProduct && (
        <ProductSheet product={sheetProduct} onClose={() => setSheetProduct(null)} />
      )}
    </div>
  );
}
