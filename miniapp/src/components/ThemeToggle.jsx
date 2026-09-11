import { useTheme } from '../context/ThemeContext.jsx';
import { haptic } from '../telegram.js';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  function pick(value) {
    haptic('light');
    setTheme(value);
  }

  return (
    <div className="theme-toggle">
      <button
        className={theme === 'dark' ? 'active' : ''}
        onClick={() => pick('dark')}
        aria-label="Qora tema"
        title="Qora tema"
      >
        🌙
      </button>
      <button
        className={theme === 'light' ? 'active' : ''}
        onClick={() => pick('light')}
        aria-label="Oq tema"
        title="Oq tema"
      >
        ☀️
      </button>
    </div>
  );
}
