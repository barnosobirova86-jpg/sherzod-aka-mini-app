import { useCart } from '../context/CartContext.jsx';
import { haptic } from '../telegram.js';
import { HomeIcon, SearchIcon, CartIcon, ProfileIcon } from './NavIcons.jsx';

const tabs = [
  { id: 'home', Icon: HomeIcon, label: 'Bosh sahifa' },
  { id: 'catalog', Icon: SearchIcon, label: 'Katalog' },
  { id: 'cart', Icon: CartIcon, label: 'Savatcha' },
  { id: 'profile', Icon: ProfileIcon, label: 'Profil' },
];

export default function BottomNav({ active, onChange }) {
  const { count } = useCart();

  return (
    <nav className="bottom-nav">
      {tabs.map(({ id, Icon, label }) => (
        <button
          key={id}
          className={`nav-item ${active === id ? 'active' : ''}`}
          onClick={() => {
            haptic('light');
            onChange(id);
          }}
        >
          <span className="nav-icon-wrap">
            <Icon />
            {id === 'cart' && count > 0 && <span className="nav-badge">{count}</span>}
          </span>
          <span className="nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
