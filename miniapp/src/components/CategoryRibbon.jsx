import { CATEGORIES } from '../categories.js';
import { haptic } from '../telegram.js';

export default function CategoryRibbon({ active, onSelect }) {
  function handleClick(name) {
    haptic('light');
    onSelect(name);
  }

  return (
    <div className="category-ribbon">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.name}
          className={`category-chip ${active === cat.name ? 'active' : ''}`}
          onClick={() => handleClick(cat.name)}
        >
          <span className="category-chip-icon">{cat.icon}</span>
          <span>{cat.name}</span>
        </button>
      ))}
    </div>
  );
}
