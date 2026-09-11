import { useEffect, useState } from 'react';
import Onboarding from './pages/Onboarding.jsx';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import Cart from './pages/Cart.jsx';
import Profile from './pages/Profile.jsx';
import BottomNav from './components/BottomNav.jsx';
import ProductSheet from './components/ProductSheet.jsx';
import { initTelegram } from './telegram.js';
import { api } from './api.js';

const ONBOARDING_KEY = 'kisva_onboarded';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return localStorage.getItem(ONBOARDING_KEY) !== '1';
    } catch {
      return true;
    }
  });

  const [tab, setTab] = useState('home');
  const [user, setUser] = useState(null);
  const [sheetProduct, setSheetProduct] = useState(null);

  useEffect(() => {
    initTelegram();
    api.me().then(setUser).catch(() => setUser(null));
  }, []);

  function finishOnboarding() {
    try {
      localStorage.setItem(ONBOARDING_KEY, '1');
    } catch {
      /* ignore */
    }
    setShowOnboarding(false);
  }

  if (showOnboarding) {
    return <Onboarding onFinish={finishOnboarding} />;
  }

  return (
    <div className="app">
      {tab === 'home' && <Home user={user} onNavigate={setTab} onOpenProduct={setSheetProduct} />}
      {tab === 'catalog' && <Catalog onOpenProduct={setSheetProduct} />}
      {tab === 'cart' && <Cart user={user} onNavigate={setTab} />}
      {tab === 'profile' && <Profile user={user} onNavigate={setTab} />}

      <BottomNav active={tab} onChange={setTab} />

      {sheetProduct && (
        <ProductSheet product={sheetProduct} onClose={() => setSheetProduct(null)} />
      )}
    </div>
  );
}
