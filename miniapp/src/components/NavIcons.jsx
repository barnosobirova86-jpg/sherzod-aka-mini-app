// Telegram uslubidagi chiziqli (outline) ikonkalar — hech qanday tashqi
// kutubxonasiz, oddiy SVG chiziqlar sifatida.

const common = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function HomeIcon() {
  return (
    <svg {...common} width="22" height="22">
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.5" />
      <path d="M9.5 20v-5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V20" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg {...common} width="22" height="22">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m19.5 19.5-4.3-4.3" />
    </svg>
  );
}

export function CartIcon() {
  return (
    <svg {...common} width="22" height="22">
      <circle cx="9.5" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <path d="M3 4h2l2.2 10.6a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L20.5 8H6" />
    </svg>
  );
}

export function ProfileIcon() {
  return (
    <svg {...common} width="22" height="22">
      <circle cx="12" cy="8.2" r="3.4" />
      <path d="M5 20c0-3.6 3.1-6.2 7-6.2s7 2.6 7 6.2" />
    </svg>
  );
}
