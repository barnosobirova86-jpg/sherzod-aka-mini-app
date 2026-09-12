import { haptic, openTelegramProfile } from '../telegram.js';

// Diqqat: username shu yerda, ko'rinadigan matnda emas
const ADMIN_USERNAME = 'ArtSherzod';

export default function ContactButton() {
  function handleClick() {
    haptic('medium');
    openTelegramProfile(ADMIN_USERNAME);
  }

  return (
    <button className="contact-btn" onClick={handleClick}>
      <span className="contact-arrow contact-arrow-left">➜</span>
      <span className="contact-btn-text">АРТ ХИЗМАТЛАРИМИЗ УЧУН БОСИНГ</span>
      <span className="contact-arrow contact-arrow-right">➜</span>
    </button>
  );
}
