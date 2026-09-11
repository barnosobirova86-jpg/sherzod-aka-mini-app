import { useCart } from '../context/CartContext.jsx';
import { haptic } from '../telegram.js';

const tabs = [
  { id: 'home', icon: '🏠', label: 'Bosh sahifa' },
  { id: 'catalog', icon: '🔍', label: 'Katalog' },
  { id: 'cart', icon: '🛒', label: 'Savatcha' },
  { id: 'profile', icon: '👤', label: 'Profil' },
];

export default function BottomNav({ active, onChange }) {
  const { count } = useCart();

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`nav-item ${active === tab.id ? 'active' : ''}`}
          onClick={() => {
            haptic('light');
            onChange(tab.id);
          }}
        >
          <span className="nav-icon">{tab.icon}</span>
          {tab.id === 'cart' && count > 0 && <span className="nav-badge">{count}</span>}
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
